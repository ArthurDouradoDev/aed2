#include <stdio.h>
#include <stdlib.h>
#include "dojo.h"

/* liga nos dois sentidos, usando o inserir_aresta_l DO ALUNO */
static void liga2(vertice* g, int a, int b) {
    inserir_aresta_l(g, a, b);
    inserir_aresta_l(g, b, a);
}

/* ===================== NIVEL 3 : TRANSFORMACOES ====================== */

void t3_1(void) {
    GRAFO_NOVO(g);
    vertice* gt;
    CENARIO("Grafo dirigido: 0->1, 1->2, 2->0, 3->1, 4->4.\n"
            "  No transposto toda aresta u->v vira v->u (o laco 4->4 continua).");
    inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 1, 2);
    inserir_aresta_l(g, 2, 0); inserir_aresta_l(g, 3, 1);
    inserir_aresta_l(g, 4, 4);
    gt = transposta_l(g);
    CHECA_STUB();
    if (!gt) FALHA("transposta_l devolveu NULL");
    {
        int e1[2] = {0, 3}, e2[1] = {1}, e0[1] = {2}, e4[1] = {4};
        errbuf[0] = 0;
        if (!dj_confere_adj(gt, 1, e1, 2, errbuf, sizeof errbuf) ||
            !dj_confere_adj(gt, 2, e2, 1, errbuf, sizeof errbuf) ||
            !dj_confere_adj(gt, 0, e0, 1, errbuf, sizeof errbuf) ||
            !dj_confere_adj(gt, 4, e4, 1, errbuf, sizeof errbuf)) {
            dj_desenha_lista("grafo original:", g);
            dj_desenha_lista("seu transposto:", gt);
            FALHA("transposto incorreto:\n       %s", errbuf);
        }
        if (dj_conta_arestas(gt) != 5) {
            dj_desenha_lista("seu transposto:", gt);
            FALHA("o transposto deveria ter 5 arestas, tem %d", dj_conta_arestas(gt));
        }
        if (dj_conta_arestas(g) != 5 || !dj_tem_adj(g, 0, 1)) {
            dj_desenha_lista("grafo original depois da chamada:", g);
            FALHA("transposta_l NAO pode alterar o grafo original g");
        }
    }
}

void t3_2(void) {
    int m[V][V];
    int i, j;
    vertice* g;
    CENARIO("Matriz com 0->1, 0->5, 2->3, 6->6. Converter para listas.");
    for (i = 0; i < V; i++) for (j = 0; j < V; j++) m[i][j] = 0;
    m[0][1] = 1; m[0][5] = 1; m[2][3] = 1; m[6][6] = 1;
    g = matriz_p_lista(m);
    CHECA_STUB();
    if (!g) FALHA("matriz_p_lista devolveu NULL");
    {
        int e0[2] = {1, 5}, e2[1] = {3}, e6[1] = {6};
        errbuf[0] = 0;
        if (!dj_confere_adj(g, 0, e0, 2, errbuf, sizeof errbuf) ||
            !dj_confere_adj(g, 2, e2, 1, errbuf, sizeof errbuf) ||
            !dj_confere_adj(g, 6, e6, 1, errbuf, sizeof errbuf) ||
            !dj_confere_adj(g, 1, e0, 0, errbuf, sizeof errbuf)) {
            dj_desenha_matriz("matriz de entrada:", m);
            dj_desenha_lista("sua lista:", g);
            FALHA("conversao incorreta:\n       %s", errbuf);
        }
        if (dj_conta_arestas(g) != 4)
            FALHA("deveriam existir 4 arestas na lista, existem %d", dj_conta_arestas(g));
    }
}

void t3_3(void) {
    GRAFO_NOVO(g1);
    int m2[V][V];
    CENARIO("g1 (lista) tem 0->1, 1->2, 4->5.\n"
            "  m2 (matriz) tem 0->1, 1->2, 4->5 e ainda 3->6.\n"
            "  Toda aresta de g1 esta em m2, logo g1 e subgrafo de m2.");
    inicializar_m(m2);
    inserir_aresta_l(g1, 0, 1); inserir_aresta_l(g1, 1, 2); inserir_aresta_l(g1, 4, 5);
    inserir_aresta_m(m2, 0, 1); inserir_aresta_m(m2, 1, 2);
    inserir_aresta_m(m2, 4, 5); inserir_aresta_m(m2, 3, 6);
    ESPERA_BOOL("subgrafo_lm(g1, m2)  -- g1 cabe dentro de m2",
                subgrafo_lm(g1, m2), TRUE);
    inserir_aresta_l(g1, 7, 0);
    ESPERA_BOOL("subgrafo_lm(g1, m2)  -- depois de g1 ganhar 7->0, que nao esta em m2",
                subgrafo_lm(g1, m2), FALSE);
}

