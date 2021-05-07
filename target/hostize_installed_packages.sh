#!/host/bin/bash -eu

package_list=$(dpkg -l | grep "^ii" | awk '{print $2}')

. /mimic-cross/script/deploy_packages.sh $package_list
