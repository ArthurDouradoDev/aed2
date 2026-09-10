#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"

vertice* alocar_l(void) {
    vertice* g = (vertice*) malloc(V * sizeof(vertice));
    return g;
}

void inicializar_l(vertice* g) {
    int i;
    for (i = 0; i < V; i++) {
        g[i].inicio = NULL;
        g[i].flag   = 0;
        g[i].tipo   = 0;
        g[i].dist   = 0;
        g[i].cor    = 0;
        g[i].pais   = 0;
    }
}

bool aresta_existe_l(vertice* g, int v1, int v2) {
    no* p = g[v1].inicio;
    while (p) {
        if (p->adj == v2) return TRUE;
        p = p->prox;
    }
    return FALSE;
}

bool inserir_aresta_l(vertice* g, int v1, int v2) {
    no* novo;
    if (aresta_existe_l(g, v1, v2)) return FALSE;
    novo = (no*) malloc(sizeof(no));
    novo->adj  = v2;
    novo->peso = 1;
    novo->id   = 0;
    novo->prox = g[v1].inicio;
    g[v1].inicio = novo;
    return TRUE;
}

bool excluir_aresta_l(vertice* g, int v1, int v2) {
    no* ant = NULL;
    no* p   = g[v1].inicio;
    while (p) {
        if (p->adj == v2) break;
        ant = p;
        p = p->prox;
    }
    if (!p) return FALSE;
    if (ant) ant->prox = p->prox;
    else     g[v1].inicio = p->prox;
    free(p);
    return TRUE;
}

int grau_saida_l(vertice* g, int v1) {
    int gs = 0;
    no* p = g[v1].inicio;
    while (p) { gs++; p = p->prox; }
    return gs;
}

int grau_entrada_l(vertice* g, int v1) {
    int i, ge = 0;
    for (i = 0; i < V; i++) {
        no* p = g[i].inicio;
        while (p) {
            if (p->adj == v1) ge++;
            p = p->prox;
        }
    }
    return ge;
}
