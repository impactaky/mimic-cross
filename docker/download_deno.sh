#!/bin/bash

set -eu

VERSION="v1.41.0"

wget -q -O deno.zip "https://github.com/denoland/deno/releases/download/${VERSION}/deno-$(arch)-unknown-linux-gnu.zip"

unzip deno.zip
rm deno.zip
