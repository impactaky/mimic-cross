replace_package_name() {
    sed -e "s/^gcc\(-[0-9]\+\)\?$/gcc\1-$(arch)-linux-gnu/" \
        -e "s/^cpp\(-[0-9]\+\)\?$/cpp\1-$(arch)-linux-gnu/" \
    | sort -u
}
