#!/bin/bash

set -eu

docker run --rm -it \
  --net=host \
  -v "$(pwd)/mimic-cross.deno:/mimic-cross/mimic-cross.deno" \
  --workdir /mimic-cross/mimic-cross.deno \
  -v "$(pwd)/.cache/apt-cache:/var/cache/apt" \
  -v "$(pwd)/.cache/apt-list:/var/lib/apt" \
  -v "$(pwd)/.cache/mimic-apt-cache:/mimic-cross/var/cache/apt" \
  -v "$(pwd)/.cache/mimic-apt-list:/mimic-cross/var/lib/apt" \
  mimic-arm64-test "$@"
