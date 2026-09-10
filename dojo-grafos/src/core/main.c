#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "dojo.h"

#ifdef _WIN32
#include <windows.h>
static void liga_cores(void) {
    HANDLE h = GetStdHandle(STD_OUTPUT_HANDLE);
    DWORD modo = 0;
    if (GetConsoleMode(h, &modo))
        SetConsoleMode(h, modo | 0x0004 /* VIRTUAL_TERMINAL_PROCESSING */);
}
#else
static void liga_cores(void) {}
#endif

void campus_app(void);
void campus_dump_json(void);

/* ---------------------------------------------------------------------------
 *  Cada teste roda num SUBPROCESSO. Assim, se o seu codigo estourar a memoria
 *  ou entrar em recursao infinita, quem morre e o subprocesso: o Dojo continua
 *  de pe e ainda consegue te contar o que aconteceu.
 * ------------------------------------------------------------------------- */
static char meu_caminho[1024] = "dojo.exe";

/* O cmd do Windows precisa das aspas externas; o sh do Linux e do macOS
   engasga com elas. Cada um com a sua forma. */
static void monta_cmd(char* destino, int tam, int indice, int quieto) {
#ifdef _WIN32
    snprintf(destino, tam, "\"\"%s\" --exec %d%s\"", meu_caminho, indice,
             quieto ? " --quieto" : "");
#else
    snprintf(destino, tam, "\"%s\" --exec %d%s", meu_caminho, indice,
             quieto ? " --quieto" : "");
#endif
}

int dojo_status(int indice) {
    char cmd[1200];
    int ret;
    if (indice < 0 || indice >= N_EXERCICIOS) return R_FALHOU;
    monta_cmd(cmd, sizeof cmd, indice, 1);
    ret = system(cmd);
#ifndef _WIN32
    if (ret != -1 && (ret & 0x7f) == 0) ret = (ret >> 8) & 0xff;   /* WEXITSTATUS */
#endif
    if (ret == R_OK || ret == R_STUB || ret == R_FALHOU) return ret;
    return R_QUEBROU;   /* qualquer outro codigo de saida = o programa morreu */
}

/* Roda um teste deixando o subprocesso escrever o diagnostico na tela.
   Devolve o codigo de saida CRU: de 0 a 3 o filho conseguiu se explicar
   sozinho; qualquer outro valor quer dizer que ele morreu antes disso. */
static int roda_visivel(int indice) {
    char cmd[1200];
    int ret;
    monta_cmd(cmd, sizeof cmd, indice, 0);
    fflush(stdout);
    ret = system(cmd);
#ifndef _WIN32
    if (ret != -1 && (ret & 0x7f) == 0) ret = (ret >> 8) & 0xff;
#endif
    return ret;
}

static int status[128];

static void roda_tudo(void) {
    int i;
    for (i = 0; i < N_EXERCICIOS; i++) status[i] = dojo_status(i);
}

static int nivel_completo(int n) {
    int i;
    for (i = 0; i < N_EXERCICIOS; i++)
        if (CATALOGO[i].nivel == n && status[i] != R_OK) return 0;
    return 1;
}

static const char* etiqueta(int st) {
    switch (st) {
        case R_OK:      return C_VERDE "  ok    " C_RESET;
        case R_FALHOU:  return C_VERM  " falhou " C_RESET;
        case R_QUEBROU: return C_ROXO  " quebrou" C_RESET;
        default:        return C_DIM   " a fazer" C_RESET;
    }
}

static void barra(int feitos, int total) {
    int i, cheio = total ? (feitos * 10) / total : 0;
    printf("[");
    for (i = 0; i < 10; i++) {
        if (i < cheio) printf(C_VERDE "#" C_RESET);
        else           printf(C_DIM   "-" C_RESET);
    }
    printf("] %d/%d", feitos, total);
}

static void cabecalho(void) {
    printf("\n" C_AZUL C_NEG);
    printf("  ================================================================\n");
    printf("    DOJO DE GRAFOS   ACH2024 - Algoritmos e Estruturas de Dados II\n");
    printf("  ================================================================\n");
    printf(C_RESET);
}