void t3_4(void) {
    GRAFO_NOVO(g);
    CENARIO("Lacos em 0, 4 e 7; arestas normais 1->2 e 2->3 nao contam.");
    inserir_aresta_l(g, 0, 0); inserir_aresta_l(g, 4, 4); inserir_aresta_l(g, 7, 7);
    inserir_aresta_l(g, 1, 2); inserir_aresta_l(g, 2, 3);
    ESPERA_INT("contar_lacos_l(g)", contar_lacos_l(g), 3);
}

void t3_5(void) {
    GRAFO_NOVO(g);
    CENARIO("Lacos em 0, 4 e 7 mais as arestas 1->2, 2->3 e 0->1.\n"
            "  Depois de remover_lacos_l devem sobrar exatamente as 3 normais.");
    inserir_aresta_l(g, 0, 0); inserir_aresta_l(g, 4, 4); inserir_aresta_l(g, 7, 7);
    inserir_aresta_l(g, 1, 2); inserir_aresta_l(g, 2, 3); inserir_aresta_l(g, 0, 1);
    remover_lacos_l(g);
    CHECA_STUB();
    if (dj_tem_adj(g, 0, 0) || dj_tem_adj(g, 4, 4) || dj_tem_adj(g, 7, 7)) {
        dj_desenha_lista("seu grafo:", g);
        FALHA("ainda sobrou algum laco");
    }
    if (dj_conta_arestas(g) != 3) {
        dj_desenha_lista("seu grafo:", g);
        FALHA("deveriam sobrar 3 arestas, sobraram %d\n"
              "       (removeu arestas normais junto?)", dj_conta_arestas(g));
    }
}

void t3_6(void) {
    GRAFO_NOVO(g);
    int i;
    CENARIO("Grafo com 6 arestas. destruir_arestas_l precisa liberar todos os\n"
            "  nos e deixar g[i].inicio = NULL para todo i (grafo vazio).");
    inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 0, 2); inserir_aresta_l(g, 1, 3);
    inserir_aresta_l(g, 3, 3); inserir_aresta_l(g, 5, 6); inserir_aresta_l(g, 6, 7);
    destruir_arestas_l(g);
    CHECA_STUB();
    for (i = 0; i < V; i++)
        if (g[i].inicio != NULL) {
            dj_desenha_lista("seu grafo:", g);
            FALHA("g[%d].inicio deveria ser NULL depois de destruir_arestas_l", i);
        }
}

void t3_7(void) {
    GRAFO_NOVO(g1);
    GRAFO_NOVO(g2);
    vertice* g3;
    CENARIO("g1 = {0->1, 0->2, 3->4, 5->5}   g2 = {0->2, 5->5, 6->7}\n"
            "  g3 deve conter as arestas de g1 que NAO estao em g2: 0->1 e 3->4.");
    inserir_aresta_l(g1, 0, 1); inserir_aresta_l(g1, 0, 2);
    inserir_aresta_l(g1, 3, 4); inserir_aresta_l(g1, 5, 5);
    inserir_aresta_l(g2, 0, 2); inserir_aresta_l(g2, 5, 5); inserir_aresta_l(g2, 6, 7);
    g3 = diferenca_l(g1, g2);
    CHECA_STUB();
    if (!g3) FALHA("diferenca_l devolveu NULL");
    if (dj_conta_arestas(g3) != 2 || !dj_tem_adj(g3, 0, 1) || !dj_tem_adj(g3, 3, 4)) {
        dj_desenha_lista("g1:", g1);
        dj_desenha_lista("g2:", g2);
        dj_desenha_lista("seu g3:", g3);
        FALHA("g3 deveria ter exatamente 0->1 e 3->4 (2 arestas), tem %d",
              dj_conta_arestas(g3));
    }
    if (dj_tem_adj(g3, 6, 7))
        FALHA("g3 nao pode conter 6->7: essa aresta e de g2, nao de g1");
}

