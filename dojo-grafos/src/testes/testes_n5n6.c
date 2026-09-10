#include <stdio.h>
#include <stdlib.h>
#include "dojo.h"

static void liga2(vertice* g, int a, int b) {
    inserir_aresta_l(g, a, b);
    inserir_aresta_l(g, b, a);
}

/* ===================== NIVEL 5 : FILA + LARGURA ====================== */

void t5_1(void) {
    FILA F;
    int a, b, c, d;
    CENARIO("ARMADILHA TRIPLA.\n"
            "  1) entrar_fila numa fila VAZIA nao pode usar f->ultimo->prox.\n"
            "  2) o vertice 0 e um valor valido: nao de return quando valor==0.\n"
            "  3) depois de esvaziar, a fila precisa voltar a funcionar.");
    inicializar_fila(&F);
    CHECA_STUB();
    if (F.inicio != NULL || F.ultimo != NULL)
        FALHA("depois de inicializar_fila, inicio e ultimo precisam ser NULL");

    entrar_fila(&F, 0);
    entrar_fila(&F, 3);
    entrar_fila(&F, 7);
    CHECA_STUB();
    if (F.inicio == NULL) FALHA("entrar_fila nao inseriu nada (f->inicio continua NULL)");

    a = sair_fila(&F);
    b = sair_fila(&F);
    c = sair_fila(&F);
    CHECA_STUB();
    if (a != 0 || b != 3 || c != 7)
        FALHA("a fila e FIFO: entrou 0, 3, 7 entao tem que sair 0, 3, 7.\n"
              "       saiu: %d, %d, %d\n"
              "       (se o 0 sumiu, o culpado e um if (!valor) return)", a, b, c);
    if (F.inicio != NULL)
        FALHA("a fila deveria estar vazia (f->inicio == NULL) depois de 3 saidas");

    entrar_fila(&F, 5);
    CHECA_STUB();
    if (F.inicio == NULL)
        FALHA("reutilizar a fila depois de esvaziar nao funcionou.\n"
              "       Quando o ultimo elemento sai, f->ultimo tambem precisa\n"
              "       voltar a ser NULL.");
    d = sair_fila(&F);
    ESPERA_INT("sair_fila depois de reencher a fila", d, 5);
}

void t5_2(void) {
    GRAFO_NOVO(g);
    int i;
    CENARIO("Grafo dirigido 0->1, 0->2, 1->3, 2->3, 3->4 e 6->7 separado.\n"
            "  Depois de largura_l(g, 0) os vertices 0..4 ficam pretos (2)\n"
            "  e 5, 6, 7 continuam brancos (0). As arestas continuam intactas.");
    inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 0, 2);
    inserir_aresta_l(g, 1, 3); inserir_aresta_l(g, 2, 3);
    inserir_aresta_l(g, 3, 4); inserir_aresta_l(g, 6, 7);
    largura_l(g, 0);
    CHECA_STUB();
    for (i = 0; i < V; i++) {
        int esperado = (i <= 4) ? 2 : 0;
        if (g[i].flag != esperado) {
            dj_desenha_lista("grafo:", g);
            dj_desenha_flags("suas flags depois de largura_l(g, 0):", g);
            FALHA("g[%d].flag deveria ser %d e vale %d\n"
                  "       Ao TIRAR um vertice da fila ele vira preto (2);\n"
                  "       ao ENFILEIRAR um vizinho branco ele vira cinza (1).\n"
                  "       Cuidado: marque g[p->adj].flag, e nao g[i].flag.",
                  i, esperado, g[i].flag);
        }
    }
    if (dj_conta_arestas(g) != 6)
        FALHA("a busca destruiu arestas do grafo (sobraram %d de 6)",
              dj_conta_arestas(g));
}

