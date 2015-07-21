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

    Return value must be a list of tuples (path-leading-to-test-file, filename,)
"""

import re
import os
import logging

def find(path):
    # If a single path is given as a string, ensure it's a list then continue
    if not isinstance(path, list):
        path = [path]

    tests = []
    _filter = []
    prog = re.compile(r"(^Test[\w]+.py$)")
    for p in path:
        # Capture individual files or walk through directories to get tests
        if os.path.isfile(p):
            logging.info("File is {}".format(p.split(os.sep)[-1]))
            if prog.match(p.split(os.sep)[-1]):
                tests.insert(0, p)

        else:
            for root, _dir, _files in os.walk(p):
                _filter = list(filter(lambda x: not prog.match(x) is None, _files))
                if _filter:
                    tests.extend([(root, f,) for f in _filter])

    return tests
