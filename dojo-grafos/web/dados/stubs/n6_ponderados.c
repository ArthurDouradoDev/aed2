/* ==========================================================================
 *  NIVEL 6 - PONDERADOS: DIJKSTRA E COLORACAO
 *
 *  Escreva aqui, do zero, as implementacoes do caderno.
 *  Para cada funcao: apague a linha FALTA_IMPLEMENTAR() e escreva o corpo.
 *
 *  rodar os testes deste nivel : make n6
 *  pedir uma dica              : make dica N=6 E=<numero do exercicio>
 *
 *  Gerado em 2026-09-10
 * ========================================================================== */
#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"
#include "dojo.h"   /* so por causa do FALTA_IMPLEMENTAR() */

/* ---- 1. custo
 *      Dijkstra em matriz de PESOS: m[i][j] == 0 quer dizer que nao ha aresta.
 *      Preenche custos[] com o custo minimo de i ate cada vertice
 *      (INFINITO para os inalcancaveis).
 *      caderno, pag. 13 (Algoritmo de Dijkstra)
 * ------------------------------------------------------------------ */
void custo(int m[V][V], int i, int custos[V]) {
    FALTA_IMPLEMENTAR();
}

/* ---- 2. achar_cor
 *      Devolve a MENOR cor (a partir de 1) que nenhum vizinho de i usa.
 *      Cor 0 significa 'ainda sem cor' e nao bloqueia nada.
 *      caderno, pag. 14 (Coloracao)
 * ------------------------------------------------------------------ */
int achar_cor(vertice* g, int i) {
    FALTA_IMPLEMENTAR();
    return -1;
}

/* ---- 3. colorir
 *      Colore em profundidade a partir de i, sem deixar dois vizinhos com
 *      a mesma cor. *k guarda a maior cor usada.
 *      Aqui o campo cor faz o papel da flag: cor == 0 e 'nao visitado'.
 *      caderno, pag. 14 (Metodo 1)
 * ------------------------------------------------------------------ */
void colorir(vertice* g, int i, int* k) {
    FALTA_IMPLEMENTAR();
}

/* ---- 4. filtrar_custo
 *      Copia de g so com as arestas de custo MAIOR que c.
 *      Peso igual a c fica de fora. Copie o peso para o no novo.
 *      lista ex. 7
 * ------------------------------------------------------------------ */
vertice* filtrar_custo(vertice* g, int c) {
    FALTA_IMPLEMENTAR();
    return NULL;
}

/* ---- 5. caminho_bfs
 *      Lista ligada com o menor caminho de a ate b, do a ate o b nessa ordem.
 *      NULL se nao existir caminho. De a ate a, a lista tem so o a.
 *      lista ex. 18 e 26
 * ------------------------------------------------------------------ */
no* caminho_bfs(vertice* g, int a, int b) {
    FALTA_IMPLEMENTAR();
    return NULL;
}

