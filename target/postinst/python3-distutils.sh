#!/bin/bash
/host/usr/bin/patch --forward /host/usr/lib/python3.8/distutils/sysconfig.py </mimic-cross/script/distutils_sysconfig.patch || [ $? -le 1 ]
