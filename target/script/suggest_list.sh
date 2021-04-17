#!/host/bin/bash

executable_list=$(dpkg -L $1 \
    | grep -v '^/lib/x86_64-linux-gnu' \
    | grep -v '^/usr/lib/x86_64-linux-gnu' \
    | xargs -I {} sh -c 'test ! -d {} -a -x {} && echo {} || :')

for executable in $executable_list; do
    if [[ ! -e /host$executable ]]; then
        echo "/host$executable is not exist"
        continue
    fi
    /host/bin/ldd /host$executable &> /dev/null || {
        echo "not executable file: /host/$executable"
        continue
    }
    /host/bin/ldd /host$executable | grep "not found" > /dev/null \
        && echo "/host$executable depends not found" \
        || echo "ln -sf /host$executable $executable" 
done


