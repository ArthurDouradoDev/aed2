#include "dojo.h"

void t1_1(void); void t1_2(void); void t1_3(void);
void t1_4(void); void t1_5(void); void t1_6(void);

void t2_1(void); void t2_2(void); void t2_3(void); void t2_4(void);
void t2_5(void); void t2_6(void); void t2_7(void);

void t3_1(void); void t3_2(void); void t3_3(void); void t3_4(void); void t3_5(void);
void t3_6(void); void t3_7(void); void t3_8(void); void t3_9(void);

void t4_1(void); void t4_2(void); void t4_3(void); void t4_4(void);
void t4_5(void); void t4_6(void); void t4_7(void); void t4_8(void);

void t5_1(void); void t5_2(void); void t5_3(void); void t5_4(void);
void t5_5(void); void t5_6(void); void t5_7(void);

void t6_1(void); void t6_2(void); void t6_3(void); void t6_4(void); void t6_5(void);

void t7_1(void); void t7_2(void); void t7_3(void); void t7_4(void); void t7_5(void);
void t7_6(void); void t7_7(void); void t7_8(void); void t7_9(void);

Nivel NIVEIS[] = {
    {1, "Matriz de adjacencia",
        "as seis operacoes basicas, do jeito que o professor escreveu no quadro",
        "src/aluno/n1_matriz.c"},
    {2, "Lista de adjacencia",
        "as mesmas operacoes com ponteiros -- onde mora a maioria dos erros",
        "src/aluno/n2_lista.c"},
    {3, "Transformacoes sobre grafos",
        "transposto, conversao, subgrafo, complemento: exercicios 1 a 9, 19 e 20",
        "src/aluno/n3_transformacoes.c"},
    {4, "Busca em profundidade",
        "flags branco/cinza/preto, ciclos, componentes conexas",
        "src/aluno/n4_profundidade.c"},
    {5, "Fila e busca em largura",
        "caminho mais curto em numero de arestas",
        "src/aluno/n5_largura.c"},
    {6, "Ponderados: Dijkstra e coloracao",
        "custo minimo, coloracao e reconstrucao de caminho",
        "src/aluno/n6_ponderados.c"},
    {7, "Desafios da lista",
        "os exercicios da lista do professor que nao aparecem no caderno",
        "src/aluno/n7_desafios.c"}
};
const int N_NIVEIS = 7;

