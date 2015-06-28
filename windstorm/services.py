import os
import sys
import signal
import logging
import mimetypes
import json
import inspect
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

def ServiceParams(func):
    def encodeparams(self, *args, **kwargs):
        newkw = { x: [json.loads(z.decode('utf-8')) for z in y] for x, y in kwargs.items() }
        for k, v in newkw.items():
            newkw[k] = v[0]
            
        return func(self, **newkw)

    return encodeparams

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
        # temporary cache for keeping projects in until we get an sql/nosql db sorted out
        self.projects = {} 
        self.application = tornado.web.Application([
            (r"/(.*)/", self.Routes, {"service": self}),
        ])
        
    def run(self):
        server = HTTPServer(self.application)
        server.listen(9091, address='localhost')
        
        tornado.ioloop.IOLoop.current().start()
        
    @ServiceParams
    def GetProjects(self, **kwargs):
        return list(self.projects.keys())
    
    @ServiceParams
    def SaveProject(self, project=None, **kwargs):
        self.projects[project['title']] = project
        return dict(project=self.projects[project['title']])
    
    @ServiceParams
    def DeleteProject(self, title=None, **kwargs):
        retval = False
        if title in self.projects:
            del self.projects[title]
            retval = True
            
        return dict(deleted=json.dumps(retval))
    
def start(pidfile):

    try:    
        pid = os.fork()

    except:
        sys.exit(1)

    if pid == 0:
        Services(pidfile).start()
            
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
