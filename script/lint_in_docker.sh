#!/bin/bash

set -eu

docker run --rm -it -v="$(pwd):$(pwd)" --workdir="$(pwd)" \
    --user="$(id -u):$(id -g)" \
    -v /etc/passwd:/etc/passwd -v /etc/group:/etc/group \
    -v /etc/shadow:/etc/shadow -v /etc/gshadow:/etc/gshadow \
    -v "$HOME:$HOME" \
    impactaky/mimic-cross-lint ./script/lint.sh "$@"
