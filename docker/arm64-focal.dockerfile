# syntax = docker/dockerfile:experimental

FROM ubuntu:20.04 as mimic-lib

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        binutils gcc make cmake libc6-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists

COPY mimic-lib /mimic-lib
RUN mkdir -p /mimic-lib/build && cd /mimic-lib/build && \
    cmake .. -DMIMIC_TARGET_ARCH=aarch64 && \
    make

# =======================================================================

FROM ubuntu:20.04 as host

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y --no-install-recommends binutils patch patchelf qemu-user-static && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists
COPY --from=mimic-lib /mimic-lib/build/libmimic-cross.so /usr/lib/x86_64-linux-gnu/

COPY host /mimic-cross
RUN /mimic-cross/setup.sh
COPY target /mimic-cross-target

# =======================================================================

FROM multiarch/ubuntu-core:arm64-focal 

COPY --from=host / /host
RUN mv /host/mimic-cross-target /mimic-cross
RUN /mimic-cross/setup.sh

# vim:set ft=dockerfile :
