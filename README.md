# mimic-cross

A cross compile environment Docker image,
can be used like docker multiarch image without speed penalty.

## usage

Change base image. [Example](/example/binutils.dockerfile)

```Dockerfile
# FROM ubuntu:20.04
# FROM multiarch/ubuntu-core:arm64-focal
FROM impactaky/mimic-cross:arm64-focal
```
