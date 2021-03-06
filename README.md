# python3-windstorm
Python3 Tornado-based continuous build and test suite

## How to use:

**Start Web Host**

    ./windstorm.py --start
    
**Stop Web Host**

    ./windstorm.py --stop
    
**Restart Web Host**

    ./windstorm.py
    
Once the service has started, navigate to `localhost:9090` on your web browswer to view the software.

* Click the **Software** side-link to add folder(s) and file(s) which are part of the project.
* Click the **Test Suite** side-link to add Suites (series of tests that encorporate one or more projects)
* Once a Suite is loaded with tests, click the **Run Tests** button to view some settings (that don't yet work) and progress bars. 
* Click the **Run** button to start testing, or you can quick-run the project by clicking on the button next to the **Run Tests** button, the smaller button with the play symbol |>.
* Test results are not yet displayed, but enabling firebug and looking at the tornado log (stdout) will describe the tests.

## History

After trying out `buildbot` and seeing how unpleasant it was to deal with off the bat, I have decided to build a simple, functional configuration-based build and test suite

* built in python3
* locally web-accessible using daemonized tornado web service(s)
* wlil be compiled with `paramiko` to enable remote system builds
* integration with `apt-repo` for package build and deployment automation for debian systems
* connectable with other windstorm instances for mesh or cluster building
* modular testing configurations

Name is based on the technology it is written upon: `tornado`.

Codenames for releases should reflect... windstorms.

## Codename "Light breeze" (0.x series)

We are finally at a pre-release for Light Breeze. It's at a state where it can run
multiple tests while showing progress and not crash. Complex tests may fail with
import issues, some projects may have issues as the Javascript isn't built to
withstand a lot of abuse and since no sockets are used, one has to stay on the
page to enable the tests to complete. No results are returned unless you view the
results of each ajax call in firebug.


At this point, I can see some cracks in the original UI design and functionality.
I have learned much during these past few weeks and will be redesigning the program
with a functional paradigm and layers to isolate bugs and enable validation for hardier
usage.

"Light Breeze" has been very much a proof of concept as well as a way to learn more of
bootstrap.js's functionality intimately.

There will be a Github pre-release of this version and, from now on, I will be using branches
to store and commit code changes.
