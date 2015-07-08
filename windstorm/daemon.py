import os
import sys
import datetime
import signal
import resource

class Daemon(object):


    def __init__(self, *args, **kwargs):
        self.timestamp = datetime.datetime.now()
        self.logfile = os.path.join(os.sep, 'var', 'log', 'windstorm.log')
        if not os.path.exists(self.logfile):
            self.logfile = os.path.join(os.getcwd(), 'windstorm.log')
            
        self.port = kwargs.get('port', None) # required
        self.pidfile = kwargs.get('pidfile', None) # required

    def run(self):
        print("Run")

    def getpid(self):
        pid = None
        try:
            with open(self.pidfile, 'r') as f:
                pid = f.read()
        except:
            # No pid to read
            pass

        return pid

    def daemonize(self, in_dir="/"):
        """
        do the UNIX double-fork magic, see Stevens' "Advanced
        Programming in the UNIX Environment" for details (ISBN 0201563177)
        http://www.erlenstar.demon.co.uk/unix/faq_2.html#SEC16
        """
        try:
            pid = os.fork()
        except OSError as e:
            raise Exception("{} [{}]".format(e.strerror, e.errno))

        if pid == 0:
            os.setsid()

            signal.signal(signal.SIGHUP, signal.SIG_IGN)

            try:
                pid = os.fork()

            except OSError as e:
                raise Exception("{} [{}]".format(e.strerror, e.errno))

            if pid == 0:
                os.chdir(in_dir)
                os.umask(0)
                # Event Loop Here
                with open(self.pidfile, 'w') as f:
                    try:
                        f.write("{}\n".format(os.getpid()))
                        
                    except PermissionError as pE:
                        sys.stderr.write("Failed to write to pidfile {},\n {}".format(self.pidfile, pE))
                
                self.run()

            else:
                os._exit(0)

        else:
            os._exit(0)

        # NOTE: Requires installing testresources
        maxfd = resource.getrlimit(resource.RLIMIT_NOFILE)[1]
        if (maxfd == resource.RLIM_INFINITY):
            maxfd = 1024 # Max number of available file descriptors

        # Iterate through and close all file descriptors.
        for fd in range(0, maxfd):
            try:
                os.close(fd)
            except OSError:   # ERROR, fd wasn't open to begin with (ignored)
                pass

    def start(self, in_dir="/"):
        """
        Start the daemon
        """
        pid = self.getpid()
        if not pid is None:
            print("pidfile {} already exist. Daemon already running?\n".format(pid))
            sys.exit(1)

        # Start the daemon
        self.daemonize(in_dir=in_dir)

    def stop(self):
        """
        Stop the daemon
        """
        # Get the pid from the pidfile
        pid = self.getpid()
        if pid is None:
            message = "pidfile {} does not exist. Daemon not running?\n"
            sys.stderr.write(message.format(self.pidfile))
            return # not an error in a restart

        # Try killing the daemon process
        try:
            while 1:
                os.kill(pid, signal.SIGTERM)
                time.sleep(0.4)
        except OSError as err:
            err = str(err)
            if err.find("No such process") > 0:
                if os.path.exists(self.pidfile):
                    os.remove(self.pidfile)

            else:
                print(str(err))
                sys.exit(1)

    def restart(self):
        """
        Restart the daemon
        """
        self.stop()
        self.start()
