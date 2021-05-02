source $MIMIC_CROSS_ROOT/script/replace_package_name.sh

package_list=$(mktemp)
printf '%s\n' $@ | replace_package_name > $package_list
supported_packages=$(comm -12 "$MIMIC_CROSS_ROOT"/supported_packages.list "$package_list")
rm $package_list

if [[ ! "${supported_packages}" ]]; then 
    exit 0
fi

echo Install : $supported_packages >> /var/log/mimic-cross/host.log
cp /etc/resolv.conf /host/etc/resolv.conf
/host/$(which chroot) /host apt-get install $supported_packages
cp /host/etc/resolv.conf.orig /host/etc/resolv.conf

for package in $supported_packages; do
    echo Configure : $package >> /var/log/mimic-cross/target.log
    . $MIMIC_CROSS_ROOT/postinst/${package}.sh
done
