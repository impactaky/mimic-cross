# syntax = docker/dockerfile:experimental

FROM ubuntu:20.04 as host

ENV DEBIAN_FRONTEND=noninteractive
RUN rm -f /etc/apt/apt.conf.d/docker-clean; \
  echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > \
    /etc/apt/apt.conf.d/keep-cache
RUN \
    --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    apt update && \
    apt-get install -y --no-install-recommends \
    patchelf \
	cmake

ENV MIMIC_CROSS_ROOT=/mimic-cross
COPY mimic-cross/host $MIMIC_CROSS_ROOT
RUN $MIMIC_CROSS_ROOT/setup.sh

FROM multiarch/ubuntu-core:arm64-focal as mimic-cross-aarch64

FROM mimic-cross-aarch64

RUN rm -f /etc/apt/apt.conf.d/docker-clean; \
  echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > \
    /etc/apt/apt.conf.d/keep-cache
RUN \
    --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    apt update && \
    apt-get install -y --no-install-recommends \
    sudo \
    gcc \
	cmake

COPY --from=host / /host
ENV MIMIC_CROSS_ROOT=/mimic-cross

COPY mimic-cross/target $MIMIC_CROSS_ROOT
RUN $MIMIC_CROSS_ROOT/setup.sh
SHELL ["/host/bin/bash", "-c"]


COPY main.c .
# RUN gcc main.c
