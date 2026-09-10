/* ==========================================================================
 *  NIVEL 3 - TRANSFORMACOES SOBRE GRAFOS
 *
 *  Escreva aqui, do zero, as implementacoes do caderno.
 *  Para cada funcao: apague a linha FALTA_IMPLEMENTAR() e escreva o corpo.
 *
 *  rodar os testes deste nivel : make n3
 *  pedir uma dica              : make dica N=3 E=<numero do exercicio>
 *
 *  Gerado em 2026-09-09
 * ========================================================================== */
#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"
#include "dojo.h"   /* so por causa do FALTA_IMPLEMENTAR() */

/* ---- 1. transposta_l
 *      Devolve um grafo NOVO com todas as arestas invertidas.
 *      O grafo g original nao pode ser alterado.
 *      caderno, pag. 6 (Problema 3) / lista ex. 4
 * ------------------------------------------------------------------ */
vertice* transposta_l(vertice* g) {
    FALTA_IMPLEMENTAR();
    return NULL;
}

/* ---- 2. matriz_p_lista
 *      Converte um grafo em matriz para lista de adjacencia.
 *      caderno, pag. 8 / lista ex. 5
 * ------------------------------------------------------------------ */
vertice* matriz_p_lista(int m[V][V]) {
    FALTA_IMPLEMENTAR();
    return NULL;
}

/* ---- 3. subgrafo_lm
 *      TRUE se toda aresta de g1 (lista) tambem existe em m2 (matriz).
 *      caderno, pag. 5-6 (Problema 2) / lista ex. 8
 * ------------------------------------------------------------------ */
bool subgrafo_lm(vertice* g1, int m2[V][V]) {
    FALTA_IMPLEMENTAR();
    return FALSE;
}

/* ---- 4. contar_lacos_l
 *      Conta quantos lacos (arestas i -> i) existem no grafo.
 *      lista ex. 1
 * ------------------------------------------------------------------ */
int contar_lacos_l(vertice* g) {
    FALTA_IMPLEMENTAR();
    return 0;
}

/* ---- 5. remover_lacos_l
 *      Remove todos os lacos, sem tocar nas outras arestas.
 *      lista ex. 2
 * ------------------------------------------------------------------ */
void remover_lacos_l(vertice* g) {
    FALTA_IMPLEMENTAR();
}

/* ---- 6. destruir_arestas_l
 *      Libera TODOS os nos e deixa o grafo vazio.
 *      Guarde o proximo antes do free: depois dele p->prox nao vale mais nada.
 *      lista ex. 3
 * ------------------------------------------------------------------ */
void destruir_arestas_l(vertice* g) {
    FALTA_IMPLEMENTAR();
}

/* ---- 7. diferenca_l
 *      Grafo novo com as arestas que estao em g1 mas nao em g2.
 *      lista ex. 9
 * ------------------------------------------------------------------ */
vertice* diferenca_l(vertice* g1, vertice* g2) {
    FALTA_IMPLEMENTAR();
    return NULL;
}

/* ---- 8. completo_l
 *      TRUE se existe aresta entre todo par de vertices distintos.
 *      lista ex. 19
 * ------------------------------------------------------------------ */
bool completo_l(vertice* g) {
    FALTA_IMPLEMENTAR();
    return FALSE;
}

/* ---- 9. complemento_l
 *      Grafo com exatamente as arestas que faltam em g.
 *      Lacos nao entram: nao sao par de vertices distintos.
 *      lista ex. 20
 * ------------------------------------------------------------------ */
vertice* complemento_l(vertice* g) {
    FALTA_IMPLEMENTAR();
    return NULL;
}

