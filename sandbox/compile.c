#include "common.h"

const char *CP[][15] = {
	{ "gcc", "Main.c", "-o", "Main", "-O2", "-Wall", "-lm", "--static", "-std=c99", "-DONLINE_JUDGE",  NULL },
	{ "g++", "Main.cpp", "-o", "Main", "-O2", "-Wall", "-lm", "--static", "-DONLINE_JUDGE",  NULL },
	{ "fpc", "Main.pas", "-O2", "-Co", "-Ct", "-Ci", NULL },
	{ "javac", "Main.java", "-J-Xms32m", "-J-Xmx256m", NULL }
};
// ./complie lang sid
int main(int argc, char* argv[]) {
	assert(argc == 3);
	int lang = atoi(argv[1]);
	char *dir = argv[2];
	int result = 0;
	chdir("runs");
	chdir(dir);
	system("pwd");
	int pid = fork();
	if (pid == 0) {
		struct rlimit LIM;
		LIM.rlim_max = LIM.rlim_cur = 60;
		setrlimit(RLIMIT_CPU, &LIM);
		LIM.rlim_max = LIM.rlim_cur = 90*STD_MB;
		setrlimit(RLIMIT_FSIZE, &LIM);
		LIM.rlim_max = LIM.rlim_cur = 1024*STD_MB;
		setrlimit(RLIMIT_AS, &LIM);
		
		freopen("err.log", "w", (lang == 2)? stdout: stderr);

		execvp(CP[lang][0], (char* const*)CP[lang]);
	} else {
		int status = 0;
		waitpid(pid, &status, 0);
		printf("%d\n", status);
	}
	return 0;
}
