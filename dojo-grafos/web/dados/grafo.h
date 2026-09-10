/* ==========================================================================
 *  grafo.h  --  Tipos e assinaturas do Dojo de Grafos (ACH2024 / Paraboni)
 *
 *  As structs abaixo sao EXATAMENTE as do caderno, ja com todos os campos
 *  extras que o professor vai acrescentando ao longo das aulas.
 *  Cada campo esta marcado com o nivel em que passa a ser usado.
 * ========================================================================== */
#ifndef GRAFO_H
#define GRAFO_H

/* Numero de vertices. Fixo em tempo de compilacao porque o professor
   declara as matrizes como int m[V][V]. */
#define V 8

#define bool int
#define TRUE  1
#define FALSE 0

#define INFINITO 1000000

/* O Dojo troca malloc por dojo_malloc nos seus arquivos (via -Dmalloc) para
   conseguir detectar o classico erro "malloc(sizeof(no*))". Voce escreve
   malloc normalmente; a troca e' invisivel. */
#include <stddef.h>
void* dojo_malloc(size_t n);
extern size_t dojo_ult_malloc;

/* ---- no: representa UMA ARESTA dentro da lista de adjacencia ---------- */
typedef struct s {
    int adj;            /* nivel 2: vertice de destino                     */
    int peso;           /* nivel 6: grafos ponderados                      */
    int id;             /* nivel 7: id da mensagem (ex.10 da lista)        */
    int cia;            /* nivel 7: companhia aerea (ex.26 da lista)       */
    struct s* prox;
} no;

/* ---- vertice: uma posicao do vetor de vertices ------------------------ */
typedef struct {
    no* inicio;         /* nivel 2: cabeca da lista de adjacencia          */
    int flag;           /* nivel 4: 0=branco 1=cinza 2=preto               */
    int tipo;           /* nivel 4: 1=aula 2=auditorio 3=biblioteca ...    */
    int dist;           /* nivel 5: distancia na busca em largura          */
    int cor;            /* nivel 6: coloracao                              */
    int pais;           /* extra:   ex.11 da lista                         */
} vertice;

/* ---- FILA: usada na busca em largura (nivel 5) ------------------------ */
typedef struct {
    no* inicio;
    no* ultimo;
} FILA;

/* ==========================================================================
 *  NIVEL 1 -- MATRIZ DE ADJACENCIA
 *  Obs: o professor chama tudo de "inicializar", "inserir_aresta" etc.
 *  Aqui usamos o sufixo _m (matriz) e _l (lista) apenas porque as duas
 *  versoes convivem no mesmo programa e o linker nao aceita nomes repetidos.
 *  Na prova, escreva sem o sufixo.
 * ========================================================================== */
void inicializar_m(int m[V][V]);
bool aresta_existe_m(int m[V][V], int v1, int v2);
void inserir_aresta_m(int m[V][V], int v1, int v2);
bool excluir_aresta_m(int m[V][V], int v1, int v2);
int  grau_saida_m(int m[V][V], int v1);
int  grau_entrada_m(int m[V][V], int v1);

/* ==========================================================================
 *  NIVEL 2 -- LISTA DE ADJACENCIA
 * ========================================================================== */
vertice* alocar_l(void);
void     inicializar_l(vertice* g);
bool     aresta_existe_l(vertice* g, int v1, int v2);
bool     inserir_aresta_l(vertice* g, int v1, int v2);
bool     excluir_aresta_l(vertice* g, int v1, int v2);
int      grau_saida_l(vertice* g, int v1);
int      grau_entrada_l(vertice* g, int v1);

/* ==========================================================================
 *  NIVEL 3 -- TRANSFORMACOES SOBRE GRAFOS
 * ========================================================================== */
vertice* transposta_l(vertice* g);                    /* caderno P3 / ex.4  */
vertice* matriz_p_lista(int m[V][V]);                 /* caderno    / ex.5  */
bool     subgrafo_lm(vertice* g1, int m2[V][V]);      /* caderno P2 / ex.8  */
int      contar_lacos_l(vertice* g);                  /*            / ex.1  */
void     remover_lacos_l(vertice* g);                 /*            / ex.2  */
void     destruir_arestas_l(vertice* g);              /*            / ex.3  */
vertice* diferenca_l(vertice* g1, vertice* g2);       /*            / ex.9  */
bool     completo_l(vertice* g);                      /*            / ex.19 */
vertice* complemento_l(vertice* g);                   /*            / ex.20 */

/* ==========================================================================
 *  NIVEL 4 -- BUSCA EM PROFUNDIDADE
 * ========================================================================== */
void zerar_flags(vertice* g);
void prof(vertice* g, int i);                              /* caderno 1/3   */
void prof_caminho(vertice* g, int i, int j, bool* achou);  /* cad. / ex.16  */
bool tem_ciclo_dir(vertice* g);                            /* cad. / ex.12  */
void contar_tipo_x(vertice* g, int i, int x, int* cont);   /* caderno       */
int  contar_grupos(vertice* g);                            /*      / ex.14  */
int  maior_grupo_inicio(vertice* g);                       /* cad. / ex.15  */
bool arvore_enraizada(vertice* g);                         /*      / ex.6   */

/* ==========================================================================
 *  NIVEL 5 -- FILA + BUSCA EM LARGURA
 * ========================================================================== */
void inicializar_fila(FILA* f);
void entrar_fila(FILA* f, int valor);
int  sair_fila(FILA* f);

void largura_l(vertice* g, int i);
void largura_m(int m[V][V], int i, int flags[V]);
int  tipo_x_mais_prox(vertice* g, int i, int x);      /* caderno    / ex.27 */
int  comprimento(vertice* g, int v1, int v2);         /* caderno    / ex.17 */
no*  vertices_raio_n(vertice* g, int i, int N);       /* caderno    / ex.24 */
void distancias(vertice* g, int i, int dist[V]);      /*            / ex.23 */

/* ==========================================================================
 *  NIVEL 6 -- PONDERADOS: DIJKSTRA, COLORACAO E CAMINHO
 * ========================================================================== */
void     custo(int m[V][V], int i, int custos[V]);    /* caderno Dijkstra   */
int      achar_cor(vertice* g, int i);                /* caderno coloracao  */
void     colorir(vertice* g, int i, int* k);          /* caderno coloracao  */
vertice* filtrar_custo(vertice* g, int c);            /*            / ex.7  */
no*      caminho_bfs(vertice* g, int a, int b);       /*      / ex.18 e 26  */

/* ==========================================================================
 *  NIVEL 7 -- DESAFIOS DA LISTA
 *  Os exercicios da lista do professor que nao aparecem no caderno.
 * ========================================================================== */
no* suspeitos_spam(vertice* g, int x);                    /*        ex.10   */
int mais_paises(vertice* g);                              /*        ex.11   */
bool tem_ciclo_nao_dir(vertice* g);                       /*        ex.12   */
bool remover_aresta_ciclo(vertice* g);                    /*        ex.13   */
no* maior_grupo_lista(vertice* g);                        /*        ex.15   */
no* vazias_mais_proximas(vertice* g, int i);              /*        ex.22   */
no* relacionados_k(vertice* g, int i, int k);             /*        ex.25   */
no* rota_companhia(vertice* g, int a, int b, int c);      /*        ex.26   */
int tipo_x_evitando(vertice* g, int i, int x, int n);     /*        ex.28   */

#endif