void t3_8(void) {
    GRAFO_NOVO(g);
    int i, j;
    CENARIO("Primeiro um grafo completo com os %d vertices (toda dupla i!=j\n"
            "  ligada nos dois sentidos). Depois tiramos a aresta 3->6.", V);
    for (i = 0; i < V; i++)
        for (j = 0; j < V; j++)
            if (i != j) inserir_aresta_l(g, i, j);
    ESPERA_BOOL("completo_l(g)  -- grafo completo", completo_l(g), TRUE);
    excluir_aresta_l(g, 3, 6);
    ESPERA_BOOL("completo_l(g)  -- faltando a aresta 3->6", completo_l(g), FALSE);
}

void t3_9(void) {
    GRAFO_NOVO(g);
    vertice* gc;
    CENARIO("g nao-dirigido com apenas 0-1 e 2-3 (4 arestas no total).\n"
            "  O complemento tem toda dupla i!=j que NAO esta em g:\n"
            "  %d - 4 = %d arestas.", V * (V - 1), V * (V - 1) - 4);
    liga2(g, 0, 1);
    liga2(g, 2, 3);
    gc = complemento_l(g);
    CHECA_STUB();
    if (!gc) FALHA("complemento_l devolveu NULL");
    if (dj_tem_adj(gc, 0, 1) || dj_tem_adj(gc, 1, 0) ||
        dj_tem_adj(gc, 2, 3) || dj_tem_adj(gc, 3, 2)) {
        dj_desenha_lista("seu complemento:", gc);
        FALHA("o complemento nao pode conter arestas que ja existiam em g");
    }
    {
        int i;
        for (i = 0; i < V; i++)
            if (dj_tem_adj(gc, i, i)) {
                dj_desenha_lista("seu complemento:", gc);
                FALHA("o complemento criou o laco %d->%d; laco nao e par de\n"
                      "       vertices distintos, entao nao entra", i, i);
            }
    }
    if (dj_conta_arestas(gc) != V * (V - 1) - 4) {
        dj_desenha_lista("g:", g);
        dj_desenha_lista("seu complemento:", gc);
        FALHA("o complemento deveria ter %d arestas, tem %d",
              V * (V - 1) - 4, dj_conta_arestas(gc));
    }
    if (dj_conta_arestas(g) != 4)
        FALHA("complemento_l NAO pode alterar o grafo original g");
}

/* ===================== NIVEL 4 : PROFUNDIDADE ======================== */

void t4_1(void) {
    GRAFO_NOVO(g);
    int i;
    CENARIO("ARMADILHA. As flags estao sujas (valem 5) e o grafo tem 3 arestas.\n"
            "  zerar_flags deve zerar SO as flags. O campo inicio guarda as\n"
            "  arestas e nao pode ser tocado.");
    inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 1, 2); inserir_aresta_l(g, 5, 6);
    for (i = 0; i < V; i++) g[i].flag = 5;
    zerar_flags(g);
    CHECA_STUB();
    for (i = 0; i < V; i++)
        if (g[i].flag != 0)
            FALHA("g[%d].flag deveria ser 0 e vale %d", i, g[i].flag);
    if (dj_conta_arestas(g) != 3) {
        dj_desenha_lista("seu grafo depois de zerar_flags:", g);
        FALHA("zerar_flags apagou as arestas! sobraram %d de 3.\n"
              "       Voce escreveu g[i].inicio = NULL no lugar de g[i].flag = 0?",
              dj_conta_arestas(g));
    }
}

void t4_2(void) {
    GRAFO_NOVO(g);
    int i;
    CENARIO("Grafo dirigido 0->1, 1->2, 2->0 (ciclo) e 3->4 separado.\n"
            "  Rodando prof(g, 0), os vertices 0,1,2 ficam pretos (flag 2)\n"
            "  e todos os outros continuam brancos (flag 0).");
    inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 1, 2); inserir_aresta_l(g, 2, 0);
    inserir_aresta_l(g, 3, 4);
    zerar_flags(g);
    prof(g, 0);
    CHECA_STUB();
    for (i = 0; i < V; i++) {
        int esperado = (i <= 2) ? 2 : 0;
        if (g[i].flag != esperado) {
            dj_desenha_lista("grafo:", g);
            dj_desenha_flags("suas flags depois de prof(g, 0):", g);
            FALHA("g[%d].flag deveria ser %d e vale %d\n"
                  "       (todo vertice visitado termina PRETO, flag = 2)",
                  i, esperado, g[i].flag);
        }
    }
}

