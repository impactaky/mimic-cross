#!/bin/bash

set -eu

if [[ "${1-}" == "--check" ]]; then
  deno fmt --check
else
  deno fmt
fi
deno lint
find -name "*.sh" | xargs shellcheck
find -name "*.dockerfile" | xargs hadolint
