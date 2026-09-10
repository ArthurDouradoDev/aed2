#include <stdio.h>
#include <stdlib.h>
#include "dojo.h"

static void liga2(vertice* g, int a, int b) {
    inserir_aresta_l(g, a, b);
    inserir_aresta_l(g, b, a);
}

/* confere que a lista devolvida tem exatamente os n vertices esperados */
static int confere_lista(no* r, const int* esp, int n) {
    int vet[64], tem[V], i, qtd;
    qtd = dj_lista_para_vetor(r, vet, 64);
    if (qtd != n) return 0;
    for (i = 0; i < V; i++) tem[i] = 0;
    for (i = 0; i < qtd; i++) {
        if (vet[i] < 0 || vet[i] >= V) return 0;
        tem[vet[i]]++;
    }
    for (i = 0; i < n; i++) if (tem[esp[i]] != 1) return 0;
    return 1;
}

static void mostra_lista(no* r) {
    int vet[64], i, n = dj_lista_para_vetor(r, vet, 64);
    dj_print("       sua lista (%d elemento(s)):", n);
    for (i = 0; i < n; i++) dj_print(" %d", vet[i]);
    dj_print("\n");
}

/* ---- 7.1  ex.10 : spam ---------------------------------------------- */
void t7_1(void) {
    GRAFO_NOVO(g);
    CENARIO("Rede de emails. A aresta u -> v com id == 99 quer dizer que u\n"
            "  mandou a mensagem 99 para v.\n"
            "     0 -> 1 (99)   1 -> 2 (99)   2 -> 3 (99)   3 -> 1 (99)\n"
            "     6 -> 7 (99)   4 -> 5 (id 7, outra mensagem)\n"
            "  Mandaram a 99: 0, 1, 2, 3 e 6.  Receberam a 99: 1, 2, 3 e 7.\n"
            "  Suspeitos de terem comecado = mandaram mas nunca receberam:\n"
            "  os usuarios 0 e 6.");
    inserir_aresta_l(g, 0, 1); dj_por_id(g, 0, 1, 99);
    inserir_aresta_l(g, 1, 2); dj_por_id(g, 1, 2, 99);
    inserir_aresta_l(g, 2, 3); dj_por_id(g, 2, 3, 99);
    inserir_aresta_l(g, 3, 1); dj_por_id(g, 3, 1, 99);
    inserir_aresta_l(g, 6, 7); dj_por_id(g, 6, 7, 99);
    inserir_aresta_l(g, 4, 5); dj_por_id(g, 4, 5, 7);
    {
        no* r = suspeitos_spam(g, 99);
        int esp[2] = {0, 6};
        CHECA_STUB();
        if (!confere_lista(r, esp, 2)) {
            dj_desenha_lista("grafo:", g);
            mostra_lista(r);
            FALHA("a lista deveria ter exatamente os usuarios 0 e 6");
        }
    }
}

/* ---- 7.2  ex.11 : paises -------------------------------------------- */
void t7_2(void) {
    GRAFO_NOVO(g);
    CENARIO("Unidades da empresa e o pais de cada uma:\n"
            "     0=BR(1) 1=BR(2) 2=AR(3) 3=BR(2) 4=US(4) 5=BR(1) 6=PT(5) 7=BR(1)\n"
            "  Chamadas: 0 liga para 1, 2 e 3 -> paises {2, 3, 2} = 2 paises.\n"
            "            1 liga para 4, 6 e 7 -> paises {4, 5, 1} = 3 paises.\n"
            "            2 liga para 3        -> 1 pais.\n"
            "  Quem fala com mais paises diferentes e a unidade 1.");
    g[0].pais = 1; g[1].pais = 2; g[2].pais = 3; g[3].pais = 2;
    g[4].pais = 4; g[5].pais = 1; g[6].pais = 5; g[7].pais = 1;
    inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 0, 2); inserir_aresta_l(g, 0, 3);
    inserir_aresta_l(g, 1, 4); inserir_aresta_l(g, 1, 6); inserir_aresta_l(g, 1, 7);
    inserir_aresta_l(g, 2, 3);
    ESPERA_INT("mais_paises(g)", mais_paises(g), 1);
}

