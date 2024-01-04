# syntax=docker/dockerfile:1.4.2

FROM ubuntu:22.04 as mimic-lib

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        binutils \
        ca-certificates \
        cmake \
        gcc \
        libc6-dev \
        make \
        unzip \
        wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists

# Download deno
RUN mkdir -p /deno
WORKDIR /deno
RUN wget -q https://github.com/denoland/deno/releases/download/v1.39.1/deno-x86_64-unknown-linux-gnu.zip \
    && unzip ./deno-x86_64-unknown-linux-gnu.zip \
    && rm ./deno-x86_64-unknown-linux-gnu.zip

COPY mimic-lib /mimic-lib
RUN mkdir -p /mimic-lib/build
WORKDIR /mimic-lib/build
RUN cmake .. -DMIMIC_TARGET_ARCH=aarch64 && \
    make

# =======================================================================

FROM ubuntu:22.04 as host-stage1

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        patchelf \
        wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists
COPY --from=mimic-lib /mimic-lib/build/libmimic-cross.so /usr/lib/x86_64-linux-gnu/
RUN mkdir -p /mimic-cross/bin/
COPY --from=mimic-lib /deno/deno /mimic-cross/bin/deno

COPY host /mimic-cross/host

# =======================================================================

FROM host-stage1 as mimic-test

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libc6-dev \
        sudo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists

COPY ./test/hello.c /test/hello.c
WORKDIR /test
RUN gcc -shared -o libhello.so hello.c \
    && gcc -shared -o libhello_runpath.so hello.c -Wl,-rpath,\$ORIGIN/foo:/path/to/lib \
    && gcc -shared -o libhello_runpath_origin.so hello.c -Wl,-rpath,\$ORIGIN/foo

ENV MIMIC_TEST_DATA_PATH=/test
RUN mkdir -p /test/deploy

COPY mimic-cross.deno /mimic-cross.deno
WORKDIR /mimic-cross.deno
ENV PATH="/mimic-cross/bin:$PATH"
RUN deno cache config/*.test.ts src/*.test.ts

# =======================================================================

FROM host-stage1 as host

RUN /mimic-cross/setup.sh
COPY target /mimic-cross-target

# =======================================================================

FROM --platform=linux/arm64 ubuntu:22.04

COPY --from=host / /host
RUN mv /host/mimic-cross-target /mimic-cross
RUN /mimic-cross/setup.sh

# vim:set ft=dockerfile :
