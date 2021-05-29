#!/usr/bin/python3

import sys
import sysconfig
import pickle

config_vars = sysconfig.get_config_vars()
with open(sys.argv[1], 'wb') as f:
    pickle.dump(config_vars, f)
