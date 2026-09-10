/* ==========================================================================
 *  Campus EACH -- o sistema que roda em cima do SEU codigo.
 *
 *  Cada funcionalidade do menu chama diretamente uma funcao que voce
 *  implementou. Enquanto o exercicio correspondente nao passa nos testes,
 *  a opcao aparece trancada.
 * ========================================================================== */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "dojo.h"

static const char* NOME[V] = {
    "Portaria", "Bloco A1", "Bandejao", "Biblioteca",
    "Bloco A2", "Lab Redes", "Cantina",  "Auditorio"
};

/* tipo: 1 = passagem  2 = comida  3 = estudo  4 = laboratorio  5 = evento */
static const int TIPO[V] = { 1, 1, 2, 3, 1, 4, 2, 5 };

static const char* NOME_TIPO(int t) {
    switch (t) {
        case 1: return "passagem";
        case 2: return "comida";
        case 3: return "estudo";
        case 4: return "laboratorio";
        case 5: return "evento";
    }
    return "?";
}

/* trechos do campus: origem, destino, minutos a pe */
static const int TRECHO[][3] = {
    {0, 1, 3}, {0, 4, 2}, {1, 2, 5}, {1, 7, 8}, {2, 3, 1},
    {2, 6, 2}, {3, 4, 4}, {4, 5, 6}, {5, 7, 1}
};
static const int N_TRECHOS = 9;

/* ---------------------------------------------------------------------- */
static int st[128];

static int liberado(int nivel, int num) {
    int i;
    for (i = 0; i < N_EXERCICIOS; i++)
        if (CATALOGO[i].nivel == nivel && CATALOGO[i].num == num)
            return st[i] == R_OK;
    return 0;
}

static const char* nome_ex(int nivel, int num) {
    int i;
    for (i = 0; i < N_EXERCICIOS; i++)
        if (CATALOGO[i].nivel == nivel && CATALOGO[i].num == num)
            return CATALOGO[i].nome;
    return "?";
}

static void atualiza_status(void) {
    int i;
    for (i = 0; i < N_EXERCICIOS; i++) st[i] = dojo_status(i);
}

/* monta o campus usando as funcoes DO ALUNO */
static vertice* monta_campus(void) {
    vertice* g;
    int i;
    dojo_stub = 0;
    g = alocar_l();
    if (dojo_stub || !g) return NULL;
    inicializar_l(g);
    if (dojo_stub) return NULL;
    for (i = 0; i < N_TRECHOS; i++) {
        inserir_aresta_l(g, TRECHO[i][0], TRECHO[i][1]);
        inserir_aresta_l(g, TRECHO[i][1], TRECHO[i][0]);
        dj_por_peso(g, TRECHO[i][0], TRECHO[i][1], TRECHO[i][2]);
        dj_por_peso(g, TRECHO[i][1], TRECHO[i][0], TRECHO[i][2]);
    }
    for (i = 0; i < V; i++) g[i].tipo = TIPO[i];
    if (dojo_stub) return NULL;
    return g;
}

static void monta_matriz_pesos(int m[V][V]) {
    int i, j;
    for (i = 0; i < V; i++) for (j = 0; j < V; j++) m[i][j] = 0;
    for (i = 0; i < N_TRECHOS; i++) {
        m[TRECHO[i][0]][TRECHO[i][1]] = TRECHO[i][2];
        m[TRECHO[i][1]][TRECHO[i][0]] = TRECHO[i][2];
    }
}

static void lista_locais(void) {
    int i;
    printf("\n  locais do campus:\n");
    for (i = 0; i < V; i++)
        printf("    %d = %-11s " C_DIM "(%s)" C_RESET "\n", i, NOME[i], NOME_TIPO(TIPO[i]));
}

static int pergunta(const char* rotulo) {
    int x = -1;
    printf("  %s ", rotulo);
    fflush(stdout);
    if (scanf("%d", &x) != 1) { while (getchar() != '\n') {} return -1; }
    if (x < 0 || x >= V) {
        printf("  " C_VERM "local invalido" C_RESET "\n");
        return -1;
    }
    return x;
}

static int pergunta_num(const char* rotulo) {
    int x = -1;
    printf("  %s ", rotulo);
    fflush(stdout);
    if (scanf("%d", &x) != 1) { while (getchar() != '\n') {} return -1; }
    return x;
}

/* ---------------------------------------------------------------------- */
static void f_mapa(vertice* g) {
    int i;
    printf("\n  " C_NEG "MAPA DO CAMPUS" C_RESET "\n");
    for (i = 0; i < V; i++) {
        no* p;
        printf("    %-11s " C_DIM "(%d saidas)" C_RESET " ->",
               NOME[i], grau_saida_l(g, i));
        for (p = g[i].inicio; p; p = p->prox)
            printf(" %s(%dmin)", NOME[p->adj], p->peso);
        printf("\n");
    }
}

