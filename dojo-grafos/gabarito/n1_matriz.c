#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"

void inicializar_m(int m[V][V]) {
    int i, j;
    for (i = 0; i < V; i++)
        for (j = 0; j < V; j++)
            m[i][j] = 0;
}

bool aresta_existe_m(int m[V][V], int v1, int v2) {
    if (m[v1][v2] == 1) return TRUE;
    else                return FALSE;
}

void inserir_aresta_m(int m[V][V], int v1, int v2) {
    m[v1][v2] = 1;
}

bool excluir_aresta_m(int m[V][V], int v1, int v2) {
    if (m[v1][v2] == 0) return FALSE;
    m[v1][v2] = 0;
    return TRUE;
}

int grau_saida_m(int m[V][V], int v1) {
    int i, gs = 0;
    for (i = 0; i < V; i++) gs = gs + m[v1][i];
    return gs;
}

int grau_entrada_m(int m[V][V], int v1) {
    int i, ge = 0;
    for (i = 0; i < V; i++) ge = ge + m[i][v1];
    return ge;
}
