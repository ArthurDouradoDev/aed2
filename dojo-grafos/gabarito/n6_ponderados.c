#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"

/* Dijkstra em matriz de pesos: m[i][j] == 0 significa "nao ha aresta". */
void custo(int m[V][V], int i, int custos[V]) {
    int flags[V];
    int k, c, atual, menor;

    for (k = 0; k < V; k++) { custos[k] = INFINITO; flags[k] = 0; }
    custos[i] = 0;

    for (k = 0; k < V; k++) {
        atual = -1;
        menor = INFINITO;
        for (c = 0; c < V; c++)
            if (!flags[c] && custos[c] < menor) { menor = custos[c]; atual = c; }
        if (atual == -1) return;
        flags[atual] = 1;
        for (c = 0; c < V; c++) {
            if (m[atual][c] > 0 && !flags[c]) {
                if (custos[atual] + m[atual][c] < custos[c])
                    custos[c] = custos[atual] + m[atual][c];
            }
        }
    }
}

int achar_cor(vertice* g, int i) {
    bool tem_cor[V + 2];
    int j;
    no* p;
    for (j = 1; j <= V + 1; j++) tem_cor[j] = FALSE;
    p = g[i].inicio;
    while (p) {
        if (g[p->adj].cor > 0) tem_cor[g[p->adj].cor] = TRUE;
        p = p->prox;
    }
    for (j = 1; j <= V + 1; j++)
        if (!tem_cor[j]) return j;
    return -1;
}

void colorir(vertice* g, int i, int* k) {
    no* p;
    g[i].cor = achar_cor(g, i);
    if (g[i].cor > *k) *k = g[i].cor;
    p = g[i].inicio;
    while (p) {
        if (g[p->adj].cor == 0) colorir(g, p->adj, k);
        p = p->prox;
    }
}

vertice* filtrar_custo(vertice* g, int c) {
    vertice* resp = alocar_l();
    int i;
    inicializar_l(resp);
    for (i = 0; i < V; i++) {
        no* p = g[i].inicio;
        while (p) {
            if (p->peso > c) {
                inserir_aresta_l(resp, i, p->adj);
                resp[i].inicio->peso = p->peso;
            }
            p = p->prox;
        }
    }
    return resp;
}

no* caminho_bfs(vertice* g, int a, int b) {
    FILA F;
    int pai[V], k, i;
    no* resp = NULL;

    zerar_flags(g);
    for (k = 0; k < V; k++) pai[k] = -1;
    inicializar_fila(&F);
    entrar_fila(&F, a);
    g[a].flag = 1;

    while (F.inicio) {
        no* p;
        i = sair_fila(&F);
        if (i == b) break;
        p = g[i].inicio;
        while (p) {
            if (g[p->adj].flag == 0) {
                g[p->adj].flag = 1;
                pai[p->adj] = i;
                entrar_fila(&F, p->adj);
            }
            p = p->prox;
        }
        g[i].flag = 2;
    }
    while (F.inicio) sair_fila(&F);

    if (a != b && pai[b] == -1) return NULL;

    k = b;
    while (k != -1) {
        no* novo = (no*) malloc(sizeof(no));
        novo->adj = k; novo->peso = 0; novo->id = 0;
        novo->prox = resp;
        resp = novo;
        k = pai[k];
    }
    return resp;
}
