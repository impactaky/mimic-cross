#!/host/bin/bash -eu

package_list=$(dpkg -l | grep "^ii" | awk '{print $2}')

. $MIMIC_CROSS_ROOT/script/deploy_packages.sh $package_list