static void f_existe_caminho(vertice* g) {
    int a, b;
    bool achou = FALSE;
    lista_locais();
    a = pergunta("de onde voce esta (numero):"); if (a < 0) return;
    b = pergunta("para onde quer ir (numero):"); if (b < 0) return;
    zerar_flags(g);
    prof_caminho(g, a, b, &achou);
    printf("\n  %s\n", achou
        ? C_VERDE "da para chegar la a pe." C_RESET
        : C_VERM  "nao existe caminho entre esses dois locais." C_RESET);
}

static void f_alcancaveis(vertice* g) {
    int x, i, n = 0;
    lista_locais();
    x = pergunta("de onde voce parte (numero):"); if (x < 0) return;
    zerar_flags(g);
    prof(g, x);
    printf("\n  saindo de %s da para chegar em:\n", NOME[x]);
    for (i = 0; i < V; i++)
        if (i != x && g[i].flag != 0) { printf("    - %s\n", NOME[i]); n++; }
    if (!n) printf("    " C_DIM "(nenhum outro local)" C_RESET "\n");
}

static void f_comida(vertice* g) {
    int x, r;
    lista_locais();
    x = pergunta("de onde voce esta (numero):"); if (x < 0) return;
    r = tipo_x_mais_prox(g, x, 2);
    if (r < 0) printf("\n  " C_VERM "nenhum lugar de comida alcancavel." C_RESET "\n");
    else       printf("\n  comida mais proxima de %s: " C_VERDE "%s" C_RESET "\n",
                      NOME[x], NOME[r]);
}

static void f_rota_curta(vertice* g) {
    int a, b;
    no* r;
    lista_locais();
    a = pergunta("origem (numero):");  if (a < 0) return;
    b = pergunta("destino (numero):"); if (b < 0) return;
    r = caminho_bfs(g, a, b);
    if (!r) { printf("\n  " C_VERM "nao ha rota." C_RESET "\n"); return; }
    printf("\n  rota com menos trechos:\n    ");
    while (r) {
        printf("%s", NOME[r->adj]);
        r = r->prox;
        if (r) printf(" -> ");
    }
    printf("\n");
}

static void f_rota_rapida(void) {
    int m[V][V], custos[V], a, i;
    monta_matriz_pesos(m);
    lista_locais();
    a = pergunta("de onde voce parte (numero):"); if (a < 0) return;
    custo(m, a, custos);
    printf("\n  tempo minimo a pe saindo de %s:\n", NOME[a]);
    for (i = 0; i < V; i++) {
        if (custos[i] >= INFINITO) printf("    %-11s  " C_DIM "inalcancavel" C_RESET "\n", NOME[i]);
        else                       printf("    %-11s  %d min\n", NOME[i], custos[i]);
    }
}

static void f_raio(vertice* g) {
    int x, n;
    no* r;
    lista_locais();
    x = pergunta("de onde voce esta (numero):"); if (x < 0) return;
    n = pergunta_num("quantos trechos de distancia (numero):"); if (n < 0) return;
    r = vertices_raio_n(g, x, n);
    printf("\n  a ate %d trecho(s) de %s:\n", n, NOME[x]);
    while (r) { printf("    - %s\n", NOME[r->adj]); r = r->prox; }
}

static void f_interdicao(void) {
    vertice* g = monta_campus();
    int x, i, antes, depois;
    if (!g) return;
    lista_locais();
    x = pergunta("qual local sera interditado (numero):"); if (x < 0) return;
    antes = contar_grupos(g);
    for (i = 0; i < V; i++) {
        excluir_aresta_l(g, x, i);
        excluir_aresta_l(g, i, x);
    }
    depois = contar_grupos(g);
    printf("\n  antes da interdicao: %d bloco(s) de campus conectados\n", antes);
    printf("  depois de fechar %s: %d bloco(s)\n", NOME[x], depois);
    if (depois > antes + 1)
        printf("  " C_VERM C_NEG "  fechar %s PARTE o campus em pedacos isolados."
               C_RESET "\n", NOME[x]);
    else
        printf("  " C_VERDE "  o campus continua inteiro (fora o proprio local)."
               C_RESET "\n");
    dj_libera(g);
}

static void f_transposto(vertice* g) {
    vertice* gt = transposta_l(g);
    int i;
    if (!gt) return;
    printf("\n  " C_NEG "MAPA INVERTIDO" C_RESET " (util para saber quem chega em voce)\n");
    for (i = 0; i < V; i++) {
        no* p;
        printf("    %-11s <-", NOME[i]);
        for (p = gt[i].inicio; p; p = p->prox) printf(" %s", NOME[p->adj]);
        printf("\n");
    }
    dj_libera(gt);
}

static void f_horarios(void) {
    vertice* g = monta_campus();
    int k = 0, i;
    if (!g) return;
    for (i = 0; i < V; i++) g[i].cor = 0;
    colorir(g, 0, &k);
    printf("\n  " C_NEG "GRADE DE HORARIOS" C_RESET "\n");
    printf("  Locais ligados por um trecho nao podem ter evento no mesmo\n");
    printf("  horario (as pessoas circulam entre eles). Precisamos de %d faixas:\n\n", k);
    for (i = 0; i < V; i++)
        printf("    %-11s  faixa %d\n", NOME[i], g[i].cor);
    dj_libera(g);
}

