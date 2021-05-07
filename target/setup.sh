#!/bin/bash -eu

HOST_ARCH=$(cat /host/$MIMIC_CROSS_ROOT/arch)

ln -s $(realpath /host/usr/lib/$HOST_ARCH-linux-gnu /usr/lib/)
if [[ $(realpath /lib) != /usr/lib ]]; then
    ln -s /host/lib/$HOST_ARCH-linux-gnu/ /lib/
fi

mkdir -p /lib64
ln -s /host/lib64/ld-linux-x86-64.* /lib64/
ln -s /host/usr/aarch64-linux-gnu /usr
ln -s /host/mimic-cross/lib/libmimic-cross.so /host/lib/$HOST_ARCH-linux-gnu/

mkdir -p /var/log/mimic-cross
mkdir -p $MIMIC_CROSS_ROOT/deploy/host
mkdir -p $MIMIC_CROSS_ROOT/deploy/target

. $MIMIC_CROSS_ROOT/hostize_installed_packages.sh

cp $MIMIC_CROSS_ROOT/bin/apt-get /usr/local/bin/
cp $MIMIC_CROSS_ROOT/bin/mimic-deploy /usr/local/bin/