static void painel(void) {
    int n, i, total_ok = 0, travado = 0;

    cabecalho();
    for (n = 1; n <= N_NIVEIS; n++) {
        int feitos = 0, total = 0, bloqueado = (n > 1 && !nivel_completo(n - 1));
        for (i = 0; i < N_EXERCICIOS; i++)
            if (CATALOGO[i].nivel == n) { total++; if (status[i] == R_OK) feitos++; }
        total_ok += feitos;

        printf("\n  " C_NEG "NIVEL %d  %s" C_RESET "  ", n, NIVEIS[n-1].titulo);
        barra(feitos, total);
        if (bloqueado) printf("  " C_DIM "(bloqueado)" C_RESET);
        printf("\n  " C_DIM "  %s" C_RESET "\n", NIVEIS[n-1].subtitulo);
        printf("  " C_DIM "  arquivo: %s" C_RESET "\n", NIVEIS[n-1].arquivo);

        for (i = 0; i < N_EXERCICIOS; i++) {
            if (CATALOGO[i].nivel != n) continue;
            printf("     %s  %d.%d  %-22s" C_DIM "%s" C_RESET "\n",
                   bloqueado && status[i] != R_OK ? C_DIM " ------ " C_RESET
                                                  : etiqueta(status[i]),
                   n, CATALOGO[i].num, CATALOGO[i].nome, CATALOGO[i].referencia);
            if (!travado && status[i] != R_OK && !bloqueado) travado = n * 100 + CATALOGO[i].num;
        }
    }

    printf("\n  " C_NEG "TOTAL: %d de %d" C_RESET "\n", total_ok, N_EXERCICIOS);
    if (total_ok == N_EXERCICIOS) {
        printf("\n  " C_VERDE C_NEG "Tudo verde. Voce implementou os %d exercicios na unha.\n"
               C_RESET, N_EXERCICIOS);
        printf("  Rode " C_NEG "make app" C_RESET " para usar o Campus EACH com o seu\n"
               "  codigo, e " C_NEG "make novociclo" C_RESET " para apagar tudo e treinar de novo.\n\n");
    } else if (travado) {
        printf("\n  Proximo passo: " C_NEG "make n%d" C_RESET "   (ou "
               C_NEG "make dica N=%d E=%d" C_RESET " se travar)\n\n",
               travado / 100, travado / 100, travado % 100);
    }
}

static void cabecalho_ex(Exercicio* e) {
    printf("\n  " C_NEG "%d.%d  %s" C_RESET "\n", e->nivel, e->num, e->nome);
    printf("  " C_DIM "%s" C_RESET "\n", e->assinatura);
    printf("  " C_DIM "referencia: %s" C_RESET "\n\n", e->referencia);
    printf("  o que a funcao deve fazer:\n  %s\n\n", e->enunciado);
}

static void explica_crash(void) {
    printf("  " C_ROXO C_NEG "O SEU CODIGO QUEBROU (acesso invalido de memoria)."
           C_RESET "\n");
    printf("  O teste foi rodado num processo separado justamente para isso:\n");
    printf("  o programa morreu, mas o Dojo continua de pe.\n\n");
    printf("  Quase sempre e um destes:\n");
    printf("    - usar um ponteiro NULL (p->adj com p == NULL,\n");
    printf("      f->ultimo->prox com a fila vazia,\n");
    printf("      ant->prox quando o no removido era o primeiro da lista);\n");
    printf("    - malloc(sizeof(no*)) no lugar de malloc(sizeof(no)), que\n");
    printf("      reserva 8 bytes em vez da struct inteira;\n");
    printf("    - recursao sem parada (esqueceu de marcar a flag antes de\n");
    printf("      descer nos vizinhos).\n\n");
}

static void mostra_falha(Exercicio* e, int st) {
    cabecalho_ex(e);
    if (dojo_ctx[0])   printf("  cenario do teste:\n  %s\n\n", dojo_ctx);
    if (dojo_extra[0]) printf("%s\n", dojo_extra);
    if (st == R_QUEBROU) explica_crash();
    else printf("  " C_VERM C_NEG "FALHOU:" C_RESET " %s\n\n", dojo_msg);
}

/* Roda o teste de fato. E este o caminho executado no subprocesso. */
static int exec_teste(int idx, int quieto) {
    int st;
    if (idx < 0 || idx >= N_EXERCICIOS) return R_FALHOU;
#ifdef _WIN32
    SetErrorMode(SEM_FAILCRITICALERRORS | SEM_NOGPFAULTERRORBOX |
                 SEM_NOOPENFILEERRORBOX);
#endif
    st = dojo_roda(&CATALOGO[idx]);
    if (!quieto && st != R_OK && st != R_STUB) mostra_falha(&CATALOGO[idx], st);
    return st;
}

