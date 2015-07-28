#!/usr/bin/env python3.4

"""

:Logging:
    use logging.getLogger("WindStormLogger") # case sensitive
"""

import os
import sys
import signal
import logging
import mimetypes
import argparse
try:
    import tornado
    import tornado.web
    import tornado.ioloop
    from tornado.httpserver import HTTPServer
    import tornado.httpclient
    import tornado.template as template

except ImportError as iE:
    sys.stderr.write("Import of tornado web server failed.\n")
    sys.stderr.write("\t{}\n".format(iE))
    sys.exit(1)

try:
    import windstorm.daemon as daemon
    import windstorm.services as services

except ImportError as iE:
    import daemon as daemon
    import services as services


class Windstorm(daemon.Daemon):
    """
    :Description:
        Windstorm is a subclassed daemon that holds its own specific web handler
        for tornado web pages (get and post) that contains ssi functionality,
        caching and eventually security.

    :TODO:
        - Security login
    """

    class Services(tornado.web.RequestHandler):

        @tornado.web.asynchronous
        def post(self, methodname):
            http = tornado.httpclient.AsyncHTTPClient()
            http.fetch("http://127.0.0.1:9091/{}/".format(methodname),
                    self.handle_request, method='POST', headers=None, body=self.request.body,
                    request_timeout=300)

        def handle_request(self, response):
            logging.debug(response)
            if response.error:
                logging.error("Error: {}".format(response.error))
                self.write({"error": response.error})

            else:
                self.write(response.body)

            self.set_header("Content-type", "application/json")
            self.finish()

    class Routes(tornado.web.RequestHandler):
        """
        :Description:
            Routes are set up like this:

            url://mysite/
                This one links to the index.html page, uses ssi tags
                to inject shtml file content into the self.write() or
                self.render() methods.

            url://mysite/software/
                This one looks for files (where the index.html is located,
                aka the web root) with .../software/ parameter, adds .html
                to it, and loads it.
                For example: .../software/ --> look for /software.html, load
                it and present it.
                If user looks for .../asdf/ --> look for /asdf.html, is not found,
                show 404 error.

            Note: Only works with top level html files for now, which import
            ssi files in [webroot]/ssi/ directory.
        """

        def initialize(self, webroot=None, loader=None):
            self.webroot = webroot
            self.loader = loader

        def get(self, *args, **kwargs):
            values = {}
            if len(args) == 0:
                self.write(self.loader.load(os.path.join(self.webroot, "index.html")).generate(**values))

            elif not os.path.exists(os.path.join(self.webroot, args[0])):
                self.clear()
                self.set_status(404)
                self.write("Error: 404")

            else:
                self.write(self.loader.load(os.path.join(self.webroot, args[0])).generate(**values))

    def __init__(self, pidfile, webroot, port):
        super().__init__(self)
        self.pidfile = pidfile
        self.port = port
        print("Port {}".format(port))
        self.webpath = webroot
        self.loader = template.Loader(self.webpath)
        self.logger = logging.getLogger("WindStormLog")
        self.application = tornado.web.Application([
            (r"/^(favicon\.ico)$", tornado.web.StaticFileHandler, dict(path=self.webpath)),
            (r"/Services/(.*)/$", Windstorm.Services),
            (r"/$", Windstorm.Routes, {'webroot': self.webpath,
                                       'loader': self.loader}),
            (r"/(.*\.html)", Windstorm.Routes, {'webroot': self.webpath,
                                                'loader': self.loader}),
            (r"/(.*)", tornado.web.StaticFileHandler, dict(path=self.webpath)),
        ])

    def run(self):
        server = HTTPServer(self.application)
        server.listen(self.port, address='localhost')

        tornado.ioloop.IOLoop.current().start()

def start(pidfile, in_dir="/", port=9090):

    try:
        pid = os.fork()

    except:
        sys.exit(1)

    if pid == 0:
        # Start windstorm daemon
        Windstorm(pidfile, os.path.join(os.getcwd(), 'www'), port).start(in_dir=in_dir)

def stop(pidfile):
    pfile = open(pidfile, 'r')
    try:
        pid = int(pfile.read().strip())
        print("Stopping windstorm.py {}".format(pid))
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

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run Windstorm Webserver and Service Daemon')
    # Both flags set to default to calling windstorm results in restart functionality
    parser.add_argument("--stop", action='store_true', help="Stop the web server and service daemon", default=False)
    parser.add_argument("--start", action='store_true', help="Start the web server and service daemon", default=False)
    parser.add_argument("--port", nargs='?', help="Start the web server on this port (default 9090)",
                        default=9090, type=int)

    args = parser.parse_args()
    if not args.stop and not args.start:
        print("No action specified, restarting")
        args.stop = True
        args.start = True

    pidfile = os.path.join(os.sep, 'var', 'run', 'ws-services.pid')
    try:
        # Predetermine if permissions are OK
        with open(pidfile, 'w') as f:
            pass

    except PermissionError as pE:
        # Reset pidfile to location where is assumed writable.
        pidfile = os.path.join(os.environ.get('HOME', os.getcwd()), 'ws-services.pid') # writable file

    if args.stop:
        if os.path.exists(pidfile):
            services.stop(pidfile)

    if args.start:
        services.start(pidfile, in_dir=os.getcwd())


    pidfile = os.path.join(os.sep, 'var', 'run', 'windstorm.pid')
    try:
        # Predetermine if permissions are OK
        with open(pidfile, 'w') as f:
            pass

    except PermissionError as pE:
        # Reset pidfile to location where is assumed writable.
        pidfile = os.path.join(os.environ.get('HOME', os.getcwd()), 'windstorm.pid') # writable file

    if args.stop:
        if os.path.exists(pidfile):
            stop(pidfile)

    if args.start:
        start(pidfile, port=args.port, in_dir=os.getcwd())