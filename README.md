# python3-windstorm
Python3 Tornado-based continuous build and test suite

After trying out `buildbot` and seeing how unpleasant it was to deal with off the bat, I have decided to build a simple, functional configuration-based build and test suite

* built in python3
* locally web-accessible using daemonized tornado web service(s)
* wlil be compiled with `paramiko` to enable remote system builds
* integration with `apt-repo` for package build and deployment automation for debian systems
* connectable with other windstorm instances for mesh or cluster building
* modular testing configurations

Name is based on the technology it is written upon: `tornado`.

Codenames for releases should reflect... windstorms.

## Codename "Moderate Maestro" (0.9x - 1.0 series)

See Milestones for bugs and features that apply to this release.
See Windstorm-Maestro-UI.pdf for scan of improved prototype webpage design.

Notes on the new design:

* Logging in is mandatory, although tornado should have a flag for disabling logging in for those who just want a purely local non-intrusive testing suite. Obviously this is not secure when enabled and will output warnings.
* Compact design with more modal windows and absolute elements, more focus on drag n drop and less focus on having buttons for everything
* Use tooltips and glyphs/images to represent state instead of text and collapseable divs.
* Use backbone.js for organizing views, models and collections and syncing of data to a mongodb database.
* Have notifications done through side tabs that are disabled if no new messages exist
* Have a footer for program information and licensing that is out of the way
* No more test suites/test groups, projects may contain tests and other projects.
* Testing is done through the project object and contains a progress bar overview.
* Other pages, such as results and setting pages are accessible via a link at the top of the page below the header, but still utilizes the one-page layout style so data is cached/quickly retrieved.
* Use HTML pushes to update information
* Tornado is used for credentials, running of programs and test suites, connecting to other windstorm instances and perhaps mongodb.
* A nice-to-have is a tornado webpage -based log viewer with a separate admin account that is spec'd in the windstorm config file. Ex: Email administrator on error/warning, batch send logs every [x] duration.

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