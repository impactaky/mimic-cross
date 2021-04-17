#!/host/bin/bash

package_list=$(mktemp)
dpkg -l | grep "^ii" | awk '{print $2}' | sort -u > $package_list
supported_packages=$(comm -12 "$MIMIC_CROSS_ROOT"/supported_packages.list "$package_list")
rm "$package_list"

mv /host/etc/resolv.conf /host/etc/resolv.conf.orig
cp /etc/resolv.conf /host/etc/resolv.conf
/host/$(which chroot) /host apt-get install $supported_packages
mv /host/etc/resolv.conf.orig /host/etc/resolv.conf
for package in $supported_packages; do
    echo $package
    . $MIMIC_CROSS_ROOT/postinst/$package.sh
done
