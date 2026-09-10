/* ==========================================================================
 *  dojo.h -- micro-framework de testes do Dojo de Grafos
 * ========================================================================== */
#ifndef DOJO_H
#define DOJO_H

#include <stdio.h>
#include <string.h>
#include "grafo.h"

/* --- cores ANSI ------------------------------------------------------- */
#define C_RESET "\033[0m"
#define C_DIM   "\033[2m"
#define C_NEG   "\033[1m"
#define C_VERDE "\033[32m"
#define C_VERM  "\033[31m"
#define C_AMAR  "\033[33m"
#define C_AZUL  "\033[36m"
#define C_ROXO  "\033[35m"

/* --- estado global do teste corrente ---------------------------------- */
typedef enum { R_OK = 0, R_STUB = 1, R_FALHOU = 2, R_QUEBROU = 3 } Resultado;

extern int       dojo_stub;        /* 1 se alguma funcao ainda e' stub     */
extern Resultado dojo_res;
extern char      dojo_msg[2048];
extern char      dojo_ctx[2048];
extern char      dojo_extra[8192];

/* Escreve no buffer de diagnostico em vez da tela: assim os desenhos
   aparecem depois do cabecalho do exercicio, e nao antes. */
void dj_print(const char* fmt, ...);

/* Marcador usado pelos stubs em src/aluno/. NUNCA aparece no gabarito. */
#define FALTA_IMPLEMENTAR() do { dojo_stub = 1; } while (0)

/* --- macros de asserção ----------------------------------------------- */
#define CENARIO(...) snprintf(dojo_ctx, sizeof dojo_ctx, __VA_ARGS__)

#define CHECA_STUB() do { if (dojo_stub) { dojo_res = R_STUB; return; } } while (0)

#define FALHA(...) do {                                                       \
        dojo_res = R_FALHOU;                                                  \
        snprintf(dojo_msg, sizeof dojo_msg, __VA_ARGS__);                     \
        return;                                                               \
    } while (0)

#define ESPERA_INT(rotulo, obtido, esperado) do {                             \
        int _o = (obtido); CHECA_STUB();                                      \
        int _e = (esperado);                                                  \
        if (_o != _e)                                                         \
            FALHA("%s\n       esperado: %d\n       obtido  : %d",             \
                  rotulo, _e, _o);                                            \
    } while (0)

#define ESPERA_BOOL(rotulo, obtido, esperado) do {                            \
        int _o = (obtido); CHECA_STUB();                                      \
        int _e = (esperado);                                                  \
        if (!!_o != !!_e)                                                     \
            FALHA("%s\n       esperado: %s\n       obtido  : %s",             \
                  rotulo, _e ? "TRUE" : "FALSE", _o ? "TRUE" : "FALSE");      \
    } while (0)

#define ESPERA_NAO_NULO(rotulo, obtido) do {                                  \
        void* _p = (void*)(obtido); CHECA_STUB();                             \
        if (_p == NULL)                                                       \
            FALHA("%s\n       a funcao devolveu NULL", rotulo);               \
    } while (0)

/* --- utilitarios de verificacao (NAO usam codigo do aluno) ------------ */
int  dj_conta_adj(vertice* g, int v);
int  dj_tem_adj(vertice* g, int v, int alvo);
int  dj_confere_adj(vertice* g, int v, const int* esperados, int n, char* err, int errsz);
int  dj_conta_arestas(vertice* g);
int  dj_lista_para_vetor(no* l, int* saida, int max);
void dj_por_peso(vertice* g, int v1, int v2, int peso);
void dj_por_id(vertice* g, int v1, int v2, int id);
void dj_por_cia(vertice* g, int v1, int v2, int cia);
void dj_liga(vertice* g, int v1, int v2);      /* insere aresta sem o aluno */
void dj_libera(vertice* g);

/* --- desenho de diagnostico ------------------------------------------- */
void dj_desenha_lista(const char* titulo, vertice* g);
void dj_desenha_matriz(const char* titulo, int m[V][V]);
void dj_desenha_flags(const char* titulo, vertice* g);
void dj_desenha_vetor(const char* titulo, int* vet, int n);

/* Cria um grafo em lista usando as funcoes DO ALUNO (dependencia real). */
#define GRAFO_NOVO(g)                                                             vertice* g = alocar_l();                                                      CHECA_STUB();                                                                 if (!g) FALHA("alocar_l() devolveu NULL");                                    inicializar_l(g);                                                             CHECA_STUB();

extern char errbuf[1024];

/* --- catalogo de exercicios ------------------------------------------- */
typedef struct Exercicio_s {
    int          nivel;
    int          num;
    const char*  nome;         /* nome da funcao                          */
    const char*  assinatura;
    const char*  enunciado;
    const char*  referencia;   /* onde esta no caderno / lista            */
    void       (*teste)(void);
    const char*  dicas[3];
} Exercicio;

extern Exercicio CATALOGO[];
extern const int N_EXERCICIOS;

typedef struct {
    int         numero;
    const char* titulo;
    const char* subtitulo;
    const char* arquivo;
} Nivel;

int dojo_roda(struct Exercicio_s* e);   /* roda no processo atual */
int dojo_status(int indice);            /* roda isolado num subprocesso  */

extern Nivel NIVEIS[];
extern const int N_NIVEIS;

#endif
