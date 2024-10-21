""" Database Connection Script """

''' LIBRARIES '''
import pymongo  # MongoDB
from bson import ObjectId   # ObjectId casting
import os
import datetime

''' FUNCTIONS '''
# Connecting with database (returns collection access)
def database_connection(col):
    # Docker usage (deployment)
    myclient = pymongo.MongoClient("mongodb://{}:{}@{}:{}".format(
        os.environ['DB_USERNAME'], os.environ['DB_PASSWORD'],
        os.environ['DB_URL'], os.environ['DB_PORT']))
    # IDE usage (testing)
    # myclient = pymongo.MongoClient("mongodb+srv://{}:{}@{}".format(
    #     os.environ['DB_USERNAME'], os.environ['DB_PASSWORD'],
    #     os.environ['DB_URL']))
    mydb = myclient[os.environ['DB_NAME']]
    mycol = mydb[col]
    return mycol

# NOT IN USE
# Function to retrieve all users (returns list with users)
def retrieve_docs(col_name):
    col = database_connection(col_name)
    docs_list = []
    if col_name == 'Users':
        for x in col.find():
            print(x)
            user_dict = {
                'username': x['username'],
                'password': x['password']
            }
            docs_list.append(user_dict)
    return docs_list

# Function to retrieve all jobs (returns list with jobs)
def retrieve_all_jobs():
    col = database_connection('Jobs')  # Connection to collection
    jobs = []   # Lists with all jobs
    for j in col.find():
        j['id'] = str(j['_id'])  # Adding new id key and casting ObjectId to str
        del j['_id']    # Deleting ObjectId key
        jobs.append(j)  # Adding job to list
    return jobs

# Function to retrieve all user's jobs (returns list with jobs)
def retrieve_jobs(user):
    col = database_connection('Jobs')  # Connection to collection
    jobs = []   # Lists with all jobs
    for j in col.find({'user': user}):
        j['id'] = str(j['_id'])  # Adding new id key and casting ObjectId to str
        del j['_id']    # Deleting ObjectId key
        jobs.append(j)  # Adding job to list
    return jobs

# Function to retrieve job for a given id (returns job)
def retrieve_job(job_id):
    col = database_connection('Jobs')  # Connection to collection
    result = col.find_one({'_id': ObjectId(job_id)})    # Searching for given id
    if result is not None:
        result['id'] = job_id   # Adding new id key
        del result['_id']   # Deleting ObjectId key
        # Changing deploy mode key for UI
        result['options']['deployMode'] = result['options']['deploy-mode']
        del result['options']['deploy-mode']
        return result
    else:
        return None


# Function to create a new job (returns success status boolean)
def create_job(user, status, priority, timestamp, options):
    col = database_connection('Jobs')
    success = True
    job = {
        'user': user,
        'status': status,
        'priority': priority,
        'timestamp': timestamp,
        'options': options
    }
    job_object = col.insert_one(job)
    message = f'User {user} create a new job with id= {job_object.inserted_id}'
    report = {
        'success': success,
        'message': message
    }
    return report


# Function to delete a job by id (returns a report)
def delete_job(job_id):
    col = database_connection('Jobs')  # Connection to collection
    result = col.delete_one({"_id": ObjectId(job_id)})
    if result.deleted_count == 0:
        success = False
        message = f'Job with id={job_id} not found'
    else:
        success = True
        message = f'Job with id= {job_id} deleted by user= {""}'
    report = {
        'success': success,
        'message': message
    }
    return report


# Function to update a job (returns a report)
def update_job(job_id, options):
    col = database_connection('Jobs')  # Connection to collection
    result = col.update_one({"_id": ObjectId(job_id)}, {"$set": {'options': options}})
    if result.modified_count == 0:
        success = False
        message = f'Job with id={job_id} not found'
    else:
        success = True
        message = f'Job with id= {job_id} updated by user= {""}'
    report = {
        'success': success,
        'message': message
    }
    return report


def add_option(option):
    col = database_connection('Options')
    inserted_option = col.insert_one(option)
    print(f'\nOption inserted with id={inserted_option.inserted_id}\n')


def retrieve_options():
    col = database_connection('options')
    options = []
    for option in col.find():
        option['id'] = str(option['_id'])
        del option['_id']
        options.append(option)
    return options  


def find_option_by_name(name):
    col = database_connection('options')
    option = col.find_one({'name': name})  # Searching option by name
    return option


# Retrieving list with jobs for execution
def retrieve_jobs_for_execution():
    col = database_connection('Jobs')
    jobs = []
    for j in col.find({'status': 'pending', 'priority': 1}):
        # print(j)
        jobs.append(j)

    return jobs

# Importing started or finished timestamp and changes status to given job
def add_timestamp(job, choice):
    col = database_connection('Jobs')
    timestamp = datetime.datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    if choice == 'started':
        result = col.update_one({"_id": ObjectId(job['_id'])}, {"$set": {'started_timestamp': timestamp, 'status': 'running'}})
    elif choice == 'finished':
        result = col.update_one({"_id": ObjectId(job['_id'])}, {"$set": {'finished_timestamp': timestamp, 'status': 'finished', 'priority': 0}})
    else:
        result = ''

    print(result)

# Adding log from job's subprocess
def add_log(job, results):
    col = database_connection('Logs')
    timestamp = datetime.datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    log = {
        'job_id': job['_id'],
        'log': results,
        'timestamp': timestamp
    }
    inserted_log = col.insert_one(log)
    print(f'\nLog inserted with id={inserted_log.inserted_id}\n')

# Changing priority of given job
def change_job_priority(job_id, new_priority):
    col = database_connection('Jobs')
    timestamp = datetime.datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    if new_priority == 0:
        result = col.update_one({"_id": ObjectId(job_id)},{"$set": {'priority': new_priority, 'status': 'finished', 'started_timestamp': timestamp, 'finished_timestamp': timestamp}})
    else:
        result = col.update_one({"_id": ObjectId(job_id)},{"$set": {'priority': new_priority}})

    if result.modified_count == 0:
        report = {
        'success': False,
        'message': f'No job with id={job_id} found'
         }
    else:
        report = {
            'success': True,
            'message': f'Job with id={job_id} change priority to {new_priority}'
        }
    return report

''' GLOBAL '''
print(f'\n{__file__} is running...')
