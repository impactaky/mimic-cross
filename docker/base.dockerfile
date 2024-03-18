ARG HOST_BASE_IMAGE
ARG HOST_BASE_IMAGE_TAG
ARG BASE_IMAGE
ARG BASE_IMAGE_TAG
ARG MIMIC_ARCH
FROM tonistiigi/binfmt:qemu-v8.1.5-40 as binfmt
# =======================================================================

FROM scratch as mimic-host-native

COPY docker/setup.sh /mimic-cross.deno/setup.sh

# =======================================================================

FROM ${HOST_BASE_IMAGE}:${HOST_BASE_IMAGE_TAG} as mimic-host-build

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        unzip \
        wget \
        xz-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists

# Download zig
RUN mkdir /zig
WORKDIR /zig
RUN wget -q "https://ziglang.org/download/0.11.0/zig-linux-$(arch)-0.11.0.tar.xz" \
    && tar xf zig-linux-*-0.11.0.tar.xz \
    && rm zig-linux-*-0.11.0.tar.xz \
    && ln -sf "./zig-linux-$(arch)-0.11.0/zig" /zig/zig

COPY mimic-lib /mimic-lib
WORKDIR /mimic-lib
RUN /zig/zig build \
    && mkdir -p "lib/$(arch)-linux-gnu" \
    && mv zig-out/lib/libmimic-cross.so "lib/$(arch)-linux-gnu"

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
# Download deno
# hadolint ignore=DL3059
RUN mkdir -p /deno
WORKDIR /deno
RUN wget -qO- https://deno.land/install.sh | sh \
    && mv /root/.deno/bin/deno /deno/deno

# =======================================================================

FROM ${HOST_BASE_IMAGE}:${HOST_BASE_IMAGE_TAG} as mimic-host

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        binutils \
        ca-certificates \
        patch \
        patchelf \
        unzip \
        wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists

COPY --from=binfmt /usr/bin/qemu-* /mimic-cross/internal/bin/
RUN ln -s ../../../usr/bin/bash /mimic-cross/internal/bin \
    && ln -s ../../../usr/sbin/chroot /mimic-cross/internal/bin \
    && ln -s ../../../usr/bin/objdump /mimic-cross/internal/bin \
    && ln -s ../../../usr/bin/patch /mimic-cross/internal/bin \
    && ln -s ../../../usr/bin/patchelf /mimic-cross/internal/bin \
    && ln -s ../../../usr/bin/readelf /mimic-cross/internal/bin \
    && ln -s ../../../usr/bin/unzip /mimic-cross/internal/bin

COPY --from=mimic-host-build /mimic-lib/lib/ /usr/lib/
RUN mkdir -p /mimic-cross/bin/
COPY --from=mimic-host-build /deno/deno /mimic-cross/bin/mimic-deno
RUN arch > /mimic-cross/host_arch
COPY --from=mimic-host-build /zig/ /mimic-cross/internal/zig/
RUN ln -s ../zig/zig /mimic-cross/internal/bin/zig

COPY mimic-cross.deno /mimic-cross.deno

# ======================================================================

FROM mimic-host-build as mimic-test-host

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libc6-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists

COPY /test /test
WORKDIR /test
RUN gcc -shared -o libhello.so hello.c \
    && gcc -shared -o libhello_runpath.so hello.c -Wl,-rpath,\$ORIGIN/foo:/path/to/lib \
    && gcc -shared -o libhello_runpath_origin.so hello.c -Wl,-rpath,\$ORIGIN/foo

ENV MIMIC_TEST_DATA_PATH=/test
RUN mkdir -p /test/deploy

# =======================================================================

# hadolint ignore=DL3029
FROM --platform=linux/${MIMIC_ARCH} ${BASE_IMAGE}:${BASE_IMAGE_TAG} as mimic-cross

COPY --from=mimic-host / /mimic-cross
RUN /mimic-cross/mimic-cross.deno/setup.sh

# =======================================================================

# hadolint ignore=DL3029
FROM --platform=linux/${MIMIC_ARCH} ${BASE_IMAGE}:${BASE_IMAGE_TAG} as mimic-test

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        clang \
        clang-15 \
        gcc \
        g++ \
        python3 \
        python3.10-venv \
        python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists

COPY --from=mimic-test-host /test/custom /etc/mimic-cross/custom

COPY --from=mimic-host / /mimic-cross
RUN rm /etc/apt/apt.conf.d/docker-clean /mimic-cross/etc/apt/apt.conf.d/docker-clean
# hadolint ignore=DL3059
RUN /mimic-cross/mimic-cross.deno/setup.sh

# =======================================================================

FROM mimic-test AS mimic-test-run

COPY --from=mimic-test-host /test /test

ENV MIMIC_TEST_DATA_PATH=/test
ENV PATH="/mimic-cross/mimic-cross/bin:$PATH"
WORKDIR /mimic-cross/mimic-cross.deno

RUN mimic-deno test -A --parallel
