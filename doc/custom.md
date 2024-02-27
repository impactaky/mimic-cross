# How to customize mimic-cross for your environment

## Overview

mimic-cross can add corresponding packages and override built-in implementations
through the `/etc/mimic-cross/custom` directory.\
You can refer to the default implementation
[builtin/recipes.ts](../mimic-cross.deno/apt/builtin/recipes.ts) and
[builtin/supported.json](../mimic-cross.deno/apt/builtin/supported.json)

## supported.json

Describe how to handle the apt package here.\
The default behavior is to search for elf executables referenced by $PATH from
files installed with the specified package name, allowing for fast execution in
the mimic-cross environment.

## recipes.ts

If special processing is required, describe the processing here and reference it
from supported.json.

### nameResolver

Describes special processing for package names.\
This is useful when package names are different in TARGETPLATFORM and
BUILDPLATFORM.

### postInstall

If special handling is required to deploy the package, it is described here.
