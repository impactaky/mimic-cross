#!/bin/bash -eu

arch >/mimic-cross/arch
HOST_ARCH=$(cat /mimic-cross/host/mimic-cross/arch)
# echo PATH=\"/mimic-cross/deploy/bin:"$PATH"\" >/etc/environment

#shellcheck disable=SC2046,SC2226
ln -s $(realpath /mimic-cross/host/usr/lib/"$HOST_ARCH"-linux-gnu /usr/lib/)
if [[ $(realpath /lib) != /usr/lib ]]; then
  ln -s /mimic-cross/host/lib/"$HOST_ARCH"-linux-gnu /lib
fi

# TODO support another arch
mkdir -p /lib64
ln -s /mimic-cross/host/lib64/ld-linux-x86-64.* /lib64/
ln -s /mimic-cross/host/usr/aarch64-linux-gnu /usr

# mkdir -p /var/log/mimic-cross
# mkdir -p /mimic-cross/deploy/host
# mkdir -p /mimic-cross/deploy/target
# mkdir -p /mimic-cross/deploy/bin
#
# cp /mimic-cross/bin/apt-get /usr/local/bin/
# cp /mimic-cross/bin/mimic-deploy /usr/local/bin/
# cp /mimic-cross/bin/mimic-host-run /usr/local/bin/
# cp /mimic-cross/bin/mimic-dual-run /usr/local/bin/
#
# cp /host/usr/bin/qemu-aarch64-static /usr/bin/qemu-aarch64-static
#
# # random devices used in apt-key script
# /host/"$(command -v chroot)" /host mknod /dev/random c 1 8
# /host/"$(command -v chroot)" /host mknod /dev/urandom c 1 9
#
# [[ "$(ls -A /etc/apt/sources.list.d/)" ]] && cp /etc/apt/sources.list.d/* /host/etc/apt/sources.list.d/
# cp /etc/apt/trusted.gpg.d/* /host/etc/apt/trusted.gpg.d/
#
# cp /etc/resolv.conf /host/etc/resolv.conf
# dpkg -l | awk '/gnupg/ {print $2}' | xargs -r /host/"$(command -v chroot)" /host apt-get install
# cp /host/etc/resolv.conf.orig /host/etc/resolv.conf
# #shellcheck disable=SC1091
# /mimic-cross/hostize_installed_packages.sh
