#!/bin/bash

set -eu

if [[ "$1" == "--check" ]]; then
  deno fmt --check
else
  deno fmt
fi
deno lint
git ls-files  | grep .sh$ | xargs shellcheck
git ls-files  | grep .dockerfile$ | xargs hadolint