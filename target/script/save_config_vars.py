#!/usr/bin/python3

import sys
import distutils.sysconfig
import pickle

config_vars = distutils.sysconfig.get_config_vars()
with open(sys.argv[1], 'wb') as f:
    pickle.dump(config_vars, f)
