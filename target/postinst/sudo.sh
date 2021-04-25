$MIMIC_CROSS_ROOT/bin/mimic-deploy /host/usr/bin/sudo
chmod u+s /usr/bin/sudo
echo Path plugin_dir /host/usr/lib/sudo/ >> /etc/sudo.conf
chmod 751 /etc/sudo.conf
