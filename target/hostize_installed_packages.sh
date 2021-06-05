#!/host/bin/bash -eu

package_list=$(dpkg -l | grep "^ii" | awk '{print $2}')

#shellcheck disable=SC1091
. /mimic-cross/script/deploy_packages.sh "$package_list"
