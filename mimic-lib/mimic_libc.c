#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/utsname.h>
 
int uname(struct utsname *buf)
{
    int ret;
    char *line = NULL;
    ssize_t nread;
    {
        size_t len = 0;
        FILE *fp;
        fp = fopen("/mimic-cross/arch", "r");
        if (fp == NULL) {
            perror("Can't open /mimic-cross/arch");
            exit(EXIT_FAILURE);
        }
        nread = getline(&line, &len, fp);
        if (nread == -1) {
            perror("Can't read line from /mimic-cross/arch");
            exit(EXIT_FAILURE);
        }
    }
    {
        int (*func)(struct utsname *) = dlsym(RTLD_NEXT, "uname");
        ret = func(buf);
        strncpy(buf->machine, line, nread-1);
    }
    return ret;
}
