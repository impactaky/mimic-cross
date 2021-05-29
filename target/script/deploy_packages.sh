source /mimic-cross/script/replace_package_name.sh

package_list=$(mktemp)
printf '%s\n' $@ | replace_package_name > $package_list
supported_packages=$(comm -12 /mimic-cross/supported_packages.list "$package_list")
supported_packages+=" "$(
    printf '%s\n' $@ |
    cat $package_list \
    | xargs -n 1 -P$(nproc) -I {} \
      sh -c "dpkg -L {} | grep -e '/usr/lib/python3/dist-packages/.*cpython.*\.so$' -e '/usr/lib/python3.' > /dev/null && echo {}" \
    | sed -e "s/:$(dpkg --print-architecture)$//"
    )
supported_packages=$(echo $supported_packages | sed -e "s/:$(dpkg --print-architecture)$//")
# For run /host/usr/bin/python3 as /usr/bin/python3
rm $package_list

if [[ ! "${supported_packages// }" ]]; then
    exit 0
fi

echo Install : $supported_packages >> /var/log/mimic-cross/host.log
cp /etc/resolv.conf /host/etc/resolv.conf
/host/$(which chroot) /host apt-get install $supported_packages
cp /host/etc/resolv.conf.orig /host/etc/resolv.conf

for package in $supported_packages; do
    if [[ -e /mimic-cross/postinst/${package}.sh ]]; then
        echo Configure : $package >> /var/log/mimic-cross/target.log
        . /mimic-cross/postinst/${package}.sh
    else
        echo Skip configure : $package >> /var/log/mimic-cross/target.log
    fi
done
