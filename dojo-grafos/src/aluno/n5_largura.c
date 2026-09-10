/* ==========================================================================
 *  NIVEL 5 - FILA E BUSCA EM LARGURA
 *
 *  Escreva aqui, do zero, as implementacoes do caderno.
 *  Para cada funcao: apague a linha FALTA_IMPLEMENTAR() e escreva o corpo.
 *
 *  rodar os testes deste nivel : make n5
 *  pedir uma dica              : make dica N=5 E=<numero do exercicio>
 *
 *  Gerado em 2026-09-09
 * ========================================================================== */
#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"
#include "dojo.h"   /* so por causa do FALTA_IMPLEMENTAR() */

/* ---- 1. as tres funcoes da FILA
 *      Entra no fim, sai do comeco (FIFO).
 *      sair_fila devolve -1 se a fila estiver vazia.
 *      Tres armadilhas moram aqui:
 *        1) com a fila vazia f->ultimo e NULL: nada de f->ultimo->prox;
 *        2) o vertice 0 e um valor valido, nao rejeite valor == 0;
 *        3) quando o ultimo elemento sai, zere f->ultimo tambem.
 *      caderno, pag. 10 (1. criar uma fila F)
 * ------------------------------------------------------------------ */
void inicializar_fila(FILA* f) {
    FALTA_IMPLEMENTAR();
}

void entrar_fila(FILA* f, int valor) {
    FALTA_IMPLEMENTAR();
}

int sair_fila(FILA* f) {
    FALTA_IMPLEMENTAR();
    return -1;
}

/* ---- 2. largura_l
 *      Busca em largura a partir de i. A propria funcao zera as flags.
 *      Ao ENFILEIRAR um vizinho branco ele fica cinza (1);
 *      ao SAIR da fila, o vertice fica preto (2).
 *      caderno, pag. 10
 * ------------------------------------------------------------------ */
void largura_l(vertice* g, int i) {
    FALTA_IMPLEMENTAR();
}

/* ---- 3. largura_m
 *      A mesma busca em largura, agora em matriz.
 *      As marcas vao no vetor flags, que a propria funcao zera antes.
 *      caderno, pag. 11
 * ------------------------------------------------------------------ */
void largura_m(int m[V][V], int i, int flags[V]) {
    FALTA_IMPLEMENTAR();
}

/* ---- 4. tipo_x_mais_prox
 *      Devolve o vertice de tipo x MAIS PROXIMO de i (menos arestas), ou -1.
 *      Se o proprio i for do tipo x, a resposta e i.
 *      Tem que ser busca em largura: profundidade daria resposta errada.
 *      caderno, pag. 11 (Ex 1) / lista ex. 21 e 27
 * ------------------------------------------------------------------ */
int tipo_x_mais_prox(vertice* g, int i, int x) {
    FALTA_IMPLEMENTAR();
    return -1;
}

/* ---- 5. comprimento
 *      Numero de arestas do menor caminho de v1 ate v2.
 *      Devolve INFINITO se nao houver caminho. De v1 ate v1 da 0.
 *      caderno, pag. 12 (Ex 2)
 * ------------------------------------------------------------------ */
int comprimento(vertice* g, int v1, int v2) {
    FALTA_IMPLEMENTAR();
    return INFINITO;
}

/* ---- 6. vertices_raio_n
 *      Lista ligada com todos os vertices a no maximo N arestas de i,
 *      incluindo o proprio i. A ordem da lista nao importa.
 *      caderno, pag. 12 (Ex 2) / lista ex. 24
 * ------------------------------------------------------------------ */
no* vertices_raio_n(vertice* g, int i, int N) {
    FALTA_IMPLEMENTAR();
    return NULL;
}

/* ---- 7. distancias
 *      Preenche dist[] com a distancia em arestas de i ate cada vertice.
 *      Quem nao for alcancavel fica com INFINITO.
 *      lista ex. 23
 * ------------------------------------------------------------------ */
void distancias(vertice* g, int i, int dist[V]) {
    FALTA_IMPLEMENTAR();
}

