#!/bin/bash

set -eu

if [[ "${1-}" == "--check" ]]; then
  deno fmt --check
else
  deno fmt
fi
deno lint
find . -name "*.sh" -print0 | xargs -0 shellcheck
find . -name "*.dockerfile" -print0 | xargs -0 hadolint
