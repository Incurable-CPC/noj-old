#include "common.h"

int execute_sh(const char* fmt, ...) {
	char sh[BUFFER_SIZE];
	va_list ap;

	va_start(ap, fmt);
	vsprintf(sh, fmt, ap);
	int ret = system(sh);
	va_end(ap);

	return ret;
}

int get_proc_status(pid_t pid, const char* mark) {
	FILE* pf;
	char fn[BUFFER_SIZE], buf[BUFFER_SIZE];
	int ret = 0;
	sprintf(fn, "/proc/%d/status", pid);
	pf = fopen(fn, "r");
	int m = strlen(mark);
	while (pf&&fgets(buf, BUFFER_SIZE-1, pf)) {
		buf[strlen(buf)-1] = 0;
		if (strncmp(buf, mark, m) == 0) {
			sscanf(buf+m+1, "%d", &ret);
		}
	}
	if (pf) fclose(pf);
	return ret;
}

int get_page_fault_mem(pid_t pid, struct rusage* ruse) {
	return ruse->ru_minflt*getpagesize();
}