void t5_3(void) {
    int m[V][V], flags[V], i;
    CENARIO("Mesmo grafo do exercicio anterior, agora em MATRIZ.\n"
            "  Em vez do campo flag, a marcacao vai no vetor flags[].");
    inicializar_m(m);
    inserir_aresta_m(m, 0, 1); inserir_aresta_m(m, 0, 2);
    inserir_aresta_m(m, 1, 3); inserir_aresta_m(m, 2, 3);
    inserir_aresta_m(m, 3, 4); inserir_aresta_m(m, 6, 7);
    for (i = 0; i < V; i++) flags[i] = 9;
    largura_m(m, 0, flags);
    CHECA_STUB();
    for (i = 0; i < V; i++) {
        int esperado = (i <= 4) ? 2 : 0;
        if (flags[i] != esperado) {
            dj_desenha_matriz("matriz:", m);
            dj_desenha_vetor("suas flags:", flags, V);
            FALHA("flags[%d] deveria ser %d e vale %d\n"
                  "       (a propria funcao precisa zerar o vetor flags antes)",
                  i, esperado, flags[i]);
        }
    }
}

void t5_4(void) {
    GRAFO_NOVO(g);
    CENARIO("ARMADILHA: aqui a profundidade daria a resposta ERRADA.\n"
            "  Grafo: 0->1, 1->2, 2->3 (corredor longo) e 0->4 (vizinho direto).\n"
            "  Postos (tipo 9) estao no 3 e no 4. O mais PROXIMO do 0 e o 4,\n"
            "  a 1 aresta. So a busca em LARGURA garante isso.");
    inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 1, 2); inserir_aresta_l(g, 2, 3);
    inserir_aresta_l(g, 0, 4);
    g[3].tipo = 9;
    g[4].tipo = 9;
    ESPERA_INT("tipo_x_mais_prox(g, 0, 9)", tipo_x_mais_prox(g, 0, 9), 4);
    ESPERA_INT("tipo_x_mais_prox(g, 0, 5)  -- nao existe tipo 5 no grafo",
               tipo_x_mais_prox(g, 0, 5), -1);
    ESPERA_INT("tipo_x_mais_prox(g, 4, 9)  -- o proprio vertice atual ja e tipo 9",
               tipo_x_mais_prox(g, 4, 9), 4);
    ESPERA_INT("tipo_x_mais_prox(g, 1, 9)  -- do 1 so da para chegar no 3",
               tipo_x_mais_prox(g, 1, 9), 3);
}

void t5_5(void) {
    GRAFO_NOVO(g);
    CENARIO("Grafo dirigido 0->1, 1->2, 2->3, 0->4, 4->3 e 6->7 separado.\n"
            "  De 0 ate 3 existem dois caminhos: 0-1-2-3 (3 arestas) e\n"
            "  0-4-3 (2 arestas). O comprimento e o MENOR deles.");
    inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 1, 2); inserir_aresta_l(g, 2, 3);
    inserir_aresta_l(g, 0, 4); inserir_aresta_l(g, 4, 3);
    inserir_aresta_l(g, 6, 7);
    ESPERA_INT("comprimento(g, 0, 3)  -- o atalho tem 2 arestas",
               comprimento(g, 0, 3), 2);
    ESPERA_INT("comprimento(g, 0, 0)  -- de um vertice ate ele mesmo",
               comprimento(g, 0, 0), 0);
    ESPERA_INT("comprimento(g, 0, 1)", comprimento(g, 0, 1), 1);
    ESPERA_INT("comprimento(g, 0, 7)  -- inalcancavel, devolva INFINITO",
               comprimento(g, 0, 7), INFINITO);
}

