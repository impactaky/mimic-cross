#!/host/bin/bash -eu

executable_list=$(dpkg -L $1 \
    | grep -v "^/lib/$(arch)-linux-gnu" \
    | grep -v "^/usr/lib/$(arch)-linux-gnu" \
    | xargs -I {} sh -c 'test ! -d {} -a ! -L {} -a -x {} && echo {} || :')

for executable in $executable_list; do
    ldd $executable &> /dev/null || {
        echo "# not dynamic executable : $executable"
        continue
    }
    echo "mimic-deploy /host$executable"
done