void t4_3(void) {
    GRAFO_NOVO(g);
    bool achou;
    CENARIO("Caminho 0->1->2->3 e, separado, 4->5.\n"
            "  Lembre: quem chama a funcao zera as flags e o achou antes.");
    inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 1, 2); inserir_aresta_l(g, 2, 3);
    inserir_aresta_l(g, 4, 5);

    zerar_flags(g); achou = FALSE;
    prof_caminho(g, 0, 3, &achou);
    ESPERA_BOOL("prof_caminho(g, 0, 3, &achou)  -- existe 0->1->2->3", achou, TRUE);

    zerar_flags(g); achou = FALSE;
    prof_caminho(g, 0, 5, &achou);
    ESPERA_BOOL("prof_caminho(g, 0, 5, &achou)  -- 5 esta em outro pedaco", achou, FALSE);

    zerar_flags(g); achou = FALSE;
    prof_caminho(g, 2, 2, &achou);
    ESPERA_BOOL("prof_caminho(g, 2, 2, &achou)  -- origem igual ao destino", achou, TRUE);

    zerar_flags(g); achou = FALSE;
    prof_caminho(g, 3, 0, &achou);
    ESPERA_BOOL("prof_caminho(g, 3, 0, &achou)  -- dirigido: nao volta", achou, FALSE);
}

void t4_4(void) {
    CENARIO("ARMADILHA. Primeiro um DIAMANTE aciclico: 0->1, 0->2, 1->3, 2->3.\n"
            "  O vertice 3 e alcancado duas vezes, mas isso NAO e ciclo: ele ja\n"
            "  esta PRETO na segunda visita. So aresta para vertice CINZA fecha\n"
            "  ciclo.");
    {
        GRAFO_NOVO(g);
        inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 0, 2);
        inserir_aresta_l(g, 1, 3); inserir_aresta_l(g, 2, 3);
        ESPERA_BOOL("tem_ciclo_dir(g)  -- diamante, aciclico", tem_ciclo_dir(g), FALSE);
        inserir_aresta_l(g, 3, 0);
        ESPERA_BOOL("tem_ciclo_dir(g)  -- depois de fechar com 3->0",
                    tem_ciclo_dir(g), TRUE);
    }
    {
        GRAFO_NOVO(h);
        inserir_aresta_l(h, 6, 6);
        ESPERA_BOOL("tem_ciclo_dir(h)  -- so o laco 6->6", tem_ciclo_dir(h), TRUE);
    }
    {
        GRAFO_NOVO(k);
        inserir_aresta_l(k, 0, 1);
        inserir_aresta_l(k, 5, 6); inserir_aresta_l(k, 6, 7); inserir_aresta_l(k, 7, 5);
        ESPERA_BOOL("tem_ciclo_dir(k)  -- ciclo em pedaco que nao contem o vertice 0",
                    tem_ciclo_dir(k), TRUE);
    }
}

void t4_5(void) {
    GRAFO_NOVO(g);
    int cont;
    CENARIO("Caminho 0->1->2->3, e 4->5 fora do alcance.\n"
            "  tipos: 0=aula(1) 1=auditorio(2) 2=auditorio(2) 3=biblioteca(3)\n"
            "         4=auditorio(2) 5=auditorio(2)\n"
            "  Quantos auditorios (tipo 2) da para alcancar saindo do 0?");
    inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 1, 2); inserir_aresta_l(g, 2, 3);
    inserir_aresta_l(g, 4, 5);
    g[0].tipo = 1; g[1].tipo = 2; g[2].tipo = 2;
    g[3].tipo = 3; g[4].tipo = 2; g[5].tipo = 2;

    zerar_flags(g); cont = 0;
    contar_tipo_x(g, 0, 2, &cont);
    ESPERA_INT("contar_tipo_x(g, 0, 2, &cont)  -- saindo do 0", cont, 2);

    zerar_flags(g); cont = 0;
    contar_tipo_x(g, 1, 2, &cont);
    ESPERA_INT("contar_tipo_x(g, 1, 2, &cont)  -- o proprio 1 e tipo 2 e conta",
               cont, 2);

    zerar_flags(g); cont = 0;
    contar_tipo_x(g, 3, 2, &cont);
    ESPERA_INT("contar_tipo_x(g, 3, 2, &cont)  -- do 3 nao sai nada", cont, 0);
}