void t5_6(void) {
    GRAFO_NOVO(g);
    int vet[64], n, i, tem[V];
    CENARIO("Rede social NAO-dirigida:\n"
            "     0 - 1     0 - 2     1 - 3     3 - 5     6 - 7\n"
            "  Distancias a partir do 0: grau 1 = {1,2}, grau 2 = {3},\n"
            "  grau 3 = {5}. Com N = 2 a lista tem 0, 1, 2 e 3 (o proprio 0\n"
            "  entra, distancia zero). Ordem nao importa.");
    liga2(g, 0, 1); liga2(g, 0, 2); liga2(g, 1, 3); liga2(g, 3, 5); liga2(g, 6, 7);
    {
        no* r = vertices_raio_n(g, 0, 2);
        CHECA_STUB();
        n = dj_lista_para_vetor(r, vet, 64);
        for (i = 0; i < V; i++) tem[i] = 0;
        for (i = 0; i < n; i++)
            if (vet[i] >= 0 && vet[i] < V) tem[vet[i]]++;
        if (n != 4 || !tem[0] || !tem[1] || !tem[2] || !tem[3]) {
            dj_desenha_lista("grafo:", g);
            dj_print("       sua lista tem %d elemento(s):", n);
            for (i = 0; i < n; i++) dj_print(" %d", vet[i]);
            dj_print("\n");
            FALHA("a lista deveria ter exatamente 0, 1, 2 e 3 (4 elementos)");
        }
        if (tem[5])
            FALHA("o vertice 5 esta a distancia 3, nao pode entrar com N = 2");
    }
    {
        no* r = vertices_raio_n(g, 0, 1);
        n = dj_lista_para_vetor(r, vet, 64);
        CHECA_STUB();
        for (i = 0; i < V; i++) tem[i] = 0;
        for (i = 0; i < n; i++) if (vet[i] >= 0 && vet[i] < V) tem[vet[i]]++;
        if (n != 3 || !tem[0] || !tem[1] || !tem[2]) {
            dj_print("       com N = 1 sua lista tem %d elemento(s):", n);
            for (i = 0; i < n; i++) dj_print(" %d", vet[i]);
            dj_print("\n");
            FALHA("com N = 1 a lista deveria ter 0, 1 e 2 (3 elementos)");
        }
    }
}

void t5_7(void) {
    GRAFO_NOVO(g);
    int dist[V], esperado[V], i;
    CENARIO("Grafo dirigido 0->1, 1->2, 2->3, 0->4, 4->3, 3->5, e 6->7 solto.\n"
            "  distancias(g, 0, dist) preenche dist[] com o numero de arestas\n"
            "  do menor caminho de 0 ate cada vertice (INFINITO se nao chega).");
    inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 1, 2); inserir_aresta_l(g, 2, 3);
    inserir_aresta_l(g, 0, 4); inserir_aresta_l(g, 4, 3); inserir_aresta_l(g, 3, 5);
    inserir_aresta_l(g, 6, 7);
    for (i = 0; i < V; i++) dist[i] = -99;
    distancias(g, 0, dist);
    CHECA_STUB();
    esperado[0] = 0; esperado[1] = 1; esperado[2] = 2; esperado[3] = 2;
    esperado[4] = 1; esperado[5] = 3;
    esperado[6] = INFINITO; esperado[7] = INFINITO;
    for (i = 0; i < V; i++)
        if (dist[i] != esperado[i]) {
            dj_desenha_lista("grafo:", g);
            dj_desenha_vetor("suas distancias:", dist, V);
            dj_desenha_vetor("esperado:", esperado, V);
            FALHA("dist[%d] deveria ser %d e vale %d", i, esperado[i], dist[i]);
        }
}

/* ===================== NIVEL 6 : PONDERADOS ========================== */

