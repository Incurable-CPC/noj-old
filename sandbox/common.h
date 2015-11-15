#ifndef __COMMON_H__
#define __COMMON_H__

#include <sys/resource.h>
#include <sys/syscall.h>
#include <sys/ptrace.h>
#include <sys/user.h>
#include <sys/time.h>
#include <sys/wait.h>
#include <unistd.h>
#include <assert.h>
#include <string.h>
#include <stdarg.h>
#include <stdlib.h>
#include <stdio.h>

#include "oj-info.h"

#define STD_KB 1024
#define STD_MB 1024*1024

#define BUFFER_SIZE 512

#endif
