/* ==========================================================================
 *  NIVEL 2 - LISTA DE ADJACENCIA
 *
 *  Escreva aqui, do zero, as implementacoes do caderno.
 *  Para cada funcao: apague a linha FALTA_IMPLEMENTAR() e escreva o corpo.
 *
 *  rodar os testes deste nivel : make n2
 *  pedir uma dica              : make dica N=2 E=<numero do exercicio>
 *
 *  Gerado em 2026-09-10
 * ========================================================================== */
#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"
#include "dojo.h"   /* so por causa do FALTA_IMPLEMENTAR() */

/* ---- 1. alocar_l
 *      Aloca o vetor com os V vertices do grafo e devolve o ponteiro.
 *      Cuidado com o sizeof: sao V structs vertice, nao V ponteiros.
 *      caderno, pag. 4
 * ------------------------------------------------------------------ */
vertice* alocar_l(void) {
    FALTA_IMPLEMENTAR();
    return NULL;
}

/* ---- 2. inicializar_l
 *      Deixa a lista de todo vertice vazia (inicio = NULL).
 *      Zere tambem flag, tipo, dist, cor e pais: os niveis 4, 5 e 6
 *      contam com esses campos comecando em zero.
 *      caderno, pag. 4 (Funcao para inicializacao)
 * ------------------------------------------------------------------ */
void inicializar_l(vertice* g) {
    FALTA_IMPLEMENTAR();
}

/* ---- 3. aresta_existe_l
 *      Percorre a lista de v1 procurando um no com adj == v2.
 *      caderno, pag. 4 (Funcao para verificar se aresta existe)
 * ------------------------------------------------------------------ */
bool aresta_existe_l(vertice* g, int v1, int v2) {
    FALTA_IMPLEMENTAR();
    return FALSE;
}

/* ---- 4. inserir_aresta_l
 *      Insere v1 -> v2 na CABECA da lista de v1.
 *      Devolve FALSE se a aresta ja existia (nao duplique).
 *      Inicialize tambem peso = 1 e id = 0 no no novo.
 *      caderno, pag. 4 (Funcao para inserir aresta)
 * ------------------------------------------------------------------ */
bool inserir_aresta_l(vertice* g, int v1, int v2) {
    FALTA_IMPLEMENTAR();
    return FALSE;
}

/* ---- 5. excluir_aresta_l
 *      Remove o no de v2 da lista de v1 e da free nele.
 *      Devolve FALSE se a aresta nao existia.
 *      Atencao ao caso em que o no procurado e o PRIMEIRO da lista.
 *      caderno, pag. 5 (Funcao para excluir aresta)
 * ------------------------------------------------------------------ */
bool excluir_aresta_l(vertice* g, int v1, int v2) {
    FALTA_IMPLEMENTAR();
    return FALSE;
}

/* ---- 6. grau_saida_l
 *      Conta quantos nos tem a lista de v1.
 *      caderno, pag. 3 (versao em lista)
 * ------------------------------------------------------------------ */
int grau_saida_l(vertice* g, int v1) {
    FALTA_IMPLEMENTAR();
    return 0;
}

/* ---- 7. grau_entrada_l
 *      Conta quantas arestas chegam em v1.
 *      Em lista nao existe coluna: e preciso olhar a lista de todo mundo.
 *      caderno, pag. 3 (versao em lista)
 * ------------------------------------------------------------------ */
int grau_entrada_l(vertice* g, int v1) {
    FALTA_IMPLEMENTAR();
    return 0;
}