/* ---------------------------------------------------------------------------
 *  --dump-json: despeja o catalogo inteiro em JSON.
 *  E daqui que a versao web tira os enunciados e as dicas, para nao existirem
 *  duas listas de exercicios que possam divergir.
 * ------------------------------------------------------------------------- */
static void json_texto(const char* s) {
    putchar('"');
    for (; s && *s; s++) {
        switch (*s) {
            case '"':  fputs("\\\"", stdout); break;
            case '\\': fputs("\\\\", stdout); break;
            case '\n': fputs("\\n", stdout);  break;
            case '\r': fputs("\\r", stdout);  break;
            case '\t': fputs("\\t", stdout);  break;
            default:
                if ((unsigned char)*s < 0x20) printf("\\u%04x", (unsigned char)*s);
                else putchar(*s);
        }
    }
    putchar('"');
}

static void dump_json(void) {
    int i, j;
    printf("{\n  \"niveis\": [\n");
    for (i = 0; i < N_NIVEIS; i++) {
        printf("    {\"numero\": %d, \"titulo\": ", NIVEIS[i].numero);
        json_texto(NIVEIS[i].titulo);
        printf(", \"subtitulo\": ");
        json_texto(NIVEIS[i].subtitulo);
        printf(", \"arquivo\": ");
        json_texto(NIVEIS[i].arquivo);
        printf("}%s\n", i + 1 < N_NIVEIS ? "," : "");
    }
    printf("  ],\n  \"exercicios\": [\n");
    for (i = 0; i < N_EXERCICIOS; i++) {
        printf("    {\"nivel\": %d, \"num\": %d, \"nome\": ",
               CATALOGO[i].nivel, CATALOGO[i].num);
        json_texto(CATALOGO[i].nome);
        printf(", \"assinatura\": ");
        json_texto(CATALOGO[i].assinatura);
        printf(", \"enunciado\": ");
        json_texto(CATALOGO[i].enunciado);
        printf(", \"referencia\": ");
        json_texto(CATALOGO[i].referencia);
        printf(", \"dicas\": [");
        for (j = 0; j < 3; j++) {
            json_texto(CATALOGO[i].dicas[j]);
            if (j < 2) printf(", ");
        }
        printf("]}%s\n", i + 1 < N_EXERCICIOS ? "," : "");
    }
    printf("  ],\n  \"campus\": ");
    campus_dump_json();
    printf("\n}\n");
}

static Exercicio* acha(int nivel, int num) {
    int i;
    for (i = 0; i < N_EXERCICIOS; i++)
        if (CATALOGO[i].nivel == nivel && CATALOGO[i].num == num)
            return &CATALOGO[i];
    return NULL;
}

