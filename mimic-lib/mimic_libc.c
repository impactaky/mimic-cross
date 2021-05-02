#define _GNU_SOURCE
#include <dlfcn.h>
#include <string.h>
#include <sys/utsname.h>
 
int uname(struct utsname *buf)
{
    int ret;
    int (*func)(struct utsname *) = dlsym(RTLD_NEXT, "uname");
    ret = func(buf);
    strcpy(buf->machine, MIMIC_TARGET_ARCH);
    return ret;
}
