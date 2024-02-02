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

ln -s $(realpath /mimic-cross/usr/lib/"$HOST_ARCH"-linux-gnu /usr/lib/)
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

/mimic-cross/mimic-cross/bin/mimic-deno compile \
  -A -c /mimic-cross/mimic-cross.deno/deno.json \
   /mimic-cross/mimic-cross.deno/src/mimicx.ts
mv ./mimicx /usr/local/bin

echo '#!/bin/bash
/mimic-cross/mimic-cross/bin/mimic-deno run -A /mimic-cross/mimic-cross.deno/src/mimicx.ts $@' \
> /usr/local/bin/mimicx
chmod +x /usr/local/bin/mimicx

mimicx setup