/* ---- 7.3  ex.12 : ciclo em grafo nao-dirigido ------------------------ */
void t7_3(void) {
    CENARIO("ARMADILHA. Num grafo NAO-dirigido toda aresta aparece nos dois\n"
            "  sentidos, entao ao visitar 1 voce ve o 0 de novo -- e isso NAO e\n"
            "  ciclo, e so a aresta de volta para o pai. So conta como ciclo o\n"
            "  vizinho ja visitado que NAO e o pai.");
    {
        GRAFO_NOVO(g);
        liga2(g, 0, 1); liga2(g, 1, 2); liga2(g, 2, 3);
        ESPERA_BOOL("tem_ciclo_nao_dir(g)  -- caminho 0-1-2-3, sem ciclo",
                    tem_ciclo_nao_dir(g), FALSE);
        liga2(g, 3, 0);
        ESPERA_BOOL("tem_ciclo_nao_dir(g)  -- depois de fechar com 3-0",
                    tem_ciclo_nao_dir(g), TRUE);
    }
    {
        GRAFO_NOVO(h);
        liga2(h, 0, 1);
        inserir_aresta_l(h, 5, 5);
        ESPERA_BOOL("tem_ciclo_nao_dir(h)  -- laco 5-5 num pedaco separado",
                    tem_ciclo_nao_dir(h), TRUE);
    }
    {
        GRAFO_NOVO(k);
        liga2(k, 0, 1);
        liga2(k, 4, 5); liga2(k, 5, 6); liga2(k, 6, 4);
        ESPERA_BOOL("tem_ciclo_nao_dir(k)  -- triangulo 4-5-6 longe do vertice 0",
                    tem_ciclo_nao_dir(k), TRUE);
    }
}

/* ---- 7.4  ex.13 : remover a aresta que fecha o ciclo ----------------- */
void t7_4(void) {
    GRAFO_NOVO(g);
    CENARIO("Grafo dirigido 0->1, 1->2, 2->0 (ciclo) e 3->4 fora dele.\n"
            "  Tirar UMA aresta de volta ja desfaz o ciclo. Nao vale apagar\n"
            "  mais do que isso: as outras 3 arestas continuam la.");
    inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 1, 2); inserir_aresta_l(g, 2, 0);
    inserir_aresta_l(g, 3, 4);
    ESPERA_BOOL("remover_aresta_ciclo(g)  -- existe ciclo para desfazer",
                remover_aresta_ciclo(g), TRUE);
    CHECA_STUB();
    if (dj_conta_arestas(g) != 3) {
        dj_desenha_lista("seu grafo:", g);
        FALHA("deveriam sobrar 3 arestas (uma so foi removida), sobraram %d",
              dj_conta_arestas(g));
    }
    ESPERA_BOOL("tem_ciclo_dir(g)  -- o ciclo tem que ter sumido",
                tem_ciclo_dir(g), FALSE);
    if (!dj_tem_adj(g, 3, 4)) {
        dj_desenha_lista("seu grafo:", g);
        FALHA("a aresta 3->4 nao tinha nada a ver com o ciclo e foi removida");
    }
    ESPERA_BOOL("remover_aresta_ciclo(g)  -- agora nao ha mais ciclo",
                remover_aresta_ciclo(g), FALSE);
}

