#!/host/bin/bash

package_list=$(mktemp)
dpkg -l | grep "^ii" | awk '{print $2}' | sort -u > $package_list
supported_packages=$(comm -12 "$MIMIC_CROSS_ROOT"/supported_packages.list "$package_list")
rm "$package_list"

chroot /host apt-get install $supported_packages
for package in $supported_packages; do
    echo $package
    . $MIMIC_CROSS_ROOT/postinst/$package.sh
done
