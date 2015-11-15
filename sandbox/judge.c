#include "common.h"

int execute_sh(const char*, ...);
int get_proc_status(int, const char*);
int get_page_fault_mem(pid_t, struct rusage*);

int call_counter[512];
#define NOJ_MAX_LIMIT -1
int LANG_JV[256] = { 61, 22, 6, 33, 8, 13, 16, 111, 110, 39, 79, SYS_fcntl, SYS_getdents64 , SYS_getrlimit, SYS_rt_sigprocmask, SYS_futex, SYS_read, SYS_mmap, SYS_stat, SYS_open, SYS_close, SYS_execve, SYS_access, SYS_brk, SYS_readlink, SYS_munmap, SYS_close, SYS_uname, SYS_clone, SYS_uname, SYS_mprotect, SYS_rt_sigaction, SYS_getrlimit, SYS_fstat, SYS_getuid, SYS_getgid, SYS_geteuid, SYS_getegid, SYS_set_thread_area, SYS_set_tid_address, SYS_set_robust_list, SYS_exit_group, 158, 0 };
int LANG_JC[256] = { NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, 1, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, 0 };
int LANG_CV[256] = { SYS_time, SYS_read, SYS_uname, SYS_write, SYS_open, SYS_close, SYS_execve, SYS_access, SYS_brk, SYS_munmap, SYS_mprotect, SYS_mmap, SYS_fstat, SYS_set_thread_area, 252, SYS_arch_prctl, 231, 0 };
int LANG_CC[256] = { 1, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, 2, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, 0 };
int LANG_PV[256] = { SYS_open, SYS_set_thread_area, SYS_brk, SYS_read, SYS_uname, SYS_write, SYS_execve, SYS_ioctl, SYS_readlink, SYS_mmap, SYS_rt_sigaction, SYS_getrlimit, 252, 191, 158, 231, SYS_close, SYS_exit_group, SYS_munmap, SYS_time, 4, 0 };
int LANG_PC[256] = { NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, 1, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, 2, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, NOJ_MAX_LIMIT, 0 };

void init_syscalls_limits(int lang) {
	int i;
	memset(call_counter, 0, sizeof(call_counter));
	if ((lang == LANG_C)||(lang == LANG_CPP)) {
	for (i = 0; LANG_CC[i]; i++)
		call_counter[LANG_CV[i]] = LANG_CC[i];
	} else if (lang == LANG_PAS) {
	for (i = 0; LANG_PC[i]; i++)
		call_counter[LANG_PV[i]] = LANG_PC[i];
	} else if (lang == LANG_JAVA) {
	for (i = 0; LANG_JC[i]; i++)
		call_counter[LANG_JV[i]] = LANG_JC[i];
	}
}

void run(int lang, int time_lmt, int memory_lmt) {
	nice(19);
	freopen("data.in", "r", stdin);
	freopen("user.out", "w", stdout);
	freopen("err.log", "a+", stderr);
	
	ptrace(PTRACE_TRACEME, 0, NULL, NULL);

	if (lang != LANG_JAVA) chroot(".");

	while (setgid(1536) != 0) sleep(1);
	while (setuid(1536) != 0) sleep(1);

	struct rlimit LIM;
	LIM.rlim_cur = LIM.rlim_max = time_lmt+1;
	setrlimit(RLIMIT_CPU, &LIM);
	alarm(0);
	alarm(time_lmt*10);

	LIM.rlim_cur = 32*STD_MB;
	LIM.rlim_max = 33*STD_MB;
	setrlimit(RLIMIT_FSIZE, &LIM);

	LIM.rlim_cur = LIM.rlim_max = (lang == LANG_JAVA)? 50: 1;
	setrlimit(RLIMIT_NPROC, &LIM);

	LIM.rlim_max = LIM.rlim_cur = 64*STD_MB;
	setrlimit(RLIMIT_STACK, &LIM);
	LIM.rlim_max =  memory_lmt*2*STD_MB;
	LIM.rlim_cur = memory_lmt/2*3*STD_MB;
	if (lang < LANG_JAVA) setrlimit(RLIMIT_AS, &LIM);

	switch (lang) {
		case LANG_C:
		case LANG_CPP:
		case LANG_PAS:
			execl("./Main", "./Main", NULL);
			break;
		case LANG_JAVA:
			execl("java", "java", "-Xms32m", "-Xmx256m",
					"-Djava.security.manager",
					"-Djava.security.policy=./java.policy",
					"Main", NULL);
			break;
	}
	exit(0);
}

void watch(pid_t pid, int cid, int lang, int time_lmt, int memory_lmt,
		int* time_usage, int* memory_usage) {
	int result = OJ_AC;
	int time = 0, memory = 0;
	int status, exit_code;
	struct rusage ruse;
	struct user_regs_struct reg;
	while (1) {
		wait4(-1, &status, 0, &ruse);
		int tmp = (lang == LANG_JAVA)? get_page_fault_mem(pid, &ruse):
			get_proc_status(pid, "VmPeak:") << 10;
		if (tmp > memory) memory = tmp;
		if (memory > memory_lmt*STD_MB) {
			result = OJ_MLE;
			ptrace(PTRACE_KILL, pid, NULL, NULL);
			break;
		}
		if (WIFEXITED(status)) break;
		exit_code = WEXITSTATUS(status);

		if (WIFSIGNALED(status)) {
			int sig = WTERMSIG(status);
			if (result == OJ_AC) {
				switch (sig) {
					case SIGCHLD:
					case SIGALRM:
						alarm(0);
					case SIGKILL:
					case SIGXCPU:
						result = OJ_TLE;
						break;
					case SIGXFSZ:
						result = OJ_OLE;
						break;
					default:
						result = OJ_RE;
				}
			}
		}

		ptrace(PTRACE_GETREGS, pid, NULL, &reg);
		int syscall_id = reg.orig_rax;
		if ((syscall_id > 0)&&(call_counter[syscall_id] == 0)) {
			result = OJ_RE;
			ptrace(PTRACE_KILL, pid, NULL, NULL);
		}
	}
}

void prepare_files(int pid, int id, int sid, int spj) {
	char dir[BUFFER_SIZE];
	char file[BUFFER_SIZE];
	sprintf(dir, "../../testdata/%d", pid);
	sprintf(file, "%s/%d", dir, pid);
	execute_sh("cp %s.in data.in", file, id);
	execute_sh("cp %s.out data.out", file, id);
	if (spj) execute_sh("cp %s/spj spj", dir);
}
//./judge lang sid pid time_lmt memory_lmt test_num spj
int main(int argc, char* argv[]) {
	assert(argc == 8);
	int lang = atoi(argv[1]);
	init_syscalls_limits(lang);
	char* dir = argv[2];
	int sid = atoi(dir);
	int pid = atoi(argv[3]);
	int time_lmt = atoi(argv[4]);
	int memory_lmt = atoi(argv[5]);
	int test_num = atoi(argv[6]);
	int spj = atoi(argv[7]);
	chdir("sandbox/runs");
	chdir(dir);
	int result = OJ_AC, time = 0, memory = 0;
	int i;
	for (i = 0; (i < test_num)&&(result == OJ_AC); i++) {
		prepare_files(pid, i, sid, spj);
		
		pid_t pid = fork();

		if (pid == 0) {
			run(lang, time_lmt, memory_lmt);
		} else {
		}
	}
	printf("%d\n%d\n%d\n", result, time, memory);

	return 0;
}
