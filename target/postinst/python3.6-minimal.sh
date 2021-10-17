#!/bin/bash
mv /usr/bin/python3.6 /mimic-cross/deploy/target/
mimic-deploy /host/usr/bin/python3.6
rm -r /usr/bin/python3.6
cp /mimic-cross/bin/mimic-python /usr/bin/python3.6

python3 /mimic-cross/script/save_config_vars.py /mimic-cross/data/config_vars.pickle
cp /mimic-cross/data/config_vars.pickle /host/mimic-cross/data
/mimic-cross/deploy/target/python3.6 /mimic-cross/script/save_config_vars.py /mimic-cross/data/config_vars.pickle

/host/usr/bin/patch --forward /host/usr/lib/python3.6/sysconfig.py </mimic-cross/script/sysconfig.patch || [ $? -le 1 ]
