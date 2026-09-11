#include <stdio.h>
#include <stdlib.h>
#include "dojo.h"

/* ===================== NIVEL 1 : MATRIZ ============================== */

void t1_1(void) {
    int m[V][V], i, j;
    CENARIO("Uma matriz cheia de lixo (todos os valores = 7) e passada para\n"
            "  inicializar_m. Depois disso todas as %d x %d posicoes precisam\n"
            "  valer 0.", V, V);
    for (i = 0; i < V; i++) for (j = 0; j < V; j++) m[i][j] = 7;
    inicializar_m(m);
    CHECA_STUB();
    for (i = 0; i < V; i++)
        for (j = 0; j < V; j++)
            if (m[i][j] != 0) {
                dj_desenha_matriz("matriz depois de inicializar_m:", m);
                FALHA("m[%d][%d] deveria ser 0 e vale %d\n"
                      "       (o for de dentro percorreu todas as colunas?)",
                      i, j, m[i][j]);
            }
}

void t1_2(void) {
    int m[V][V], i, j;
    CENARIO("Matriz montada na mao com as arestas 1->2, 2->4 e o laco 4->4.\n"
            "  aresta_existe_m deve devolver TRUE so para essas tres.");
    for (i = 0; i < V; i++) for (j = 0; j < V; j++) m[i][j] = 0;
    m[1][2] = 1; m[2][4] = 1; m[4][4] = 1;
    ESPERA_BOOL("aresta_existe_m(m, 1, 2)  -- aresta que existe",
                aresta_existe_m(m, 1, 2), TRUE);
    ESPERA_BOOL("aresta_existe_m(m, 4, 4)  -- laco",
                aresta_existe_m(m, 4, 4), TRUE);
    ESPERA_BOOL("aresta_existe_m(m, 2, 1)  -- o grafo e DIRIGIDO, 2->1 nao existe",
                aresta_existe_m(m, 2, 1), FALSE);
    ESPERA_BOOL("aresta_existe_m(m, 0, 5)  -- aresta que nao existe",
                aresta_existe_m(m, 0, 5), FALSE);
}

void t1_3(void) {
    int m[V][V];
    CENARIO("Comeca com inicializar_m e insere 1->2, 2->4 e o laco 4->4.\n"
            "  Grafo DIRIGIDO: inserir 1->2 nao pode criar 2->1.");
    inicializar_m(m);
    inserir_aresta_m(m, 1, 2);
    inserir_aresta_m(m, 2, 4);
    inserir_aresta_m(m, 4, 4);
    CHECA_STUB();
    if (m[1][2] != 1 || m[2][4] != 1 || m[4][4] != 1) {
        dj_desenha_matriz("sua matriz:", m);
        FALHA("as arestas inseridas nao apareceram: m[1][2]=%d m[2][4]=%d m[4][4]=%d",
              m[1][2], m[2][4], m[4][4]);
    }
    if (m[2][1] != 0) {
        dj_desenha_matriz("sua matriz:", m);
        FALHA("m[2][1] virou %d. Em grafo dirigido inserir 1->2 NAO cria 2->1.\n"
              "       (a linha do \"se nao dirigido\" deve ficar comentada)", m[2][1]);
    }
}

void t1_4(void) {
    int m[V][V];
    CENARIO("Insere 1->2 e 2->4, depois exclui. Excluir aresta inexistente\n"
            "  precisa devolver FALSE e nao mexer no resto da matriz.");
    inicializar_m(m);
    inserir_aresta_m(m, 1, 2);
    inserir_aresta_m(m, 2, 4);
    ESPERA_BOOL("excluir_aresta_m(m, 1, 2)  -- aresta existente",
                excluir_aresta_m(m, 1, 2), TRUE);
    CHECA_STUB();
    if (m[1][2] != 0) {
        dj_desenha_matriz("sua matriz:", m);
        FALHA("depois de excluir, m[1][2] deveria ser 0 e vale %d", m[1][2]);
    }
    ESPERA_BOOL("excluir_aresta_m(m, 1, 2)  -- ja foi excluida",
                excluir_aresta_m(m, 1, 2), FALSE);
    ESPERA_BOOL("excluir_aresta_m(m, 0, 7)  -- nunca existiu",
                excluir_aresta_m(m, 0, 7), FALSE);
    if (m[2][4] != 1) {
        dj_desenha_matriz("sua matriz:", m);
        FALHA("a aresta 2->4 sumiu sem ninguem pedir (m[2][4]=%d)", m[2][4]);
    }
}

