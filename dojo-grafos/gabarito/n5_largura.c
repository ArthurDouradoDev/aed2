#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"

void inicializar_fila(FILA* f) {
    f->inicio = NULL;
    f->ultimo = NULL;
}

void entrar_fila(FILA* f, int valor) {
    no* novo = (no*) malloc(sizeof(no));
    novo->adj  = valor;
    novo->peso = 0;
    novo->id   = 0;
    novo->prox = NULL;
    if (f->ultimo == NULL) f->inicio = novo;
    else                   f->ultimo->prox = novo;
    f->ultimo = novo;
}

int sair_fila(FILA* f) {
    no* p;
    int valor;
    if (f->inicio == NULL) return -1;
    p = f->inicio;
    valor = p->adj;
    f->inicio = p->prox;
    if (f->inicio == NULL) f->ultimo = NULL;
    free(p);
    return valor;
}

void largura_l(vertice* g, int i) {
    FILA F;
    zerar_flags(g);
    inicializar_fila(&F);
    entrar_fila(&F, i);
    g[i].flag = 1;
    while (F.inicio) {
        no* p;
        i = sair_fila(&F);
        p = g[i].inicio;
        while (p) {
            if (g[p->adj].flag == 0) {
                g[p->adj].flag = 1;
                entrar_fila(&F, p->adj);
            }
            p = p->prox;
        }
        g[i].flag = 2;
    }
}

void largura_m(int m[V][V], int i, int flags[V]) {
    FILA F;
    int k;
    for (k = 0; k < V; k++) flags[k] = 0;
    inicializar_fila(&F);
    entrar_fila(&F, i);
    flags[i] = 1;
    while (F.inicio) {
        int j;
        i = sair_fila(&F);
        for (j = 0; j < V; j++) {
            if (m[i][j] == 1 && flags[j] == 0) {
                flags[j] = 1;
                entrar_fila(&F, j);
            }
        }
        flags[i] = 2;
    }
}

int tipo_x_mais_prox(vertice* g, int i, int x) {
    FILA F;
    zerar_flags(g);
    inicializar_fila(&F);
    entrar_fila(&F, i);
    g[i].flag = 1;
    while (F.inicio) {
        no* p;
        i = sair_fila(&F);
        if (g[i].tipo == x) {
            while (F.inicio) sair_fila(&F);
            return i;
        }
        p = g[i].inicio;
        while (p) {
            if (g[p->adj].flag == 0) {
                g[p->adj].flag = 1;
                entrar_fila(&F, p->adj);
            }
            p = p->prox;
        }
        g[i].flag = 2;
    }
    return -1;
}

int comprimento(vertice* g, int v1, int v2) {
    FILA F;
    int k;
    zerar_flags(g);
    for (k = 0; k < V; k++) g[k].dist = INFINITO;
    g[v1].dist = 0;
    inicializar_fila(&F);
    entrar_fila(&F, v1);
    g[v1].flag = 1;
    while (F.inicio) {
        no* p;
        int i = sair_fila(&F);
        if (i == v2) {
            int d = g[i].dist;
            while (F.inicio) sair_fila(&F);
            return d;
        }
        p = g[i].inicio;
        while (p) {
            if (g[p->adj].flag == 0) {
                g[p->adj].flag = 1;
                g[p->adj].dist = g[i].dist + 1;
                entrar_fila(&F, p->adj);
            }
            p = p->prox;
        }
        g[i].flag = 2;
    }
    return INFINITO;
}

no* vertices_raio_n(vertice* g, int i, int N) {
    no* resp = NULL;
    FILA F;
    int k;
    zerar_flags(g);
    for (k = 0; k < V; k++) g[k].dist = 0;
    inicializar_fila(&F);
    entrar_fila(&F, i);
    g[i].flag = 1;
    while (F.inicio) {
        no *p, *novo;
        i = sair_fila(&F);
        p = g[i].inicio;
        while (p) {
            if (g[p->adj].flag == 0 && g[i].dist + 1 <= N) {
                g[p->adj].dist = g[i].dist + 1;
                g[p->adj].flag = 1;
                entrar_fila(&F, p->adj);
            }
            p = p->prox;
        }
        g[i].flag = 2;
        novo = (no*) malloc(sizeof(no));
        novo->adj = i; novo->peso = 0; novo->id = 0;
        novo->prox = resp;
        resp = novo;
    }
    return resp;
}

void distancias(vertice* g, int i, int dist[V]) {
    FILA F;
    int k;
    zerar_flags(g);
    for (k = 0; k < V; k++) dist[k] = INFINITO;
    dist[i] = 0;
    inicializar_fila(&F);
    entrar_fila(&F, i);
    g[i].flag = 1;
    while (F.inicio) {
        no* p;
        i = sair_fila(&F);
        p = g[i].inicio;
        while (p) {
            if (g[p->adj].flag == 0) {
                g[p->adj].flag = 1;
                dist[p->adj] = dist[i] + 1;
                entrar_fila(&F, p->adj);
            }
            p = p->prox;
        }
        g[i].flag = 2;
    }
}
