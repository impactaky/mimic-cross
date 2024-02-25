#!/bin/bash

set -eux

HOST_ARCH=$(cat /mimic-cross/mimic-cross/host_arch)

function create_ld_linux_symlink() {
  local host_ld_linux="$1"
  local target="$2"
  mkdir -p "$(dirname "${target}")"
  if [[ $(realpath "${host_ld_linux}") != $(realpath "${target}") ]]; then
    ln -s "$host_ld_linux" "$target"
  fi
}

ln -s "$(realpath /mimic-cross/usr/lib/"$HOST_ARCH"-linux-gnu)" "$(realpath /usr/lib/)"
if [[ $(realpath /lib) != /usr/lib ]]; then
  ln -s /mimic-cross/lib/"$HOST_ARCH"-linux-gnu /lib
fi

find /mimic-cross -name "ld-linux-*" | while read -r host_ld_linux; do
  target="${host_ld_linux#/mimic-cross}"
  create_ld_linux_symlink "$host_ld_linux" "$target"
  if [[ "${target}" == /usr/* ]]; then
    create_ld_linux_symlink "$host_ld_linux" "${target#/usr}"
  fi
done

pushd /mimic-cross/mimic-cross.deno
PATH=/mimic-cross/mimic-cross/internal/bin /mimic-cross/mimic-cross/bin/mimic-deno compile -c deno.json -A src/mimicx.ts 
ln -s /mimic-cross/mimic-cross.deno/mimicx /usr/local/bin/mimicx
popd

mimicx setup