void t1_5(void) {
    int m[V][V];
    CENARIO("Saem do vertice 2 as arestas 2->0, 2->4, 2->5 e 2->7.\n"
            "  O vertice 3 e isolado e o 6 so tem o laco 6->6.\n"
            "  O 2->7 esta ai de proposito: e a ULTIMA coluna. Quem escreve\n"
            "  i < V-1 no lugar de i < V perde essa coluna e conta 3.");
    inicializar_m(m);
    inserir_aresta_m(m, 2, 0); inserir_aresta_m(m, 2, 4); inserir_aresta_m(m, 2, 5);
    inserir_aresta_m(m, 2, 7);
    inserir_aresta_m(m, 1, 2); inserir_aresta_m(m, 6, 6);
    ESPERA_INT("grau_saida_m(m, 2)", grau_saida_m(m, 2), 4);
    ESPERA_INT("grau_saida_m(m, 3)  -- vertice isolado", grau_saida_m(m, 3), 0);
    ESPERA_INT("grau_saida_m(m, 6)  -- o laco conta como saida", grau_saida_m(m, 6), 1);
}

void t1_6(void) {
    int m[V][V];
    CENARIO("Chegam no vertice 4 as arestas 0->4, 2->4, 5->4 e 7->4.\n"
            "  Cuidado: grau de ENTRADA percorre a COLUNA, nao a linha.\n"
            "  O 7->4 esta ai de proposito: e a ULTIMA linha. Quem escreve\n"
            "  i < V-1 no lugar de i < V perde essa linha e conta 3.");
    inicializar_m(m);
    inserir_aresta_m(m, 0, 4); inserir_aresta_m(m, 2, 4); inserir_aresta_m(m, 5, 4);
    inserir_aresta_m(m, 7, 4);
    inserir_aresta_m(m, 4, 1); inserir_aresta_m(m, 6, 6);
    ESPERA_INT("grau_entrada_m(m, 4)", grau_entrada_m(m, 4), 4);
    ESPERA_INT("grau_entrada_m(m, 1)", grau_entrada_m(m, 1), 1);
    ESPERA_INT("grau_entrada_m(m, 3)  -- ninguem aponta pro 3", grau_entrada_m(m, 3), 0);
    ESPERA_INT("grau_entrada_m(m, 6)  -- o laco conta como entrada",
               grau_entrada_m(m, 6), 1);
}

/* ===================== NIVEL 2 : LISTA =============================== */

void t2_1(void) {
    vertice* g;
    CENARIO("alocar_l precisa reservar espaco para %d structs vertice,\n"
            "  ou seja V * sizeof(vertice) = %d bytes.\n"
            "  O Dojo mede quantos bytes o seu malloc pediu.",
            V, (int)(V * sizeof(vertice)));
    dojo_ult_malloc = 0;
    g = alocar_l();
    CHECA_STUB();
    if (!g) FALHA("alocar_l() devolveu NULL");
    if (dojo_ult_malloc < V * sizeof(vertice))
        FALHA("seu malloc pediu apenas %d bytes, mas sao necessarios %d.\n"
              "       Voce escreveu sizeof(vertice*) (o tamanho do PONTEIRO,\n"
              "       %d bytes) no lugar de sizeof(vertice) (%d bytes)?",
              (int)dojo_ult_malloc, (int)(V * sizeof(vertice)),
              (int)sizeof(vertice*), (int)sizeof(vertice));
}