static void roda_nivel(int n, int so_este) {
    int i, st, feitos = 0, total = 0;

    cabecalho();
    if (n < 1 || n > N_NIVEIS) {
        printf("\n  Nivel %d nao existe. Os niveis vao de 1 a %d.\n\n", n, N_NIVEIS);
        return;
    }
    roda_tudo();
    if (n > 1 && !nivel_completo(n - 1)) {
        printf("\n  " C_AMAR C_NEG "NIVEL %d BLOQUEADO." C_RESET "\n", n);
        printf("  Os exercicios do nivel %d usam as funcoes que voce escreve no\n"
               "  nivel %d. Enquanto elas nao estiverem certas, nada aqui pode ser\n"
               "  testado de verdade.\n\n"
               "  Termine o nivel %d primeiro:  " C_NEG "make n%d" C_RESET "\n\n",
               n, n - 1, n - 1, n - 1);
        return;
    }

    printf("\n  " C_NEG "NIVEL %d - %s" C_RESET "\n", n, NIVEIS[n-1].titulo);
    printf("  " C_DIM "escreva suas respostas em %s" C_RESET "\n", NIVEIS[n-1].arquivo);

    for (i = 0; i < N_EXERCICIOS; i++) {
        if (CATALOGO[i].nivel != n) continue;
        if (so_este && CATALOGO[i].num != so_este) continue;
        total++;
        st = status[i];
        printf("\n     %s  %d.%d  %s\n", etiqueta(st), n, CATALOGO[i].num,
               CATALOGO[i].nome);
        if (st == R_OK) { feitos++; continue; }

        if (st == R_STUB) {
            printf("\n  " C_AMAR C_NEG "PROXIMO EXERCICIO: %d.%d  %s" C_RESET "\n",
                   n, CATALOGO[i].num, CATALOGO[i].nome);
            printf("  " C_DIM "%s" C_RESET "\n", CATALOGO[i].assinatura);
            printf("  " C_DIM "referencia: %s" C_RESET "\n\n", CATALOGO[i].referencia);
            printf("  %s\n\n", CATALOGO[i].enunciado);
            printf("  Abra " C_NEG "%s" C_RESET ", ache a funcao %s,\n"
                   "  apague o FALTA_IMPLEMENTAR() e escreva o corpo dela.\n",
                   NIVEIS[n-1].arquivo, CATALOGO[i].nome);
            printf("  Depois rode " C_NEG "make n%d" C_RESET " de novo.\n", n);
        } else {
            /* Repete o teste num subprocesso, agora deixando ele escrever o
               diagnostico na tela. Se o codigo quebrar, quem morre e o filho
               -- e ai o proprio pai explica o que aconteceu. */
            int rc = roda_visivel(i);
            if (rc < 0 || rc > R_QUEBROU) {   /* morreu sem conseguir falar */
                cabecalho_ex(&CATALOGO[i]);
                explica_crash();
            }
            printf("  Corrija e rode " C_NEG "make n%d" C_RESET " de novo.\n", n);
        }
        printf("  Travou? " C_NEG "make dica N=%d E=%d" C_RESET "\n\n",
               n, CATALOGO[i].num);
        return;   /* um problema de cada vez */
    }

    if (so_este && total == 0) {
        printf("\n  O nivel %d nao tem o exercicio %d.\n\n", n, so_este);
        return;
    }
    printf("\n  " C_VERDE C_NEG "NIVEL %d COMPLETO" C_RESET "  (%d/%d)\n",
           n, feitos, total);
    if (!so_este && n < N_NIVEIS)
        printf("  Nivel %d liberado: " C_NEG "make n%d" C_RESET "\n\n", n + 1, n + 1);
    else
        printf("\n");
}

static void mostra_dica(int n, int e, int grau) {
    Exercicio* ex = acha(n, e);
    int i;
    cabecalho();
    if (!ex) { printf("\n  Exercicio %d.%d nao existe.\n\n", n, e); return; }
    printf("\n  " C_NEG "%d.%d  %s" C_RESET "\n", n, e, ex->nome);
    printf("  " C_DIM "%s" C_RESET "\n", ex->assinatura);
    printf("  " C_DIM "referencia: %s" C_RESET "\n\n", ex->referencia);
    printf("  %s\n", ex->enunciado);
    if (grau < 1) grau = 1;
    if (grau > 3) grau = 3;
    for (i = 0; i < grau; i++) {
        const char* rotulo = (i == 0) ? "DICA 1 - o caminho"
                           : (i == 1) ? "DICA 2 - o detalhe que derruba todo mundo"
                                      : "DICA 3 - o codigo";
        printf("\n  " C_AMAR C_NEG "%s" C_RESET "\n     %s\n", rotulo, ex->dicas[i]);
    }
    if (grau < 3)
        printf("\n  " C_DIM "Mais uma dica: make dica N=%d E=%d G=%d" C_RESET "\n\n",
               n, e, grau + 1);
    else
        printf("\n");
}

int main(int argc, char** argv) {
    if (argv[0] && argv[0][0])
        snprintf(meu_caminho, sizeof meu_caminho, "%s", argv[0]);

    /* modo interno: rodar UM teste isolado (usado pelo proprio Dojo) */
    if (argc >= 3 && strcmp(argv[1], "--exec") == 0) {
        int quieto = (argc >= 4 && strcmp(argv[3], "--quieto") == 0);
        if (!quieto) liga_cores();
        return exec_teste(atoi(argv[2]), quieto);
    }

    if (argc >= 2 && strcmp(argv[1], "--dump-json") == 0) { dump_json(); return 0; }

    liga_cores();

    if (argc >= 2 && strcmp(argv[1], "app") == 0) { campus_app(); return 0; }

    if (argc >= 4 && strcmp(argv[1], "dica") == 0) {
        mostra_dica(atoi(argv[2]), atoi(argv[3]), argc >= 5 ? atoi(argv[4]) : 1);
        return 0;
    }
    if (argc >= 2 && argv[1][0] >= '1' && argv[1][0] <= '9' && argv[1][1] == 0) {
        roda_nivel(atoi(argv[1]), argc >= 3 ? atoi(argv[2]) : 0);
        return 0;
    }
    roda_tudo();
    painel();
    return 0;
}
