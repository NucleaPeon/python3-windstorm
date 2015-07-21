"""
Module to read and write configurations and databases
that are used in windstorm
"""

import shelve
import configparser
import os
import logging

PROJECT_DIR = "projects.d"
SUITE_DIR = "suites.d"
GROUPS_DIR = "groups.d"

def write_projects(directory, projects):
    """
    :Parameters:
        - directory: Parent directory to find project configuration file
        - project: Entire Project dictionary
    """
    cp = None
    for p in projects:
        checkdir = os.path.join(directory, PROJECT_DIR)
        if not os.path.exists(checkdir):
            try:
                logging.info("Creating {} Directory".format(PROJECT_DIR))
                os.makedirs(checkdir)

            except PermissionError as pE:
                logging.error(str(pE))
                return False


        cp = configparser.ConfigParser()
        if checkdir:
            cp.read(os.path.join(directory, PROJECT_DIR, "{}.conf".format(p)))

        cp['project'] = {'plugin': p['plugin']}
        cp['depfiles'] = {y.split(os.sep)[-1]: y for y in p['depends']['files']} if not p['depends'].get('files') is None else {}
        cp['windstorminstances'] = {}
        cp['tests'] = {'shelve-filename': "{}.db".format(p['title']),
                       'autoupdate-on-run': True,
                       'persist': True}

        with open(os.path.join(directory, PROJECT_DIR, "{}.conf".format(p['title'])), 'w') as cpwrite:
            cp.write(cpwrite)
            logging.info("Wrote configuration file of project {}".format(p))


    return True


def read_projects(directory, projects=[]):
    """
    :Parameters:
        - directory: Parent directory to find project configuration file
        - project: Project Title, if list is None, return all projects
    """
    retval = {}
    cp = None
    for p in os.listdir(os.path.join(directory, PROJECT_DIR)):
        cp = configparser.ConfigParser()
        cp.read(os.path.join(directory, PROJECT_DIR, p))
        p = p.replace(".conf", "")
        project = {}
        project['title'] = p
        project['depends'] = {'files': None,
                              'windstorminstances': None,
                              'services': None}

        project['files'] = []
        project['size'] = 0
        project['plugin'] = cp['project']['plugin']
        retval[p] = project

    return retval

def write_suite(suite, directory):
    pass

def write_group(group, directory):
    pass

def read_suite(suite, directory):
    pass