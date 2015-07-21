"""
Module to read and write configurations and databases
that are used in windstorm
"""

import shelve
import configparser
import os

PROJECT_DIR = "projects.d"
SUITE_DIR = "suites.d"
GROUPS_DIR = "groups.d"

def write_project(project, directory):
    """
    :Parameters:
        - project: Entire Project dictionary
        - directory: Parent directory to find project configuration file
    """
    for p in project:
        cp = configparser.ConfigParser()

        cp['project'] = {'plugin': p['plugin']}
        cp['files'] = {y.split(os.sep)[-1]: y for y in p['depends']['files']}
        cp['windstorminstances'] = {}


        checkdir = os.path.join(directory, PROJECT_DIR)
        if not os.path.exists(checkdir):
            try:
                os.makedirs(checkdir)
                with open(os.path.join(directory, PROJECT_DIR, p['title'] + ".conf"), 'w') as cpwrite:
                    cp.write(cpwrite)

            except PermissionError as pE:
                return False

    return True


def read_project(project, directory):
    """
    :Parameters:
        - project: Project Title
        - directory: Parent directory to find project configuration file
    """
    pass


def write_suite(suite, directory):
    pass

def write_group(group, directory):
    pass

def read_suite(suite, directory):
    pass