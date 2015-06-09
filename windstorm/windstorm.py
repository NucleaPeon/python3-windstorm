#!/usr/bin/env python3
import os
import sys
import signal
try:
    import tornado
    import tornado.web
    import tornado.ioloop
    from tornado.httpserver import HTTPServer
    
except ImportError as iE:
    sys.stderr.write("Import of tornado web server failed.\n")
    sys.stderr.write("\t{}\n".format(iE))
    sys.exit(1)

try:    
    import windstorm.daemon as daemon
    
except ImportError as iE:
    import daemon as daemon
    
import logging
    
class Windstorm(daemon.Daemon):
    
    class Routes(tornado.web.RequestHandler):
        
        def get(self, *args, **kwargs):
            self.write("GET at root /")
    
    
    def __init__(self, pidfile):
        super().__init__(self)
        self.pidfile = pidfile
        self.webpath = os.path.join(os.getcwd(), 'www')
        self.application = tornado.web.Application([
            (r"/(.*)", tornado.web.StaticFileHandler, {'path': self.webpath}),
        ])
        
    def run(self):
        server = HTTPServer(self.application)
        server.listen(9090, address='localhost')
        tornado.ioloop.IOLoop.current().start()
    
if __name__ == "__main__":
    pidfile = os.path.join(os.sep, 'var', 'run', 'windstorm.pid')
    try:
        # Predetermine if permissions are OK
        with open(pidfile, 'w') as f:
            pass
        
    except PermissionError as pE:
        # Reset pidfile to location where is assumed writable.
        pidfile = os.path.join(os.environ.get('HOME', os.getcwd()), 'windstorm.pid') # writable file
        
    if os.path.exists(pidfile):
        pfile = open(pidfile, 'r')
        try:
            pid = int(pfile.read().strip())
            print(pid)
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
        
    else:
        try:
            pid = os.fork()

        except:
            sys.exit(1)

        if pid == 0:
            Windstorm(pidfile).start()