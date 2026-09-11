/* ==========================================================================
 *  NIVEL 4 - BUSCA EM PROFUNDIDADE
 *
 *  Escreva aqui, do zero, as implementacoes do caderno.
 *  Para cada funcao: apague a linha FALTA_IMPLEMENTAR() e escreva o corpo.
 *
 *  rodar os testes deste nivel : make n4
 *  pedir uma dica              : make dica N=4 E=<numero do exercicio>
 *
 *  Esqueleto inicial
 * ========================================================================== */
#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"
#include "dojo.h"   /* so por causa do FALTA_IMPLEMENTAR() */


/* --------------------------------------------------------------------------
 *  ESPACO PARA SUAS FUNCOES AUXILIARES
 *
 *  Dois exercicios deste nivel pedem uma funcao recursiva de apoio:
 *    - tem_ciclo_dir      precisa de uma que devolva TRUE ao achar um
 *                         vizinho CINZA;
 *    - maior_grupo_inicio precisa de uma que conte os alcancaveis.
 *
 *  Declare as duas como static, aqui em cima, antes de usa-las.
 * ------------------------------------------------------------------------ */

/* ---- 1. zerar_flags
 *      Deixa todo vertice BRANCO (flag = 0) antes de comecar uma busca.
 *      Mexa APENAS no campo flag.
 *      caderno, pag. 6
 * ------------------------------------------------------------------ */
void zerar_flags(vertice* g) {
    FALTA_IMPLEMENTAR();
}

/* ---- 2. prof
 *      Busca em profundidade a partir de i. Quem chama zera as flags antes.
 *      Convencao: 0 = branco, 1 = cinza (descoberto), 2 = preto (concluido).
 *      caderno, pag. 6 (parte 1/3)
 * ------------------------------------------------------------------ */
void prof(vertice* g, int i) {
    FALTA_IMPLEMENTAR();
}

/* ---- 3. prof_caminho
 *      Marca *achou = TRUE se existe caminho de i ate j.
 *      Quem chama zera as flags e poe *achou = FALSE antes.
 *      caderno, pag. 7 / lista ex. 16
 * ------------------------------------------------------------------ */
void prof_caminho(vertice* g, int i, int j, bool* achou) {
    FALTA_IMPLEMENTAR();
}

/* ---- 4. tem_ciclo_dir
 *      TRUE se o grafo dirigido tem algum ciclo.
 *      Zere as flags voce mesmo e cubra o grafo inteiro: o ciclo pode estar
 *      num pedaco que nao contem o vertice 0.
 *      Escreva a auxiliar recursiva logo acima, no espaco reservado.
 *      caderno, pag. 7 / lista ex. 12
 * ------------------------------------------------------------------ */
bool tem_ciclo_dir(vertice* g) {
    FALTA_IMPLEMENTAR();
    return FALSE;
}

/* ---- 5. contar_tipo_x
 *      Conta quantos vertices de tipo x da para alcancar a partir de i,
 *      contando o proprio i se ele for do tipo x.
 *      Quem chama zera as flags e o contador antes.
 *      caderno, pag. 8
 * ------------------------------------------------------------------ */
void contar_tipo_x(vertice* g, int i, int x, int* cont) {
    FALTA_IMPLEMENTAR();
}

/* ---- 6. contar_grupos
 *      Conta os grupos de vertices mutuamente alcancaveis (componentes)
 *      de um grafo nao-dirigido.
 *      lista ex. 14
 * ------------------------------------------------------------------ */
int contar_grupos(vertice* g) {
    FALTA_IMPLEMENTAR();
    return 0;
}

/* ---- 7. maior_grupo_inicio
 *      Devolve um vertice qualquer do MAIOR grupo conectado, ou -1.
 *      Escreva a auxiliar recursiva que conta alcancaveis no espaco acima.
 *      caderno, pag. 8 (Ex 1) / lista ex. 15
 * ------------------------------------------------------------------ */
int maior_grupo_inicio(vertice* g) {
    FALTA_IMPLEMENTAR();
    return -1;
}

/* ---- 8. arvore_enraizada
 *      TRUE se g e aciclico, conexo, dirigido e tem UMA UNICA fonte
 *      (vertice de grau de entrada zero). Implemente essa definicao,
 *      exatamente como esta escrita.
 *      lista ex. 6
 * ------------------------------------------------------------------ */
bool arvore_enraizada(vertice* g) {
    FALTA_IMPLEMENTAR();
    return FALSE;
}

