# FROM ubuntu:20.04
# [+] Building 56.6s (11/11) FINISHED
# => [2/7] RUN apt-get update &&     apt-get install -y --no-install-recommends         wget ca-certificates         binutils gcc make li  15.9s
# => [3/7] RUN wget https://ftp.gnu.org/gnu/binutils/binutils-2.36.tar.gz                                                                   4.7s
# => [4/7] RUN tar xf ./binutils-2.36.tar.gz                                                                                                1.8s
# => [5/7] WORKDIR /binutils-2.36                                                                                                           0.0s
# => [6/7] RUN ./configure                                                                                                                  1.6s
# => [7/7] RUN make -j `nproc`                                                                                                             29.9s

# FROM multiarch/ubuntu-core:arm64-focal
# [+] Building 537.1s (11/11) FINISHED
# => [2/7] RUN apt-get update &&     apt-get install -y --no-install-recommends         wget ca-certificates         binutils gcc make li  67.4s
# => [3/7] RUN wget https://ftp.gnu.org/gnu/binutils/binutils-2.36.tar.gz                                                                   5.7s
# => [4/7] RUN tar xf ./binutils-2.36.tar.gz                                                                                                3.6s
# => [5/7] WORKDIR /binutils-2.36                                                                                                           0.0s
# => [6/7] RUN ./configure                                                                                                                 22.8s
# => [7/7] RUN make -j `nproc`                                                                                                            434.8s


FROM impactaky/mimic-cross:arm64-focal
# [+] Building 97.5s (11/11) FINISHED
# => [2/7] RUN apt-get update &&     apt-get install -y --no-install-recommends         wget ca-certificates         binutils gcc make li  51.9s
# => [3/7] RUN wget https://ftp.gnu.org/gnu/binutils/binutils-2.36.tar.gz                                                                   5.0s
# => [4/7] RUN tar xf ./binutils-2.36.tar.gz                                                                                                1.8s
# => [5/7] WORKDIR /binutils-2.36                                                                                                           0.0s
# => [6/7] RUN ./configure                                                                                                                  1.7s
# => [7/7] RUN make -j `nproc`                                                                                                             34.2s

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        wget ca-certificates \
        binutils gcc make libc6-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists

RUN wget https://ftp.gnu.org/gnu/binutils/binutils-2.36.tar.gz
RUN tar xf ./binutils-2.36.tar.gz
WORKDIR /binutils-2.36
RUN ./configure
RUN make -j `nproc`

# vim:set ft=dockerfile :
