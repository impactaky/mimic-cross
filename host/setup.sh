#!/bin/bash -eu

if [[ $(arch) != x86_64 ]]; then
    echo "currently host architecture support only x86_64"
    exit 1
fi

arch > $MIMIC_CROSS_ROOT/arch

# install latest patchelf
git clone https://github.com/NixOS/patchelf
cd patchelf
./bootstrap.sh
./configure
make
make install
cd ..
rm -r patchelf

cp $MIMIC_CROSS_ROOT/bin/apt-get /usr/local/bin/apt-get
