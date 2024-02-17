#!/bin/bash

set -eu

VERSION="v1.40.5"

if [[ "$(arch)" == "x86_64" ]]; then
    wget -q -O deno.zip https://github.com/denoland/deno/releases/download/${VERSION}/deno-x86_64-unknown-linux-gnu.zip
elif [[ "$(arch)" == "aarch64" ]]; then
    wget -q -O deno.zip https://github.com/LukeChannings/deno-arm64/releases/download/${VERSION}/deno-linux-arm64.zip
else
    echo "Unsupported $(arch)" 1>&2
    exit 1
fi

unzip deno.zip
rm deno.zip
