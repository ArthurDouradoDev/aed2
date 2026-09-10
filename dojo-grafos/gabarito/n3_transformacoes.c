#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"

vertice* transposta_l(vertice* g) {
    vertice* gt = alocar_l();
    int i;
    inicializar_l(gt);
    for (i = 0; i < V; i++) {
        no* p = g[i].inicio;
        while (p) {
            inserir_aresta_l(gt, p->adj, i);
            p = p->prox;
        }
    }
    return gt;
}

vertice* matriz_p_lista(int m[V][V]) {
    vertice* g = alocar_l();
    int i, j;
    inicializar_l(g);
    for (i = 0; i < V; i++)
        for (j = 0; j < V; j++)
            if (m[i][j] == 1) inserir_aresta_l(g, i, j);
    return g;
}

bool subgrafo_lm(vertice* g1, int m2[V][V]) {
    int i;
    for (i = 0; i < V; i++) {
        no* p = g1[i].inicio;
        while (p) {
            if (!aresta_existe_m(m2, i, p->adj)) return FALSE;
            p = p->prox;
        }
    }
    return TRUE;
}

int contar_lacos_l(vertice* g) {
    int i, cont = 0;
    for (i = 0; i < V; i++)
        if (aresta_existe_l(g, i, i)) cont++;
    return cont;
}

void remover_lacos_l(vertice* g) {
    int i;
    for (i = 0; i < V; i++)
        if (aresta_existe_l(g, i, i)) excluir_aresta_l(g, i, i);
}

void destruir_arestas_l(vertice* g) {
    int i;
    for (i = 0; i < V; i++) {
        no* p = g[i].inicio;
        while (p) {
            no* t = p->prox;
            free(p);
            p = t;
        }
        g[i].inicio = NULL;
    }
}

vertice* diferenca_l(vertice* g1, vertice* g2) {
    vertice* g3 = alocar_l();
    int i;
    inicializar_l(g3);
    for (i = 0; i < V; i++) {
        no* p = g1[i].inicio;
        while (p) {
            if (!aresta_existe_l(g2, i, p->adj)) inserir_aresta_l(g3, i, p->adj);
            p = p->prox;
        }
    }
    return g3;
}

bool completo_l(vertice* g) {
    int i, j;
    for (i = 0; i < V; i++)
        for (j = 0; j < V; j++)
            if (i != j && !aresta_existe_l(g, i, j)) return FALSE;
    return TRUE;
}

vertice* complemento_l(vertice* g) {
    vertice* gc = alocar_l();
    int i, j;
    inicializar_l(gc);
    for (i = 0; i < V; i++)
        for (j = 0; j < V; j++)
            if (i != j && !aresta_existe_l(g, i, j)) inserir_aresta_l(gc, i, j);
    return gc;
}
