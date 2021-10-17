# syntax = docker/dockerfile:experimental

FROM ubuntu:18.04 as dependencies

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        autoconf \
        automake \
        binutils \
        cmake \
        gcc \
        g++ \
        git \
        libc6-dev \
        make \
        && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists

COPY mimic-lib /mimic-lib
RUN mkdir -p /mimic-lib/build && cd /mimic-lib/build && \
    cmake .. -DMIMIC_TARGET_ARCH=aarch64 && \
    make

ENV GIT_SSL_NO_VERIFY=1
RUN git clone -b 0.10 https://github.com/NixOS/patchelf
RUN cd patchelf && ./bootstrap.sh && ./configure --prefix /dist && make -j $(nproc) && make install

# =======================================================================

FROM ubuntu:18.04 as host

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y --no-install-recommends binutils patch && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists
COPY --from=dependencies /mimic-lib/build/libmimic-cross.so /usr/lib/x86_64-linux-gnu/
COPY --from=dependencies /dist /usr

COPY host /mimic-cross
RUN /mimic-cross/setup.sh
COPY target /mimic-cross-target

# =======================================================================

FROM multiarch/ubuntu-core:arm64-bionic

COPY --from=host / /host
RUN mv /host/mimic-cross-target /mimic-cross
RUN /mimic-cross/setup.sh

# vim:set ft=dockerfile :