void t2_2(void) {
    vertice* g = alocar_l();
    int i;
    CENARIO("Depois de inicializar_l, todo g[i].inicio precisa ser NULL\n"
            "  (a lista de cada vertice comeca vazia).");
    CHECA_STUB();
    if (!g) FALHA("alocar_l() devolveu NULL -- resolva o exercicio 1 primeiro");
    for (i = 0; i < V; i++) g[i].inicio = (no*) 0xDEAD;
    inicializar_l(g);
    CHECA_STUB();
    for (i = 0; i < V; i++)
        if (g[i].inicio != NULL)
            FALHA("g[%d].inicio deveria ser NULL depois de inicializar_l", i);
}

void t2_3(void) {
    GRAFO_NOVO(g);
    CENARIO("Listas montadas por fora: 1 -> 2, 2 -> 4, 4 -> 4 (laco).\n"
            "  aresta_existe_l percorre SO a lista de v1 procurando adj == v2.\n"
            "  A palavra \"so\" e o exercicio inteiro: quem varre os %d vertices\n"
            "  atras de adj == v2 responde outra pergunta (\"chega alguem no v2?\")\n"
            "  e acerta por acaso boa parte dos casos.", V);
    dj_liga(g, 1, 2); dj_liga(g, 2, 4); dj_liga(g, 4, 4);
    ESPERA_BOOL("aresta_existe_l(g, 1, 2)", aresta_existe_l(g, 1, 2), TRUE);
    ESPERA_BOOL("aresta_existe_l(g, 4, 4)  -- laco", aresta_existe_l(g, 4, 4), TRUE);
    ESPERA_BOOL("aresta_existe_l(g, 2, 1)  -- dirigido: 2->1 nao existe",
                aresta_existe_l(g, 2, 1), FALSE);
    ESPERA_BOOL("aresta_existe_l(g, 0, 3)  -- lista vazia",
                aresta_existe_l(g, 0, 3), FALSE);
    /* Estes dois separam "existe v1 -> v2" de "chega alguma aresta em v2":
       o 2 e o 4 recebem arestas, mas nao vindas do 0 nem do 3. */
    ESPERA_BOOL("aresta_existe_l(g, 0, 2)  -- chega aresta no 2, mas nao vinda do 0",
                aresta_existe_l(g, 0, 2), FALSE);
    ESPERA_BOOL("aresta_existe_l(g, 3, 4)  -- chega aresta no 4, mas nao vinda do 3",
                aresta_existe_l(g, 3, 4), FALSE);
}

void t2_4(void) {
    GRAFO_NOVO(g);
    CENARIO("Insere 1->2, 1->5 e tenta inserir 1->2 de novo (deve dar FALSE,\n"
            "  sem duplicar). O no alocado precisa ter sizeof(no) = %d bytes.",
            (int)sizeof(no));
    dojo_ult_malloc = 0;
    ESPERA_BOOL("inserir_aresta_l(g, 1, 2)  -- aresta nova",
                inserir_aresta_l(g, 1, 2), TRUE);
    if (dojo_ult_malloc < sizeof(no))
        FALHA("seu malloc pediu %d bytes, mas sizeof(no) = %d.\n"
              "       Voce escreveu malloc(sizeof(no*)) no lugar de malloc(sizeof(no))?",
              (int)dojo_ult_malloc, (int)sizeof(no));
    inserir_aresta_l(g, 1, 5);
    ESPERA_BOOL("inserir_aresta_l(g, 1, 2)  -- aresta REPETIDA",
                inserir_aresta_l(g, 1, 2), FALSE);
    CHECA_STUB();
    {
        int esp[2] = {2, 5};
        errbuf[0] = 0;
        if (!dj_confere_adj(g, 1, esp, 2, errbuf, sizeof errbuf)) {
            dj_desenha_lista("seu grafo:", g);
            FALHA("a lista do vertice 1 saiu errada:\n       %s", errbuf);
        }
        if (dj_conta_adj(g, 2) != 0) {
            dj_desenha_lista("seu grafo:", g);
            FALHA("inserir 1->2 nao pode criar nada na lista do vertice 2 (dirigido)");
        }
    }
}

