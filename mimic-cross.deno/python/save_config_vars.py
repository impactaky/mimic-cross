#!/usr/bin/python3

import sysconfig
import pickle

config_vars = sysconfig.get_config_vars()
with open('/mimic-cross/mimic-cross/internal/config_vars.pickle', 'wb') as f:
    pickle.dump(config_vars, f)
