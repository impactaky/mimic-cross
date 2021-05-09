# not dynamic executable : /sbin/ldconfig
# not dynamic executable : /sbin/ldconfig.real
# not dynamic executable : /usr/bin/catchsegv
mimic-deploy /host/usr/bin/getconf
mimic-deploy /host/usr/bin/getent
mimic-deploy /host/usr/bin/iconv
# not dynamic executable : /usr/bin/ldd
mimic-deploy /host/usr/bin/locale
mimic-deploy /host/usr/bin/localedef
mimic-deploy /host/usr/bin/pldd
# not dynamic executable : /usr/bin/tzselect
mimic-deploy /host/usr/bin/zdump
mimic-deploy /host/usr/sbin/iconvconfig
mimic-deploy /host/usr/sbin/zic
