#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/utsname.h>
 
int uname(struct utsname *buf)
{
    int ret;
    char *line = MIMIC_TARGET_ARCH;
    {
        int (*func)(struct utsname *) = dlsym(RTLD_NEXT, "uname");
        ret = func(buf);
        strcpy(buf->machine, line);
    }
    return ret;
}
