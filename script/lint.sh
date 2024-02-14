#!/bin/bash

set -eu

deno fmt
deno lint
git ls-files  | grep .sh$ | xargs shellcheck
git ls-files  | grep .dockerfile$ | xargs hadolint

