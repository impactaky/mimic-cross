FROM ubuntu:20.04 as host

# ENV DEBIAN_FRONTEND=noninteractive
# RUN apt-get update && apt-get install -y \
#     autoconf \
#     gcc \
#     g++ \
#     git \
#     make \
#  && apt-get clean \
#  && rm -rf /var/lib/apt/lists/*

ENV MIMIC_CROSS_ROOT=/mimic-cross
COPY mimic-cross/host $MIMIC_CROSS_ROOT
RUN $MIMIC_CROSS_ROOT/setup.sh

FROM multiarch/ubuntu-core:arm64-focal as mimic-cross-aarch64

COPY --from=host / /host
ENV MIMIC_CROSS_ROOT=/mimic-cross

COPY mimic-cross/target $MIMIC_CROSS_ROOT
RUN $MIMIC_CROSS_ROOT/setup.sh
# SHELL ["/host/bin/bash", "-c"]

# FROM mimic-cross-aarch64
#
# RUN apt-get update && apt-get install -y \
# 	cmake \
#  && apt-get clean \
#  && rm -rf /var/lib/apt/lists/*
#
# COPY main.c .
# RUN gcc main.c
