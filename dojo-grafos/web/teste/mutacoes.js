/* Mutacoes usadas pelo teste diferencial: cada uma e um erro que aluno
   comete de verdade.

   estrito: true marca os erros que sao COMPORTAMENTO INDEFINIDO em C (ler
   memoria nao inicializada, usar memoria depois do free, escrever alem do
   bloco). Nesses casos o gcc as vezes deixa passar por sorte -- o valor de
   lixo calhou de ser zero, o chunk liberado ainda tinha o conteudo antigo --
   enquanto o interpretador percebe sempre. E permitido que o site reprove
   onde o gcc aprovou; o contrario nunca. */
export const MUTACOES = [
    /* estrito: o bloco alocado fica pequeno demais e o programa passa a
       escrever na memoria vizinha. Em C isso e comportamento indefinido: o
       gcc as vezes deixa passar, o interpretador percebe. Nesses casos o
       site pode ser mais rigoroso que o gcc, nunca mais permissivo. */
    { nome: 'malloc(sizeof(no*))', arquivo: 'n2_lista.c', estrito: true,
      de: 'malloc(sizeof(no))', para: 'malloc(sizeof(no*))' },
    { nome: 'alocar_l com sizeof(vertice*)', arquivo: 'n2_lista.c', estrito: true,
      de: 'malloc(V * sizeof(vertice))', para: 'malloc(V * sizeof(vertice*))' },
    { nome: 'excluir sem tratar ant == NULL', arquivo: 'n2_lista.c',
      de: '    if (ant) ant->prox = p->prox;\n    else     g[v1].inicio = p->prox;',
      para: '    ant->prox = p->prox;' },
    { nome: 'inserir na cauda em vez da cabeca', arquivo: 'n2_lista.c',
      de: '    novo->prox = g[v1].inicio;\n    g[v1].inicio = novo;',
      para: '    novo->prox = NULL;\n    if (!g[v1].inicio) g[v1].inicio = novo;' },
    { nome: 'aresta_existe_l sem andar na lista', arquivo: 'n2_lista.c',
      de: '        if (p->adj == v2) return TRUE;\n        p = p->prox;',
      para: '        if (p->adj == v2) return TRUE;' },
    { nome: 'grau_entrada_l percorrendo a lista errada', arquivo: 'n2_lista.c',
      de: '            if (p->adj == v1) ge++;', para: '            if (i == v1) ge++;' },
    { nome: 'grau_saida_m somando lixo', estrito: true, arquivo: 'n1_matriz.c',
      de: 'int i, gs = 0;\n    for (i = 0; i < V; i++) gs = gs + m[v1][i];',
      para: 'int i, gs;\n    for (i = 0; i < V; i++) gs = gs + m[v1][i];' },
    { nome: 'inserir_aresta_m criando o sentido de volta', arquivo: 'n1_matriz.c',
      de: '    m[v1][v2] = 1;\n}', para: '    m[v1][v2] = 1;\n    m[v2][v1] = 1;\n}' },
    { nome: 'inicializar_m so na diagonal', estrito: true, arquivo: 'n1_matriz.c',
      de: '    for (i = 0; i < V; i++)\n        for (j = 0; j < V; j++)\n            m[i][j] = 0;',
      para: '    for (i = 0; i < V; i++)\n        m[i][i] = 0;\n    j = 0;' },
    /* Off-by-one no fim do laco. Os cenarios de 1.5, 1.6 e 2.7 nao tocavam
       no ultimo vertice, entao esses tres erros passavam despercebidos nos
       dois motores. As arestas 2->7 e 7->4 foram acrescentadas para fechar
       o buraco; estas mutacoes existem para ele nao reabrir. */
    /* Confunde "existe v1 -> v2" com "chega alguma aresta em v2". Passava em
       2.3 e so aparecia la no 2.7, com um numero sem pe nem cabeca. */
    { nome: 'aresta_existe_l varrendo o grafo todo', arquivo: 'n2_lista.c',
      de: 'bool aresta_existe_l(vertice* g, int v1, int v2) {\n' +
          '    no* p = g[v1].inicio;\n' +
          '    while (p) {\n' +
          '        if (p->adj == v2) return TRUE;\n' +
          '        p = p->prox;\n' +
          '    }\n' +
          '    return FALSE;\n' +
          '}',
      para: 'bool aresta_existe_l(vertice* g, int v1, int v2) {\n' +
            '    int k;\n' +
            '    for (k = 0; k < V; k++) {\n' +
            '        no* p = g[k].inicio;\n' +
            '        while (p) {\n' +
            '            if (p->adj == v2) return TRUE;\n' +
            '            p = p->prox;\n' +
            '        }\n' +
            '    }\n' +
            '    return FALSE;\n' +
            '}' },

    { nome: 'grau_saida_m parando em V-1', arquivo: 'n1_matriz.c',
      de: 'for (i = 0; i < V; i++) gs = gs + m[v1][i];',
      para: 'for (i = 0; i < V - 1; i++) gs = gs + m[v1][i];' },
    { nome: 'grau_entrada_m parando em V-1', arquivo: 'n1_matriz.c',
      de: 'for (i = 0; i < V; i++) ge = ge + m[i][v1];',
      para: 'for (i = 0; i < V - 1; i++) ge = ge + m[i][v1];' },
    { nome: 'grau_entrada_l parando em V-1', arquivo: 'n2_lista.c',
      de: 'for (i = 0; i < V; i++) {\n        no* p = g[i].inicio;',
      para: 'for (i = 0; i < V - 1; i++) {\n        no* p = g[i].inicio;' },

    { nome: 'zerar_flags mexendo em inicio', arquivo: 'n4_profundidade.c',
      de: 'for (i = 0; i < V; i++) g[i].flag = 0;',
      para: 'for (i = 0; i < V; i++) g[i].inicio = NULL;' },
    { nome: 'prof sem marcar a flag', arquivo: 'n4_profundidade.c',
      de: 'void prof(vertice* g, int i) {\n    no* p;\n    g[i].flag = 1;',
      para: 'void prof(vertice* g, int i) {\n    no* p;' },
    { nome: 'prof que nao pinta de preto', arquivo: 'n4_profundidade.c',
      de: '        p = p->prox;\n    }\n    g[i].flag = 2;\n}\n\nvoid prof_caminho',
      para: '        p = p->prox;\n    }\n}\n\nvoid prof_caminho' },
    { nome: 'ciclo confundindo preto com cinza', arquivo: 'n4_profundidade.c',
      de: '        if (g[p->adj].flag == 1) return TRUE;',
      para: '        if (g[p->adj].flag != 0) return TRUE;' },
    { nome: 'entrar_fila com f->ultimo->prox na fila vazia', arquivo: 'n5_largura.c',
      de: '    if (f->ultimo == NULL) f->inicio = novo;\n    else                   f->ultimo->prox = novo;',
      para: '    f->ultimo->prox = novo;\n    if (f->inicio == NULL) f->inicio = novo;' },
    { nome: 'entrar_fila rejeitando o vertice 0', arquivo: 'n5_largura.c',
      de: 'void entrar_fila(FILA* f, int valor) {\n',
      para: 'void entrar_fila(FILA* f, int valor) {\n    if (!valor) return;\n' },
    { nome: 'sair_fila sem zerar f->ultimo', estrito: true, arquivo: 'n5_largura.c',
      de: '    if (f->inicio == NULL) f->ultimo = NULL;\n    free(p);', para: '    free(p);' },
    { nome: 'largura sem pintar de preto', arquivo: 'n5_largura.c',
      de: '            p = p->prox;\n        }\n        g[i].flag = 2;\n    }\n}\n\nvoid largura_m',
      para: '            p = p->prox;\n        }\n    }\n}\n\nvoid largura_m' },
    /* Troca a busca em largura por uma busca em profundidade de verdade: no
       grafo do teste 5.4 ela desce o corredor longo e devolve o posto errado. */
    { nome: 'tipo_x_mais_prox usando profundidade', arquivo: 'n5_largura.c',
      de: 'int tipo_x_mais_prox(vertice* g, int i, int x) {\n    FILA F;',
      para: 'static int prof_tipo(vertice* g, int i, int x) {\n' +
            '    no* p;\n' +
            '    if (g[i].tipo == x) return i;\n' +
            '    g[i].flag = 1;\n' +
            '    for (p = g[i].inicio; p; p = p->prox)\n' +
            '        if (g[p->adj].flag == 0) {\n' +
            '            int r = prof_tipo(g, p->adj, x);\n' +
            '            if (r >= 0) return r;\n' +
            '        }\n' +
            '    return -1;\n' +
            '}\n\n' +
            'int tipo_x_mais_prox(vertice* g, int i, int x) {\n' +
            '    zerar_flags(g);\n' +
            '    return prof_tipo(g, i, x);\n' +
            '}\n\n' +
            'static int tipo_x_mais_prox_fila(vertice* g, int i, int x) {\n    FILA F;' },
    { nome: 'dijkstra escolhendo pelo peso da aresta', arquivo: 'n6_ponderados.c',
      de: '                if (custos[atual] + m[atual][c] < custos[c])\n                    custos[c] = custos[atual] + m[atual][c];',
      para: '                if (m[atual][c] < custos[c])\n                    custos[c] = m[atual][c];' },
    { nome: 'achar_cor comecando do zero', estrito: true, arquivo: 'n6_ponderados.c',
      de: '    for (j = 1; j <= V + 1; j++)\n        if (!tem_cor[j]) return j;',
      para: '    for (j = 0; j <= V + 1; j++)\n        if (!tem_cor[j]) return j;' },
    { nome: 'filtrar_custo com >= em vez de >', arquivo: 'n6_ponderados.c',
      de: '            if (p->peso > c) {', para: '            if (p->peso >= c) {' },
    { nome: 'ciclo nao dirigido sem tratar o pai', arquivo: 'n7_desafios.c',
      de: '        } else if (p->adj != pai) {\n            return TRUE;\n        }',
      para: '        } else {\n            return TRUE;\n        }' },
    { nome: 'destruir_arestas usando p depois do free', estrito: true, arquivo: 'n3_transformacoes.c',
      de: '            no* t = p->prox;\n            free(p);\n            p = t;',
      para: '            free(p);\n            p = p->prox;' },
    { nome: 'complemento criando lacos', arquivo: 'n3_transformacoes.c',
      de: '            if (i != j && !aresta_existe_l(g, i, j)) inserir_aresta_l(gc, i, j);',
      para: '            if (!aresta_existe_l(g, i, j)) inserir_aresta_l(gc, i, j);' },
    { nome: 'transposta alterando o grafo original', arquivo: 'n3_transformacoes.c',
      de: '            inserir_aresta_l(gt, p->adj, i);',
      para: '            inserir_aresta_l(gt, p->adj, i);\n            g[i].inicio = p->prox;' }
];
