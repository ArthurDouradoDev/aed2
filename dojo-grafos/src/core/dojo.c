#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <signal.h>
#include <setjmp.h>
#include "dojo.h"

int       dojo_stub = 0;
Resultado dojo_res  = R_OK;
char      dojo_msg[2048];
char      dojo_ctx[2048];
char      errbuf[1024];
char      dojo_extra[8192];

void dj_print(const char* fmt, ...) {
    va_list ap;
    size_t n = strlen(dojo_extra);
    if (n >= sizeof(dojo_extra) - 1) return;
    va_start(ap, fmt);
    vsnprintf(dojo_extra + n, sizeof(dojo_extra) - n, fmt, ap);
    va_end(ap);
}

/* ---------------------------------------------------------------------- */
int dj_conta_adj(vertice* g, int v) {
    int c = 0; no* p;
    if (!g) return -1;
    for (p = g[v].inicio; p; p = p->prox) c++;
    return c;
}

int dj_tem_adj(vertice* g, int v, int alvo) {
    no* p;
    if (!g) return 0;
    for (p = g[v].inicio; p; p = p->prox)
        if (p->adj == alvo) return 1;
    return 0;
}

int dj_conta_arestas(vertice* g) {
    int i, t = 0;
    if (!g) return -1;
    for (i = 0; i < V; i++) t += dj_conta_adj(g, i);
    return t;
}

/* Confere que a lista de v contem exatamente os n vertices de `esperados`,
   em qualquer ordem e sem repeticoes. Devolve 1 se bate. */
int dj_confere_adj(vertice* g, int v, const int* esperados, int n,
                   char* err, int errsz) {
    int i, achou, obtidos[64], qtd = 0, pos = 0;
    no* p;
    if (!g) { snprintf(err, errsz, "grafo e' NULL"); return 0; }

    for (p = g[v].inicio; p && qtd < 64; p = p->prox) obtidos[qtd++] = p->adj;

    if (qtd != n) {
        pos += snprintf(err + pos, errsz - pos,
                        "vertice %d deveria ter %d adjacente(s), tem %d\n",
                        v, n, qtd);
    }
    for (i = 0; i < n; i++)
        if (!dj_tem_adj(g, v, esperados[i]))
            pos += snprintf(err + pos, errsz - pos,
                            "       falta a aresta %d -> %d\n", v, esperados[i]);

    for (i = 0; i < qtd; i++) {
        int j; achou = 0;
        for (j = 0; j < n; j++) if (obtidos[i] == esperados[j]) achou = 1;
        if (!achou)
            pos += snprintf(err + pos, errsz - pos,
                            "       sobra  a aresta %d -> %d\n", v, obtidos[i]);
    }
    return pos == 0;
}

int dj_lista_para_vetor(no* l, int* saida, int max) {
    int n = 0;
    while (l && n < max) { saida[n++] = l->adj; l = l->prox; }
    return n;
}

/* Insere aresta SEM usar o codigo do aluno (para montar cenarios de teste
   quando o proprio inserir_aresta ainda nao foi implementado). */
void dj_liga(vertice* g, int v1, int v2) {
    no* novo;
    if (!g) return;
    if (dj_tem_adj(g, v1, v2)) return;
    novo = (no*) malloc(sizeof(no));
    novo->adj  = v2;
    novo->peso = 1;
    novo->id   = 0;
    novo->cia  = 0;
    novo->prox = g[v1].inicio;
    g[v1].inicio = novo;
}

void dj_por_peso(vertice* g, int v1, int v2, int peso) {
    no* p;
    if (!g) return;
    for (p = g[v1].inicio; p; p = p->prox)
        if (p->adj == v2) p->peso = peso;
}

void dj_por_id(vertice* g, int v1, int v2, int id) {
    no* p;
    if (!g) return;
    for (p = g[v1].inicio; p; p = p->prox)
        if (p->adj == v2) p->id = id;
}

void dj_por_cia(vertice* g, int v1, int v2, int cia) {
    no* p;
    if (!g) return;
    for (p = g[v1].inicio; p; p = p->prox)
        if (p->adj == v2) p->cia = cia;
}

void dj_libera(vertice* g) {
    int i; no *p, *t;
    if (!g) return;
    for (i = 0; i < V; i++) {
        p = g[i].inicio;
        while (p) { t = p->prox; free(p); p = t; }
        g[i].inicio = NULL;
    }
    free(g);
}

/* ---------------------------------------------------------------------- */
void dj_desenha_lista(const char* titulo, vertice* g) {
    int i; no* p;
    dj_print("       " C_DIM "%s" C_RESET "\n", titulo);
    if (!g) { dj_print("       " C_VERM "(NULL)" C_RESET "\n"); return; }
    for (i = 0; i < V; i++) {
        dj_print("       [%d]", i);
        for (p = g[i].inicio; p; p = p->prox) dj_print(" -> %d", p->adj);
        dj_print("\n");
    }
}

void dj_desenha_matriz(const char* titulo, int m[V][V]) {
    int i, j;
    dj_print("       " C_DIM "%s" C_RESET "\n", titulo);
    dj_print("       de -> para");
    for (j = 0; j < V; j++) dj_print(" %d", j);
    dj_print("\n");
    for (i = 0; i < V; i++) {
        dj_print("       [%d]    ", i);
        for (j = 0; j < V; j++)
            dj_print(" %s%d%s", m[i][j] ? C_AMAR : C_DIM, m[i][j], C_RESET);
        dj_print("\n");
    }
}

void dj_desenha_flags(const char* titulo, vertice* g) {
    int i;
    dj_print("       " C_DIM "%s  (0=branco 1=cinza 2=preto)" C_RESET "\n", titulo);
    dj_print("       vertice:");
    for (i = 0; i < V; i++) dj_print(" %d", i);
    dj_print("\n       flag   :");
    for (i = 0; i < V; i++) dj_print(" %d", g ? g[i].flag : -1);
    dj_print("\n");
}

void dj_desenha_vetor(const char* titulo, int* vet, int n) {
    int i;
    dj_print("       " C_DIM "%s" C_RESET "\n       ", titulo);
    for (i = 0; i < n; i++) {
        if (vet[i] >= INFINITO) dj_print(" inf");
        else                    dj_print(" %3d", vet[i]);
    }
    dj_print("\n");
}

/* ---------------------------------------------------------------------- */
/* Roda um exercicio isolado, sobrevivendo a acessos invalidos de memoria. */
static jmp_buf dj_pulo;
static void dj_trata_sinal(int s) { (void)s; longjmp(dj_pulo, 1); }

int dojo_roda(Exercicio* e) {
    dojo_stub = 0;
    dojo_res  = R_OK;
    dojo_msg[0] = 0;
    dojo_ctx[0] = 0;
    dojo_extra[0] = 0;

    signal(SIGSEGV, dj_trata_sinal);
    signal(SIGFPE,  dj_trata_sinal);
    if (setjmp(dj_pulo) == 0) {
        e->teste();
    } else {
        signal(SIGSEGV, SIG_DFL);
        signal(SIGFPE,  SIG_DFL);
        return R_QUEBROU;
    }
    signal(SIGSEGV, SIG_DFL);
    signal(SIGFPE,  SIG_DFL);
    if (dojo_stub && dojo_res != R_FALHOU) return R_STUB;
    return dojo_res;
}