void t6_1(void) {
    int m[V][V], custos[V], esperado[V], i, j;
    CENARIO("ARMADILHA: aqui o caminho com MENOS arestas nao e o mais BARATO.\n"
            "  Arestas (dirigidas, com peso):\n"
            "     0->1 = 1     1->2 = 2     2->3 = 1     0->3 = 9\n"
            "     0->4 = 4     4->5 = 1     3->5 = 1\n"
            "  Ate o 3: direto custa 9, mas 0-1-2-3 custa so 4.\n"
            "  Na matriz, m[i][j] == 0 significa que NAO existe aresta.");
    for (i = 0; i < V; i++) for (j = 0; j < V; j++) m[i][j] = 0;
    m[0][1] = 1; m[1][2] = 2; m[2][3] = 1; m[0][3] = 9;
    m[0][4] = 4; m[4][5] = 1; m[3][5] = 1;
    for (i = 0; i < V; i++) custos[i] = -99;
    custo(m, 0, custos);
    CHECA_STUB();
    esperado[0] = 0; esperado[1] = 1; esperado[2] = 3; esperado[3] = 4;
    esperado[4] = 4; esperado[5] = 5;
    esperado[6] = INFINITO; esperado[7] = INFINITO;
    for (i = 0; i < V; i++)
        if (custos[i] != esperado[i]) {
            dj_desenha_vetor("seus custos:", custos, V);
            dj_desenha_vetor("esperado:   ", esperado, V);
            FALHA("custos[%d] deveria ser %d e vale %d", i, esperado[i], custos[i]);
        }
}

void t6_2(void) {
    GRAFO_NOVO(g);
    int c;
    CENARIO("Vizinhos do vertice 0: 1, 2 e 3. As cores ja atribuidas sao\n"
            "  cor[1] = 1, cor[2] = 3, cor[3] = 0 (ainda sem cor).\n"
            "  A menor cor livre para o 0 e a 2.");
    liga2(g, 0, 1); liga2(g, 0, 2); liga2(g, 0, 3);
    g[1].cor = 1; g[2].cor = 3; g[3].cor = 0;
    ESPERA_INT("achar_cor(g, 0)", achar_cor(g, 0), 2);
    g[3].cor = 2;
    c = achar_cor(g, 0);
    CHECA_STUB();
    if (c != 4)
        FALHA("com os vizinhos usando as cores 1, 3 e 2, a menor cor livre\n"
              "       para o vertice 0 e a 4 (voce devolveu %d)", c);
    {
        GRAFO_NOVO(h);
        ESPERA_INT("achar_cor(h, 5)  -- vertice sem nenhum vizinho", achar_cor(h, 5), 1);
    }
}

void t6_3(void) {
    GRAFO_NOVO(g);
    int k = 0, i;
    CENARIO("Coloracao de um TRIANGULO 0-1-2 mais o vertice 3 ligado ao 0.\n"
            "  Um triangulo exige 3 cores. Vizinhos nunca podem ter a mesma\n"
            "  cor, e k guarda quantas cores foram usadas.");
    liga2(g, 0, 1); liga2(g, 1, 2); liga2(g, 0, 2); liga2(g, 0, 3);
    for (i = 0; i < V; i++) g[i].cor = 0;
    colorir(g, 0, &k);
    CHECA_STUB();
    for (i = 0; i <= 3; i++)
        if (g[i].cor <= 0)
            FALHA("o vertice %d ficou sem cor (cor = %d)", i, g[i].cor);
    for (i = 0; i < V; i++) {
        no* p;
        for (p = g[i].inicio; p; p = p->prox)
            if (g[i].cor == g[p->adj].cor) {
                dj_print("       cores: ");
                { int j; for (j = 0; j < V; j++) dj_print("%d:%d ", j, g[j].cor); }
                dj_print("\n");
                FALHA("conflito: %d e %d sao vizinhos e ficaram os dois com a cor %d",
                      i, p->adj, g[i].cor);
            }
    }
    if (k != 3) {
        dj_print("       cores: ");
        { int j; for (j = 0; j < V; j++) dj_print("%d:%d ", j, g[j].cor); }
        dj_print("\n");
        FALHA("k deveria terminar valendo 3 (o triangulo exige 3 cores) e vale %d", k);
    }
}

