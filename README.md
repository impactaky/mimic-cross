# mimic-cross

Fast cross-compiled environment requiring no special recipes.

## Quick start

### Usage

Just use this as base image and build image with `--platform` option.

```Dockerfile
FROM --platform=${BUILDPLATFORM} impactaky/mc-ubuntu22.04-${TARGETARCH}
```

### Run example

Use [binutils build example](/example/binutils.dockerfile).

```bash
cd ./example
docker buildx build --platform=linux/arm64,linux/amd64 -f binutils.dockerfile .
```

This is the result on my local machine.

| Base image                     | sec   | 
| ------------------------------ | ----- |
| ubuntu:22.04 (native compile)  | 29.9  |
| ubuntu:22.04 (cross compile)   | 434.8 |
| mc-ubuntu22.04 (cross compile) | 34.6  |
 
### How to introduce mimic-cross to existing image

Please write as following.

```Dockerfile
FROM --platform=${BUILDPLATFORM} impactaky/mc-ubuntu22.04-${TARGETARCH}-host AS mimic-host
FROM ubuntu:22.04
COPY --from=mimic-host / /mimic-cross
RUN /mimic-cross/mimic-cross.deno/setup.sh
```

## Notes

mimic-cross currently does not support the apt command, please use apt-get.

mimic-cross currently does not support the pip command. Please use
`python3 -m pip` instead.

## Supported environments

- OS
  - ubuntu:22.04
- Build platform
  - linux/amd64
  - linux/arm64
- Target platform
  - linux/amd64
  - linux/arm64
- Package manager
  - apt-get
- Compiler
  - gcc-11
  - g++-11
- Language
  - python3.10

Supported packages can be found in
[supported.json](/mimic-cross.deno/apt/packages/supported.json)

## How to add support packages

T.B.D.

## How to make runable users binary

T.B.D.

## How mimic-cross works

![Untitled Diagram (1)](https://user-images.githubusercontent.com/37619203/131243313-c4f6264f-621c-47b6-981b-a76f4ec7902f.png)

Mimic-cross introduces binaries running on host into the environment run by
qemu-use-static to speed up the process. To do so, the mimic-cross image has a
sysroot for the host architecture under /mimic-cross.

This allows us to run the program faster without using QEMU instead of
increasing the image size.\
The image size increase can be handled by multistage build.

### What happen when run package manager

1. Run in target sysroot
2. Check installed package
3. If supported package installed, package install in /mimic-cross sysroot.
4. Set up for mimicking (Patch to elf RUNPATH, etc...)

## Environent variables

### MIMIC_CROSS_DISABLE=1

When this value is set, execute only the original command by qemu and no special
mimic-cross processing.

If you run the pip command with this, you will not be able to invoke the
installed packages in the mimic-cross environment, but you can reduce the image
size if you are simply installing dependencies needed for the build

### MIMIC_CRSOS_DEBUG=1

When this variable is set, debugging information is output.

When reporting errors, please set this variable and attach the /var/log/mimic-cross.log.

### MIIMC_CROSS_GCC_NATIVE_ARCH=xxx

Replace gcc/g++ -march=native option to -march=xxx

### MIIMC_CROSS_GCC_NATIVE_CPU=xxx

Replace gcc/g++ -mcpu=native option to -march=xxx

### MIIMC_CROSS_GCC_NATIVE_TUNE=xxx

Replace gcc/g++ -mtune=native option to -mtune=xxx