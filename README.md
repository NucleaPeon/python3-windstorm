# python3-windstorm
Python3 Tornado-based continuous build and test suite

After trying out `buildbot` and seeing how unpleasant it was to deal with off the bat, I have decided to build a simple, functional configuration-based build and test suite

* built in python3
* web-accessible using daemonized tornado web service(s)
* compiled with `paramiko` to enable remote system builds
* integrated with `apt-repo` for package build and deployment automation
* connectable with other windstorm instances for mesh or cluster building
* extensible with a REST API and swappable web interfaces if desired (based on said REST API)

Name is based on the technology it is written upon: `tornado`.

Codenames for releases should reflect... windstorms.

## Codename "Light breeze" (0.x series)

1st release requires the following:

* Simple angular-based interface (because I've been meaning to learn it)
* REST API defined even if not fully functional
* Tornado daemon with web access (pretty much done at this point)
* Basic configparser config file and folder structure
* Build a debian package using `apt-repo` for the release
* Building and packaging is restricted to "files in a folder that get copied to a target system" deployment
* Option to set up debian repo and auto-add built packages to it -- requires a daemon owned by root/www-data/apache2 to ensure packages are added to web-accessible repo folders. Otherwise dump packages in a folder and have logged in users access them. 
* User Authentication for Tornado Services (basic cookie auth)
