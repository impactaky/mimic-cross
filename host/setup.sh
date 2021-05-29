#!/bin/bash -eu

if [[ $(arch) != x86_64 ]]; then
    echo "currently host architecture support only x86_64"
    exit 1
fi

arch > /mimic-cross/arch
mkdir /mimic-cross/data

# # install latest patchelf
# git clone https://github.com/NixOS/patchelf
# cd patchelf
# ./bootstrap.sh
# ./configure
# make
# make install
# cd ..
# rm -r patchelf

cp /mimic-cross/bin/apt-get /usr/local/bin/apt-get

cp /etc/resolv.conf /etc/resolv.conf.orig
