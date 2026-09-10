# -*- coding: utf-8 -*-
"""
Gera os arquivos-esqueleto em src/aluno/ a partir da tabela abaixo.
Usado por `make novociclo` para recomecar o treino do zero.

    python tools/gerar_stubs.py            -> so gera se o arquivo nao existe
    python tools/gerar_stubs.py --forcar   -> sobrescreve tudo
"""
import os
import sys
import datetime

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, "src", "aluno")

# (nome_arquivo, titulo, [ (assinatura, retorno_stub, enunciado, referencia) ])
NIVEIS = [
("n1_matriz.c", "NIVEL 1 - MATRIZ DE ADJACENCIA", "make n1", [
 ("void inicializar_m(int m[V][V])", None,
  ["Zera a matriz inteira: no comeco nenhuma aresta existe."],
  "caderno, pag. 3 (Funcao de inicializacao)"),
 ("bool aresta_existe_m(int m[V][V], int v1, int v2)", "return FALSE;",
  ["Devolve TRUE se existe a aresta v1 -> v2, FALSE caso contrario."],
  "caderno, pag. 3 (Funcao para verificar se aresta existe)"),
 ("void inserir_aresta_m(int m[V][V], int v1, int v2)", None,
  ["Marca a aresta v1 -> v2.",
   "O grafo aqui e DIRIGIDO: inserir 1->2 nao pode criar 2->1."],
  "caderno, pag. 3 (Funcao para inserir aresta)"),
 ("bool excluir_aresta_m(int m[V][V], int v1, int v2)", "return FALSE;",
  ["Apaga a aresta v1 -> v2.",
   "Devolve FALSE (sem mexer na matriz) se ela nao existia."],
  "caderno, pag. 3 (Funcao para excluir aresta)"),
 ("int grau_saida_m(int m[V][V], int v1)", "return 0;",
  ["Conta quantas arestas SAEM de v1."],
  "caderno, pag. 3 (Funcao para calcular o grau de saida)"),
 ("int grau_entrada_m(int m[V][V], int v1)", "return 0;",
  ["Conta quantas arestas CHEGAM em v1."],
  "caderno, pag. 3 (Funcao para calcular o grau de entrada)"),
]),

("n2_lista.c", "NIVEL 2 - LISTA DE ADJACENCIA", "make n2", [
 ("vertice* alocar_l(void)", "return NULL;",
  ["Aloca o vetor com os V vertices do grafo e devolve o ponteiro.",
   "Cuidado com o sizeof: sao V structs vertice, nao V ponteiros."],
  "caderno, pag. 4"),
 ("void inicializar_l(vertice* g)", None,
  ["Deixa a lista de todo vertice vazia (inicio = NULL).",
   "Zere tambem flag, tipo, dist, cor e pais: os niveis 4, 5 e 6",
   "contam com esses campos comecando em zero."],
  "caderno, pag. 4 (Funcao para inicializacao)"),
 ("bool aresta_existe_l(vertice* g, int v1, int v2)", "return FALSE;",
  ["Percorre a lista de v1 procurando um no com adj == v2."],
  "caderno, pag. 4 (Funcao para verificar se aresta existe)"),
 ("bool inserir_aresta_l(vertice* g, int v1, int v2)", "return FALSE;",
  ["Insere v1 -> v2 na CABECA da lista de v1.",
   "Devolve FALSE se a aresta ja existia (nao duplique).",
   "Inicialize tambem peso = 1 e id = 0 no no novo."],
  "caderno, pag. 4 (Funcao para inserir aresta)"),
 ("bool excluir_aresta_l(vertice* g, int v1, int v2)", "return FALSE;",
  ["Remove o no de v2 da lista de v1 e da free nele.",
   "Devolve FALSE se a aresta nao existia.",
   "Atencao ao caso em que o no procurado e o PRIMEIRO da lista."],
  "caderno, pag. 5 (Funcao para excluir aresta)"),
 ("int grau_saida_l(vertice* g, int v1)", "return 0;",
  ["Conta quantos nos tem a lista de v1."],
  "caderno, pag. 3 (versao em lista)"),
 ("int grau_entrada_l(vertice* g, int v1)", "return 0;",
  ["Conta quantas arestas chegam em v1.",
   "Em lista nao existe coluna: e preciso olhar a lista de todo mundo."],
  "caderno, pag. 3 (versao em lista)"),
]),

("n3_transformacoes.c", "NIVEL 3 - TRANSFORMACOES SOBRE GRAFOS", "make n3", [
 ("vertice* transposta_l(vertice* g)", "return NULL;",
  ["Devolve um grafo NOVO com todas as arestas invertidas.",
   "O grafo g original nao pode ser alterado."],
  "caderno, pag. 6 (Problema 3) / lista ex. 4"),
 ("vertice* matriz_p_lista(int m[V][V])", "return NULL;",
  ["Converte um grafo em matriz para lista de adjacencia."],
  "caderno, pag. 8 / lista ex. 5"),
 ("bool subgrafo_lm(vertice* g1, int m2[V][V])", "return FALSE;",
  ["TRUE se toda aresta de g1 (lista) tambem existe em m2 (matriz)."],
  "caderno, pag. 5-6 (Problema 2) / lista ex. 8"),
 ("int contar_lacos_l(vertice* g)", "return 0;",
  ["Conta quantos lacos (arestas i -> i) existem no grafo."],
  "lista ex. 1"),
 ("void remover_lacos_l(vertice* g)", None,
  ["Remove todos os lacos, sem tocar nas outras arestas."],
  "lista ex. 2"),
 ("void destruir_arestas_l(vertice* g)", None,
  ["Libera TODOS os nos e deixa o grafo vazio.",
   "Guarde o proximo antes do free: depois dele p->prox nao vale mais nada."],
  "lista ex. 3"),
 ("vertice* diferenca_l(vertice* g1, vertice* g2)", "return NULL;",
  ["Grafo novo com as arestas que estao em g1 mas nao em g2."],
  "lista ex. 9"),
 ("bool completo_l(vertice* g)", "return FALSE;",
  ["TRUE se existe aresta entre todo par de vertices distintos."],
  "lista ex. 19"),
 ("vertice* complemento_l(vertice* g)", "return NULL;",
  ["Grafo com exatamente as arestas que faltam em g.",
   "Lacos nao entram: nao sao par de vertices distintos."],
  "lista ex. 20"),
]),

("n4_profundidade.c", "NIVEL 4 - BUSCA EM PROFUNDIDADE", "make n4", [
 ("void zerar_flags(vertice* g)", None,
  ["Deixa todo vertice BRANCO (flag = 0) antes de comecar uma busca.",
   "Mexa APENAS no campo flag."],
  "caderno, pag. 6"),
 ("void prof(vertice* g, int i)", None,
  ["Busca em profundidade a partir de i. Quem chama zera as flags antes.",
   "Convencao: 0 = branco, 1 = cinza (descoberto), 2 = preto (concluido)."],
  "caderno, pag. 6 (parte 1/3)"),
 ("void prof_caminho(vertice* g, int i, int j, bool* achou)", None,
  ["Marca *achou = TRUE se existe caminho de i ate j.",
   "Quem chama zera as flags e poe *achou = FALSE antes."],
  "caderno, pag. 7 / lista ex. 16"),
 ("bool tem_ciclo_dir(vertice* g)", "return FALSE;",
  ["TRUE se o grafo dirigido tem algum ciclo.",
   "Zere as flags voce mesmo e cubra o grafo inteiro: o ciclo pode estar",
   "num pedaco que nao contem o vertice 0.",
   "Escreva a auxiliar recursiva logo acima, no espaco reservado."],
  "caderno, pag. 7 / lista ex. 12"),
 ("void contar_tipo_x(vertice* g, int i, int x, int* cont)", None,
  ["Conta quantos vertices de tipo x da para alcancar a partir de i,",
   "contando o proprio i se ele for do tipo x.",
   "Quem chama zera as flags e o contador antes."],
  "caderno, pag. 8"),
 ("int contar_grupos(vertice* g)", "return 0;",
  ["Conta os grupos de vertices mutuamente alcancaveis (componentes)",
   "de um grafo nao-dirigido."],
  "lista ex. 14"),
 ("int maior_grupo_inicio(vertice* g)", "return -1;",
  ["Devolve um vertice qualquer do MAIOR grupo conectado, ou -1.",
   "Escreva a auxiliar recursiva que conta alcancaveis no espaco acima."],
  "caderno, pag. 8 (Ex 1) / lista ex. 15"),
 ("bool arvore_enraizada(vertice* g)", "return FALSE;",
  ["TRUE se g e aciclico, conexo, dirigido e tem UMA UNICA fonte",
   "(vertice de grau de entrada zero). Implemente essa definicao,",
   "exatamente como esta escrita."],
  "lista ex. 6"),
]),

("n5_largura.c", "NIVEL 5 - FILA E BUSCA EM LARGURA", "make n5", [
 ([("void inicializar_fila(FILA* f)", None),
   ("void entrar_fila(FILA* f, int valor)", None),
   ("int sair_fila(FILA* f)", "return -1;")], "as tres funcoes da FILA",
  ["Entra no fim, sai do comeco (FIFO).",
   "sair_fila devolve -1 se a fila estiver vazia.",
   "Tres armadilhas moram aqui:",
   "  1) com a fila vazia f->ultimo e NULL: nada de f->ultimo->prox;",
   "  2) o vertice 0 e um valor valido, nao rejeite valor == 0;",
   "  3) quando o ultimo elemento sai, zere f->ultimo tambem."],
  "caderno, pag. 10 (1. criar uma fila F)"),
 ("void largura_l(vertice* g, int i)", None,
  ["Busca em largura a partir de i. A propria funcao zera as flags.",
   "Ao ENFILEIRAR um vizinho branco ele fica cinza (1);",
   "ao SAIR da fila, o vertice fica preto (2)."],
  "caderno, pag. 10"),
 ("void largura_m(int m[V][V], int i, int flags[V])", None,
  ["A mesma busca em largura, agora em matriz.",
   "As marcas vao no vetor flags, que a propria funcao zera antes."],
  "caderno, pag. 11"),
 ("int tipo_x_mais_prox(vertice* g, int i, int x)", "return -1;",
  ["Devolve o vertice de tipo x MAIS PROXIMO de i (menos arestas), ou -1.",
   "Se o proprio i for do tipo x, a resposta e i.",
   "Tem que ser busca em largura: profundidade daria resposta errada."],
  "caderno, pag. 11 (Ex 1) / lista ex. 21 e 27"),
 ("int comprimento(vertice* g, int v1, int v2)", "return INFINITO;",
  ["Numero de arestas do menor caminho de v1 ate v2.",
   "Devolve INFINITO se nao houver caminho. De v1 ate v1 da 0."],
  "caderno, pag. 12 (Ex 2)"),
 ("no* vertices_raio_n(vertice* g, int i, int N)", "return NULL;",
  ["Lista ligada com todos os vertices a no maximo N arestas de i,",
   "incluindo o proprio i. A ordem da lista nao importa."],
  "caderno, pag. 12 (Ex 2) / lista ex. 24"),
 ("void distancias(vertice* g, int i, int dist[V])", None,
  ["Preenche dist[] com a distancia em arestas de i ate cada vertice.",
   "Quem nao for alcancavel fica com INFINITO."],
  "lista ex. 23"),
]),

("n6_ponderados.c", "NIVEL 6 - PONDERADOS: DIJKSTRA E COLORACAO", "make n6", [
 ("void custo(int m[V][V], int i, int custos[V])", None,
  ["Dijkstra em matriz de PESOS: m[i][j] == 0 quer dizer que nao ha aresta.",
   "Preenche custos[] com o custo minimo de i ate cada vertice",
   "(INFINITO para os inalcancaveis)."],
  "caderno, pag. 13 (Algoritmo de Dijkstra)"),
 ("int achar_cor(vertice* g, int i)", "return -1;",
  ["Devolve a MENOR cor (a partir de 1) que nenhum vizinho de i usa.",
   "Cor 0 significa 'ainda sem cor' e nao bloqueia nada."],
  "caderno, pag. 14 (Coloracao)"),
 ("void colorir(vertice* g, int i, int* k)", None,
  ["Colore em profundidade a partir de i, sem deixar dois vizinhos com",
   "a mesma cor. *k guarda a maior cor usada.",
   "Aqui o campo cor faz o papel da flag: cor == 0 e 'nao visitado'."],
  "caderno, pag. 14 (Metodo 1)"),
 ("vertice* filtrar_custo(vertice* g, int c)", "return NULL;",
  ["Copia de g so com as arestas de custo MAIOR que c.",
   "Peso igual a c fica de fora. Copie o peso para o no novo."],
  "lista ex. 7"),
 ("no* caminho_bfs(vertice* g, int a, int b)", "return NULL;",
  ["Lista ligada com o menor caminho de a ate b, do a ate o b nessa ordem.",
   "NULL se nao existir caminho. De a ate a, a lista tem so o a."],
  "lista ex. 18 e 26"),
]),

("n7_desafios.c", "NIVEL 7 - DESAFIOS DA LISTA", "make n7", [
 ("no* suspeitos_spam(vertice* g, int x)", "return NULL;",
  ["Rede de emails dirigida. A aresta u -> v com id == x quer dizer que u",
   "mandou a mensagem x para v.",
   "Devolve a lista dos usuarios que MANDARAM x mas NUNCA receberam x."],
  "lista ex. 10"),
 ("int mais_paises(vertice* g)", "return -1;",
  ["Cada vertice tem um campo pais. Devolve a unidade que liga para o",
   "maior numero de paises DIFERENTES. Empate: qualquer uma serve."],
  "lista ex. 11"),
 ("bool tem_ciclo_nao_dir(vertice* g)", "return FALSE;",
  ["TRUE se o grafo NAO-dirigido tem algum ciclo.",
   "A auxiliar recursiva precisa receber tambem o vertice pai: a aresta",
   "de volta para quem te chamou nao e ciclo."],
  "lista ex. 12"),
 ("bool remover_aresta_ciclo(vertice* g)", "return FALSE;",
  ["Acha UMA aresta de volta num grafo dirigido, remove ela e devolve",
   "TRUE. FALSE se nao havia ciclo nenhum."],
  "lista ex. 13"),
 ("no* maior_grupo_lista(vertice* g)", "return NULL;",
  ["Lista ligada com TODOS os vertices do maior grupo conectado.",
   "A ordem nao importa; havendo empate, qualquer grupo serve."],
  "lista ex. 15"),
 ("no* vazias_mais_proximas(vertice* g, int i)", "return NULL;",
  ["O campo tipo guarda a OCUPACAO da sala; tipo == 0 e sala vazia.",
   "Lista de TODAS as salas vazias que empatam em menor distancia de i.",
   "Se a propria sala i estiver vazia, a resposta e so ela."],
  "lista ex. 22"),
 ("no* relacionados_k(vertice* g, int i, int k)", "return NULL;",
  ["O peso da aresta conta as mensagens enviadas naquele sentido.",
   "Lista dos usuarios j ligados a i (num sentido ou no outro) cuja soma",
   "dos dois sentidos seja >= k. Sem repetir j."],
  "lista ex. 25"),
 ("no* rota_companhia(vertice* g, int a, int b, int c)", "return NULL;",
  ["Cada aresta tem uma companhia no campo cia.",
   "Trajeto com menos conexoes de a ate b usando so voos da companhia c.",
   "NULL se nao der para chegar."],
  "lista ex. 26"),
 ("int tipo_x_evitando(vertice* g, int i, int x, int n)", "return -1;",
  ["Igual ao tipo_x_mais_prox, mas o vertice n esta interditado:",
   "nao pode ser atravessado nem ser a resposta. -1 se nao houver saida."],
  "lista ex. 28"),
]),
]

