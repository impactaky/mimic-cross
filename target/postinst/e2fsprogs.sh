#!/bin/bash
mimic-deploy /host/sbin/badblocks
mimic-deploy /host/sbin/debugfs
mimic-deploy /host/sbin/dumpe2fs
mimic-deploy /host/sbin/e2fsck
mimic-deploy /host/sbin/e2image
# not dynamic executable : /sbin/e2scrub
# not dynamic executable : /sbin/e2scrub_all
mimic-deploy /host/sbin/e2undo
mimic-deploy /host/sbin/mke2fs
mimic-deploy /host/sbin/resize2fs
mimic-deploy /host/sbin/tune2fs
mimic-deploy /host/usr/bin/chattr
mimic-deploy /host/usr/bin/lsattr
mimic-deploy /host/usr/sbin/e2freefrag
mimic-deploy /host/usr/sbin/e4crypt
mimic-deploy /host/usr/sbin/e4defrag
mimic-deploy /host/usr/sbin/filefrag
mimic-deploy /host/usr/sbin/mklost+found
