python3 /mimic-cross/script/save_config_vars.py /mimic-cross/data/config_vars.pickle

mimic-deploy /host/usr/bin/python3.8
cp /host/usr/bin/python3.8 /mimic-cross/deploy/host/
rm /usr/bin/python3.8
cp /mimic-cross/bin/python3.8 /usr/bin/

# ln -sf /host/usr/lib/python38.zip /usr/lib/python38.zip
rm -r /usr/lib/python3.8
cp -r /host/usr/lib/python3.8 /usr/lib/python3.8
# rm -r /usr/lib/python3.8/lib-dynload
# ln -sf /host/usr/lib/python3.8/lib-dynload /usr/lib/python3.8/lib-dynload
pushd /
/host/usr/bin/patch -p0 < /mimic-cross/script/sysconfig.patch
popd
