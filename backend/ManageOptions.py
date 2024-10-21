""" Script to retrieve Spark-submit jobs from database, check them and run valid ones """

''' LIBRARIES '''
import subprocess  # Subprocess
import DatabaseConnection as DB  # Python file managing database
import time  # Time manager
import json     # JSON files

''' FUNCTIONS '''

# Function to check job's options
# Returns a checklist of job's options which are invalid and a message
def check_spark_job(job):
    start = time.time()  # Start of timing
    print(f"Job: {job}\n")
    job_options = list(job['options'].items())  # Listing job's options
    required_options = DB.retrieve_options()  # Retrieve required options from database
    # print(f"\nJob's Options: {job_options}\n")
    # print(f"Required Options: {required_options}\n")

    # Making list with names of all required options
    required_options_names = []  # List with all names of required options
    for r in required_options:
        required_options_names.append(r['name'])
    # print(required_options_names)

    # Making list with names of all job's options
    job_options_names = []  # List with all names of job's options
    for j in range(len(job_options)):
        print(job_options[j])
        if job_options[j][0] == 'deployMode':
            job_options[j] = ('deploy-mode', job_options[j][1])
        if job_options[j][0] == 'sparkPath':
            job_options[j] = ('spark_path', job_options[j][1])
        if job_options[j][0] == 'conf':
            for c in job_options[j][1]:
                print(c)
                job_options_names.append(c)
        # Case needed to check additional options
        # elif j[0] == 'additional_options':
        #     for a in j[1]:
        #         print(list(j[1][a].items())[0][1])
        #         job_options_names.append(list(j[1][a].items())[0][1])
        else:
            job_options_names.append(job_options[j][0])

    print(f"Job's options names: {job_options_names}\n")
    print(f"Job's options: {job_options}\n")


    # Check if all required options exist
    missing_options = []
    for o in required_options_names:
        if o not in job_options_names:
            missing_options.append(o)
            # print(f"Option {o} is required\n")

    if len(missing_options) > 0:
        print(f"Missing required options: {missing_options}\n")

    options_checklist = check_options_values(job_options)   # Checklist of job's options
    invalid_options = []    # List with options which are invalid
    message = ''
    print(f"\t\t\t\t----------\tChecklist\t----------\n")
    for x in options_checklist:
        print(f"Option's check: {x}\n")
        if x['valid_type'] is False and x['valid_limit'] is True:
            message = 'Invalid type of option'
        elif x['valid_type'] is True and x['valid_limit'] is False:
            message = 'Invalid value of option'
        elif x['valid_type'] is False and x['valid_limit'] is False:
            message = 'Invalid type and value of option'

        if x['valid_type'] is False or x['valid_limit'] is False:
            invalid_options.append([x['option'], message])

    end = time.time()  # End of timing
    print(f"\n-----------------------------------\nCheck Time: {end - start} secs\n-----------------------------------\n")

    return invalid_options


# Function to check option's type & limits
# Returns a checklist of options
def check_options_values(job_options):
    options_checklist = []     # List with the checks for each option
    for option in job_options:
        print(f"Option: {option}\n")
        valid_type, valid_limit = False, True
        if option[0] == "conf":
            conf_list = list(option[1].items())
            # print(f"Configurations: {conf_list}\n")
            for conf in conf_list:
                if conf[1] is None:
                    valid_type = False
                    print(f'\nValue of {conf[0]} is None\n')
                else:
                    db_option = DB.find_option_by_name(conf[0])
                    print(f'Result from database: {db_option}\n')
                    print(conf[0])
                    print(conf[1])
                    print(db_option['values']['range'][0][0])
                    # print(db_option['values']['range'][0][1])
                    print(type(conf[1]).__name__)
                    print(db_option['values']['type'])
                    print('\n')
                    if type(conf[1]).__name__ == 'int' or type(conf[1]).__name__ == 'float':
                        if int(db_option['values']['range'][0][0]) <= conf[1] <= int(db_option['values']['range'][0][1]):
                            valid_limit = True
                        else:
                            valid_limit = False
                            # print(f'Value {conf[1]} is out of range!\n')
                    elif type(conf[1]).__name__ == 'str':
                        valid_limit = True
                    else:
                        valid_limit = False
                        # print(f"Error on value's limit!\n")
                    if type(conf[1]).__name__ == db_option['values']['type']:
                        valid_type = True
                    elif conf[0] == 'spark.executor.memory':
                        valid_type = True
                    else:
                        valid_type = False
                        # print(f'Type {type(conf[1]).__name__} is not valid!\n')
                option_check = {
                    'option': conf[0],
                    'value': conf[1],
                    'valid_type': valid_type,
                    'valid_limit': valid_limit
                }
                options_checklist.append(option_check)
        elif option[0] == "additional_options":
            # Case needed to check values of additional options
            for a in list(option[1].items()):
                if a[1] is None:
                    valid_type = False
                    print(f'\nValue of {option[0]} is None\n')
                else:
                    # print(f"Configurations: {a}\n")
                    add_conf_list = list(a[1].items())
                    # print(f"Configurations: {add_conf_list}\n")
                    valid_type = True
                    valid_limit = True
                option_check = {
                    'option': add_conf_list[0][0],
                    'value': add_conf_list[0][1],
                    'valid_type': valid_type,
                    'valid_limit': valid_limit
                }
                options_checklist.append(option_check)
        else:
            if option[1] is None:
                valid_type = False
                print(f'\nValue of {option[0]} is None\n')
            else:
                db_option = DB.find_option_by_name(option[0])
                # print(f'Result from database: {db_option}\n')
                if type(option[1]).__name__ == db_option['values']['type']:
                    valid_type = True
                else:
                    valid_type = False
                    # print(f'Type {type(option[1]).__name__} is not valid!\n')
            option_check = {
                'option': option[0],
                'value': option[1],
                'valid_type': valid_type,
                'valid_limit': valid_limit
            }
            options_checklist.append(option_check)
    return options_checklist


''' GLOBAL '''
print(f'\n{__file__} is running...\n')