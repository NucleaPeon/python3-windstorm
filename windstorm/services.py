#!/usr/bin/env python3

import os
import sys
import signal
import logging
logging.basicConfig(level=logging.INFO)
import mimetypes
import json
import inspect
import importlib
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
        
        
    def __init__(self, pidfile):
        super().__init__(self)
        self.pidfile = pidfile
        # Add plugins directory
        sys.path.insert(0, os.path.join(os.getcwd(), "plugins.d"))
        # Information Cache:
        self.projects = {
            'TestProject' : {
                'title': "TestProject",
                'paths': ['/tmp/'],
                'plugin': "TestsByFilename",
                'depends': {
                    'services': [],
                    'files': [],
                    'windstorminstances': []
                }
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
        
        self.application = tornado.web.Application([
            (r"/(.*)/", self.Routes, {"service": self}),
        ])
        
    def run(self):
        server = HTTPServer(self.application)
        server.listen(9091, address='localhost')
        tornado.ioloop.IOLoop.current().start()
    
    def GetProjects(self, **kwargs):
        return list(self.projects.keys())
    
    def GetProjectPathsByName(self, name=None, **kwargs):
        if not name is None:
            name = name[0].decode('utf-8')
            if not self.projects.get(name) is None:
                return self.projects[name]["paths"]
            
        return []
    
    def GetProjectsByName(self, name=None, *kwargs):
        if not name is None:
            name = name[0].decode('utf-8')
            if not self.projects.get(name) is None:
                return self.projects[name]
            
        return []
    
    def GetTestSuites(self, **kwargs):
        return self.testsuites
    
    def DeleteTestSuites(self, suites=None, **kwargs):
        deltests = []
        for s in suites:
            s = s.decode('utf-8')
            if not s in self.testgroups:
                continue
                
            else:
                del self.testgroups[s]
                deltests.append(s)
            
        return dict(deleted=deltests)
    
    def SaveProject(self, project=None, **kwargs):
        if not project is None:
            project = project.decode('utf-8')
            
        self.projects[project['title']] = project
        return dict(project=self.projects[project['title']])
    
    def DeleteProject(self, title=None, **kwargs):
        if not title is None:
            title = title.decode('utf-8')
        retval = False
        if title in self.projects:
            del self.projects[title]
            retval = True
            
        return dict(deleted=json.dumps(retval))
    
    def LoadTestsByPlugin(self, plugin=None, path=None, **kwargs):    
        if not plugin is None:
            plugin = plugin[0].decode('utf-8')
            
        logging.info(path)
        loadedtests = []
        
        if path is None:
            logging.warning("No path supplied")
            return loadedtests
        
        if not plugin in self.GetListOfPlugins():
            logging.warning("Not found in list of plugins")
            return loadedtests # empty
        
        try:
            mod = importlib.import_module(plugin)
            loadedtests = mod.find(path)
            logging.info(loadedtests)
            
        except:
            logging.error("Module failed to import, plugin {}".format(plugin))
        
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
                        for pth in self.projects[p]['paths']:
                            tmptests.extend(self.LoadTestsByPlugin(plugin=[bytes(self.projects[p]["plugin"], "utf-8")],
                                                                path=[bytes(pth, "utf-8")]))
                            
                        if tmptests:
                            tests[group] = {s: {p: tmptests}}
                                            
        
        return tests
    
    def RunTest(self, test=None, **kwargs):
        return None
    
def start(pidfile, in_dir="/"):
    try:    
        pid = os.fork()

    except:
        sys.exit(1)

    if pid == 0:
        Services(pidfile).start(in_dir=in_dir)
            
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