void t2_5(void) {
    GRAFO_NOVO(g);
    CENARIO("ARMADILHA CLASSICA. A lista do vertice 1 fica 1 -> 7 -> 5 -> 2\n"
            "  (inserindo na cabeca, a ordem sai invertida). Vamos excluir o\n"
            "  PRIMEIRO no da lista, depois o do meio, depois o ultimo.");
    inserir_aresta_l(g, 1, 2);
    inserir_aresta_l(g, 1, 5);
    inserir_aresta_l(g, 1, 7);
    CHECA_STUB();

    ESPERA_BOOL("excluir_aresta_l(g, 1, 7)  -- PRIMEIRO no da lista",
                excluir_aresta_l(g, 1, 7), TRUE);
    CHECA_STUB();
    {
        int esp[2] = {5, 2};
        errbuf[0] = 0;
        if (!dj_confere_adj(g, 1, esp, 2, errbuf, sizeof errbuf)) {
            dj_desenha_lista("seu grafo:", g);
            FALHA("excluir o primeiro no quebrou a lista:\n       %s\n"
                  "       Quando ant == NULL, quem passa a apontar para p->prox\n"
                  "       e g[v1].inicio, e nao ant->prox.", errbuf);
        }
    }
    ESPERA_BOOL("excluir_aresta_l(g, 1, 5)  -- no do meio",
                excluir_aresta_l(g, 1, 5), TRUE);
    ESPERA_BOOL("excluir_aresta_l(g, 1, 2)  -- ultimo no restante",
                excluir_aresta_l(g, 1, 2), TRUE);
    CHECA_STUB();
    if (dj_conta_adj(g, 1) != 0) {
        dj_desenha_lista("seu grafo:", g);
        FALHA("a lista do vertice 1 deveria estar vazia, tem %d no(s)",
              dj_conta_adj(g, 1));
    }
    ESPERA_BOOL("excluir_aresta_l(g, 1, 2)  -- lista ja vazia",
                excluir_aresta_l(g, 1, 2), FALSE);
    ESPERA_BOOL("excluir_aresta_l(g, 3, 6)  -- aresta que nunca existiu",
                excluir_aresta_l(g, 3, 6), FALSE);
}

void t2_6(void) {
    GRAFO_NOVO(g);
    CENARIO("Saem do vertice 2 as arestas 2->0, 2->4 e 2->5.\n"
            "  O vertice 3 e isolado e o 6 so tem o laco 6->6.");
    inserir_aresta_l(g, 2, 0); inserir_aresta_l(g, 2, 4); inserir_aresta_l(g, 2, 5);
    inserir_aresta_l(g, 1, 2); inserir_aresta_l(g, 6, 6);
    ESPERA_INT("grau_saida_l(g, 2)", grau_saida_l(g, 2), 3);
    ESPERA_INT("grau_saida_l(g, 3)  -- isolado", grau_saida_l(g, 3), 0);
    ESPERA_INT("grau_saida_l(g, 6)  -- laco", grau_saida_l(g, 6), 1);
}

void t2_7(void) {
    GRAFO_NOVO(g);
    CENARIO("Chegam no vertice 4 as arestas 0->4, 2->4, 5->4 e 7->4.\n"
            "  Em lista de adjacencia isso obriga a varrer TODOS os vertices.\n"
            "  O 7->4 esta ai de proposito: e o ULTIMO vertice. Quem para em\n"
            "  V-1 nunca olha a lista dele e conta 3.");
    inserir_aresta_l(g, 0, 4); inserir_aresta_l(g, 2, 4); inserir_aresta_l(g, 5, 4);
    inserir_aresta_l(g, 7, 4);
    inserir_aresta_l(g, 4, 1); inserir_aresta_l(g, 6, 6);
    ESPERA_INT("grau_entrada_l(g, 4)", grau_entrada_l(g, 4), 4);
    ESPERA_INT("grau_entrada_l(g, 1)", grau_entrada_l(g, 1), 1);
    ESPERA_INT("grau_entrada_l(g, 3)  -- ninguem aponta pro 3",
               grau_entrada_l(g, 3), 0);
    ESPERA_INT("grau_entrada_l(g, 6)  -- laco", grau_entrada_l(g, 6), 1);
}
