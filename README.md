# python3-windstorm
Python3 Tornado-based continuous build and test suite

After trying out `buildbot` and seeing how unpleasant it was to deal with off the bat, I have decided to build a simple, functional configuration-based build and test suite

* built in python3
* web-accessible using daemonized tornado web service(s)
* compiled with `paramiko` to enable remote system builds
* integrated with `apt-repo` for package build and deployment automation
* extensible with a REST API and swappable web interfaces if desired (based on said REST API)

Name is based on the technology it is written upon: `tornado`.

Codenames for releases should reflect... windstorms.
