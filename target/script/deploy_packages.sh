#!/bin/bash

#shellcheck disable=SC1091
source /mimic-cross/script/replace_package_name.sh

origin_package_list=$(mktemp)
package_list=$(mktemp)
printf '%s\n' "$@" | sort -u >"$origin_package_list"
replace_package_name <"$origin_package_list" >"$package_list"
supported_packages=$(comm -12 /mimic-cross/supported_packages.list "$package_list")
supported_packages+=" "$(
  comm -13 /mimic-cross/supported_packages.list "$origin_package_list" \
    | xargs -n 1 -P"$(nproc)" -I {} \
      sh -c "dpkg -L {} | grep -e '/python[^/]\+/dist-packages/.\+\.so' > /dev/null && echo {}" \
    | sed -e "s/:.\+$//"
)
supported_packages=$(echo "$supported_packages" | sed -e "s/:.\+$//" | sort -u)
# For run /host/usr/bin/python3 as /usr/bin/python3
rm "$origin_package_list"
rm "$package_list"

if [[ ! "${supported_packages// /}" ]]; then
  exit 0
fi

echo Install : "$supported_packages" >>/var/log/mimic-cross/host.log
cp /etc/resolv.conf /host/etc/resolv.conf
/host/"$(which chroot)" /host apt-get install "$supported_packages"
cp /host/etc/resolv.conf.orig /host/etc/resolv.conf

for package in $supported_packages; do
  if [[ -e /mimic-cross/postinst/${package}.sh ]]; then
    echo Configure : "$package" >>/var/log/mimic-cross/target.log
    #shellcheck disable=SC1090
    . /mimic-cross/postinst/"$package".sh
  else
    echo Skip configure : "$package" >>/var/log/mimic-cross/target.log
  fi
done
