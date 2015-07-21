"""
Test discovery plugin

Given the results of os.walk (root, directories, files) tuple and
the expected find() method, this plugin will search for tests
based on a filename regular expression and return the full path
to the tests.

    Example:

    /project/
             myprojectfile1.py
             myprojectfile2.py
             TestMyProjectFiles.py

    Test plugin will default to look for files that start with "Test" and
    end with ".py" (regex something like ^(Test[*.]\.py)$ ) and return
    the joined root and filename if this is a match.

    Return value must be a list
"""

import os

def find(path):
    tests = []
    for root, dirs, files in os.walk(path):
        tests.extend([(root, f) for f in files])

    return tests