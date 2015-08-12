#include <unistd.h>
#include <assert.h>
#include <stdlib.h>
#include <stdio.h>

#include "oj-info.h"

int run(char*, int, int, int*, int*);

int main(int argc, char* argv[]) {
	assert(argc == 6);
	char* dir = argv[1];
	int pid = atoi(argv[2]);
	int time_limit = atoi(argv[3]);
	int memory_limit = atoi(argv[4]);
	int test_num = atoi(argv[5]);
	chdir("sandbox/submissions");
	chdir(dir);
	int result = OJ_AC, time = 0, memory = 0;
	int i;
	for (i = 0; i < test_num; i++) {
		char file[50], cmd[200];
		sprintf(file, "../../testdata/%d/testdata%d.in", pid, i);
		int tmp_memory, tmp_time;
		int tmp = run(file, time_limit, memory_limit, 
				&tmp_time, &tmp_memory);
		if (tmp_memory > memory) memory = tmp_memory;
		if (tmp_time > time) time = tmp_time;
		if (tmp != OJ_AC) { result = tmp; break; }
		sprintf(file, "../../testdata/%d/testdata%d.out", pid, i);
		sprintf(cmd, "diff -b %s tmp.out > err.log", file);
		if (system(cmd)) { result = OJ_WA; break; }
	}
	printf("%d\n%d\n%d\n", result, time, memory);

	return 0;
}
