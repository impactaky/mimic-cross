#!/bin/bash
mimic-deploy /host/bin/run-parts
mimic-deploy /host/bin/tempfile
# not dynamic executable : /bin/which
# not dynamic executable : /sbin/installkernel
mimic-deploy /host/usr/bin/ischroot
# not dynamic executable : /usr/bin/savelog
# not dynamic executable : /usr/sbin/add-shell
# not dynamic executable : /usr/sbin/remove-shell
