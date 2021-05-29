replace_package_name() {
    sed -e "s/^binutils$/binutils-$(arch)-linux-gnu/" \
        -e "s/^cpp\(-[0-9]\+\)\?$/cpp\1-$(arch)-linux-gnu/" \
        -e "s/^g++\(-[0-9]\+\)\?$/g++\1-$(arch)-linux-gnu/" \
        -e "s/^gcc\(-[0-9]\+\)\?$/gcc\1-$(arch)-linux-gnu/" \
        -e "s/:$(dpkg --print-architecture)$//" \
    | sort -u
}
