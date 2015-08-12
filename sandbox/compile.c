#include <unistd.h>
#include <assert.h>
#include <stdlib.h>
#include <stdio.h>

#include "oj-info.h"

int main(int argc, char* argv[]) {
	assert(argc == 3);
	int lang = atoi(argv[1]);
	char *dir = argv[2];
	int result = 0;
	chdir("sandbox/submissions");
	chdir(dir);
	switch (lang) {
		case GNU_C:
			result = system("gcc Main.c -O2 -lm -DONLIE_JUDGE 2> err.log");
			break;
		case GNU_CPP:
			result = system("g++ Main.cpp -O2 -lm -DONLIE_JUDGE 2> err.log");
			break;
		case JAVA:
			result = system("javac Main.java 2> err.log");
			break;
		default: assert(0);
	}
	printf("%d\n", result);
	return 0;
}
