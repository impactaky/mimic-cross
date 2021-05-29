mv /usr/bin/python3.8 /mimic-cross/deploy/target/
mimic-deploy /host/usr/bin/python3.8
rm -r /usr/bin/python3.8
cp /mimic-cross/bin/python3.8 /usr/bin/

python3 /mimic-cross/script/save_config_vars.py /mimic-cross/data/config_vars.pickle
cp /mimic-cross/data/config_vars.pickle /host/mimic-cross/data
/mimic-cross/deploy/target/python3.8 /mimic-cross/script/save_config_vars.py /mimic-cross/data/config_vars.pickle

/host/usr/bin/patch /host/usr/lib/python3.8/sysconfig.py < /mimic-cross/script/sysconfig.patch
