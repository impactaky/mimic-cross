# mimic-cross

A cross compile environment Docker image,
can be used like docker multiarch image without speed penalty.

## Usage

Change base image. [Example](/example/binutils.dockerfile)  

```Dockerfile
# FROM ubuntu:20.04
# FROM multiarch/ubuntu-core:arm64-focal
FROM impactaky/mimic-cross:arm64-focal
```

## Supported environments

Currently, support only ubuntu20.04 and aarch64.  
Supported apt packages is here [supported_pacakges.list](target/supported_packages.list)

## How mimic-cross works

![Untitled Diagram (1)](https://user-images.githubusercontent.com/37619203/131243313-c4f6264f-621c-47b6-981b-a76f4ec7902f.png)


Mimic-cross introduces binaries running on host into the environment run by qemu-use-static to speed up the process.  
To do so, the mimic-cross image has a sysroot for the host architecture under /host.

### Package management with mimicking

mimic-cross provide apt-get and pip wrapper for package management with mimicking.

#### What happen when run apt-get

1. Run apt-get in target sysroot
2. Check installed package
3. If mimicking supported package installed, package install by apt-get in /host sysroot.
4. Set up for mimicking (make symbolic links etc...)

