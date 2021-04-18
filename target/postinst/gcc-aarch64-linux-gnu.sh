#!/host/bin/bash -eu

ln -sf /host/usr/bin/aarch64-linux-gnu-gcc /usr/bin/aarch64-linux-gnu-gcc
ln -sf /host/usr/bin/aarch64-linux-gnu-gcc-ar /usr/bin/aarch64-linux-gnu-gcc-ar
ln -sf /host/usr/bin/aarch64-linux-gnu-gcc-nm /usr/bin/aarch64-linux-gnu-gcc-nm
ln -sf /host/usr/bin/aarch64-linux-gnu-gcc-ranlib /usr/bin/aarch64-linux-gnu-gcc-ranlib
ln -sf /host/usr/bin/aarch64-linux-gnu-gcov /usr/bin/aarch64-linux-gnu-gcov
ln -sf /host/usr/bin/aarch64-linux-gnu-gcov-dump /usr/bin/aarch64-linux-gnu-gcov-dump
ln -sf /host/usr/bin/aarch64-linux-gnu-gcov-tool /usr/bin/aarch64-linux-gnu-gcov-tool
if [[ "$(arch)" == "aarch64" ]]; then
    ln -sf /host/usr/bin/aarch64-linux-gnu-gcc /usr/bin/gcc
    ln -sf /host/usr/bin/aarch64-linux-gnu-gcc-ar /usr/bin/gcc-ar
    ln -sf /host/usr/bin/aarch64-linux-gnu-gcc-nm /usr/bin/gcc-nm
    ln -sf /host/usr/bin/aarch64-linux-gnu-gcc-ranlib /usr/bin/gcc-ranlib
    ln -sf /host/usr/bin/aarch64-linux-gnu-gcov /usr/bin/gcov
    ln -sf /host/usr/bin/aarch64-linux-gnu-gcov-dump /usr/bin/gcov-dump
    ln -sf /host/usr/bin/aarch64-linux-gnu-gcov-tool /usr/bin/gcov-tool
    # /usr/lib/bfd-plugins/liblto_plugin.so
fi
