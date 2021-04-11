#!/bin/bash -eu

HOST_ARCH=$(cat /host/$MIMIC_CROSS_ROOT/arch)

ln -s $(realpath /host/usr/lib/$HOST_ARCH-linux-gnu /usr/lib/)
if [[ $(realpath /lib) != /usr/lib ]]; then
    ln -s /host/lib/$HOST_ARCH-linux-gnu/ /lib/
fi

mkdir -p /lib64
ln -s /host/lib64/ld-linux-x86-64.* /lib64/

cp $MIMIC_CROSS_ROOT/bin/apt-get /usr/local/bin/apt-get
cp /etc/resolv.conf /host/etc/resolv.conf

package_list=$(mktemp)
dpkg -l | grep "^ii" | awk '{print $2}' | sort -u > $package_list
supported_packages=$(comm -12 "$MIMIC_CROSS_ROOT"/supported_packages.list "$package_list")
# rm "$package_list"
echo $supported_packages > /tmp/debug

# chroot /host apt-get install $supported_packages
# for package in $supported_packages; do
#     $MIMIC_CROSS_ROOT/postinst/$package.sh
# done
