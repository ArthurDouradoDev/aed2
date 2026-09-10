#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"

static no* empilha(no* lista, int v) {
    no* novo = (no*) malloc(sizeof(no));
    novo->adj = v; novo->peso = 0; novo->id = 0; novo->cia = 0;
    novo->prox = lista;
    return novo;
}

/* ---- ex.10 ------------------------------------------------------------ */
no* suspeitos_spam(vertice* g, int x) {
    no* resp = NULL;
    int i;
    for (i = 0; i < V; i++) {
        int enviou = 0, recebeu = 0, j;
        no* p;
        for (p = g[i].inicio; p; p = p->prox)
            if (p->id == x) enviou = 1;
        for (j = 0; j < V; j++)
            for (p = g[j].inicio; p; p = p->prox)
                if (p->adj == i && p->id == x) recebeu = 1;
        if (enviou && !recebeu) resp = empilha(resp, i);
    }
    return resp;
}

/* ---- ex.11 ------------------------------------------------------------ */
int mais_paises(vertice* g) {
    int i, melhor = -1, maior = -1;
    for (i = 0; i < V; i++) {
        int vistos[V], nv = 0, qtd = 0, k;
        no* p;
        for (p = g[i].inicio; p; p = p->prox) {
            int pais = g[p->adj].pais, achou = 0;
            for (k = 0; k < nv; k++) if (vistos[k] == pais) achou = 1;
            if (!achou) { vistos[nv++] = pais; qtd++; }
        }
        if (qtd > maior) { maior = qtd; melhor = i; }
    }
    return melhor;
}

/* ---- ex.12 ------------------------------------------------------------ */
static bool ciclo_nd(vertice* g, int i, int pai) {
    no* p;
    g[i].flag = 1;
    for (p = g[i].inicio; p; p = p->prox) {
        if (p->adj == i) return TRUE;                 /* laco */
        if (g[p->adj].flag == 0) {
            if (ciclo_nd(g, p->adj, i)) return TRUE;
        } else if (p->adj != pai) {
            return TRUE;
        }
    }
    g[i].flag = 2;
    return FALSE;
}

bool tem_ciclo_nao_dir(vertice* g) {
    int i;
    zerar_flags(g);
    for (i = 0; i < V; i++)
        if (g[i].flag == 0 && ciclo_nd(g, i, -1)) return TRUE;
    return FALSE;
}

/* ---- ex.13 ------------------------------------------------------------ */
static int achou_u = -1, achou_v = -1;

static bool acha_volta(vertice* g, int i) {
    no* p;
    g[i].flag = 1;
    for (p = g[i].inicio; p; p = p->prox) {
        if (g[p->adj].flag == 1) { achou_u = i; achou_v = p->adj; return TRUE; }
        if (g[p->adj].flag == 0 && acha_volta(g, p->adj)) return TRUE;
    }
    g[i].flag = 2;
    return FALSE;
}

bool remover_aresta_ciclo(vertice* g) {
    int i;
    achou_u = -1; achou_v = -1;
    zerar_flags(g);
    for (i = 0; i < V; i++) {
        if (g[i].flag == 0 && acha_volta(g, i)) {
            excluir_aresta_l(g, achou_u, achou_v);
            return TRUE;
        }
    }
    return FALSE;
}

/* ---- ex.15 ------------------------------------------------------------ */
static void junta(vertice* g, int i, no** lista, int* cont) {
    no* p;
    g[i].flag = 1;
    *lista = empilha(*lista, i);
    *cont = *cont + 1;
    for (p = g[i].inicio; p; p = p->prox)
        if (g[p->adj].flag == 0) junta(g, p->adj, lista, cont);
    g[i].flag = 2;
}

no* maior_grupo_lista(vertice* g) {
    no* melhor = NULL;
    int maior = 0, i;
    zerar_flags(g);
    for (i = 0; i < V; i++) {
        if (g[i].flag == 0) {
            no* lista = NULL;
            int cont = 0;
            junta(g, i, &lista, &cont);
            if (cont > maior) { maior = cont; melhor = lista; }
        }
    }
    return melhor;
}

/* ---- ex.22 ------------------------------------------------------------ */
no* vazias_mais_proximas(vertice* g, int i) {
    no* resp = NULL;
    FILA F;
    int k, achado = -1;

    zerar_flags(g);
    for (k = 0; k < V; k++) g[k].dist = 0;
    inicializar_fila(&F);
    entrar_fila(&F, i);
    g[i].flag = 1;

    while (F.inicio) {
        no* p;
        int u = sair_fila(&F);
        if (achado >= 0 && g[u].dist > achado) break;
        if (g[u].tipo == 0) { achado = g[u].dist; resp = empilha(resp, u); }
        for (p = g[u].inicio; p; p = p->prox) {
            if (g[p->adj].flag == 0) {
                g[p->adj].flag = 1;
                g[p->adj].dist = g[u].dist + 1;
                entrar_fila(&F, p->adj);
            }
        }
        g[u].flag = 2;
    }
    while (F.inicio) sair_fila(&F);
    return resp;
}

/* ---- ex.25 ------------------------------------------------------------ */
no* relacionados_k(vertice* g, int i, int k) {
    no* resp = NULL;
    int j;
    for (j = 0; j < V; j++) {
        int total = 0, ligado = 0;
        no* p;
        if (j == i) continue;
        for (p = g[i].inicio; p; p = p->prox)
            if (p->adj == j) { total += p->peso; ligado = 1; }
        for (p = g[j].inicio; p; p = p->prox)
            if (p->adj == i) { total += p->peso; ligado = 1; }
        if (ligado && total >= k) resp = empilha(resp, j);
    }
    return resp;
}

/* ---- ex.26 ------------------------------------------------------------ */
no* rota_companhia(vertice* g, int a, int b, int c) {
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
        for (p = g[i].inicio; p; p = p->prox) {
            if (p->cia == c && g[p->adj].flag == 0) {
                g[p->adj].flag = 1;
                pai[p->adj] = i;
                entrar_fila(&F, p->adj);
            }
        }
        g[i].flag = 2;
    }
    while (F.inicio) sair_fila(&F);

    if (a != b && pai[b] == -1) return NULL;
    k = b;
    while (k != -1) { resp = empilha(resp, k); k = pai[k]; }
    return resp;
}

/* ---- ex.28 ------------------------------------------------------------ */
int tipo_x_evitando(vertice* g, int i, int x, int n) {
    FILA F;
    if (i == n) return -1;
    zerar_flags(g);
    inicializar_fila(&F);
    entrar_fila(&F, i);
    g[i].flag = 1;
    while (F.inicio) {
        no* p;
        i = sair_fila(&F);
        if (g[i].tipo == x) { while (F.inicio) sair_fila(&F); return i; }
        for (p = g[i].inicio; p; p = p->prox) {
            if (p->adj != n && g[p->adj].flag == 0) {
                g[p->adj].flag = 1;
                entrar_fila(&F, p->adj);
            }
        }
        g[i].flag = 2;
    }
    return -1;
}
