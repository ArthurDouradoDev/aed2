/* ==========================================================================
 *  NIVEL 1 - MATRIZ DE ADJACENCIA
 *
 *  Escreva aqui, do zero, as implementacoes do caderno.
 *  Para cada funcao: apague a linha FALTA_IMPLEMENTAR() e escreva o corpo.
 *
 *  rodar os testes deste nivel : make n1
 *  pedir uma dica              : make dica N=1 E=<numero do exercicio>
 *
 *  Esqueleto inicial
 * ========================================================================== */
#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"
#include "dojo.h"   /* so por causa do FALTA_IMPLEMENTAR() */

/* ---- 1. inicializar_m
 *      Zera a matriz inteira: no comeco nenhuma aresta existe.
 *      caderno, pag. 3 (Funcao de inicializacao)
 * ------------------------------------------------------------------ */
void inicializar_m(int m[V][V]) {
    FALTA_IMPLEMENTAR();
}

/* ---- 2. aresta_existe_m
 *      Devolve TRUE se existe a aresta v1 -> v2, FALSE caso contrario.
 *      caderno, pag. 3 (Funcao para verificar se aresta existe)
 * ------------------------------------------------------------------ */
bool aresta_existe_m(int m[V][V], int v1, int v2) {
    FALTA_IMPLEMENTAR();
    return FALSE;
}

/* ---- 3. inserir_aresta_m
 *      Marca a aresta v1 -> v2.
 *      O grafo aqui e DIRIGIDO: inserir 1->2 nao pode criar 2->1.
 *      caderno, pag. 3 (Funcao para inserir aresta)
 * ------------------------------------------------------------------ */
void inserir_aresta_m(int m[V][V], int v1, int v2) {
    FALTA_IMPLEMENTAR();
}

/* ---- 4. excluir_aresta_m
 *      Apaga a aresta v1 -> v2.
 *      Devolve FALSE (sem mexer na matriz) se ela nao existia.
 *      caderno, pag. 3 (Funcao para excluir aresta)
 * ------------------------------------------------------------------ */
bool excluir_aresta_m(int m[V][V], int v1, int v2) {
    FALTA_IMPLEMENTAR();
    return FALSE;
}

/* ---- 5. grau_saida_m
 *      Conta quantas arestas SAEM de v1.
 *      caderno, pag. 3 (Funcao para calcular o grau de saida)
 * ------------------------------------------------------------------ */
int grau_saida_m(int m[V][V], int v1) {
    FALTA_IMPLEMENTAR();
    return 0;
}

/* ---- 6. grau_entrada_m
 *      Conta quantas arestas CHEGAM em v1.
 *      caderno, pag. 3 (Funcao para calcular o grau de entrada)
 * ------------------------------------------------------------------ */
int grau_entrada_m(int m[V][V], int v1) {
    FALTA_IMPLEMENTAR();
    return 0;
}