/* ---- 7.5  ex.15 : lista do maior grupo ------------------------------- */
void t7_5(void) {
    GRAFO_NOVO(g);
    CENARIO("Grupos: {0,1,4,6} com 4 vertices, {2,3} e {5,7} com 2 cada.\n"
            "  A resposta e a lista ligada com os vertices do maior grupo.\n"
            "  A ordem da lista nao importa.");
    liga2(g, 0, 1); liga2(g, 1, 4); liga2(g, 4, 6);
    liga2(g, 2, 3);
    liga2(g, 5, 7);
    {
        no* r = maior_grupo_lista(g);
        int esp[4] = {0, 1, 4, 6};
        CHECA_STUB();
        if (!confere_lista(r, esp, 4)) {
            dj_desenha_lista("grafo:", g);
            mostra_lista(r);
            FALHA("a lista deveria ter exatamente 0, 1, 4 e 6");
        }
    }
}

/* ---- 7.6  ex.22 : salas vazias mais proximas ------------------------- */
void t7_6(void) {
    GRAFO_NOVO(g);
    CENARIO("Salas de aula. O campo tipo guarda a OCUPACAO: 0 = sala vazia.\n"
            "     ligacoes: 0-1  0-2  1-3  2-4  0-5\n"
            "     ocupacao: 0=5  1=0  2=0  3=0  4=7  5=9  6=0  7=0\n"
            "  Saindo da sala 0: a 1 corredor estao a 1 e a 2, as DUAS vazias.\n"
            "  A sala 3 tambem esta vazia, mas a 2 corredores: fica de fora.\n"
            "  Havendo empate, a resposta traz todas as empatadas.");
    liga2(g, 0, 1); liga2(g, 0, 2); liga2(g, 1, 3); liga2(g, 2, 4); liga2(g, 0, 5);
    g[0].tipo = 5; g[1].tipo = 0; g[2].tipo = 0; g[3].tipo = 0;
    g[4].tipo = 7; g[5].tipo = 9; g[6].tipo = 0; g[7].tipo = 0;
    {
        no* r = vazias_mais_proximas(g, 0);
        int esp[2] = {1, 2};
        CHECA_STUB();
        if (!confere_lista(r, esp, 2)) {
            dj_desenha_lista("grafo:", g);
            mostra_lista(r);
            FALHA("a lista deveria ter exatamente as salas 1 e 2");
        }
    }
    {
        no* r = vazias_mais_proximas(g, 3);
        int esp[1] = {3};
        CHECA_STUB();
        if (!confere_lista(r, esp, 1)) {
            mostra_lista(r);
            FALHA("saindo da sala 3, que ja esta vazia, a resposta e a propria 3");
        }
    }
}

/* ---- 7.7  ex.25 : relacionados com pelo menos k mensagens ------------ */
void t7_7(void) {
    GRAFO_NOVO(g);
    CENARIO("Rede de emails dirigida, com o peso da aresta contando quantas\n"
            "  mensagens foram enviadas naquele sentido:\n"
            "     0->1 = 3   e   1->0 = 4    -> total entre 0 e 1: 7\n"
            "     0->2 = 2                   -> total entre 0 e 2: 2\n"
            "     3->0 = 5                   -> total entre 0 e 3: 5\n"
            "     0->4 = 1   e   4->0 = 1    -> total entre 0 e 4: 2\n"
            "  Com k = 5, quem se relaciona com o 0 nesse volume: 1 e 3.");
    inserir_aresta_l(g, 0, 1); dj_por_peso(g, 0, 1, 3);
    inserir_aresta_l(g, 1, 0); dj_por_peso(g, 1, 0, 4);
    inserir_aresta_l(g, 0, 2); dj_por_peso(g, 0, 2, 2);
    inserir_aresta_l(g, 3, 0); dj_por_peso(g, 3, 0, 5);
    inserir_aresta_l(g, 0, 4); dj_por_peso(g, 0, 4, 1);
    inserir_aresta_l(g, 4, 0); dj_por_peso(g, 4, 0, 1);
    {
        no* r = relacionados_k(g, 0, 5);
        int esp[2] = {1, 3};
        CHECA_STUB();
        if (!confere_lista(r, esp, 2)) {
            dj_desenha_lista("grafo:", g);
            mostra_lista(r);
            FALHA("a lista deveria ter exatamente os usuarios 1 e 3");
        }
    }
    {
        no* r = relacionados_k(g, 0, 100);
        CHECA_STUB();
        if (r != NULL) { mostra_lista(r); FALHA("com k = 100 ninguem se qualifica: devolva NULL"); }
    }
}

