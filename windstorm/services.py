#!/usr/bin/env python3

import os
import sys
import signal
import logging
logging.basicConfig(level=logging.INFO)
import unittest
import mimetypes
import json
import inspect
import importlib
from decimal import *
import wsconfig
try:
    import tornado
    import tornado.web
    import tornado.ioloop
    from tornado.httpserver import HTTPServer
    import tornado.template as template

except ImportError as iE:
    sys.stderr.write("Import of tornado web server failed.\n")
    sys.stderr.write("\t{}\n".format(iE))
    sys.exit(1)

try:
    import windstorm.daemon as daemon

except ImportError as iE:
    import daemon as daemon

RESULT_STATUS = {
    "complete": 0,
    "running": 1,
    "updating": 2, # updating tests when box is checked
    "failure": 3,
    "success": 4,
    "error": 255
}

class Services(daemon.Daemon):
    """
    A note on Configuration and Persistence:

    Configurations are saved in a directory relative to the windstorm project,
    see the in_dir variable in the __main__ method of this module.

    As this class should not be initialied in, say, the filesystem root,
    it is unlikely that the default value of / will ever be used.
    By default, windstorm is run in the directory you call it from.
    (When installed on the OS through package manager, a script might
    have to call windstorm individually to prepare the folder.

    Configurations and shelve database are saved in folders that
    are created if they do not exist. (If user cannot write, command
    fails but test suite is still usable, just not saveable. Export
    config files option needs to be available)

    Tests are updated every time a project is loaded, assuming
    an option does not explicitly prevent reloading of tests,
    just using the shelve database to ensure tests are not
    changed (in case certain tests added or removed break the test).
    """

    class Routes(tornado.web.RequestHandler):

        def initialize(self, service=None):
            self.service = service

        def post(self, methodname, *args, **kwargs):
            if hasattr(self.service, methodname):
                logging.warn(methodname)
                m = getattr(self.service, methodname)
                if inspect.isroutine(m):
                    self.write({"results": m(**self.request.arguments)})
                    return

            self.write({"results": None})



    def __init__(self, pidfile, in_dir):
        super().__init__(self)
        self.__directory__ = in_dir
        self.pidfile = pidfile
        # Add plugins directory
        sys.path.insert(0, os.path.join(os.getcwd(), "plugins.d"))

        # Information Cache:
        """
        self.projects = {
            'TestProject' : {
                'title': "TestProject",
                'paths': ['/tmp/'],
                'plugin': "TestsByFilename",
                'depends': {
                    'services': [],
                    'files': [],
                    'windstorminstances': []
                },
                'files': [], # Cached version,
                'size': 0
            }
        }
        self.testsuites = {
            'TestTestSuite': {
                "projects": ["TestProject"],
                "additional": {}
            }
        }
        self.testgroups = {
            'TestTestGroup': ['TestTestSuite']
        }

        self.testresults = {
            'TestGroupX' : {
                "status": RESULT_STATUS['complete'],
                "tests": {
                    "TestOne": {
                        "TestSomethingInTestOne": {
                            "result": RESULT_STATUS["success"],
                            "trace": "",
                            "output": ""
                        }
                    }
                }
            }
        }
        """
        self.projects = {}
        self.testsuites = {}
        self.testgroups = {}
        self.testresults = {}

        self.__load_projects(in_dir)
        self.__load_suites_and_groups(in_dir)

        self.application = tornado.web.Application([
            (r"/(.*)/", self.Routes, {"service": self}),
        ])

    def __load_projects(self, in_dir):
        """ Load using configparser sans tests, save those via shelve."""
        projects = wsconfig.read_projects(in_dir)
        logging.info("{}: {}".format(__name__, projects))
        for key in projects:
            self.projects[key] = projects[key]

        logging.info(self.projects)

    def __load_suites_and_groups(self, in_dir, suites=[], groups=[]):
        """ Load using configparser. """
        self.testsuites.update(wsconfig.read_suites(in_dir, suites=suites))

    def __persist_projects(self, in_dir, projects=None):
        if not isinstance(projects, list):
             projects = [projects]

        return wsconfig.write_projects(self.__directory__, projects)

    def __persist_suites(self, in_dir, suites=None, cache={}):
        if not isinstance(suites, list):
            suites = [suites]

        wsconfig.write_suites(self.__directory__, suites=suites, cache=cache)

    def __remove_projects(self, in_dir, projects=None):
        logging.info("FIXME")
        return True

    def run(self):
        server = HTTPServer(self.application)
        server.listen(9091, address='localhost')
        tornado.ioloop.IOLoop.current().start()

    def GetProjects(self, **kwargs):
        return list(self.projects.values())

    def GetProject(self, name=None, **kwargs):
        if not name is None:
            name = name[0].decode('utf-8')
            if not self.projects.get(name) is None:
                return self.projects[name]

        return None

    def GetProjectsBySuite(self, suite=None, **kwargs):
        if not suite is None:
            suite = suite[0].decode('utf-8')
            if suite in self.testsuites:
                return {x: self.projects[x] for x in self.testsuites[suite]['projects']}

        return {}


    def GetProjectPathsByName(self, name=None, **kwargs):
        if not name is None:
            name = name[0].decode('utf-8')
            if not self.projects.get(name) is None:
                return self.projects[name]["files"]

        return []

    def GetProjectsByName(self, name=None, *kwargs):
        if not name is None:
            name = name[0].decode('utf-8')
            if not self.projects.get(name) is None:
                return self.projects[name]

        return []

    def GetTestSuites(self, **kwargs):
        return self.testsuites

    def CreateTestSuite(self, suite=None, group=None, **kwargs):
        if not suite is None:
            suite = suite[0].decode("utf-8")


        if not suite in self.testsuites:
            self.testsuites[suite] = {"projects": [], "additional": {}}


        if not group is None:
            group = group[0].decode("utf-8")
            if not self.testgroups.get(group) is None:
                self.testgroups[group].append(suite)

            else:
                self.testgroups[group] = [suite]

    def DeleteTestSuites(self, suites=None, **kwargs):
        deltests = []
        for s in suites:
            s = s.decode('utf-8')
            if s in self.testsuites:
                del self.testsuites[s]
                deltests.append(s)
                for g in self.testgroups.keys():
                    logging.info("Checking if suite is in any groups")
                    if s in self.testgroups[g]:
                        logging.info("Suite {} found in Group {}".format(s, g))
                        self.testgroups[g] = list(set(filter(lambda x: x != s, self.testgroups[g])))

        return dict(deleted=deltests)

    def SaveProject(self, title=None, **kwargs):
        logging.info("SaveProject")

    def SaveTestSuite(self, suite=None, group=None, **kwargs):
        logging.info("SaveTestSuite")

    def CreateProject(self, title=None, **kwargs):
        if not title is None:
            title = title[0].decode('utf-8')

        logging.info(title)
        if not title in self.projects:
            self.projects[title] = {
                "title": title,
                "description": "",
                "plugin": "TestsByFilename",
                "depends": {
                    "services": [],
                    "files": [],
                    "windstorminstances": []
                },
                "files": [],
                "size": 0
            }

        return self.projects[title]

    def DeleteProject(self, title=None, **kwargs):
        if not title is None:
            title = title[0].decode('utf-8')

        retval = False
        if title in self.projects:
            logging.info("Found project {} to delete".format(title))
            # Remove config file and then delete from cache
            if self.__remove_projects(self.__directory__, projects=[self.projects[title]]):
                del self.projects[title]

            retval = True

        return dict(deleted=json.dumps(retval))

    def __remove_file_prefix__(self, files):
        return list(set(map(lambda x: x[7:] if x[0:7] == "file://" else x, files)))

    def UpdateProject(self, project=None, files=None,
                      description=None, pythonpath=None, **kwargs):
        logging.info("\tfiles: {}".format(files))
        if project is None:
            return project

        description = "" if description is None else description[0].decode("utf-8")
        description = description.replace("\n", "<br />")

        # Remove file:// from path
        if not files is None:
            files = map(lambda x: x.decode("utf-8"), files)
            files = self.__remove_file_prefix__(files)

        else:
            files = []

        def get_size(d):
            size = Decimal(0)
            for root, _dir, _file in os.walk(d):
                for f in _file:
                    size = Decimal(os.path.getsize(os.path.join(root, f))) + size

            return size

        project = project[0].decode("utf-8")
        logging.info("Project is {} before Update".format(project))
        if not project in self.projects:
            self.SaveProject(title=[bytes(project, "utf-8")])

        size = Decimal(0)
        for f in files:
            if os.path.exists(f):
                try:
                    size += get_size(f) if os.path.isdir(f) else Decimal(os.path.getsize(f))

                except PermissionError as pE:
                    logging.error("Permission denied to {}, {}".format(f, pE))
                    continue

            else:
                logging.warning("File {} not found, removing".format(f))
                del f

        pythonpath = [pp.decode("utf-8") for pp in pythonpath] if not pythonpath is None else []
        self.projects[project]["files"] = files
        self.projects[project]["description"] = description
        self.projects[project]["size"] = int(Decimal(size/Decimal(1000000)).quantize(Decimal('1.'), rounding=ROUND_UP))
        self.projects[project]["pythonpath"] = self.__remove_file_prefix__(pythonpath)
        written = self.__persist_projects(self.__directory__, projects=self.projects[project])
        return self.projects[project]

    def LoadTestsByPlugin(self, plugin=None, path=None, **kwargs):
        if not plugin is None:
            plugin = plugin[0].decode('utf-8')

        loadedtests = []
        if path is None:
            logging.warning("No path supplied")
            return loadedtests

        if not plugin in self.GetListOfPlugins():
            logging.warning("Not found in list of plugins")
            return loadedtests # empty

        try:
            path = list(map(lambda x: x.decode("utf-8"), path)) if not path is None else []
            logging.info(path)
            mod = importlib.import_module(plugin)
            loadedtests = mod.find(path)

        except Exception as E:
            logging.error("Module failed to import, plugin {}".format(plugin))
            return {"error": str(E)}

        return loadedtests

    def GetListOfPlugins(self, **kwargs):
        logging.info("GetListOfPlugins from directory {}".format(os.getcwd()))
        plugins = []
        for root, dirs, files in os.walk(os.path.join(os.getcwd(), "plugins.d")):
            for f in files:
                if f[-3:] == ".py":
                    plugins.append(f[:-3])
                    logging.info("\t{}".format(f[:-3]))

        return plugins

    def GetTestsBySuiteName(self, suite=None, **kwargs):
        # Returns {project: [], additional: {}}
        if not suite is None:
            suite = suite[0].decode('utf-8')
            if suite in self.testsuites:
                logging.info(self.testsuites[suite])
                return self.testsuites[suite]

        return {}

    def GetTestsByGroupName(self, group=None, **kwargs):
        # Returns {suite: {project: [], additional: {}}}
        tests = {}
        if not group is None:
            group = group[0].decode('utf-8')
            if group in self.testgroups:
                for suite in self.testgroups[group]:
                    tests[suite] = self.testsuites[suite]

        return tests

    def UpdateTestSuite(self, suite=None, projects=None, **kwargs):
        if suite is None or projects is None:
            return None

        suite = suite[0].decode("utf-8")
        logging.info("Suite is {}".format(suite))
        projects = list(map(lambda x: x.decode("utf-8"), projects))
        logging.info("Projects for suite are {}".format(projects))
        logging.info(self.testsuites[suite]["projects"])
        logging.info(projects)
        self.testsuites[suite]["projects"] = projects
        self.__persist_suites(self.__directory__, suites=suite, cache=self.testsuites)
        return self.testsuites[suite]

    def GetGroupTestFilenames(self, group=None, **kwargs):
        """
        :Description:
            This method is similar to GetTestsByGroupName, but instead of returning a
            list of project tests per suite per group with a dict structure, this
            returns an implied structure with filenames; it calls plugins to produce
            lists so RunTests() can be called directly with knowledge of the maximum
            number of tests it has to run.
        """
        if group is None:
            return None

        tests = {}
        tmptests = []
        group = group[0].decode('utf-8')
        suite = None
        projects = None
        if group in self.testgroups:
            suite = self.testgroups.get(group)
            if suite is None:
                logging.error("Group has no associated suite")
                return suite

            for s in suite:
                projects = self.testsuites[s]["projects"]
                if projects:
                    # Run through plugins to get filenames
                    for p in projects:
                        for pth in self.projects[p]['files']:
                            tmptests.extend(self.LoadTestsByPlugin(plugin=[bytes(self.projects[p]["plugin"], "utf-8")],
                                                                path=[bytes(pth, "utf-8")]))

                        if tmptests:
                            tests[group] = {s: {p: tmptests}}


        return tests

    def GetSuiteTestFilenames(self, suite=None, **kwargs):
        if suite is None:
            return None

        suite = suite[0].decode("utf-8")
        tests = {suite: {}}
        if suite in self.testsuites:
            projects = self.testsuites[suite]["projects"]
            if projects:
                # Run through plugins to get filenames
                for p in projects:
                    for pth in self.projects[p]['files']:
                        tests[suite][p] = [os.path.join(x[0], x[1]) for x in self.LoadTestsByPlugin(plugin=[bytes(self.projects[p]["plugin"], "utf-8")],
                                                                                path=[bytes(pth, "utf-8")])]

            if self.testsuites[suite]["additional"]:
                logging.warning("TODO: Additional files not implemented")

        return tests

    def _prepare_tests(self, filename, pythonpath=None):
        """
        :Description:
            Takes the filename and optional pythonpath (if it's none, we
            add the directory minus filename) to produce the test module and
            the count of tests in said module as a tuple.

            Module is used for runtests, count is used for CountTestModulesInFile.

        :Returns:
            - tuple (module, count,)
        """
        logging.info("PYTHON PATH {}".format(pythonpath))
        logging.info(type(pythonpath))
        splitpath = list(filter(None, filename.split(os.sep)))
        if pythonpath is None:
            logging.info("Preparing with path insert to {}".format(os.path.join(os.sep, *splitpath[:-1])))
            logging.info(filename)
            logging.info(splitpath)
            sys.path.insert(0, os.path.join(os.sep, *splitpath[:-1]))

        else:
            if os.path.exists(os.path.join(pythonpath)):
                sys.path.insert(0, pythonpath)

        tloader = unittest.TestLoader()
        try:
            mod = importlib.import_module(splitpath[-1].rstrip(".py"))
            loadedtests = tloader.loadTestsFromModule(mod)
            return (mod, loadedtests.countTestCases(),)

        except ImportError as iE:
            logging.error("Was unable to import test module")
            logging.error(str(iE))
            return (None, 0,)

        except Exception as E:
            logging.error("Encountered fatal error in test")
            #logging.error(str(E))
            return (None, 0,)



    def RunTest(self, test=None, pythonpath=None, **kwargs):
        if test is None:
            return None

        test = test[0].decode("utf-8")
        pythonpath = pythonpath[0].decode("utf-8") if not pythonpath is None else None
        logging.info("\tRunning Test {}".format(test))
        logging.info("\tTest Pythonpath is {}".format(pythonpath))
        mod, count = self._prepare_tests(test, pythonpath)
        retval = {}
        if not mod is None:
            tloader = unittest.TestLoader()
            loadedtests = tloader.loadTestsFromModule(mod)

            # FIXME: Create a Run Plugin module
            for lt in loadedtests:
                retval['count'] = count
                for t in lt:
                    tresults = t.run()
                    retval['tests'] = {t.id(): {"errors": tresults.errors,
                                                "failures": tresults.failures,
                                                "skipped": tresults.skipped,
                                                "ran": tresults.testsRun}}

        else:
            retval['count'] = count
            retval['tests'] = {test: {"errors": 0,
                                        "failures": 1,
                                        "skipped": 0,
                                        "ran": 1}}
        return retval

    def CountTestModulesInFile(self, test=None, **kwargs):
        if tests is None:
            return -1

        mod, count = self._prepare_tests(test)
        return count


def start(pidfile, in_dir="/"):
    try:
        pid = os.fork()

    except:
        sys.exit(1)

    if pid == 0:
        Services(pidfile, in_dir).start(in_dir=in_dir)

def stop(pidfile):
    pfile = open(pidfile, 'r')
    try:
        pid = int(pfile.read().strip())
        print("Stopping services.py {}".format(pid))
        os.kill(pid, signal.SIGTERM)
        pfile.close()

    except Exception as E:
        sys.stderr.write("{}\n".format(E))

    finally:
        try:
            pfile.close()
            os.remove(pidfile)
        except Exception as E:
            print(E)
