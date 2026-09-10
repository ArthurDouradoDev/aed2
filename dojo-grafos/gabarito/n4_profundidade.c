#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"

void zerar_flags(vertice* g) {
    int i;
    for (i = 0; i < V; i++) g[i].flag = 0;
}

void prof(vertice* g, int i) {
    no* p;
    g[i].flag = 1;
    p = g[i].inicio;
    while (p) {
        if (g[p->adj].flag == 0) prof(g, p->adj);
        p = p->prox;
    }
    g[i].flag = 2;
}

void prof_caminho(vertice* g, int i, int j, bool* achou) {
    no* p;
    if (i == j) { *achou = TRUE; return; }
    g[i].flag = 1;
    p = g[i].inicio;
    while (p) {
        if (g[p->adj].flag == 0) {
            prof_caminho(g, p->adj, j, achou);
            if (*achou) return;
        }
        p = p->prox;
    }
    g[i].flag = 2;
}

static bool ciclo_aux(vertice* g, int i) {
    no* p;
    g[i].flag = 1;
    p = g[i].inicio;
    while (p) {
        if (g[p->adj].flag == 1) return TRUE;
        if (g[p->adj].flag == 0 && ciclo_aux(g, p->adj)) return TRUE;
        p = p->prox;
    }
    g[i].flag = 2;
    return FALSE;
}

bool tem_ciclo_dir(vertice* g) {
    int i;
    zerar_flags(g);
    for (i = 0; i < V; i++)
        if (g[i].flag == 0 && ciclo_aux(g, i)) return TRUE;
    return FALSE;
}

void contar_tipo_x(vertice* g, int i, int x, int* cont) {
    no* p;
    g[i].flag = 1;
    if (g[i].tipo == x) *cont = *cont + 1;
    p = g[i].inicio;
    while (p) {
        if (g[p->adj].flag == 0) contar_tipo_x(g, p->adj, x, cont);
        p = p->prox;
    }
    g[i].flag = 2;
}

int contar_grupos(vertice* g) {
    int i, cont = 0;
    zerar_flags(g);
    for (i = 0; i < V; i++) {
        if (g[i].flag == 0) {
            cont++;
            prof(g, i);
        }
    }
    return cont;
}

static void conta_alcancaveis(vertice* g, int i, int* cont) {
    no* p;
    g[i].flag = 1;
    *cont = *cont + 1;
    p = g[i].inicio;
    while (p) {
        if (g[p->adj].flag == 0) conta_alcancaveis(g, p->adj, cont);
        p = p->prox;
    }
    g[i].flag = 2;
}

int maior_grupo_inicio(vertice* g) {
    int maior_i = -1, maior_quant = 0, i;
    zerar_flags(g);
    for (i = 0; i < V; i++) {
        int cont = 0;
        if (g[i].flag == 0) {
            conta_alcancaveis(g, i, &cont);
            if (cont > maior_quant) {
                maior_quant = cont;
                maior_i = i;
            }
        }
    }
    return maior_i;
}

bool arvore_enraizada(vertice* g) {
    int i, fontes = 0, raiz = -1, visitados = 0;
    for (i = 0; i < V; i++) {
        if (grau_entrada_l(g, i) == 0) { fontes++; raiz = i; }
    }
    if (fontes != 1)      return FALSE;
    if (tem_ciclo_dir(g)) return FALSE;
    zerar_flags(g);
    prof(g, raiz);
    for (i = 0; i < V; i++) if (g[i].flag != 0) visitados++;
    if (visitados != V) return FALSE;
    return TRUE;
}
