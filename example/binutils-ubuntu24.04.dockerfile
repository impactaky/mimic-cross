# hadolint ignore=DL3007
FROM --platform=${BUILDPLATFORM} impactaky/mc-ubuntu24.04-${TARGETARCH}:latest

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        wget ca-certificates \
        binutils gcc make libc6-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists

RUN wget -q https://ftp.gnu.org/gnu/binutils/binutils-2.36.tar.gz \
    && tar xf ./binutils-2.36.tar.gz
WORKDIR /binutils-2.36
RUN ./configure
RUN make -j "$(nproc)"
