/* ==========================================================================
 *  NIVEL 7 - DESAFIOS DA LISTA
 *
 *  Escreva aqui, do zero, as implementacoes do caderno.
 *  Para cada funcao: apague a linha FALTA_IMPLEMENTAR() e escreva o corpo.
 *
 *  rodar os testes deste nivel : make n7
 *  pedir uma dica              : make dica N=7 E=<numero do exercicio>
 *
 *  Gerado em 2026-09-10
 * ========================================================================== */
#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"
#include "dojo.h"   /* so por causa do FALTA_IMPLEMENTAR() */


/* --------------------------------------------------------------------------
 *  ESPACO PARA SUAS FUNCOES AUXILIARES
 *
 *  Tres exercicios deste nivel pedem apoio recursivo:
 *    - tem_ciclo_nao_dir    uma auxiliar que receba o vertice pai;
 *    - remover_aresta_ciclo uma auxiliar que guarde a aresta de volta;
 *    - maior_grupo_lista    uma auxiliar que va empilhando os visitados.
 * ------------------------------------------------------------------------ */

/* ---- 1. suspeitos_spam
 *      Rede de emails dirigida. A aresta u -> v com id == x quer dizer que u
 *      mandou a mensagem x para v.
 *      Devolve a lista dos usuarios que MANDARAM x mas NUNCA receberam x.
 *      lista ex. 10
 * ------------------------------------------------------------------ */
no* suspeitos_spam(vertice* g, int x) {
    FALTA_IMPLEMENTAR();
    return NULL;
}

/* ---- 2. mais_paises
 *      Cada vertice tem um campo pais. Devolve a unidade que liga para o
 *      maior numero de paises DIFERENTES. Empate: qualquer uma serve.
 *      lista ex. 11
 * ------------------------------------------------------------------ */
int mais_paises(vertice* g) {
    FALTA_IMPLEMENTAR();
    return -1;
}

/* ---- 3. tem_ciclo_nao_dir
 *      TRUE se o grafo NAO-dirigido tem algum ciclo.
 *      A auxiliar recursiva precisa receber tambem o vertice pai: a aresta
 *      de volta para quem te chamou nao e ciclo.
 *      lista ex. 12
 * ------------------------------------------------------------------ */
bool tem_ciclo_nao_dir(vertice* g) {
    FALTA_IMPLEMENTAR();
    return FALSE;
}

/* ---- 4. remover_aresta_ciclo
 *      Acha UMA aresta de volta num grafo dirigido, remove ela e devolve
 *      TRUE. FALSE se nao havia ciclo nenhum.
 *      lista ex. 13
 * ------------------------------------------------------------------ */
bool remover_aresta_ciclo(vertice* g) {
    FALTA_IMPLEMENTAR();
    return FALSE;
}

/* ---- 5. maior_grupo_lista
 *      Lista ligada com TODOS os vertices do maior grupo conectado.
 *      A ordem nao importa; havendo empate, qualquer grupo serve.
 *      lista ex. 15
 * ------------------------------------------------------------------ */
no* maior_grupo_lista(vertice* g) {
    FALTA_IMPLEMENTAR();
    return NULL;
}

/* ---- 6. vazias_mais_proximas
 *      O campo tipo guarda a OCUPACAO da sala; tipo == 0 e sala vazia.
 *      Lista de TODAS as salas vazias que empatam em menor distancia de i.
 *      Se a propria sala i estiver vazia, a resposta e so ela.
 *      lista ex. 22
 * ------------------------------------------------------------------ */
no* vazias_mais_proximas(vertice* g, int i) {
    FALTA_IMPLEMENTAR();
    return NULL;
}

/* ---- 7. relacionados_k
 *      O peso da aresta conta as mensagens enviadas naquele sentido.
 *      Lista dos usuarios j ligados a i (num sentido ou no outro) cuja soma
 *      dos dois sentidos seja >= k. Sem repetir j.
 *      lista ex. 25
 * ------------------------------------------------------------------ */
no* relacionados_k(vertice* g, int i, int k) {
    FALTA_IMPLEMENTAR();
    return NULL;
}

/* ---- 8. rota_companhia
 *      Cada aresta tem uma companhia no campo cia.
 *      Trajeto com menos conexoes de a ate b usando so voos da companhia c.
 *      NULL se nao der para chegar.
 *      lista ex. 26
 * ------------------------------------------------------------------ */
no* rota_companhia(vertice* g, int a, int b, int c) {
    FALTA_IMPLEMENTAR();
    return NULL;
}

/* ---- 9. tipo_x_evitando
 *      Igual ao tipo_x_mais_prox, mas o vertice n esta interditado:
 *      nao pode ser atravessado nem ser a resposta. -1 se nao houver saida.
 *      lista ex. 28
 * ------------------------------------------------------------------ */
int tipo_x_evitando(vertice* g, int i, int x, int n) {
    FALTA_IMPLEMENTAR();
    return -1;
}

