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

Currently, support only ubuntu18.04 or 20.04 and aarch64. 

## How mimic-cross works

![Untitled Diagram (1)](https://user-images.githubusercontent.com/37619203/131243313-c4f6264f-621c-47b6-981b-a76f4ec7902f.png)


Mimic-cross introduces binaries running on host into the environment run by qemu-use-static to speed up the process.
To do so, the mimic-cross image has a sysroot for the host architecture under /host.

This allows us to run the program faster without using QEMU instead of increasing the image size.  
The image size increase can be handled by multistage build.

### More details

* [apt package management in mimic-cross](docs/apt-get.md)
* [about mimic python](docs/python3.md)



