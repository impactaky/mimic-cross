#!/bin/bash
mimic-deploy -c /host/bin/bash
# not dynamic executable : /usr/bin/bashbug
mimic-deploy /host/usr/bin/clear_console