CABECALHO = """/* ==========================================================================
 *  {titulo}
 *
 *  Escreva aqui, do zero, as implementacoes do caderno.
 *  Para cada funcao: apague a linha FALTA_IMPLEMENTAR() e escreva o corpo.
 *
 *  rodar os testes deste nivel : {cmd}
 *  pedir uma dica              : make dica N={n} E=<numero do exercicio>
 *
 *  Gerado em {data}
 * ========================================================================== */
#include <stdio.h>
#include <stdlib.h>
#include "grafo.h"
#include "dojo.h"   /* so por causa do FALTA_IMPLEMENTAR() */

"""

AUXILIARES = {
"n7_desafios.c": """
/* --------------------------------------------------------------------------
 *  ESPACO PARA SUAS FUNCOES AUXILIARES
 *
 *  Tres exercicios deste nivel pedem apoio recursivo:
 *    - tem_ciclo_nao_dir    uma auxiliar que receba o vertice pai;
 *    - remover_aresta_ciclo uma auxiliar que guarde a aresta de volta;
 *    - maior_grupo_lista    uma auxiliar que va empilhando os visitados.
 * ------------------------------------------------------------------------ */

""",
"n4_profundidade.c": """
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

"""
}


def bloco(idx, assinatura, retorno, linhas, ref):
    """assinatura pode ser uma string, ou uma lista de (assinatura, retorno)
    quando um mesmo exercicio pede mais de uma funcao."""
    if isinstance(assinatura, list):
        funcs = assinatura
        rotulo = retorno
    else:
        funcs = [(assinatura, retorno)]
        rotulo = assinatura.split("(")[0].split()[-1].lstrip("*")

    txt = "/* ---- %d. %s\n" % (idx, rotulo)
    for l in linhas:
        txt += (" *      %s" % l).rstrip() + "\n"
    txt += " *      %s\n" % ref
    txt += " * ------------------------------------------------------------------ */\n"
    for ass, ret in funcs:
        txt += "%s {\n" % ass
        txt += "    FALTA_IMPLEMENTAR();\n"
        if ret:
            txt += "    %s\n" % ret
        txt += "}\n\n"
    return txt


def main():
    forcar = "--forcar" in sys.argv
    destino = DESTINO
    if "--destino" in sys.argv:
        destino = sys.argv[sys.argv.index("--destino") + 1]
        forcar = True
    os.makedirs(destino, exist_ok=True)
    data = datetime.date.today().isoformat()
    criados, pulados = [], []

    for n, (arquivo, titulo, cmd, funcs) in enumerate(NIVEIS, start=1):
        caminho = os.path.join(destino, arquivo)
        if os.path.exists(caminho) and not forcar:
            pulados.append(arquivo)
            continue
        txt = CABECALHO.format(titulo=titulo, cmd=cmd, n=n, data=data)
        txt += AUXILIARES.get(arquivo, "")
        for i, (assinatura, retorno, linhas, ref) in enumerate(funcs, start=1):
            txt += bloco(i, assinatura, retorno, linhas, ref)
        with open(caminho, "w", encoding="utf-8", newline="\n") as f:
            f.write(txt)
        criados.append(arquivo)

    for a in criados:
        print("  criado : %s" % os.path.join(destino, a))
    for a in pulados:
        print("  mantido: %s (use --forcar para sobrescrever)" % os.path.join(destino, a))


if __name__ == "__main__":
    main()
