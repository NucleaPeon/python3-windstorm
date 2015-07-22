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
DB_FILE = "testdb"

def write_projects(directory, projects):
    """
    :Parameters:
        - directory: Parent directory to find project configuration file
        - project: Entire Project dictionary
    """
    cp = None
    for p in projects:
        checkdir = os.path.join(directory, PROJECT_DIR)
        if not checkdir:
            return False

        # Place into its own check method:
        if not os.path.exists(checkdir):
            try:
                logging.info("Creating {} Directory".format(PROJECT_DIR))
                os.makedirs(checkdir, exist_ok=True)

            except PermissionError as pE:
                logging.error(str(pE))
                return False

        cp = configparser.ConfigParser()
        cp.read(os.path.join(directory, PROJECT_DIR, "{}.conf".format(p['title'])))

        # request writing file database if option is set
        logging.info("Sections in config parser file: {}".format(cp.sections()))
        if 'tests' in cp.sections():
            if 'persist' in cp['tests']:
                if cp['tests']['persist']:
                    logging.info("Writing to db")
                    write_tests_to_db(directory, p['title'],
                                      p['files'])


        cp['project'] = {'plugin': p['plugin'],
                         'pythonpath': p['pythonpath'][0]}
        cp['depfiles'] = {y.split(os.sep)[-1]: y for y in p['depends']['files']} if not p['depends'].get('files') is None else {}
        cp['windstorminstances'] = {}
        cp['tests'] = {'autoupdate-on-run': True,
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
    logging.info(directory)
    logging.info(projects)
    if len(projects) > 0:
        return None # FIXME return specified projects

    else:
        checkdir = os.path.join(directory, PROJECT_DIR)
        if not os.path.exists(checkdir):
            try:
                logging.info("Creating {} Directory".format(PROJECT_DIR))
                os.makedirs(checkdir, exist_ok=True)

            except PermissionError as pE:
                logging.error(str(pE))
                return False

        for p in os.listdir(checkdir):
            cp = configparser.ConfigParser()
            logging.info(os.path.join(directory, PROJECT_DIR, p))
            cp.read(os.path.join(directory, PROJECT_DIR, p))
            p = p.replace(".conf", "")
            project = {}
            project['title'] = p
            project['depends'] = {'files': None,
                                'windstorminstances': None,
                                'services': None}

            project['files'] = read_tests_from_db(directory, p)
            project['size'] = 0
            project['plugin'] = cp['project']['plugin']
            project['pythonpath'] = cp['project']['pythonpath'].split(':')

            retval[p] = project


    return retval

def write_suites(directory, suites, cache={}):
    logging.info("write_suites")
    cp = None
    for s in suites:
        checkdir = os.path.join(directory, SUITE_DIR)
        if not os.path.exists(checkdir):
            try:
                logging.info("Creating {} Directory".format(SUITE_DIR))
                os.makedirs(checkdir, exist_ok=True)

            except PermissionError as pE:
                logging.error(str(pE))
                return False

        cp = configparser.ConfigParser()
        cp.read(os.path.join(directory, SUITE_DIR, "{}.conf".format(s)))
        logging.info(s)
        logging.info(cache)
        cp['projects'] = {x: True for x in cache[s]['projects']}


        with open(os.path.join(directory, SUITE_DIR, "{}.conf".format(s)), 'w') as cpwrite:
            cp.write(cpwrite)
            logging.info("Wrote configuration file of suite {}".format(s))

    return False


def write_groups(directory, groups=[]):
    return False

def read_suites(directory, suites=[]):
    checkdir = os.path.join(directory, SUITE_DIR)
    if not os.path.exists(checkdir):
        try:
            logging.info("Creating {} Directory".format(SUITE_DIR))
            os.makedirs(checkdir, exist_ok=True)

        except PermissionError as pE:
            logging.error(str(pE))
            return False

    retval = {}
    if len(suites) > 0:
        logging.info("specific suite")

    else:
        for s in os.listdir(os.path.join(directory, SUITE_DIR)):
            cp = configparser.ConfigParser()
            logging.info(os.path.join(directory, SUITE_DIR, s))
            cp.read(os.path.join(directory, SUITE_DIR, s))
            s = s.replace(".conf", "")
            retval[s] = {'projects': [],
                         'additional': []}
            for k, v in cp['projects'].items():
                if v:
                    retval[s]['projects'].append(k)

    return retval

def write_tests_to_db(directory, projtitle, files):
    if not os.path.exists(os.path.join(directory, DB_FILE)):
        os.makedirs(os.path.join(directory), exist_ok=True)

    try:
        with shelve.open(os.path.join(directory, DB_FILE)) as db:
            db[projtitle] = files

        return True

    except PermissionError as pE:
        logging.error(str(pE))

    return False

def read_tests_from_db(directory, projtitle):
    if not os.path.exists(os.path.join(directory, DB_FILE)):
        return [] # FIX THIS BLOCK SO ITs NOT REDUNDANT

    try:
        with shelve.open(os.path.join(directory, DB_FILE)) as db:
            if projtitle in db:
                return db[projtitle]

    except PermissionError as pE:
        logging.error(str(pE))

    return []