void t6_4(void) {
    GRAFO_NOVO(g);
    vertice* r;
    CENARIO("Grafo nao-dirigido PONDERADO:\n"
            "     0 - 1 custa 10     0 - 2 custa 3     1 - 3 custa 7\n"
            "     4 - 5 custa 5\n"
            "  Com c = 5, sobram so as arestas de custo MAIOR que 5:\n"
            "  0-1 (10) e 1-3 (7). Nos dois sentidos, entao 4 arestas.");
    liga2(g, 0, 1); liga2(g, 0, 2); liga2(g, 1, 3); liga2(g, 4, 5);
    dj_por_peso(g, 0, 1, 10); dj_por_peso(g, 1, 0, 10);
    dj_por_peso(g, 0, 2, 3);  dj_por_peso(g, 2, 0, 3);
    dj_por_peso(g, 1, 3, 7);  dj_por_peso(g, 3, 1, 7);
    dj_por_peso(g, 4, 5, 5);  dj_por_peso(g, 5, 4, 5);
    r = filtrar_custo(g, 5);
    CHECA_STUB();
    if (!r) FALHA("filtrar_custo devolveu NULL");
    if (!dj_tem_adj(r, 0, 1) || !dj_tem_adj(r, 1, 0) ||
        !dj_tem_adj(r, 1, 3) || !dj_tem_adj(r, 3, 1)) {
        dj_desenha_lista("seu resultado:", r);
        FALHA("faltaram arestas de custo maior que 5 (0-1 vale 10, 1-3 vale 7)");
    }
    if (dj_tem_adj(r, 0, 2) || dj_tem_adj(r, 4, 5)) {
        dj_desenha_lista("seu resultado:", r);
        FALHA("sobraram arestas baratas: 0-2 custa 3 e 4-5 custa 5.\n"
              "       O criterio e MAIOR que c, entao custo == 5 tambem sai.");
    }
    if (dj_conta_arestas(r) != 4) {
        dj_desenha_lista("seu resultado:", r);
        FALHA("o resultado deveria ter 4 arestas, tem %d", dj_conta_arestas(r));
    }
}

void t6_5(void) {
    GRAFO_NOVO(g);
    int vet[64], n;
    CENARIO("Grafo dirigido 0->1, 1->2, 2->3, 0->4, 4->3, 3->5 e 6->7 solto.\n"
            "  O menor caminho de 0 ate 5 e a lista 0, 4, 3, 5 -- nessa ordem,\n"
            "  comecando em a e terminando em b.");
    inserir_aresta_l(g, 0, 1); inserir_aresta_l(g, 1, 2); inserir_aresta_l(g, 2, 3);
    inserir_aresta_l(g, 0, 4); inserir_aresta_l(g, 4, 3); inserir_aresta_l(g, 3, 5);
    inserir_aresta_l(g, 6, 7);
    {
        no* r = caminho_bfs(g, 0, 5);
        CHECA_STUB();
        if (!r) FALHA("existe caminho de 0 ate 5, mas a funcao devolveu NULL");
        n = dj_lista_para_vetor(r, vet, 64);
        if (n != 4 || vet[0] != 0 || vet[1] != 4 || vet[2] != 3 || vet[3] != 5) {
            int i;
            dj_desenha_lista("grafo:", g);
            dj_print("       seu caminho:");
            for (i = 0; i < n; i++) dj_print(" %d", vet[i]);
            dj_print("\n       esperado   : 0 4 3 5\n");
            FALHA("caminho errado (a lista precisa sair de a e chegar em b)");
        }
    }
    {
        no* r = caminho_bfs(g, 0, 7);
        CHECA_STUB();
        if (r != NULL) FALHA("nao existe caminho de 0 ate 7: devolva NULL");
    }
    {
        no* r = caminho_bfs(g, 2, 2);
        CHECA_STUB();
        n = dj_lista_para_vetor(r, vet, 64);
        if (n != 1 || vet[0] != 2)
            FALHA("o caminho de 2 ate 2 e uma lista com um unico elemento: 2");
    }
}