static void f_comida_evitando(vertice* g) {
    int x, n, r;
    lista_locais();
    x = pergunta("de onde voce esta (numero):");        if (x < 0) return;
    n = pergunta("qual local esta interditado (numero):"); if (n < 0) return;
    r = tipo_x_evitando(g, x, 2, n);
    if (r < 0)
        printf("\n  " C_VERM "com %s interditado nao da para chegar em nenhum"
               " lugar de comida." C_RESET "\n", NOME[n]);
    else
        printf("\n  comida mais proxima de %s sem passar por %s: "
               C_VERDE "%s" C_RESET "\n", NOME[x], NOME[n], NOME[r]);
}

static void f_ciclo(vertice* g) {
    bool tem = tem_ciclo_nao_dir(g);
    printf("\n  %s\n", tem
        ? C_AMAR "o campus tem pelo menos um circuito fechado: da para sair de"
                 " um lugar e voltar nele sem repetir trecho." C_RESET
        : C_VERDE "o campus nao tem nenhum circuito: e uma arvore." C_RESET);
}

/* ---------------------------------------------------------------------- */
typedef struct {
    const char* rotulo;
    int         nivel, num;      /* exercicio que destrava a opcao */
} Opcao;

static Opcao MENU[] = {
    {"Mapa do campus",                        2, 6},
    {"Existe caminho entre dois locais?",     4, 3},
    {"Aonde da para chegar a partir daqui",   4, 2},
    {"Comida mais proxima",                   5, 4},
    {"Rota com menos trechos",                6, 5},
    {"Rota mais rapida (em minutos)",         6, 1},
    {"Quem esta a ate N trechos daqui",       5, 6},
    {"Simular interdicao de um local",        4, 6},
    {"Mapa invertido (quem chega em voce)",   3, 1},
    {"Grade de horarios sem conflito",        6, 3},
    {"Comida mais proxima evitando um local", 7, 9},
    {"O campus tem algum circuito fechado?",  7, 3}
};
static const int N_MENU = 12;

void campus_app(void) {
    vertice* g;
    int op, i, abertas;

    atualiza_status();

    printf("\n" C_AZUL C_NEG);
    printf("  ================================================================\n");
    printf("    CAMPUS EACH -- rodando em cima do SEU codigo\n");
    printf("  ================================================================\n");
    printf(C_RESET);

    g = monta_campus();
    if (!g) {
        printf("\n  " C_AMAR "O campus nem chega a ser montado." C_RESET "\n");
        printf("  Ele e construido com alocar_l, inicializar_l e inserir_aresta_l.\n");
        printf("  Termine o nivel 2 primeiro:  " C_NEG "make n2" C_RESET "\n\n");
        return;
    }

    for (;;) {
        abertas = 0;
        printf("\n  " C_NEG "O QUE VOCE QUER FAZER?" C_RESET "\n");
        for (i = 0; i < N_MENU; i++) {
            int ok = liberado(MENU[i].nivel, MENU[i].num);
            if (ok) {
                abertas++;
                printf("    %2d) %s\n", i + 1, MENU[i].rotulo);
            } else {
                printf("    " C_DIM "%2d) %-38s trancado: falta %d.%d %s" C_RESET "\n",
                       i + 1, MENU[i].rotulo, MENU[i].nivel, MENU[i].num,
                       nome_ex(MENU[i].nivel, MENU[i].num));
            }
        }
        printf("     0) sair\n");
        if (!abertas)
            printf("\n  " C_DIM "Nenhuma funcionalidade liberada ainda. Cada uma depende\n"
                   "  de um exercicio seu passar nos testes." C_RESET "\n");

        printf("\n  opcao: ");
        fflush(stdout);
        if (scanf("%d", &op) != 1) break;
        if (op == 0) break;
        if (op < 1 || op > N_MENU) { printf("  opcao invalida\n"); continue; }
        if (!liberado(MENU[op-1].nivel, MENU[op-1].num)) {
            printf("\n  " C_AMAR "Essa opcao ainda esta trancada." C_RESET "\n");
            printf("  Ela usa o exercicio %d.%d. Rode " C_NEG "make n%d" C_RESET
                   " para destravar.\n", MENU[op-1].nivel, MENU[op-1].num, MENU[op-1].nivel);
            continue;
        }
        switch (op) {
            case 1:  f_mapa(g);             break;
            case 2:  f_existe_caminho(g);   break;
            case 3:  f_alcancaveis(g);      break;
            case 4:  f_comida(g);           break;
            case 5:  f_rota_curta(g);       break;
            case 6:  f_rota_rapida();       break;
            case 7:  f_raio(g);             break;
            case 8:  f_interdicao();        break;
            case 9:  f_transposto(g);       break;
            case 10: f_horarios();          break;
            case 11: f_comida_evitando(g);  break;
            case 12: f_ciclo(g);            break;
        }
    }
    printf("\n  ate a proxima.\n\n");
}
