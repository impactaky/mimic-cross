# apt package management in mimic-cross

## What happen when run apt-get

1. Run apt-get in target sysroot
2. Check installed package
3. If mimicking supported package installed, package install by apt-get in /host
   sysroot.
4. Set up for mimicking (make symbolic links etc...)

## Supported package list

See [target/supported_packages.list](../target/supported_packages.list)

## Supported apt command

Currently support apt-get only.