/* ---- 7.8  ex.26 : rota por uma companhia so -------------------------- */
void t7_8(void) {
    GRAFO_NOVO(g);
    CENARIO("Malha aerea. Cada voo tem uma companhia no campo cia:\n"
            "     0->1 cia 1    1->3 cia 1    3->5 cia 1\n"
            "     0->2 cia 2    2->3 cia 2\n"
            "  Voando so pela companhia 1, de 0 ate 5: 0, 1, 3, 5.\n"
            "  Voando so pela companhia 2 nao da para chegar no 5.");
    inserir_aresta_l(g, 0, 1); dj_por_cia(g, 0, 1, 1);
    inserir_aresta_l(g, 1, 3); dj_por_cia(g, 1, 3, 1);
    inserir_aresta_l(g, 3, 5); dj_por_cia(g, 3, 5, 1);
    inserir_aresta_l(g, 0, 2); dj_por_cia(g, 0, 2, 2);
    inserir_aresta_l(g, 2, 3); dj_por_cia(g, 2, 3, 2);
    {
        no* r = rota_companhia(g, 0, 5, 1);
        int vet[64], n;
        CHECA_STUB();
        if (!r) FALHA("existe rota de 0 ate 5 pela companhia 1, mas veio NULL");
        n = dj_lista_para_vetor(r, vet, 64);
        if (n != 4 || vet[0] != 0 || vet[1] != 1 || vet[2] != 3 || vet[3] != 5) {
            mostra_lista(r);
            dj_print("       esperado: 0 1 3 5\n");
            FALHA("rota errada (a lista sai da origem e chega no destino)");
        }
    }
    {
        no* r = rota_companhia(g, 0, 5, 2);
        CHECA_STUB();
        if (r != NULL) {
            mostra_lista(r);
            FALHA("pela companhia 2 nao ha rota ate o 5: devolva NULL\n"
                  "       (o trecho 3->5 e da companhia 1)");
        }
    }
}

/* ---- 7.9  ex.28 : mais proximo evitando um local --------------------- */
void t7_9(void) {
    GRAFO_NOVO(g);
    CENARIO("Ruas: 0-1  1-2  0-3  3-4  4-5.\n"
            "  Pontos de interesse do tipo 9 estao no 2 e no 5.\n"
            "  Sem bloqueio, o 2 esta a 2 quarteiroes e o 5 a 3: vence o 2.\n"
            "  Com o vertice 1 interditado, o unico caminho passa a ser\n"
            "  0-3-4-5, entao a resposta vira 5.");
    liga2(g, 0, 1); liga2(g, 1, 2); liga2(g, 0, 3); liga2(g, 3, 4); liga2(g, 4, 5);
    g[2].tipo = 9;
    g[5].tipo = 9;
    ESPERA_INT("tipo_x_evitando(g, 0, 9, 7)  -- o 7 nem esta no caminho",
               tipo_x_evitando(g, 0, 9, 7), 2);
    ESPERA_INT("tipo_x_evitando(g, 0, 9, 1)  -- evitando o 1",
               tipo_x_evitando(g, 0, 9, 1), 5);
    ESPERA_INT("tipo_x_evitando(g, 0, 9, 3)  -- evitando o 3",
               tipo_x_evitando(g, 0, 9, 3), 2);
    ESPERA_INT("tipo_x_evitando(g, 0, 9, 0)  -- interditar a propria origem",
               tipo_x_evitando(g, 0, 9, 0), -1);
    ESPERA_INT("tipo_x_evitando(g, 0, 4, 7)  -- nao existe tipo 4 no grafo",
               tipo_x_evitando(g, 0, 4, 7), -1);
}
