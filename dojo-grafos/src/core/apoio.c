/* Compilado SEM -Dmalloc, para poder chamar o malloc de verdade. */
#include <stdlib.h>
#include <stddef.h>

size_t dojo_ult_malloc = 0;

void* dojo_malloc(size_t n) {
    dojo_ult_malloc = n;
    return malloc(n);
}
