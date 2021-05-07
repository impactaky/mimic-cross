# syntax = docker/dockerfile:experimental

FROM ubuntu:20.04 as mimic-lib

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        binutils gcc make cmake libc6-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists

COPY mimic-cross/mimic-lib /mimic-lib
RUN mkdir -p /mimic-lib/build && cd /mimic-lib/build && \
    cmake .. -DMIMIC_TARGET_ARCH=aarch64 && \
    make

# =======================================================================

FROM ubuntu:20.04 as host

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y --no-install-recommends patch patchelf && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists

COPY mimic-cross/host /mimic-cross
RUN /mimic-cross/setup.sh

FROM host as debug
RUN apt-get update && \
    apt-get install -y gcc make sudo && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists


# =======================================================================

FROM multiarch/ubuntu-core:arm64-focal as mimic-cross-aarch64

FROM mimic-cross-aarch64

RUN rm -f /etc/apt/apt.conf.d/docker-clean; \
  echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > \
    /etc/apt/apt.conf.d/keep-cache
RUN \
    --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    sudo \
    gcc \
    libc6-dev \
	cmake

COPY --from=host / /host
COPY --from=mimic-lib /mimic-lib/build/libmimic-cross.so /host/mimic-cross/lib
ENV PATH=/mimic-cross/bin:$PATH

COPY mimic-cross/target /mimic-cross
RUN /mimic-cross/setup.sh
SHELL ["/host/bin/bash", "-c"]


COPY main.c .
# RUN gcc main.c

