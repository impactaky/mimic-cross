# FROM ubuntu:22.04
# => [2/7] RUN apt-get update &&     apt-get install -y --no-install-recommends         wget ca-certificates         binutils gcc make l  13.5s
# => [3/7] RUN wget https://ftp.gnu.org/gnu/binutils/binutils-2.36.tar.gz                                                                  5.6s
# => [4/7] RUN tar xf ./binutils-2.36.tar.gz                                                                                               1.7s
# => [5/7] WORKDIR /binutils-2.36                                                                                                          0.1s
# => [6/7] RUN ./configure                                                                                                                 1.3s
# => [7/7] RUN make -j `nproc`                                                                                                            27.9s


# FROM --platform=linux/arm64 ubunu:22.04
# [+] Building 537.1s (11/11) FINISHED
# => [2/7] RUN apt-get update &&     apt-get install -y --no-install-recommends         wget ca-certificates         binutils gcc make li  67.4s
# => [3/7] RUN wget https://ftp.gnu.org/gnu/binutils/binutils-2.36.tar.gz                                                                   5.7s
# => [4/7] RUN tar xf ./binutils-2.36.tar.gz                                                                                                3.6s
# => [5/7] WORKDIR /binutils-2.36                                                                                                           0.0s
# => [6/7] RUN ./configure                                                                                                                 22.8s
# => [7/7] RUN make -j `nproc`                                                                                                            434.8s


FROM --platform=${BUILDPLATFORM} impactaky/mc-ubuntu22.04-${TARGETARCH}
# => [2/7] RUN apt-get update &&     apt-get install -y --no-install-recommends         wget ca-certificates         binutils gcc make l  62.8s
# => [3/7] RUN wget https://ftp.gnu.org/gnu/binutils/binutils-2.36.tar.gz                                                                  5.2s
# => [4/7] RUN tar xf ./binutils-2.36.tar.gz                                                                                               1.8s
# => [5/7] WORKDIR /binutils-2.36                                                                                                          0.1s
# => [6/7] RUN ./configure                                                                                                                 1.5s
# => [7/7] RUN make -j `nproc`                                                                                                            34.6s


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

# vim:set ft=dockerfile :