Exercicio CATALOGO[] = {

/* ---------------------------- NIVEL 1 ---------------------------------- */
{1, 1, "inicializar_m", "void inicializar_m(int m[V][V])",
 "Zera a matriz inteira: nenhuma aresta existe no comeco.",
 "caderno, pag. 3 (Funcao de inicializacao)", t1_1,
 {"Sao dois fors encaixados, i para a linha e j para a coluna.",
  "O for de dentro precisa percorrer TODAS as colunas de cada linha.",
  "void inicializar(int m[v][v]) { int i, j; for (i=0;i<v;i++) { for (j=0;j<v;j++) { m[i][j] = 0; } } }"}},

{1, 2, "aresta_existe_m", "bool aresta_existe_m(int m[V][V], int v1, int v2)",
 "Devolve TRUE se existe a aresta v1 -> v2 e FALSE caso contrario.",
 "caderno, pag. 3 (Funcao para verificar se aresta existe)", t1_2,
 {"A matriz responde isso em uma unica consulta: m[v1][v2].",
  "Repare na ordem: a LINHA e a origem, a COLUNA e o destino. Custo O(1).",
  "if (m[v1][v2] == 1) { return true; } else { return false; }"}},

{1, 3, "inserir_aresta_m", "void inserir_aresta_m(int m[V][V], int v1, int v2)",
 "Marca a aresta v1 -> v2. O grafo aqui e DIRIGIDO.",
 "caderno, pag. 3 (Funcao para inserir aresta)", t1_3,
 {"Uma linha basta.",
  "A linha m[v2][v1] = 1 so entra se o grafo for NAO dirigido. Aqui, nao.",
  "m[v1][v2] = 1;   // se nao dirigido: m[v2][v1] = 1;"}},

{1, 4, "excluir_aresta_m", "bool excluir_aresta_m(int m[V][V], int v1, int v2)",
 "Apaga a aresta v1 -> v2. Devolve FALSE se ela nao existia.",
 "caderno, pag. 3 (Funcao para excluir aresta)", t1_4,
 {"Antes de apagar, verifique se a aresta esta la.",
  "Se m[v1][v2] == 0, saia com return false ANTES de mexer na matriz.",
  "if (m[v1][v2] == 0) { return false; } m[v1][v2] = 0; return true;"}},

{1, 5, "grau_saida_m", "int grau_saida_m(int m[V][V], int v1)",
 "Conta quantas arestas SAEM de v1.",
 "caderno, pag. 3 (Funcao para calcular o grau de saida)", t1_5,
 {"Fixe a linha v1 e ande pelas colunas.",
  "Como a matriz so tem 0 e 1, da para somar os valores em vez de comparar.",
  "int i, gs = 0; for (i=0;i<v;i++) { gs = gs + m[v1][i]; } return gs;"}},

{1, 6, "grau_entrada_m", "int grau_entrada_m(int m[V][V], int v1)",
 "Conta quantas arestas CHEGAM em v1.",
 "caderno, pag. 3 (Funcao para calcular o grau de entrada)", t1_6,
 {"E o espelho do exercicio anterior.",
  "Agora quem fica fixo e a COLUNA v1; quem varia e a linha: m[i][v1].",
  "int i, ge = 0; for (i=0;i<v;i++) { ge = ge + m[i][v1]; } return ge;"}},

/* ---------------------------- NIVEL 2 ---------------------------------- */
{2, 1, "alocar_l", "vertice* alocar_l(void)",
 "Aloca o vetor com os V vertices do grafo e devolve o ponteiro.",
 "caderno, pag. 4 (vertice* g = malloc...)", t2_1,
 {"Sao V structs vertice, uma para cada posicao do vetor.",
  "ARMADILHA: sizeof(vertice*) e o tamanho de um PONTEIRO (so o endereco). Voce\n     quer sizeof(vertice), o tamanho da STRUCT inteira.",
  "vertice* g = (vertice*) malloc(V * sizeof(vertice)); return g;"}},

{2, 2, "inicializar_l", "void inicializar_l(vertice* g)",
 "Deixa a lista de todo vertice vazia (inicio = NULL). Zere tambem flag,\n"
 "  tipo, dist, cor e pais: os niveis seguintes contam com isso.",
 "caderno, pag. 4 (Funcao para inicializacao)", t2_2,
 {"Um for de 0 ate V-1.",
  "Lista vazia quer dizer que a cabeca aponta para lugar nenhum.",
  "int i; for (i=0;i<V;i++) { g[i].inicio = NULL; g[i].flag = 0; g[i].tipo = 0;\n     g[i].dist = 0; g[i].cor = 0; g[i].pais = 0; }"}},

{2, 3, "aresta_existe_l", "bool aresta_existe_l(vertice* g, int v1, int v2)",
 "Percorre a lista de v1 procurando um no com adj == v2.",
 "caderno, pag. 4 (Funcao para verificar se aresta existe)", t2_3,
 {"Comece com no* p = g[v1].inicio e va andando com p = p->prox.",
  "Se a lista acabar (p == NULL) sem achar, a resposta e false. Custo O(|V|).",
  "no* p = g[v1].inicio; while (p) { if (p->adj == v2) { return true; }\n     p = p->prox; } return false;"}},

{2, 4, "inserir_aresta_l", "bool inserir_aresta_l(vertice* g, int v1, int v2)",
 "Insere v1 -> v2 na CABECA da lista. Devolve FALSE se ja existia.\n"
 "  Inicialize tambem peso = 1 e id = 0 no no novo.",
 "caderno, pag. 4 (Funcao para inserir aresta)", t2_4,
 {"Reaproveite aresta_existe_l para nao duplicar aresta.",
  "Inserir na cabeca sao dois passos: o novo aponta para o antigo inicio,\n     depois o inicio passa a ser o novo. ARMADILHA: malloc(sizeof(no)).",
  "if (aresta_existe_l(g,v1,v2)) { return false; }\n     no* novo = (no*) malloc(sizeof(no));\n     novo->adj = v2; novo->peso = 1; novo->id = 0;\n     novo->prox = g[v1].inicio; g[v1].inicio = novo; return true;"}},

{2, 5, "excluir_aresta_l", "bool excluir_aresta_l(vertice* g, int v1, int v2)",
 "Remove o no de v2 da lista de v1 e da free nele. FALSE se nao existia.",
 "caderno, pag. 5 (Funcao para excluir aresta)", t2_5,
 {"Voce precisa de DOIS ponteiros: p, que procura, e ant, o anterior a p.",
  "ARMADILHA: se o no procurado for o PRIMEIRO, ant continua NULL. Nesse\n     caso quem muda e g[v1].inicio, nao ant->prox.",
  "no* ant = NULL; no* p = g[v1].inicio;\n     while (p) { if (p->adj == v2) break; ant = p; p = p->prox; }\n     if (!p) return false;\n     if (ant) { ant->prox = p->prox; } else { g[v1].inicio = p->prox; }\n     free(p); return true;"}},

{2, 6, "grau_saida_l", "int grau_saida_l(vertice* g, int v1)",
 "Conta quantos nos tem a lista de v1.",
 "caderno, pag. 3 (versao em lista do grau de saida)", t2_6,
 {"O tamanho da lista de v1 ja e a resposta.",
  "Ande com p = p->prox somando 1 a cada no.",
  "int gs = 0; no* p = g[v1].inicio; while (p) { gs++; p = p->prox; } return gs;"}},

{2, 7, "grau_entrada_l", "int grau_entrada_l(vertice* g, int v1)",
 "Conta quantas arestas chegam em v1.",
 "caderno, pag. 3 (versao em lista do grau de entrada)", t2_7,
 {"Em lista nao existe coluna: e preciso olhar a lista de TODOS os vertices.",
  "Dois lacos: um for por todos os i, e dentro dele um while na lista de i\n     contando quantas vezes aparece adj == v1. Custo O(|V| + |A|).",
  "int i, ge = 0; for (i=0;i<V;i++) { no* p = g[i].inicio;\n     while (p) { if (p->adj == v1) ge++; p = p->prox; } } return ge;"}},

/* ---------------------------- NIVEL 3 ---------------------------------- */
{3, 1, "transposta_l", "vertice* transposta_l(vertice* g)",
 "Devolve um grafo NOVO com todas as arestas invertidas. g fica intacto.",
 "caderno, pag. 6 (Problema 3) / lista ex. 4", t3_1,
 {"Crie e inicialize gt, depois percorra g inteiro.",
  "Para cada aresta i -> p->adj que voce encontrar em g, insira p->adj -> i\n     em gt. Repare que os papeis se invertem.",
  "vertice* gt = alocar_l(); inicializar_l(gt); int i;\n     for (i=0;i<V;i++) { no* p = g[i].inicio;\n       while (p) { inserir_aresta_l(gt, p->adj, i); p = p->prox; } }\n     return gt;"}},

{3, 2, "matriz_p_lista", "vertice* matriz_p_lista(int m[V][V])",
 "Converte um grafo em matriz para lista de adjacencia.",
 "caderno, pag. 8 / lista ex. 5", t3_2,
 {"Varra a matriz com dois fors procurando os 1.",
  "Cada m[i][j] == 1 vira uma aresta i -> j na lista.",
  "vertice* g = alocar_l(); inicializar_l(g); int i, j;\n     for (i=0;i<V;i++) for (j=0;j<V;j++)\n       if (m[i][j] == 1) inserir_aresta_l(g, i, j);\n     return g;"}},

{3, 3, "subgrafo_lm", "bool subgrafo_lm(vertice* g1, int m2[V][V])",
 "TRUE se toda aresta de g1 (lista) tambem existe em m2 (matriz).",
 "caderno, pag. 5-6 (Problema 2) / lista ex. 8", t3_3,
 {"Percorra todas as arestas de g1 e pergunte se cada uma existe em m2.",
  "Basta UMA aresta faltando para a resposta ser false; so devolva true\n     depois de olhar todas. Aqui aresta_existe_m ganha o dia.",
  "int i; for (i=0;i<V;i++) { no* p = g1[i].inicio;\n       while (p) { if (!aresta_existe_m(m2, i, p->adj)) return false;\n                   p = p->prox; } }\n     return true;"}},

{3, 4, "contar_lacos_l", "int contar_lacos_l(vertice* g)",
 "Conta quantos lacos (arestas i -> i) existem no grafo.",
 "lista ex. 1", t3_4,
 {"Laco e a aresta que sai de um vertice e volta nele mesmo.",
  "Para cada i, basta perguntar se existe a aresta i -> i.",
  "int i, cont = 0;\n     for (i=0;i<V;i++) if (aresta_existe_l(g, i, i)) cont++;\n     return cont;"}},

{3, 5, "remover_lacos_l", "void remover_lacos_l(vertice* g)",
 "Remove todos os lacos, sem tocar nas outras arestas.",
 "lista ex. 2", t3_5,
 {"Mesma varredura do exercicio anterior, trocando contar por excluir.",
  "excluir_aresta_l(g, i, i) ja cuida do free e do religamento da lista.",
  "int i;\n     for (i=0;i<V;i++) if (aresta_existe_l(g,i,i)) excluir_aresta_l(g,i,i);"}},

{3, 6, "destruir_arestas_l", "void destruir_arestas_l(vertice* g)",
 "Libera TODOS os nos e deixa o grafo vazio (inicio = NULL em todo vertice).",
 "lista ex. 3", t3_6,
 {"Percorra cada lista dando free em todos os nos.",
  "ARMADILHA: depois do free(p) o campo p->prox nao vale mais nada. Guarde\n     o proximo numa variavel ANTES de liberar.",
  "int i;\n     for (i=0;i<V;i++) { no* p = g[i].inicio;\n       while (p) { no* t = p->prox; free(p); p = t; }\n       g[i].inicio = NULL; }"}},

{3, 7, "diferenca_l", "vertice* diferenca_l(vertice* g1, vertice* g2)",
 "Devolve um grafo novo com as arestas que estao em g1 mas nao em g2.",
 "lista ex. 9", t3_7,
 {"Percorra as arestas de g1 e teste cada uma contra g2.",
  "So entra em g3 a aresta que existe em g1 e NAO existe em g2.",
  "vertice* g3 = alocar_l(); inicializar_l(g3); int i;\n     for (i=0;i<V;i++) { no* p = g1[i].inicio;\n       while (p) { if (!aresta_existe_l(g2, i, p->adj))\n                     inserir_aresta_l(g3, i, p->adj);\n                   p = p->prox; } }\n     return g3;"}},

{3, 8, "completo_l", "bool completo_l(vertice* g)",
 "TRUE se existe aresta entre todo par de vertices distintos.",
 "lista ex. 19", t3_8,
 {"Sao todos os pares (i, j) com i diferente de j.",
  "Uma unica aresta faltando ja derruba tudo: return false na hora.",
  "int i, j;\n     for (i=0;i<V;i++) for (j=0;j<V;j++)\n       if (i != j && !aresta_existe_l(g,i,j)) return false;\n     return true;"}},

{3, 9, "complemento_l", "vertice* complemento_l(vertice* g)",
 "Devolve o grafo complementar: tem exatamente as arestas que faltam em g.\n"
 "  Lacos nao entram (nao sao par de vertices distintos).",
 "lista ex. 20", t3_9,
 {"E o exercicio anterior de cabeca para baixo.",
  "Para cada par i != j, insira em gc justamente quando a aresta NAO existe\n     em g. O g original nao pode ser alterado.",
  "vertice* gc = alocar_l(); inicializar_l(gc); int i, j;\n     for (i=0;i<V;i++) for (j=0;j<V;j++)\n       if (i != j && !aresta_existe_l(g,i,j)) inserir_aresta_l(gc,i,j);\n     return gc;"}},

/* ---------------------------- NIVEL 4 ---------------------------------- */
{4, 1, "zerar_flags", "void zerar_flags(vertice* g)",
 "Deixa todo vertice BRANCO (flag = 0) antes de comecar uma busca.",
 "caderno, pag. 6 (antes de chamar, zerar flags)", t4_1,
 {"Um for simples mexendo em um campo so.",
  "ARMADILHA SERIA: o campo e flag, nao inicio. Zerar inicio apagaria o\n     grafo inteiro e a busca sairia vazia.",
  "int i; for (i=0;i<V;i++) { g[i].flag = 0; }"}},

{4, 2, "prof", "void prof(vertice* g, int i)",
 "Busca em profundidade a partir de i. Quem chama zera as flags antes.\n"
 "  Convencao: 0 = branco (nao descoberto), 1 = cinza (descoberto),\n"
 "  2 = preto (concluido).",
 "caderno, pag. 6 (parte 1/3)", t4_2,
 {"A estrutura e: pinta de cinza, visita os vizinhos brancos, pinta de preto.",
  "So desca no vizinho que ainda estiver BRANCO -- e isso que impede a\n     recursao infinita quando o grafo tem ciclo.",
  "g[i].flag = 1;\n     no* p = g[i].inicio;\n     while (p) { if (g[p->adj].flag == 0) prof(g, p->adj); p = p->prox; }\n     g[i].flag = 2;"}},

{4, 3, "prof_caminho", "void prof_caminho(vertice* g, int i, int j, bool* achou)",
 "Marca *achou = TRUE se existe caminho de i ate j. Quem chama zera as\n"
 "  flags e poe *achou = FALSE antes.",
 "caderno, pag. 7 (verificar caminho de i ate j) / lista ex. 16", t4_3,
 {"E a busca em profundidade com uma parada antecipada.",
  "Se i == j, marque *achou e volte na hora. Depois de cada chamada\n     recursiva, teste if (*achou) return; para nao continuar procurando.",
  "if (i == j) { *achou = true; return; }\n     g[i].flag = 1;\n     no* p = g[i].inicio;\n     while (p) { if (g[p->adj].flag == 0) {\n                   prof_caminho(g, p->adj, j, achou);\n                   if (*achou) return; }\n                 p = p->prox; }\n     g[i].flag = 2;"}},

{4, 4, "tem_ciclo_dir", "bool tem_ciclo_dir(vertice* g)",
 "TRUE se o grafo dirigido tem algum ciclo. Zere as flags voce mesmo e\n"
 "  cubra o grafo inteiro (o ciclo pode estar num pedaco separado).\n"
 "  Escreva uma funcao auxiliar recursiva no mesmo arquivo.",
 "caderno, pag. 7 (para detectar ciclos) / lista ex. 12", t4_4,
 {"O que denuncia um ciclo e chegar num vertice que ainda esta CINZA:\n     ele e um ancestral vivo na pilha da recursao.",
  "ARMADILHA: vizinho PRETO nao e ciclo, e so um vertice ja terminado que\n     foi alcancado por outro caminho (pense no diamante 0->1, 0->2,\n     1->3, 2->3).",
  "static bool aux(vertice* g, int i) {\n       g[i].flag = 1;\n       no* p = g[i].inicio;\n       while (p) { if (g[p->adj].flag == 1) return true;\n                   if (g[p->adj].flag == 0 && aux(g, p->adj)) return true;\n                   p = p->prox; }\n       g[i].flag = 2; return false; }\n     // no tem_ciclo_dir: zerar_flags e um for chamando aux nos brancos"}},

{4, 5, "contar_tipo_x", "void contar_tipo_x(vertice* g, int i, int x, int* cont)",
 "Conta quantos vertices de tipo x da para alcancar a partir de i,\n"
 "  contando o proprio i se ele for do tipo x. Quem chama zera flags e cont.",
 "caderno, pag. 8 (contar salas do tipo x)", t4_5,
 {"E a busca em profundidade com um contador passado por ponteiro.",
  "Faca o teste do tipo logo depois de pintar i de cinza, antes de descer.",
  "g[i].flag = 1;\n     if (g[i].tipo == x) { *cont = *cont + 1; }\n     no* p = g[i].inicio;\n     while (p) { if (g[p->adj].flag == 0) contar_tipo_x(g, p->adj, x, cont);\n                 p = p->prox; }\n     g[i].flag = 2;"}},

{4, 6, "contar_grupos", "int contar_grupos(vertice* g)",
 "Conta os grupos de vertices mutuamente alcancaveis (componentes) de um\n"
 "  grafo nao-dirigido.",
 "lista ex. 14", t4_6,
 {"Zere as flags uma unica vez, no comeco. Depois varra todos os vertices.",
  "Cada vertice que voce encontrar ainda BRANCO comeca um grupo novo:\n     some 1 e dispare prof a partir dele para pintar o grupo inteiro.",
  "int i, cont = 0; zerar_flags(g);\n     for (i=0;i<V;i++) if (g[i].flag == 0) { cont++; prof(g, i); }\n     return cont;"}},

{4, 7, "maior_grupo_inicio", "int maior_grupo_inicio(vertice* g)",
 "Devolve um vertice qualquer do MAIOR grupo conectado. -1 se nao houver.\n"
 "  Escreva uma auxiliar recursiva que conta os vertices alcancaveis.",
 "caderno, pag. 8 (Ex 1) / lista ex. 15", t4_7,
 {"E o exercicio anterior guardando, alem da contagem, quem foi o maior.",
  "A auxiliar e igual ao prof, so que somando 1 no contador a cada vertice\n     visitado. Compare cont com maior_quant a cada grupo terminado.",
  "int maior_i = -1, maior_quant = 0, i; zerar_flags(g);\n     for (i=0;i<V;i++) { int cont = 0;\n       if (g[i].flag == 0) { conta_alcancaveis(g, i, &cont);\n         if (cont > maior_quant) { maior_quant = cont; maior_i = i; } } }\n     return maior_i;"}},

{4, 8, "arvore_enraizada", "bool arvore_enraizada(vertice* g)",
 "TRUE se g e aciclico, conexo, dirigido e tem UM UNICO vertice fonte\n"
 "  (grau de entrada zero). Implemente exatamente essa definicao.",
 "lista ex. 6", t4_8,
 {"Sao tres perguntas independentes. Responda uma de cada vez e ja devolva\n     false na primeira que falhar.",
  "1) conte os vertices com grau_entrada_l == 0: tem que dar exatamente 1;\n     2) tem_ciclo_dir tem que dar false;\n     3) uma prof saindo da raiz tem que deixar os V vertices nao-brancos.",
  "int i, fontes = 0, raiz = -1, vis = 0;\n     for (i=0;i<V;i++) if (grau_entrada_l(g,i)==0) { fontes++; raiz = i; }\n     if (fontes != 1) return false;\n     if (tem_ciclo_dir(g)) return false;\n     zerar_flags(g); prof(g, raiz);\n     for (i=0;i<V;i++) if (g[i].flag != 0) vis++;\n     return vis == V;"}},

/* ---------------------------- NIVEL 5 ---------------------------------- */
{5, 1, "fila (3 funcoes)",
 "void inicializar_fila(FILA*) / void entrar_fila(FILA*, int) / int sair_fila(FILA*)",
 "A fila da busca em largura. Entra no fim, sai do comeco (FIFO).\n"
 "  sair_fila devolve -1 se a fila estiver vazia. Implemente as TRES.",
 "caderno, pag. 10 (1. criar uma fila F)", t5_1,
 {"A FILA tem dois ponteiros: inicio (por onde sai) e ultimo (por onde entra).",
  "ARMADILHA 1: se a fila esta vazia, f->ultimo e NULL e f->ultimo->prox\n     estoura. Nesse caso o novo no vira o inicio E o ultimo.\n     ARMADILHA 2: nunca teste if (!valor) -- o vertice 0 e valido.\n     ARMADILHA 3: quando o ultimo elemento sai, zere f->ultimo tambem.",
  "void inicializar_fila(FILA* f) { f->inicio = NULL; f->ultimo = NULL; }\n\n     void entrar_fila(FILA* f, int valor) {\n       no* novo = (no*) malloc(sizeof(no));\n       novo->adj = valor; novo->peso = 0; novo->id = 0; novo->prox = NULL;\n       if (f->ultimo == NULL) { f->inicio = novo; }\n       else { f->ultimo->prox = novo; }\n       f->ultimo = novo; }\n\n     int sair_fila(FILA* f) {\n       if (f->inicio == NULL) return -1;\n       no* p = f->inicio; int valor = p->adj;\n       f->inicio = p->prox;\n       if (f->inicio == NULL) f->ultimo = NULL;\n       free(p); return valor; }"}},

{5, 2, "largura_l", "void largura_l(vertice* g, int i)",
 "Busca em largura a partir de i, em lista. A propria funcao zera as flags.\n"
 "  Ao ENFILEIRAR um vizinho ele fica cinza; ao SAIR da fila, preto.",
 "caderno, pag. 10 (Busca em Largura)", t5_2,
 {"Roteiro do caderno: zerar flags, criar e inicializar a fila, botar i\n     nela, marcar g[i].flag = 1, e rodar enquanto a fila tiver alguem.",
  "ARMADILHA: ao descobrir um vizinho, quem fica cinza e g[p->adj].flag,\n     nao g[i].flag. Marcar cinza NA HORA de enfileirar e o que impede o\n     mesmo vertice de entrar duas vezes.",
  "FILA F; zerar_flags(g); inicializar_fila(&F);\n     entrar_fila(&F, i); g[i].flag = 1;\n     while (F.inicio) {\n       i = sair_fila(&F);\n       no* p = g[i].inicio;\n       while (p) { if (g[p->adj].flag == 0) { g[p->adj].flag = 1;\n                                              entrar_fila(&F, p->adj); }\n                   p = p->prox; }\n       g[i].flag = 2; }"}},

{5, 3, "largura_m", "void largura_m(int m[V][V], int i, int flags[V])",
 "A mesma busca em largura, mas em matriz. As marcas vao no vetor flags,\n"
 "  que a propria funcao zera antes de comecar.",
 "caderno, pag. 11 (em matriz)", t5_3,
 {"Estrutura identica a da lista, so muda como se acham os vizinhos.",
  "Sem lista para percorrer: um for de j = 0 a V-1 testando\n     m[i][j] == 1 && flags[j] == 0.",
  "int k; for (k=0;k<V;k++) flags[k] = 0;\n     FILA F; inicializar_fila(&F); entrar_fila(&F, i); flags[i] = 1;\n     while (F.inicio) { int j; i = sair_fila(&F);\n       for (j=0;j<V;j++) if (m[i][j]==1 && flags[j]==0) {\n         flags[j] = 1; entrar_fila(&F, j); }\n       flags[i] = 2; }"}},

{5, 4, "tipo_x_mais_prox", "int tipo_x_mais_prox(vertice* g, int i, int x)",
 "Devolve o vertice de tipo x MAIS PROXIMO de i (menos arestas), ou -1.\n"
 "  Se o proprio i for do tipo x, a resposta e i.",
 "caderno, pag. 11 (Ex 1) / lista ex. 21 e 27", t5_4,
 {"Tem que ser busca em LARGURA: ela visita os vertices em ordem de\n     distancia, entao o primeiro que aparecer ja e o mais proximo.",
  "Faca o teste do tipo logo depois de tirar o vertice da fila. Se bater,\n     esvazie a fila e devolva i na hora. Se a fila secar, devolva -1.",
  "zerar_flags(g); FILA F; inicializar_fila(&F);\n     entrar_fila(&F, i); g[i].flag = 1;\n     while (F.inicio) { i = sair_fila(&F);\n       if (g[i].tipo == x) { while (F.inicio) sair_fila(&F); return i; }\n       no* p = g[i].inicio;\n       while (p) { if (g[p->adj].flag == 0) { g[p->adj].flag = 1;\n                                              entrar_fila(&F, p->adj); }\n                   p = p->prox; }\n       g[i].flag = 2; }\n     return -1;"}},

{5, 5, "comprimento", "int comprimento(vertice* g, int v1, int v2)",
 "Numero de arestas do menor caminho de v1 ate v2. INFINITO se nao houver.\n"
 "  De v1 ate v1 o comprimento e 0.",
 "caderno, pag. 12 (Ex 2)", t5_5,
 {"Use o campo dist do vertice. dist[v1] = 0 e o resto comeca em INFINITO.",
  "Ao descobrir um vizinho, g[p->adj].dist = g[i].dist + 1. Quando v2 sair\n     da fila, a distancia dele ja e definitiva: devolva.",
  "int k; zerar_flags(g);\n     for (k=0;k<V;k++) g[k].dist = INFINITO;\n     g[v1].dist = 0;\n     FILA F; inicializar_fila(&F); entrar_fila(&F, v1); g[v1].flag = 1;\n     while (F.inicio) { int i = sair_fila(&F);\n       if (i == v2) { int d = g[i].dist;\n                      while (F.inicio) sair_fila(&F); return d; }\n       no* p = g[i].inicio;\n       while (p) { if (g[p->adj].flag == 0) {\n           g[p->adj].flag = 1; g[p->adj].dist = g[i].dist + 1;\n           entrar_fila(&F, p->adj); }\n         p = p->prox; }\n       g[i].flag = 2; }\n     return INFINITO;"}},

{5, 6, "vertices_raio_n", "no* vertices_raio_n(vertice* g, int i, int N)",
 "Lista ligada com todos os vertices a no maximo N arestas de i, incluindo\n"
 "  o proprio i. A ordem da lista nao importa.",
 "caderno, pag. 12 (Ex 2) / lista ex. 24", t5_6,
 {"Busca em largura calculando dist, montando a lista resposta pelo caminho.",
  "ARMADILHA: nao pare a busca ao ver o primeiro vizinho longe demais --\n     isso deixaria de fora os irmaos dele no mesmo nivel. So NAO ENFILEIRE\n     quem passaria de N.",
  "no* resp = NULL; int k; zerar_flags(g);\n     for (k=0;k<V;k++) g[k].dist = 0;\n     FILA F; inicializar_fila(&F); entrar_fila(&F, i); g[i].flag = 1;\n     while (F.inicio) { i = sair_fila(&F);\n       no* p = g[i].inicio;\n       while (p) { if (g[p->adj].flag == 0 && g[i].dist + 1 <= N) {\n           g[p->adj].dist = g[i].dist + 1; g[p->adj].flag = 1;\n           entrar_fila(&F, p->adj); }\n         p = p->prox; }\n       g[i].flag = 2;\n       no* novo = (no*) malloc(sizeof(no));\n       novo->adj = i; novo->prox = resp; resp = novo; }\n     return resp;"}},

{5, 7, "distancias", "void distancias(vertice* g, int i, int dist[V])",
 "Preenche dist[] com a distancia (em arestas) de i ate cada vertice.\n"
 "  Quem nao for alcancavel fica com INFINITO.",
 "lista ex. 23", t5_7,
 {"E a busca em largura sem parada antecipada: rode ate a fila secar.",
  "Comece com dist[k] = INFINITO para todo k e dist[i] = 0. Ao descobrir\n     um vizinho, dist[p->adj] = dist[i] + 1.",
  "int k; zerar_flags(g);\n     for (k=0;k<V;k++) dist[k] = INFINITO;\n     dist[i] = 0;\n     FILA F; inicializar_fila(&F); entrar_fila(&F, i); g[i].flag = 1;\n     while (F.inicio) { i = sair_fila(&F);\n       no* p = g[i].inicio;\n       while (p) { if (g[p->adj].flag == 0) { g[p->adj].flag = 1;\n           dist[p->adj] = dist[i] + 1; entrar_fila(&F, p->adj); }\n         p = p->prox; }\n       g[i].flag = 2; }"}},

/* ---------------------------- NIVEL 6 ---------------------------------- */
{6, 1, "custo", "void custo(int m[V][V], int i, int custos[V])",
 "Dijkstra em matriz de PESOS: m[i][j] == 0 quer dizer que nao ha aresta.\n"
 "  Preenche custos[] com o custo minimo de i ate cada vertice (INFINITO\n"
 "  para os inalcancaveis).",
 "caderno, pag. 13 (Algoritmo de Dijkstra)", t6_1,
 {"Comece com custos[i] = 0 e todo o resto INFINITO, com um vetor flags\n     marcando quem ja foi fechado.",
  "Repita V vezes: escolha o vertice NAO fechado de menor custo, feche ele,\n     e para cada vizinho tente melhorar\n     custos[viz] = custos[atual] + m[atual][viz].",
  "int flags[V], k, c, atual, menor;\n     for (k=0;k<V;k++) { custos[k] = INFINITO; flags[k] = 0; }\n     custos[i] = 0;\n     for (k=0;k<V;k++) {\n       atual = -1; menor = INFINITO;\n       for (c=0;c<V;c++) if (!flags[c] && custos[c] < menor)\n                           { menor = custos[c]; atual = c; }\n       if (atual == -1) return;\n       flags[atual] = 1;\n       for (c=0;c<V;c++)\n         if (m[atual][c] > 0 && !flags[c] &&\n             custos[atual] + m[atual][c] < custos[c])\n           custos[c] = custos[atual] + m[atual][c]; }"}},

{6, 2, "achar_cor", "int achar_cor(vertice* g, int i)",
 "Devolve a MENOR cor (a partir de 1) que nenhum vizinho de i esta usando.\n"
 "  Cor 0 significa 'ainda sem cor' e nao bloqueia nada.",
 "caderno, pag. 14 (Coloracao)", t6_2,
 {"Use um vetorzinho tem_cor[] marcando as cores ocupadas pelos vizinhos.",
  "Duas passadas: a primeira marca tem_cor[g[p->adj].cor] = true para cada\n     vizinho ja colorido; a segunda devolve o primeiro j livre a partir de 1.",
  "bool tem_cor[V+2]; int j; no* p;\n     for (j=1;j<=V+1;j++) tem_cor[j] = false;\n     p = g[i].inicio;\n     while (p) { if (g[p->adj].cor > 0) tem_cor[g[p->adj].cor] = true;\n                 p = p->prox; }\n     for (j=1;j<=V+1;j++) if (!tem_cor[j]) return j;\n     return -1;"}},

{6, 3, "colorir", "void colorir(vertice* g, int i, int* k)",
 "Colore o grafo em profundidade a partir de i, sem deixar dois vizinhos\n"
 "  com a mesma cor. *k guarda a maior cor usada. Quem chama zera as cores.",
 "caderno, pag. 14 (Metodo 1)", t6_3,
 {"E a busca em profundidade usando o campo cor no lugar da flag: cor == 0\n     faz o papel de 'branco'.",
  "Pinte i com achar_cor(g, i), atualize *k se essa cor for maior, e so\n     entao desca nos vizinhos que ainda estiverem com cor == 0.",
  "g[i].cor = achar_cor(g, i);\n     if (g[i].cor > *k) { *k = g[i].cor; }\n     no* p = g[i].inicio;\n     while (p) { if (g[p->adj].cor == 0) colorir(g, p->adj, k);\n                 p = p->prox; }"}},

{6, 4, "filtrar_custo", "vertice* filtrar_custo(vertice* g, int c)",
 "Copia de g contendo apenas as arestas de custo MAIOR que c (peso == c\n"
 "  fica de fora). Copie tambem o peso para o no novo.",
 "lista ex. 7", t6_4,
 {"E a copia do grafo com um if a mais na hora de inserir.",
  "Depois de inserir_aresta_l, o no novo esta na CABECA da lista, entao\n     resp[i].inicio->peso = p->peso copia o peso.",
  "vertice* resp = alocar_l(); inicializar_l(resp); int i;\n     for (i=0;i<V;i++) { no* p = g[i].inicio;\n       while (p) { if (p->peso > c) { inserir_aresta_l(resp, i, p->adj);\n                                      resp[i].inicio->peso = p->peso; }\n                   p = p->prox; } }\n     return resp;"}},

{6, 5, "caminho_bfs", "no* caminho_bfs(vertice* g, int a, int b)",
 "Lista ligada com o menor caminho de a ate b, do a ate o b nessa ordem.\n"
 "  NULL se nao existir caminho. De a ate a, a lista tem so o a.",
 "lista ex. 18 e 26", t6_5,
 {"Busca em largura guardando, para cada vertice descoberto, QUEM o\n     descobriu: um vetor pai[] comecando todo em -1.",
  "No fim, saia de b subindo por pai[] ate chegar em -1. Inserindo cada\n     vertice na CABECA da lista, ela ja sai na ordem certa (a ... b).",
  "int pai[V], k, i; no* resp = NULL; zerar_flags(g);\n     for (k=0;k<V;k++) pai[k] = -1;\n     FILA F; inicializar_fila(&F); entrar_fila(&F, a); g[a].flag = 1;\n     while (F.inicio) { i = sair_fila(&F);\n       if (i == b) break;\n       no* p = g[i].inicio;\n       while (p) { if (g[p->adj].flag == 0) { g[p->adj].flag = 1;\n           pai[p->adj] = i; entrar_fila(&F, p->adj); }\n         p = p->prox; }\n       g[i].flag = 2; }\n     while (F.inicio) sair_fila(&F);\n     if (a != b && pai[b] == -1) return NULL;\n     k = b;\n     while (k != -1) { no* novo = (no*) malloc(sizeof(no));\n       novo->adj = k; novo->prox = resp; resp = novo; k = pai[k]; }\n     return resp;"}},

/* ---------------------------- NIVEL 7 ---------------------------------- */
{7, 1, "suspeitos_spam", "no* suspeitos_spam(vertice* g, int x)",
 "Rede de emails dirigida. A aresta u -> v com id == x quer dizer que u\n"
 "  mandou a mensagem x para v. Devolve a lista dos usuarios que MANDARAM\n"
 "  x mas NUNCA receberam x (os suspeitos de ter comecado a propagacao).",
 "lista ex. 10", t7_1,
 {"Para cada usuario i sao duas perguntas: ele mandou x? ele recebeu x?",
  "Mandou: alguma aresta da lista de i tem id == x.\n     Recebeu: alguma aresta de QUALQUER outro vertice chega em i com\n     id == x -- isso exige varrer o grafo todo, igual ao grau de entrada.",
  "for (i=0;i<V;i++) { int enviou=0, recebeu=0, j; no* p;\n       for (p=g[i].inicio;p;p=p->prox) if (p->id==x) enviou=1;\n       for (j=0;j<V;j++) for (p=g[j].inicio;p;p=p->prox)\n         if (p->adj==i && p->id==x) recebeu=1;\n       if (enviou && !recebeu) { /* empilha i na resposta */ } }"}},

{7, 2, "mais_paises", "int mais_paises(vertice* g)",
 "Cada vertice tem um campo pais. Devolve a unidade que liga para o maior\n"
 "  numero de paises DIFERENTES. Havendo empate, qualquer uma serve.",
 "lista ex. 11", t7_2,
 {"Nao e problema de busca: basta olhar a lista de cada vertice.",
  "O cuidado e nao contar o mesmo pais duas vezes. Guarde os paises ja\n     vistos num vetorzinho e so conte o que ainda nao estiver la.",
  "for (i=0;i<V;i++) { int vistos[V], nv=0, qtd=0, k; no* p;\n       for (p=g[i].inicio;p;p=p->prox) {\n         int pais = g[p->adj].pais, achou = 0;\n         for (k=0;k<nv;k++) if (vistos[k]==pais) achou=1;\n         if (!achou) { vistos[nv++]=pais; qtd++; } }\n       if (qtd > maior) { maior = qtd; melhor = i; } }\n     return melhor;"}},

{7, 3, "tem_ciclo_nao_dir", "bool tem_ciclo_nao_dir(vertice* g)",
 "TRUE se o grafo NAO-dirigido tem algum ciclo. Cubra o grafo inteiro.\n"
 "  Escreva uma auxiliar recursiva que receba tambem o vertice pai.",
 "lista ex. 12", t7_3,
 {"Num grafo nao-dirigido toda aresta aparece nos dois sentidos, entao ao\n     visitar 1 voce enxerga o 0 outra vez. Isso nao pode contar como ciclo.",
  "A auxiliar recebe de onde veio: aux(g, i, pai). Vizinho ja visitado so\n     denuncia ciclo se for DIFERENTE do pai. Laco (p->adj == i) tambem conta.",
  "static bool aux(vertice* g, int i, int pai) {\n       g[i].flag = 1;\n       for (no* p = g[i].inicio; p; p = p->prox) {\n         if (p->adj == i) return true;\n         if (g[p->adj].flag == 0) { if (aux(g, p->adj, i)) return true; }\n         else if (p->adj != pai) return true; }\n       g[i].flag = 2; return false; }\n     // no principal: zerar_flags e um for chamando aux(g, i, -1)"}},

{7, 4, "remover_aresta_ciclo", "bool remover_aresta_ciclo(vertice* g)",
 "Acha UMA aresta de volta (a que fecha um ciclo) num grafo dirigido,\n"
 "  remove ela e devolve TRUE. FALSE se nao havia ciclo nenhum.",
 "lista ex. 13", t7_4,
 {"E a deteccao de ciclo do nivel 4, so que guardando qual foi a aresta.",
  "Quando a busca acha um vizinho CINZA, a aresta i -> p->adj e a de volta.\n     Guarde os dois vertices em variaveis e chame excluir_aresta_l DEPOIS\n     que a recursao terminar: mexer na lista no meio do while quebra o p.",
  "static int u = -1, v = -1;   // guardam a aresta encontrada\n     // na auxiliar:\n     //   if (g[p->adj].flag == 1) { u = i; v = p->adj; return true; }\n     // no principal, depois de achar:\n     //   excluir_aresta_l(g, u, v); return true;"}},

{7, 5, "maior_grupo_lista", "no* maior_grupo_lista(vertice* g)",
 "Devolve uma lista ligada com TODOS os vertices do maior grupo conectado.\n"
 "  A ordem da lista nao importa. Havendo empate, qualquer grupo serve.",
 "lista ex. 15", t7_5,
 {"E o maior_grupo_inicio do nivel 4, so que juntando os vertices numa\n     lista em vez de apenas conta-los.",
  "A auxiliar recebe um no** para ir empilhando cada vertice visitado, e um\n     contador para saber o tamanho. Guarde a maior lista vista ate agora.",
  "static void junta(vertice* g, int i, no** lista, int* cont) {\n       g[i].flag = 1;\n       no* novo = (no*) malloc(sizeof(no));\n       novo->adj = i; novo->prox = *lista; *lista = novo;\n       *cont = *cont + 1;\n       for (no* p = g[i].inicio; p; p = p->prox)\n         if (g[p->adj].flag == 0) junta(g, p->adj, lista, cont);\n       g[i].flag = 2; }"}},

{7, 6, "vazias_mais_proximas", "no* vazias_mais_proximas(vertice* g, int i)",
 "O campo tipo guarda a OCUPACAO da sala; tipo == 0 quer dizer sala vazia.\n"
 "  Devolve a lista de TODAS as salas vazias que empatam em menor distancia\n"
 "  a partir de i. Se a propria sala i estiver vazia, a resposta e so ela.",
 "lista ex. 22", t7_6,
 {"Busca em largura guardando a distancia de cada sala.",
  "Nao pare na primeira sala vazia: guarde a distancia dela e continue\n     coletando enquanto os vertices que saem da fila tiverem essa mesma\n     distancia. Quando sair um mais distante, pode parar.",
  "int achado = -1;\n     // dentro do while, logo depois de tirar u da fila:\n     if (achado >= 0 && g[u].dist > achado) break;\n     if (g[u].tipo == 0) { achado = g[u].dist; /* empilha u */ }"}},

{7, 7, "relacionados_k", "no* relacionados_k(vertice* g, int i, int k)",
 "Grafo dirigido de emails; o peso da aresta conta quantas mensagens foram\n"
 "  enviadas naquele sentido. Devolve a lista dos usuarios j ligados a i\n"
 "  (num sentido ou no outro) cuja soma dos dois sentidos seja >= k.",
 "lista ex. 25", t7_7,
 {"Para cada j diferente de i, some o peso de i -> j com o peso de j -> i.",
  "Cuidado para nao colocar o mesmo j duas vezes na resposta: varra os j de\n     0 a V-1 e decida uma unica vez por j.",
  "for (j=0;j<V;j++) { int total=0, ligado=0; no* p;\n       if (j == i) continue;\n       for (p=g[i].inicio;p;p=p->prox) if (p->adj==j) { total+=p->peso; ligado=1; }\n       for (p=g[j].inicio;p;p=p->prox) if (p->adj==i) { total+=p->peso; ligado=1; }\n       if (ligado && total >= k) { /* empilha j */ } }"}},

{7, 8, "rota_companhia", "no* rota_companhia(vertice* g, int a, int b, int c)",
 "Malha aerea: cada aresta tem uma companhia no campo cia. Devolve a lista\n"
 "  do trajeto com MENOS conexoes de a ate b usando so voos da companhia c.\n"
 "  NULL se nao der para chegar.",
 "lista ex. 26", t7_8,
 {"E o caminho_bfs do nivel 6 com um filtro a mais.",
  "Na hora de olhar os vizinhos, so entra na fila quem estiver do outro\n     lado de uma aresta com p->cia == c. O resto da busca e igual.",
  "// unica mudanca em relacao ao caminho_bfs:\n     if (p->cia == c && g[p->adj].flag == 0) {\n       g[p->adj].flag = 1; pai[p->adj] = i; entrar_fila(&F, p->adj); }"}},

{7, 9, "tipo_x_evitando", "int tipo_x_evitando(vertice* g, int i, int x, int n)",
 "Igual ao tipo_x_mais_prox, mas o vertice n esta interditado: nao pode ser\n"
 "  atravessado nem ser a resposta. Devolve -1 se nao houver alternativa.",
 "lista ex. 28", t7_9,
 {"E o exercicio 5.4 com um vertice proibido.",
  "Nunca enfileire o vertice n. E, se a propria origem i for o vertice\n     interditado, a resposta ja e -1 antes mesmo de comecar a busca.",
  "if (i == n) return -1;\n     // dentro do while, ao olhar os vizinhos:\n     if (p->adj != n && g[p->adj].flag == 0) {\n       g[p->adj].flag = 1; entrar_fila(&F, p->adj); }"}}

};

const int N_EXERCICIOS = (int)(sizeof(CATALOGO) / sizeof(CATALOGO[0]));