void t4_6(void) {
    GRAFO_NOVO(g);
    CENARIO("Grafo NAO-dirigido com 3 grupos: {0,1,4}, {2,3} e {5,6,7}.");
    liga2(g, 0, 1); liga2(g, 1, 4);
    liga2(g, 2, 3);
    liga2(g, 5, 6); liga2(g, 6, 7);
    ESPERA_INT("contar_grupos(g)", contar_grupos(g), 3);
}

void t4_7(void) {
    GRAFO_NOVO(g);
    int r;
    CENARIO("Grupos: {0,1,4,6} com 4 vertices, {2,3} e {5,7} com 2 cada.\n"
            "  A funcao deve devolver um vertice qualquer do MAIOR grupo.");
    liga2(g, 0, 1); liga2(g, 1, 4); liga2(g, 4, 6);
    liga2(g, 2, 3);
    liga2(g, 5, 7);
    r = maior_grupo_inicio(g);
    CHECA_STUB();
    if (r != 0 && r != 1 && r != 4 && r != 6) {
        dj_desenha_lista("grafo:", g);
        FALHA("maior_grupo_inicio devolveu %d.\n"
              "       O maior grupo e {0,1,4,6}, entao a resposta precisa ser\n"
              "       um desses quatro vertices.", r);
    }
}

void t4_8(void) {
    CENARIO("Arvore enraizada = dirigida + aciclica + conexa + UMA UNICA fonte.\n"
            "  Arvore usada: 0->1, 0->2, 1->3, 1->4, 2->5, 2->6, 3->7\n"
            "  (cobre os %d vertices, raiz = 0).", V);
    {
        GRAFO_NOVO(g);
        inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 0, 2);
        inserir_aresta_l(g, 1, 3); inserir_aresta_l(g, 1, 4);
        inserir_aresta_l(g, 2, 5); inserir_aresta_l(g, 2, 6);
        inserir_aresta_l(g, 3, 7);
        ESPERA_BOOL("arvore_enraizada(g)  -- arvore de verdade",
                    arvore_enraizada(g), TRUE);
        inserir_aresta_l(g, 7, 0);
        ESPERA_BOOL("arvore_enraizada(g)  -- depois de 7->0 virou ciclica",
                    arvore_enraizada(g), FALSE);
    }
    {
        GRAFO_NOVO(h);
        inserir_aresta_l(h, 0, 1); inserir_aresta_l(h, 0, 2);
        inserir_aresta_l(h, 1, 3); inserir_aresta_l(h, 1, 4);
        inserir_aresta_l(h, 2, 5); inserir_aresta_l(h, 2, 6);
        ESPERA_BOOL("arvore_enraizada(h)  -- sem 3->7, o 7 vira uma segunda fonte",
                    arvore_enraizada(h), FALSE);
    }
    {
        GRAFO_NOVO(k);
        inserir_aresta_l(k, 0, 1); inserir_aresta_l(k, 0, 2);
        inserir_aresta_l(k, 1, 3); inserir_aresta_l(k, 1, 4);
        inserir_aresta_l(k, 2, 5); inserir_aresta_l(k, 2, 6);
        inserir_aresta_l(k, 3, 7); inserir_aresta_l(k, 4, 7);
        /* Sutileza proposital: pela definicao do enunciado (dirigido +
           aciclico + conexo + uma unica fonte) este grafo PASSA, mesmo com
           o vertice 7 tendo dois pais. Implemente a definicao, nao o
           palpite. */
        ESPERA_BOOL("arvore_enraizada(k)  -- 7 tem dois pais, mas o grafo continua\n"
                    "                          aciclico, conexo e com uma unica fonte:\n"
                    "                          pela definicao do enunciado, isso e arvore",
                    arvore_enraizada(k), TRUE);
    }
}
