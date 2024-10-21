""" Script to insert options into database """

''' LIBRARIES '''
import DatabaseConnection as dc     # Python file managing database

''' FUNCTIONS '''
def true_or_false(value):
    if value == 'yes' or value == 'YES':
        return True
    elif value == 'no' or value == 'NO':
        return False
    else:
        return None

def give_none(value):
    if value == '':
        return None
    else:
        return value

''' GLOBAL '''
print(f'\n{__file__} is running...')
isFinished = False
while not isFinished:
    print("\t\t\t\n--ADD OPTION--\n")
    name = input("Give name: ")
    conf = input("Is conf?: ")
    required = input("Is required?: ")
    type = input("Give type: ")
    default = input("Give default: ")
    range = []
    range = [range for range in input("Give range: ").split("-")]
    option = {
        'name': name,
        'conf': true_or_false(conf),
        'required': true_or_false(required),
        'values': {
            'type': give_none(type),
            'default': give_none(default),
            'range': [range]
        }
    }
    dc.add_option(option)
    for o in dc.retrieve_options():
        print(o)
    x = input("\nAdd another option? (y/n): ")
    if x == 'y':
        isFinished = False
    elif x == 'n':
        isFinished = True
    else:
        print('Invalid input\n')
        exit(-1)
