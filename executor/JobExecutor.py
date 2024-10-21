""" Backend Python Script for job execution service """

''' LIBRARIES '''
import subprocess   # Running spark submit
import time     # Timings
import DatabaseConnection as dc
import os

''' FUNCTIONS '''
# Select the best job according to priority and timestamp (The Lowest Priority and FirstCameFirstServed)
def job_selector():
    # Retrieving pending jobs from database
    try:
        jobs_to_execute = dc.retrieve_jobs_for_execution()
        print(f'Before Sorting (or without): \n{jobs_to_execute}\n')
        return jobs_to_execute[0]
    except Exception as e:
        print(e)
    # for job in jobs_to_execute:
    #     print(f"{job['timestamp']}\n")
    # Sorting jobs from newest to oldest
    # jobs_to_execute = sorted(jobs_to_execute, key=lambda d: d['timestamp'], reverse=True)
    # print(f'After Sorting: \n{jobs_to_execute}\n')
    # if len(jobs_to_execute) == 0:
    #     for job in jobs_to_execute:
    #         # print(f"{job['timestamp']}\n")
    #         job_executor(job)
    # else:
    #     print('No jobs to execute\n')

# Edit & Run job
def job_executor(job):
    # Making one string job from options of job
    spark_submit = ""
    print(f"{job['options']}\n")
    for option in job['options']:
        if option == 'spark_path':
            spark_submit += f"{job['options'][option]}\\\n"
            # spark_submit += f"{job['options'][option]} \n"
        elif option == 'executable':
            spark_submit += f"local:///{job['options'][option][2:]} \n"
        elif option == 'conf':
            for conf in job['options'][option]:
                spark_submit += f"--conf {conf}={job['options'][option][conf]} \n"
        elif option == 'additional_options':
            for a in job['options'][option]:
                add_conf = job['options'][option][a]
                spark_submit += f"--conf {add_conf['confKey']}={add_conf['confValue']} \n"
        else:
            if option == 'name':    # Removing space from value of option name
                job['options'][option] = job['options'][option].replace(" ", "")
            spark_submit += f"--{option} {job['options'][option]} \n"

    print(spark_submit)
    # Run job
    cwd = os.getcwd()
    print(f'\nCurrent Path: {cwd}\n')
    directories = subprocess.run(["dir"], shell=True, capture_output=True, text=True)
    print(f'\nThe directories of the path {cwd} are: \n{directories.stdout}\n')
    # os.chdir("/opt")
    # cwd = os.getcwd()
    # print(f'\nNew Path: {cwd}\n')
    # new_directories = subprocess.run(["dir"], shell=True, capture_output=True, text=True)
    # print(f'\nThe directories of the path {cwd} are: \n{new_directories.stdout}\n')
    result = subprocess.run([spark_submit], shell=True, capture_output=True, text=True)
    print(result.stderr)
    if result.stdout == '':
        result.stdout = "Subprocess didn't run"
    dc.add_log(job, result.stdout)
    # print(result.stdout)
    return result.stdout

# cluster_info = 'kubectl cluster-info dump'
# spark_submit = "/opt/spark/bin/spark-submit \
#   --master k8s://https://192.168.0.201:16443 \
#   --deploy-mode cluster \
#   --name spark-pi \
#   --class org.apache.spark.examples.SparkPi \
#   --conf spark.executor.instances=1 \
#   --conf spark.executor.cores=1 \
#   --conf spark.executor.memory=1g \
#   --conf spark.kubernetes.driver.node.selector.kubernetes.io/hostname=k8s-1 \
#   --conf spark.kubernetes.container.image=apache/spark:3.5.0 \
#   --conf spark.kubernetes.authenticate.driver.serviceAccountName=spark \
#   local:///opt/spark/examples/jars/spark-examples_2.12-3.5.0.jar \
#   1000"

''' GLOBAL '''
# Looping: Selecting job, Executing job, Waiting
stop = False
while stop is False:
    start_time = time.time()
    job = job_selector()    # Selecting job
    print(f'\nJob for execution:\n{job}\n')
    if not job:  # Case no job exists or all jobs are finished
        # stop = True
        print(f'\nNo job found for execution\n')
    else:
        dc.edit_timestamp(job, 'started', 'add')
        results = job_executor(job)     # Executing job
        end_time = time.time()
        print(f'\nTime: {str(end_time - start_time)} secs\n')
        print(f'\nExecution Results: {results}\n')
        if results == "Subprocess didn't run":
            dc.edit_timestamp(job, 'started', 'remove')
        else:
            dc.edit_timestamp(job, 'finished', 'add')
    time.sleep(10)  # Waiting until next execution
