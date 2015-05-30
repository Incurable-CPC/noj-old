#include <sys/resource.h>
#include <sys/time.h>
#include <sys/wait.h>
#include <unistd.h>
#include <stdlib.h>
#include <assert.h>
#include <stdio.h>
#include <errno.h>

#include "oj-info.h"

inline int tv2ms(struct timeval tv) {
	return (int)(tv.tv_usec/1000)+tv.tv_sec*1000;
}

int run(char* input, int time_limit, int memory_limit,
		int* time_usage, int* memory_usage) {
	pid_t pid = fork();
	if (pid) {
		int status;
		struct rusage usage;
		int memory = 0, time = 0;
		wait4(pid, &status, WUNTRACED, &usage);
		time = tv2ms(usage.ru_utime) + tv2ms(usage.ru_stime);
		long memory_now = usage.ru_minflt*(getpagesize()>>10);
		if (memory_now > memory)
			memory = memory_now;

		*time_usage = time;
		*memory_usage = memory;

		if (time > time_limit) return OJ_TLE;
		if (memory > memory_limit*1024) return OJ_MLE;

		if (WIFEXITED(status)&&(WEXITSTATUS(status) == 0)) return OJ_AC;
		return OJ_RE;

	} else {
		struct rlimit r;
		r.rlim_max = RLIM_INFINITY;

		r.rlim_cur = time_limit/1000+1;
		setrlimit(RLIMIT_CPU, &r);

		r.rlim_cur = 512*1024*1024;
		setrlimit(RLIMIT_AS, &r);

		freopen(input, "r", stdin);
		freopen("tmp.out", "w", stdout);
		execl("./a.out", "./a.out", NULL);
	}
	return OJ_AC;
}
