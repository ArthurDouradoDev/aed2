/* ==========================================================================
 *  testes.js -- os 51 testes do Dojo
 *
 *  Porte fiel de src/testes/*.c. Mesmos cenarios, mesmas armadilhas, mesmas
 *  mensagens. O que muda e so quem executa: aqui o codigo do aluno roda no
 *  interpretador de C do navegador em vez de virar binario.
 * ========================================================================== */
import { V, INFINITO, TRUE, FALSE } from './runtime.js';

/* liga nos dois sentidos, usando o inserir_aresta_l DO ALUNO */
function liga2(T, g, a, b) {
    T.chamar('inserir_aresta_l', g, a, b);
    T.chamar('inserir_aresta_l', g, b, a);
}

function confereLista(T, r, esp) {
    const vet = T.listaParaVetor(r);
    if (vet.length !== esp.length) return false;
    const conta = new Map();
    for (const x of vet) {
        if (x < 0 || x >= V) return false;
        conta.set(x, (conta.get(x) || 0) + 1);
    }
    for (const x of esp) if (conta.get(x) !== 1) return false;
    return true;
}

function mostraLista(T, r) {
    const vet = T.listaParaVetor(r);
    T.imprimir('       sua lista (' + vet.length + ' elemento(s)):' +
               (vet.length ? ' ' + vet.join(' ') : '') + '\n');
}

/* ===================== NIVEL 1 : MATRIZ ============================== */

export const t1_1 = (T) => {
    const m = T.matriz();
    T.cenario('Uma matriz cheia de lixo (todos os valores = 7) e passada para\n' +
              '  inicializar_m. Depois disso todas as ' + V + ' x ' + V + ' posicoes precisam\n' +
              '  valer 0.');
    for (let i = 0; i < V; i++) for (let j = 0; j < V; j++) T.mSet(m, i, j, 7);
    T.chamar('inicializar_m', m);
    T.checaStub();
    for (let i = 0; i < V; i++)
        for (let j = 0; j < V; j++)
            if (T.mGet(m, i, j) !== 0) {
                T.desenhaMatriz('matriz depois de inicializar_m:', m);
                T.falha('m[' + i + '][' + j + '] deveria ser 0 e vale ' + T.mGet(m, i, j) +
                        '\n       (o for de dentro percorreu todas as colunas?)');
            }
};

export const t1_2 = (T) => {
    const m = T.matriz();
    T.cenario('Matriz montada na mao com as arestas 1->2, 2->4 e o laco 4->4.\n' +
              '  aresta_existe_m deve devolver TRUE so para essas tres.');
    for (let i = 0; i < V; i++) for (let j = 0; j < V; j++) T.mSet(m, i, j, 0);
    T.mSet(m, 1, 2, 1); T.mSet(m, 2, 4, 1); T.mSet(m, 4, 4, 1);
    T.esperaBool('aresta_existe_m(m, 1, 2)  -- aresta que existe',
                 T.chamar('aresta_existe_m', m, 1, 2), TRUE);
    T.esperaBool('aresta_existe_m(m, 4, 4)  -- laco',
                 T.chamar('aresta_existe_m', m, 4, 4), TRUE);
    T.esperaBool('aresta_existe_m(m, 2, 1)  -- o grafo e DIRIGIDO, 2->1 nao existe',
                 T.chamar('aresta_existe_m', m, 2, 1), FALSE);
    T.esperaBool('aresta_existe_m(m, 0, 5)  -- aresta que nao existe',
                 T.chamar('aresta_existe_m', m, 0, 5), FALSE);
};

export const t1_3 = (T) => {
    const m = T.matriz();
    T.cenario('Comeca com inicializar_m e insere 1->2, 2->4 e o laco 4->4.\n' +
              '  Grafo DIRIGIDO: inserir 1->2 nao pode criar 2->1.');
    T.chamar('inicializar_m', m);
    T.chamar('inserir_aresta_m', m, 1, 2);
    T.chamar('inserir_aresta_m', m, 2, 4);
    T.chamar('inserir_aresta_m', m, 4, 4);
    T.checaStub();
    if (T.mGet(m, 1, 2) !== 1 || T.mGet(m, 2, 4) !== 1 || T.mGet(m, 4, 4) !== 1) {
        T.desenhaMatriz('sua matriz:', m);
        T.falha('as arestas inseridas nao apareceram: m[1][2]=' + T.mGet(m, 1, 2) +
                ' m[2][4]=' + T.mGet(m, 2, 4) + ' m[4][4]=' + T.mGet(m, 4, 4));
    }
    if (T.mGet(m, 2, 1) !== 0) {
        T.desenhaMatriz('sua matriz:', m);
        T.falha('m[2][1] virou ' + T.mGet(m, 2, 1) +
                '. Em grafo dirigido inserir 1->2 NAO cria 2->1.\n' +
                '       (a linha do "se nao dirigido" deve ficar comentada)');
    }
};

export const t1_4 = (T) => {
    const m = T.matriz();
    T.cenario('Insere 1->2 e 2->4, depois exclui. Excluir aresta inexistente\n' +
              '  precisa devolver FALSE e nao mexer no resto da matriz.');
    T.chamar('inicializar_m', m);
    T.chamar('inserir_aresta_m', m, 1, 2);
    T.chamar('inserir_aresta_m', m, 2, 4);
    T.esperaBool('excluir_aresta_m(m, 1, 2)  -- aresta existente',
                 T.chamar('excluir_aresta_m', m, 1, 2), TRUE);
    T.checaStub();
    if (T.mGet(m, 1, 2) !== 0) {
        T.desenhaMatriz('sua matriz:', m);
        T.falha('depois de excluir, m[1][2] deveria ser 0 e vale ' + T.mGet(m, 1, 2));
    }
    T.esperaBool('excluir_aresta_m(m, 1, 2)  -- ja foi excluida',
                 T.chamar('excluir_aresta_m', m, 1, 2), FALSE);
    T.esperaBool('excluir_aresta_m(m, 0, 7)  -- nunca existiu',
                 T.chamar('excluir_aresta_m', m, 0, 7), FALSE);
    if (T.mGet(m, 2, 4) !== 1) {
        T.desenhaMatriz('sua matriz:', m);
        T.falha('a aresta 2->4 sumiu sem ninguem pedir (m[2][4]=' + T.mGet(m, 2, 4) + ')');
    }
};

export const t1_5 = (T) => {
    const m = T.matriz();
    T.cenario('Saem do vertice 2 as arestas 2->0, 2->4, 2->5 e 2->7.\n' +
              '  O vertice 3 e isolado e o 6 so tem o laco 6->6.\n' +
              '  O 2->7 esta ai de proposito: e a ULTIMA coluna. Quem escreve\n' +
              '  i < V-1 no lugar de i < V perde essa coluna e conta 3.');
    T.chamar('inicializar_m', m);
    T.chamar('inserir_aresta_m', m, 2, 0); T.chamar('inserir_aresta_m', m, 2, 4);
    T.chamar('inserir_aresta_m', m, 2, 5); T.chamar('inserir_aresta_m', m, 2, 7);
    T.chamar('inserir_aresta_m', m, 1, 2); T.chamar('inserir_aresta_m', m, 6, 6);
    T.esperaInt('grau_saida_m(m, 2)', T.chamar('grau_saida_m', m, 2), 4);
    T.esperaInt('grau_saida_m(m, 3)  -- vertice isolado', T.chamar('grau_saida_m', m, 3), 0);
    T.esperaInt('grau_saida_m(m, 6)  -- o laco conta como saida', T.chamar('grau_saida_m', m, 6), 1);
};

export const t1_6 = (T) => {
    const m = T.matriz();
    T.cenario('Chegam no vertice 4 as arestas 0->4, 2->4, 5->4 e 7->4.\n' +
              '  Cuidado: grau de ENTRADA percorre a COLUNA, nao a linha.\n' +
              '  O 7->4 esta ai de proposito: e a ULTIMA linha. Quem escreve\n' +
              '  i < V-1 no lugar de i < V perde essa linha e conta 3.');
    T.chamar('inicializar_m', m);
    T.chamar('inserir_aresta_m', m, 0, 4); T.chamar('inserir_aresta_m', m, 2, 4);
    T.chamar('inserir_aresta_m', m, 5, 4); T.chamar('inserir_aresta_m', m, 7, 4);
    T.chamar('inserir_aresta_m', m, 4, 1); T.chamar('inserir_aresta_m', m, 6, 6);
    T.esperaInt('grau_entrada_m(m, 4)', T.chamar('grau_entrada_m', m, 4), 4);
    T.esperaInt('grau_entrada_m(m, 1)', T.chamar('grau_entrada_m', m, 1), 1);
    T.esperaInt('grau_entrada_m(m, 3)  -- ninguem aponta pro 3', T.chamar('grau_entrada_m', m, 3), 0);
    T.esperaInt('grau_entrada_m(m, 6)  -- o laco conta como entrada', T.chamar('grau_entrada_m', m, 6), 1);
};

/* ===================== NIVEL 2 : LISTA =============================== */

export const t2_1 = (T) => {
    T.cenario('alocar_l precisa reservar espaco para ' + V + ' structs vertice,\n' +
              '  ou seja V * sizeof(vertice) = ' + (V * T.tVertice.tam) + ' bytes.\n' +
              '  O Dojo mede quantos bytes o seu malloc pediu.');
    T.mem.ultimoMalloc = 0;
    const g = T.chamar('alocar_l');
    T.checaStub();
    if (!g) T.falha('alocar_l() devolveu NULL');
    if (T.mem.ultimoMalloc < V * T.tVertice.tam)
        T.falha('seu malloc pediu apenas ' + T.mem.ultimoMalloc + ' bytes, mas sao necessarios ' +
                (V * T.tVertice.tam) + '.\n' +
                '       Voce escreveu sizeof(vertice*) (o tamanho do PONTEIRO,\n' +
                '       4 bytes) no lugar de sizeof(vertice) (' + T.tVertice.tam + ' bytes)?');
};

export const t2_2 = (T) => {
    const g = T.chamar('alocar_l');
    T.cenario('Depois de inicializar_l, todo g[i].inicio precisa ser NULL\n' +
              '  (a lista de cada vertice comeca vazia).');
    T.checaStub();
    if (!g) T.falha('alocar_l() devolveu NULL -- resolva o exercicio 1 primeiro');
    for (let i = 0; i < V; i++) T.vPor(g, i, 'inicio', 0xDEAD);
    T.chamar('inicializar_l', g);
    T.checaStub();
    for (let i = 0; i < V; i++)
        if (T.vCampo(g, i, 'inicio') !== 0)
            T.falha('g[' + i + '].inicio deveria ser NULL depois de inicializar_l');
};

export const t2_3 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Listas montadas por fora: 1 -> 2, 2 -> 4, 4 -> 4 (laco).\n' +
              '  aresta_existe_l percorre SO a lista de v1 procurando adj == v2.\n' +
              '  A palavra "so" e o exercicio inteiro: quem varre os ' + V + ' vertices\n' +
              '  atras de adj == v2 responde outra pergunta ("chega alguem no v2?")\n' +
              '  e acerta por acaso boa parte dos casos.');
    T.liga(g, 1, 2); T.liga(g, 2, 4); T.liga(g, 4, 4);
    T.esperaBool('aresta_existe_l(g, 1, 2)', T.chamar('aresta_existe_l', g, 1, 2), TRUE);
    T.esperaBool('aresta_existe_l(g, 4, 4)  -- laco', T.chamar('aresta_existe_l', g, 4, 4), TRUE);
    T.esperaBool('aresta_existe_l(g, 2, 1)  -- dirigido: 2->1 nao existe',
                 T.chamar('aresta_existe_l', g, 2, 1), FALSE);
    T.esperaBool('aresta_existe_l(g, 0, 3)  -- lista vazia',
                 T.chamar('aresta_existe_l', g, 0, 3), FALSE);
    /* Estes dois separam "existe v1 -> v2" de "chega alguma aresta em v2":
       o 2 e o 4 recebem arestas, mas nao vindas do 0 nem do 3. */
    T.esperaBool('aresta_existe_l(g, 0, 2)  -- chega aresta no 2, mas nao vinda do 0',
                 T.chamar('aresta_existe_l', g, 0, 2), FALSE);
    T.esperaBool('aresta_existe_l(g, 3, 4)  -- chega aresta no 4, mas nao vinda do 3',
                 T.chamar('aresta_existe_l', g, 3, 4), FALSE);
};

export const t2_4 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Insere 1->2, 1->5 e tenta inserir 1->2 de novo (deve dar FALSE,\n' +
              '  sem duplicar). O no alocado precisa ter sizeof(no) = ' + T.tNo.tam + ' bytes.');
    T.mem.ultimoMalloc = 0;
    T.esperaBool('inserir_aresta_l(g, 1, 2)  -- aresta nova',
                 T.chamar('inserir_aresta_l', g, 1, 2), TRUE);
    if (T.mem.ultimoMalloc < T.tNo.tam)
        T.falha('seu malloc pediu ' + T.mem.ultimoMalloc + ' bytes, mas sizeof(no) = ' + T.tNo.tam + '.\n' +
                '       Voce escreveu malloc(sizeof(no*)) no lugar de malloc(sizeof(no))?');
    T.chamar('inserir_aresta_l', g, 1, 5);
    T.esperaBool('inserir_aresta_l(g, 1, 2)  -- aresta REPETIDA',
                 T.chamar('inserir_aresta_l', g, 1, 2), FALSE);
    T.checaStub();
    const err = T.confereAdj(g, 1, [2, 5]);
    if (err) {
        T.desenhaLista('seu grafo:', g);
        T.falha('a lista do vertice 1 saiu errada:\n       ' + err);
    }
    if (T.contaAdj(g, 2) !== 0) {
        T.desenhaLista('seu grafo:', g);
        T.falha('inserir 1->2 nao pode criar nada na lista do vertice 2 (dirigido)');
    }
};

export const t2_5 = (T) => {
    const g = T.grafoNovo();
    T.cenario('ARMADILHA CLASSICA. A lista do vertice 1 fica 1 -> 7 -> 5 -> 2\n' +
              '  (inserindo na cabeca, a ordem sai invertida). Vamos excluir o\n' +
              '  PRIMEIRO no da lista, depois o do meio, depois o ultimo.');
    T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 1, 5);
    T.chamar('inserir_aresta_l', g, 1, 7);
    T.checaStub();

    T.esperaBool('excluir_aresta_l(g, 1, 7)  -- PRIMEIRO no da lista',
                 T.chamar('excluir_aresta_l', g, 1, 7), TRUE);
    T.checaStub();
    const err = T.confereAdj(g, 1, [5, 2]);
    if (err) {
        T.desenhaLista('seu grafo:', g);
        T.falha('excluir o primeiro no quebrou a lista:\n       ' + err +
                '\n       Quando ant == NULL, quem passa a apontar para p->prox\n' +
                '       e g[v1].inicio, e nao ant->prox.');
    }
    T.esperaBool('excluir_aresta_l(g, 1, 5)  -- no do meio',
                 T.chamar('excluir_aresta_l', g, 1, 5), TRUE);
    T.esperaBool('excluir_aresta_l(g, 1, 2)  -- ultimo no restante',
                 T.chamar('excluir_aresta_l', g, 1, 2), TRUE);
    T.checaStub();
    if (T.contaAdj(g, 1) !== 0) {
        T.desenhaLista('seu grafo:', g);
        T.falha('a lista do vertice 1 deveria estar vazia, tem ' + T.contaAdj(g, 1) + ' no(s)');
    }
    T.esperaBool('excluir_aresta_l(g, 1, 2)  -- lista ja vazia',
                 T.chamar('excluir_aresta_l', g, 1, 2), FALSE);
    T.esperaBool('excluir_aresta_l(g, 3, 6)  -- aresta que nunca existiu',
                 T.chamar('excluir_aresta_l', g, 3, 6), FALSE);
};

export const t2_6 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Saem do vertice 2 as arestas 2->0, 2->4 e 2->5.\n' +
              '  O vertice 3 e isolado e o 6 so tem o laco 6->6.');
    T.chamar('inserir_aresta_l', g, 2, 0); T.chamar('inserir_aresta_l', g, 2, 4);
    T.chamar('inserir_aresta_l', g, 2, 5); T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 6, 6);
    T.esperaInt('grau_saida_l(g, 2)', T.chamar('grau_saida_l', g, 2), 3);
    T.esperaInt('grau_saida_l(g, 3)  -- isolado', T.chamar('grau_saida_l', g, 3), 0);
    T.esperaInt('grau_saida_l(g, 6)  -- laco', T.chamar('grau_saida_l', g, 6), 1);
};

export const t2_7 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Chegam no vertice 4 as arestas 0->4, 2->4, 5->4 e 7->4.\n' +
              '  Em lista de adjacencia isso obriga a varrer TODOS os vertices.\n' +
              '  O 7->4 esta ai de proposito: e o ULTIMO vertice. Quem para em\n' +
              '  V-1 nunca olha a lista dele e conta 3.');
    T.chamar('inserir_aresta_l', g, 0, 4); T.chamar('inserir_aresta_l', g, 2, 4);
    T.chamar('inserir_aresta_l', g, 5, 4); T.chamar('inserir_aresta_l', g, 7, 4);
    T.chamar('inserir_aresta_l', g, 4, 1); T.chamar('inserir_aresta_l', g, 6, 6);
    T.esperaInt('grau_entrada_l(g, 4)', T.chamar('grau_entrada_l', g, 4), 4);
    T.esperaInt('grau_entrada_l(g, 1)', T.chamar('grau_entrada_l', g, 1), 1);
    T.esperaInt('grau_entrada_l(g, 3)  -- ninguem aponta pro 3', T.chamar('grau_entrada_l', g, 3), 0);
    T.esperaInt('grau_entrada_l(g, 6)  -- laco', T.chamar('grau_entrada_l', g, 6), 1);
};

/* ===================== NIVEL 3 : TRANSFORMACOES ====================== */

export const t3_1 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Grafo dirigido: 0->1, 1->2, 2->0, 3->1, 4->4.\n' +
              '  No transposto toda aresta u->v vira v->u (o laco 4->4 continua).');
    T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 2, 0); T.chamar('inserir_aresta_l', g, 3, 1);
    T.chamar('inserir_aresta_l', g, 4, 4);
    const gt = T.chamar('transposta_l', g);
    T.checaStub();
    if (!gt) T.falha('transposta_l devolveu NULL');
    const err = T.confereAdj(gt, 1, [0, 3]) || T.confereAdj(gt, 2, [1]) ||
                T.confereAdj(gt, 0, [2]) || T.confereAdj(gt, 4, [4]);
    if (err) {
        T.desenhaLista('grafo original:', g);
        T.desenhaLista('seu transposto:', gt);
        T.falha('transposto incorreto:\n       ' + err);
    }
    if (T.contaArestas(gt) !== 5) {
        T.desenhaLista('seu transposto:', gt);
        T.falha('o transposto deveria ter 5 arestas, tem ' + T.contaArestas(gt));
    }
    if (T.contaArestas(g) !== 5 || !T.temAdj(g, 0, 1)) {
        T.desenhaLista('grafo original depois da chamada:', g);
        T.falha('transposta_l NAO pode alterar o grafo original g');
    }
};

export const t3_2 = (T) => {
    const m = T.matriz();
    T.cenario('Matriz com 0->1, 0->5, 2->3, 6->6. Converter para listas.');
    for (let i = 0; i < V; i++) for (let j = 0; j < V; j++) T.mSet(m, i, j, 0);
    T.mSet(m, 0, 1, 1); T.mSet(m, 0, 5, 1); T.mSet(m, 2, 3, 1); T.mSet(m, 6, 6, 1);
    const g = T.chamar('matriz_p_lista', m);
    T.checaStub();
    if (!g) T.falha('matriz_p_lista devolveu NULL');
    const err = T.confereAdj(g, 0, [1, 5]) || T.confereAdj(g, 2, [3]) ||
                T.confereAdj(g, 6, [6]) || T.confereAdj(g, 1, []);
    if (err) {
        T.desenhaMatriz('matriz de entrada:', m);
        T.desenhaLista('sua lista:', g);
        T.falha('conversao incorreta:\n       ' + err);
    }
    if (T.contaArestas(g) !== 4)
        T.falha('deveriam existir 4 arestas na lista, existem ' + T.contaArestas(g));
};

export const t3_3 = (T) => {
    const g1 = T.grafoNovo();
    const m2 = T.matriz();
    T.cenario('g1 (lista) tem 0->1, 1->2, 4->5.\n' +
              '  m2 (matriz) tem 0->1, 1->2, 4->5 e ainda 3->6.\n' +
              '  Toda aresta de g1 esta em m2, logo g1 e subgrafo de m2.');
    T.chamar('inicializar_m', m2);
    T.chamar('inserir_aresta_l', g1, 0, 1); T.chamar('inserir_aresta_l', g1, 1, 2);
    T.chamar('inserir_aresta_l', g1, 4, 5);
    T.chamar('inserir_aresta_m', m2, 0, 1); T.chamar('inserir_aresta_m', m2, 1, 2);
    T.chamar('inserir_aresta_m', m2, 4, 5); T.chamar('inserir_aresta_m', m2, 3, 6);
    T.esperaBool('subgrafo_lm(g1, m2)  -- g1 cabe dentro de m2',
                 T.chamar('subgrafo_lm', g1, m2), TRUE);
    T.chamar('inserir_aresta_l', g1, 7, 0);
    T.esperaBool('subgrafo_lm(g1, m2)  -- depois de g1 ganhar 7->0, que nao esta em m2',
                 T.chamar('subgrafo_lm', g1, m2), FALSE);
};

export const t3_4 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Lacos em 0, 4 e 7; arestas normais 1->2 e 2->3 nao contam.');
    T.chamar('inserir_aresta_l', g, 0, 0); T.chamar('inserir_aresta_l', g, 4, 4);
    T.chamar('inserir_aresta_l', g, 7, 7); T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 2, 3);
    T.esperaInt('contar_lacos_l(g)', T.chamar('contar_lacos_l', g), 3);
};

export const t3_5 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Lacos em 0, 4 e 7 mais as arestas 1->2, 2->3 e 0->1.\n' +
              '  Depois de remover_lacos_l devem sobrar exatamente as 3 normais.');
    T.chamar('inserir_aresta_l', g, 0, 0); T.chamar('inserir_aresta_l', g, 4, 4);
    T.chamar('inserir_aresta_l', g, 7, 7); T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 2, 3); T.chamar('inserir_aresta_l', g, 0, 1);
    T.chamar('remover_lacos_l', g);
    T.checaStub();
    if (T.temAdj(g, 0, 0) || T.temAdj(g, 4, 4) || T.temAdj(g, 7, 7)) {
        T.desenhaLista('seu grafo:', g);
        T.falha('ainda sobrou algum laco');
    }
    if (T.contaArestas(g) !== 3) {
        T.desenhaLista('seu grafo:', g);
        T.falha('deveriam sobrar 3 arestas, sobraram ' + T.contaArestas(g) +
                '\n       (removeu arestas normais junto?)');
    }
};

export const t3_6 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Grafo com 6 arestas. destruir_arestas_l precisa liberar todos os\n' +
              '  nos e deixar g[i].inicio = NULL para todo i (grafo vazio).');
    T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 0, 2);
    T.chamar('inserir_aresta_l', g, 1, 3); T.chamar('inserir_aresta_l', g, 3, 3);
    T.chamar('inserir_aresta_l', g, 5, 6); T.chamar('inserir_aresta_l', g, 6, 7);
    T.chamar('destruir_arestas_l', g);
    T.checaStub();
    for (let i = 0; i < V; i++)
        if (T.vCampo(g, i, 'inicio') !== 0) {
            T.desenhaLista('seu grafo:', g);
            T.falha('g[' + i + '].inicio deveria ser NULL depois de destruir_arestas_l');
        }
};

export const t3_7 = (T) => {
    const g1 = T.grafoNovo();
    const g2 = T.grafoNovo();
    T.cenario('g1 = {0->1, 0->2, 3->4, 5->5}   g2 = {0->2, 5->5, 6->7}\n' +
              '  g3 deve conter as arestas de g1 que NAO estao em g2: 0->1 e 3->4.');
    T.chamar('inserir_aresta_l', g1, 0, 1); T.chamar('inserir_aresta_l', g1, 0, 2);
    T.chamar('inserir_aresta_l', g1, 3, 4); T.chamar('inserir_aresta_l', g1, 5, 5);
    T.chamar('inserir_aresta_l', g2, 0, 2); T.chamar('inserir_aresta_l', g2, 5, 5);
    T.chamar('inserir_aresta_l', g2, 6, 7);
    const g3 = T.chamar('diferenca_l', g1, g2);
    T.checaStub();
    if (!g3) T.falha('diferenca_l devolveu NULL');
    if (T.contaArestas(g3) !== 2 || !T.temAdj(g3, 0, 1) || !T.temAdj(g3, 3, 4)) {
        T.desenhaLista('g1:', g1);
        T.desenhaLista('g2:', g2);
        T.desenhaLista('seu g3:', g3);
        T.falha('g3 deveria ter exatamente 0->1 e 3->4 (2 arestas), tem ' + T.contaArestas(g3));
    }
    if (T.temAdj(g3, 6, 7))
        T.falha('g3 nao pode conter 6->7: essa aresta e de g2, nao de g1');
};

export const t3_8 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Primeiro um grafo completo com os ' + V + ' vertices (toda dupla i!=j\n' +
              '  ligada nos dois sentidos). Depois tiramos a aresta 3->6.');
    for (let i = 0; i < V; i++)
        for (let j = 0; j < V; j++)
            if (i !== j) T.chamar('inserir_aresta_l', g, i, j);
    T.esperaBool('completo_l(g)  -- grafo completo', T.chamar('completo_l', g), TRUE);
    T.chamar('excluir_aresta_l', g, 3, 6);
    T.esperaBool('completo_l(g)  -- faltando a aresta 3->6', T.chamar('completo_l', g), FALSE);
};

export const t3_9 = (T) => {
    const g = T.grafoNovo();
    T.cenario('g nao-dirigido com apenas 0-1 e 2-3 (4 arestas no total).\n' +
              '  O complemento tem toda dupla i!=j que NAO esta em g:\n' +
              '  ' + (V * (V - 1)) + ' - 4 = ' + (V * (V - 1) - 4) + ' arestas.');
    liga2(T, g, 0, 1);
    liga2(T, g, 2, 3);
    const gc = T.chamar('complemento_l', g);
    T.checaStub();
    if (!gc) T.falha('complemento_l devolveu NULL');
    if (T.temAdj(gc, 0, 1) || T.temAdj(gc, 1, 0) || T.temAdj(gc, 2, 3) || T.temAdj(gc, 3, 2)) {
        T.desenhaLista('seu complemento:', gc);
        T.falha('o complemento nao pode conter arestas que ja existiam em g');
    }
    for (let i = 0; i < V; i++)
        if (T.temAdj(gc, i, i)) {
            T.desenhaLista('seu complemento:', gc);
            T.falha('o complemento criou o laco ' + i + '->' + i + '; laco nao e par de\n' +
                    '       vertices distintos, entao nao entra');
        }
    if (T.contaArestas(gc) !== V * (V - 1) - 4) {
        T.desenhaLista('g:', g);
        T.desenhaLista('seu complemento:', gc);
        T.falha('o complemento deveria ter ' + (V * (V - 1) - 4) + ' arestas, tem ' + T.contaArestas(gc));
    }
    if (T.contaArestas(g) !== 4)
        T.falha('complemento_l NAO pode alterar o grafo original g');
};

/* ===================== NIVEL 4 : PROFUNDIDADE ======================== */

export const t4_1 = (T) => {
    const g = T.grafoNovo();
    T.cenario('ARMADILHA. As flags estao sujas (valem 5) e o grafo tem 3 arestas.\n' +
              '  zerar_flags deve zerar SO as flags. O campo inicio guarda as\n' +
              '  arestas e nao pode ser tocado.');
    T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 5, 6);
    for (let i = 0; i < V; i++) T.vPor(g, i, 'flag', 5);
    T.chamar('zerar_flags', g);
    T.checaStub();
    for (let i = 0; i < V; i++)
        if (T.vCampo(g, i, 'flag') !== 0)
            T.falha('g[' + i + '].flag deveria ser 0 e vale ' + T.vCampo(g, i, 'flag'));
    if (T.contaArestas(g) !== 3) {
        T.desenhaLista('seu grafo depois de zerar_flags:', g);
        T.falha('zerar_flags apagou as arestas! sobraram ' + T.contaArestas(g) + ' de 3.\n' +
                '       Voce escreveu g[i].inicio = NULL no lugar de g[i].flag = 0?');
    }
};

export const t4_2 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Grafo dirigido 0->1, 1->2, 2->0 (ciclo) e 3->4 separado.\n' +
              '  Rodando prof(g, 0), os vertices 0,1,2 ficam pretos (flag 2)\n' +
              '  e todos os outros continuam brancos (flag 0).');
    T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 2, 0); T.chamar('inserir_aresta_l', g, 3, 4);
    T.chamar('zerar_flags', g);
    T.chamar('prof', g, 0);
    T.checaStub();
    for (let i = 0; i < V; i++) {
        const esperado = (i <= 2) ? 2 : 0;
        if (T.vCampo(g, i, 'flag') !== esperado) {
            T.desenhaLista('grafo:', g);
            T.desenhaFlags('suas flags depois de prof(g, 0):', g);
            T.falha('g[' + i + '].flag deveria ser ' + esperado + ' e vale ' + T.vCampo(g, i, 'flag') +
                    '\n       (todo vertice visitado termina PRETO, flag = 2)');
        }
    }
};

export const t4_3 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Caminho 0->1->2->3 e, separado, 4->5.\n' +
              '  Lembre: quem chama a funcao zera as flags e o achou antes.');
    T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 2, 3); T.chamar('inserir_aresta_l', g, 4, 5);

    const rodar = (a, b) => {
        T.chamar('zerar_flags', g);
        const achou = T.celula(0);
        T.chamar('prof_caminho', g, a, b, achou);
        return T.lerCelula(achou);
    };
    T.esperaBool('prof_caminho(g, 0, 3, &achou)  -- existe 0->1->2->3', rodar(0, 3), TRUE);
    T.esperaBool('prof_caminho(g, 0, 5, &achou)  -- 5 esta em outro pedaco', rodar(0, 5), FALSE);
    T.esperaBool('prof_caminho(g, 2, 2, &achou)  -- origem igual ao destino', rodar(2, 2), TRUE);
    T.esperaBool('prof_caminho(g, 3, 0, &achou)  -- dirigido: nao volta', rodar(3, 0), FALSE);
};

export const t4_4 = (T) => {
    T.cenario('ARMADILHA. Primeiro um DIAMANTE aciclico: 0->1, 0->2, 1->3, 2->3.\n' +
              '  O vertice 3 e alcancado duas vezes, mas isso NAO e ciclo: ele ja\n' +
              '  esta PRETO na segunda visita. So aresta para vertice CINZA fecha\n' +
              '  ciclo.');
    {
        const g = T.grafoNovo();
        T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 0, 2);
        T.chamar('inserir_aresta_l', g, 1, 3); T.chamar('inserir_aresta_l', g, 2, 3);
        T.esperaBool('tem_ciclo_dir(g)  -- diamante, aciclico', T.chamar('tem_ciclo_dir', g), FALSE);
        T.chamar('inserir_aresta_l', g, 3, 0);
        T.esperaBool('tem_ciclo_dir(g)  -- depois de fechar com 3->0', T.chamar('tem_ciclo_dir', g), TRUE);
    }
    {
        const h = T.grafoNovo();
        T.chamar('inserir_aresta_l', h, 6, 6);
        T.esperaBool('tem_ciclo_dir(h)  -- so o laco 6->6', T.chamar('tem_ciclo_dir', h), TRUE);
    }
    {
        const k = T.grafoNovo();
        T.chamar('inserir_aresta_l', k, 0, 1);
        T.chamar('inserir_aresta_l', k, 5, 6); T.chamar('inserir_aresta_l', k, 6, 7);
        T.chamar('inserir_aresta_l', k, 7, 5);
        T.esperaBool('tem_ciclo_dir(k)  -- ciclo em pedaco que nao contem o vertice 0',
                     T.chamar('tem_ciclo_dir', k), TRUE);
    }
};

export const t4_5 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Caminho 0->1->2->3, e 4->5 fora do alcance.\n' +
              '  tipos: 0=aula(1) 1=auditorio(2) 2=auditorio(2) 3=biblioteca(3)\n' +
              '         4=auditorio(2) 5=auditorio(2)\n' +
              '  Quantos auditorios (tipo 2) da para alcancar saindo do 0?');
    T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 2, 3); T.chamar('inserir_aresta_l', g, 4, 5);
    T.vPor(g, 0, 'tipo', 1); T.vPor(g, 1, 'tipo', 2); T.vPor(g, 2, 'tipo', 2);
    T.vPor(g, 3, 'tipo', 3); T.vPor(g, 4, 'tipo', 2); T.vPor(g, 5, 'tipo', 2);

    const rodar = (i) => {
        T.chamar('zerar_flags', g);
        const cont = T.celula(0);
        T.chamar('contar_tipo_x', g, i, 2, cont);
        return T.lerCelula(cont);
    };
    T.esperaInt('contar_tipo_x(g, 0, 2, &cont)  -- saindo do 0', rodar(0), 2);
    T.esperaInt('contar_tipo_x(g, 1, 2, &cont)  -- o proprio 1 e tipo 2 e conta', rodar(1), 2);
    T.esperaInt('contar_tipo_x(g, 3, 2, &cont)  -- do 3 nao sai nada', rodar(3), 0);
};

export const t4_6 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Grafo NAO-dirigido com 3 grupos: {0,1,4}, {2,3} e {5,6,7}.');
    liga2(T, g, 0, 1); liga2(T, g, 1, 4);
    liga2(T, g, 2, 3);
    liga2(T, g, 5, 6); liga2(T, g, 6, 7);
    T.esperaInt('contar_grupos(g)', T.chamar('contar_grupos', g), 3);
};

export const t4_7 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Grupos: {0,1,4,6} com 4 vertices, {2,3} e {5,7} com 2 cada.\n' +
              '  A funcao deve devolver um vertice qualquer do MAIOR grupo.');
    liga2(T, g, 0, 1); liga2(T, g, 1, 4); liga2(T, g, 4, 6);
    liga2(T, g, 2, 3);
    liga2(T, g, 5, 7);
    const r = T.chamar('maior_grupo_inicio', g);
    T.checaStub();
    if (r !== 0 && r !== 1 && r !== 4 && r !== 6) {
        T.desenhaLista('grafo:', g);
        T.falha('maior_grupo_inicio devolveu ' + r + '.\n' +
                '       O maior grupo e {0,1,4,6}, entao a resposta precisa ser\n' +
                '       um desses quatro vertices.');
    }
};

export const t4_8 = (T) => {
    T.cenario('Arvore enraizada = dirigida + aciclica + conexa + UMA UNICA fonte.\n' +
              '  Arvore usada: 0->1, 0->2, 1->3, 1->4, 2->5, 2->6, 3->7\n' +
              '  (cobre os ' + V + ' vertices, raiz = 0).');
    {
        const g = T.grafoNovo();
        T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 0, 2);
        T.chamar('inserir_aresta_l', g, 1, 3); T.chamar('inserir_aresta_l', g, 1, 4);
        T.chamar('inserir_aresta_l', g, 2, 5); T.chamar('inserir_aresta_l', g, 2, 6);
        T.chamar('inserir_aresta_l', g, 3, 7);
        T.esperaBool('arvore_enraizada(g)  -- arvore de verdade',
                     T.chamar('arvore_enraizada', g), TRUE);
        T.chamar('inserir_aresta_l', g, 7, 0);
        T.esperaBool('arvore_enraizada(g)  -- depois de 7->0 virou ciclica',
                     T.chamar('arvore_enraizada', g), FALSE);
    }
    {
        const h = T.grafoNovo();
        T.chamar('inserir_aresta_l', h, 0, 1); T.chamar('inserir_aresta_l', h, 0, 2);
        T.chamar('inserir_aresta_l', h, 1, 3); T.chamar('inserir_aresta_l', h, 1, 4);
        T.chamar('inserir_aresta_l', h, 2, 5); T.chamar('inserir_aresta_l', h, 2, 6);
        T.esperaBool('arvore_enraizada(h)  -- sem 3->7, o 7 vira uma segunda fonte',
                     T.chamar('arvore_enraizada', h), FALSE);
    }
    {
        const k = T.grafoNovo();
        T.chamar('inserir_aresta_l', k, 0, 1); T.chamar('inserir_aresta_l', k, 0, 2);
        T.chamar('inserir_aresta_l', k, 1, 3); T.chamar('inserir_aresta_l', k, 1, 4);
        T.chamar('inserir_aresta_l', k, 2, 5); T.chamar('inserir_aresta_l', k, 2, 6);
        T.chamar('inserir_aresta_l', k, 3, 7); T.chamar('inserir_aresta_l', k, 4, 7);
        T.esperaBool('arvore_enraizada(k)  -- 7 tem dois pais, mas o grafo continua\n' +
                     '                          aciclico, conexo e com uma unica fonte:\n' +
                     '                          pela definicao do enunciado, isso e arvore',
                     T.chamar('arvore_enraizada', k), TRUE);
    }
};

/* ===================== NIVEL 5 : FILA + LARGURA ====================== */

export const t5_1 = (T) => {
    const F = T.novaFila();
    T.cenario('ARMADILHA TRIPLA.\n' +
              '  1) entrar_fila numa fila VAZIA nao pode usar f->ultimo->prox.\n' +
              '  2) o vertice 0 e um valor valido: nao de return quando valor==0.\n' +
              '  3) depois de esvaziar, a fila precisa voltar a funcionar.');
    T.chamar('inicializar_fila', F);
    T.checaStub();
    if (T.filaInicio(F) !== 0 || T.filaUltimo(F) !== 0)
        T.falha('depois de inicializar_fila, inicio e ultimo precisam ser NULL');

    T.chamar('entrar_fila', F, 0);
    T.chamar('entrar_fila', F, 3);
    T.chamar('entrar_fila', F, 7);
    T.checaStub();
    if (T.filaInicio(F) === 0) T.falha('entrar_fila nao inseriu nada (f->inicio continua NULL)');

    const a = T.chamar('sair_fila', F);
    const b = T.chamar('sair_fila', F);
    const c = T.chamar('sair_fila', F);
    T.checaStub();
    if (a !== 0 || b !== 3 || c !== 7)
        T.falha('a fila e FIFO: entrou 0, 3, 7 entao tem que sair 0, 3, 7.\n' +
                '       saiu: ' + a + ', ' + b + ', ' + c + '\n' +
                '       (se o 0 sumiu, o culpado e um if (!valor) return)');
    if (T.filaInicio(F) !== 0)
        T.falha('a fila deveria estar vazia (f->inicio == NULL) depois de 3 saidas');

    T.chamar('entrar_fila', F, 5);
    T.checaStub();
    if (T.filaInicio(F) === 0)
        T.falha('reutilizar a fila depois de esvaziar nao funcionou.\n' +
                '       Quando o ultimo elemento sai, f->ultimo tambem precisa\n' +
                '       voltar a ser NULL.');
    T.esperaInt('sair_fila depois de reencher a fila', T.chamar('sair_fila', F), 5);
};

export const t5_2 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Grafo dirigido 0->1, 0->2, 1->3, 2->3, 3->4 e 6->7 separado.\n' +
              '  Depois de largura_l(g, 0) os vertices 0..4 ficam pretos (2)\n' +
              '  e 5, 6, 7 continuam brancos (0). As arestas continuam intactas.');
    T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 0, 2);
    T.chamar('inserir_aresta_l', g, 1, 3); T.chamar('inserir_aresta_l', g, 2, 3);
    T.chamar('inserir_aresta_l', g, 3, 4); T.chamar('inserir_aresta_l', g, 6, 7);
    T.chamar('largura_l', g, 0);
    T.checaStub();
    for (let i = 0; i < V; i++) {
        const esperado = (i <= 4) ? 2 : 0;
        if (T.vCampo(g, i, 'flag') !== esperado) {
            T.desenhaLista('grafo:', g);
            T.desenhaFlags('suas flags depois de largura_l(g, 0):', g);
            T.falha('g[' + i + '].flag deveria ser ' + esperado + ' e vale ' + T.vCampo(g, i, 'flag') +
                    '\n       Ao TIRAR um vertice da fila ele vira preto (2);\n' +
                    '       ao ENFILEIRAR um vizinho branco ele vira cinza (1).\n' +
                    '       Cuidado: marque g[p->adj].flag, e nao g[i].flag.');
        }
    }
    if (T.contaArestas(g) !== 6)
        T.falha('a busca destruiu arestas do grafo (sobraram ' + T.contaArestas(g) + ' de 6)');
};

export const t5_3 = (T) => {
    const m = T.matriz();
    const flags = T.vetor(V);
    T.cenario('Mesmo grafo do exercicio anterior, agora em MATRIZ.\n' +
              '  Em vez do campo flag, a marcacao vai no vetor flags[].');
    T.chamar('inicializar_m', m);
    T.chamar('inserir_aresta_m', m, 0, 1); T.chamar('inserir_aresta_m', m, 0, 2);
    T.chamar('inserir_aresta_m', m, 1, 3); T.chamar('inserir_aresta_m', m, 2, 3);
    T.chamar('inserir_aresta_m', m, 3, 4); T.chamar('inserir_aresta_m', m, 6, 7);
    for (let i = 0; i < V; i++) T.vSet(flags, i, 9);
    T.chamar('largura_m', m, 0, flags);
    T.checaStub();
    for (let i = 0; i < V; i++) {
        const esperado = (i <= 4) ? 2 : 0;
        if (T.vGet(flags, i) !== esperado) {
            T.desenhaMatriz('matriz:', m);
            T.desenhaVetor('suas flags:', flags, V);
            T.falha('flags[' + i + '] deveria ser ' + esperado + ' e vale ' + T.vGet(flags, i) +
                    '\n       (a propria funcao precisa zerar o vetor flags antes)');
        }
    }
};

export const t5_4 = (T) => {
    const g = T.grafoNovo();
    T.cenario('ARMADILHA: aqui a profundidade daria a resposta ERRADA.\n' +
              '  Grafo: 0->1, 1->2, 2->3 (corredor longo) e 0->4 (vizinho direto).\n' +
              '  Postos (tipo 9) estao no 3 e no 4. O mais PROXIMO do 0 e o 4,\n' +
              '  a 1 aresta. So a busca em LARGURA garante isso.');
    /* A ordem importa: inserir_aresta_l insere na CABECA, entao o ultimo
       inserido e o primeiro visitado. Com 0->4 antes de 0->1 a lista do 0
       fica 1 -> 4, e a profundidade desce o corredor e erra a resposta. */
    T.chamar('inserir_aresta_l', g, 0, 4);
    T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 2, 3);
    T.vPor(g, 3, 'tipo', 9);
    T.vPor(g, 4, 'tipo', 9);
    T.esperaInt('tipo_x_mais_prox(g, 0, 9)', T.chamar('tipo_x_mais_prox', g, 0, 9), 4);
    T.esperaInt('tipo_x_mais_prox(g, 0, 5)  -- nao existe tipo 5 no grafo',
                T.chamar('tipo_x_mais_prox', g, 0, 5), -1);
    T.esperaInt('tipo_x_mais_prox(g, 4, 9)  -- o proprio vertice atual ja e tipo 9',
                T.chamar('tipo_x_mais_prox', g, 4, 9), 4);
    T.esperaInt('tipo_x_mais_prox(g, 1, 9)  -- do 1 so da para chegar no 3',
                T.chamar('tipo_x_mais_prox', g, 1, 9), 3);
};

export const t5_5 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Grafo dirigido 0->1, 1->2, 2->3, 0->4, 4->3 e 6->7 separado.\n' +
              '  De 0 ate 3 existem dois caminhos: 0-1-2-3 (3 arestas) e\n' +
              '  0-4-3 (2 arestas). O comprimento e o MENOR deles.');
    T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 2, 3); T.chamar('inserir_aresta_l', g, 0, 4);
    T.chamar('inserir_aresta_l', g, 4, 3); T.chamar('inserir_aresta_l', g, 6, 7);
    T.esperaInt('comprimento(g, 0, 3)  -- o atalho tem 2 arestas', T.chamar('comprimento', g, 0, 3), 2);
    T.esperaInt('comprimento(g, 0, 0)  -- de um vertice ate ele mesmo', T.chamar('comprimento', g, 0, 0), 0);
    T.esperaInt('comprimento(g, 0, 1)', T.chamar('comprimento', g, 0, 1), 1);
    T.esperaInt('comprimento(g, 0, 7)  -- inalcancavel, devolva INFINITO',
                T.chamar('comprimento', g, 0, 7), INFINITO);
};

export const t5_6 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Rede social NAO-dirigida:\n' +
              '     0 - 1     0 - 2     1 - 3     3 - 5     6 - 7\n' +
              '  Distancias a partir do 0: grau 1 = {1,2}, grau 2 = {3},\n' +
              '  grau 3 = {5}. Com N = 2 a lista tem 0, 1, 2 e 3 (o proprio 0\n' +
              '  entra, distancia zero). Ordem nao importa.');
    liga2(T, g, 0, 1); liga2(T, g, 0, 2); liga2(T, g, 1, 3);
    liga2(T, g, 3, 5); liga2(T, g, 6, 7);
    {
        const r = T.chamar('vertices_raio_n', g, 0, 2);
        T.checaStub();
        const vet = T.listaParaVetor(r);
        const tem = new Array(V).fill(0);
        for (const x of vet) if (x >= 0 && x < V) tem[x]++;
        if (vet.length !== 4 || !tem[0] || !tem[1] || !tem[2] || !tem[3]) {
            T.desenhaLista('grafo:', g);
            T.imprimir('       sua lista tem ' + vet.length + ' elemento(s): ' + vet.join(' ') + '\n');
            T.falha('a lista deveria ter exatamente 0, 1, 2 e 3 (4 elementos)');
        }
        if (tem[5]) T.falha('o vertice 5 esta a distancia 3, nao pode entrar com N = 2');
    }
    {
        const r = T.chamar('vertices_raio_n', g, 0, 1);
        T.checaStub();
        const vet = T.listaParaVetor(r);
        const tem = new Array(V).fill(0);
        for (const x of vet) if (x >= 0 && x < V) tem[x]++;
        if (vet.length !== 3 || !tem[0] || !tem[1] || !tem[2]) {
            T.imprimir('       com N = 1 sua lista tem ' + vet.length + ' elemento(s): ' + vet.join(' ') + '\n');
            T.falha('com N = 1 a lista deveria ter 0, 1 e 2 (3 elementos)');
        }
    }
};

export const t5_7 = (T) => {
    const g = T.grafoNovo();
    const dist = T.vetor(V);
    T.cenario('Grafo dirigido 0->1, 1->2, 2->3, 0->4, 4->3, 3->5, e 6->7 solto.\n' +
              '  distancias(g, 0, dist) preenche dist[] com o numero de arestas\n' +
              '  do menor caminho de 0 ate cada vertice (INFINITO se nao chega).');
    T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 2, 3); T.chamar('inserir_aresta_l', g, 0, 4);
    T.chamar('inserir_aresta_l', g, 4, 3); T.chamar('inserir_aresta_l', g, 3, 5);
    T.chamar('inserir_aresta_l', g, 6, 7);
    for (let i = 0; i < V; i++) T.vSet(dist, i, -99);
    T.chamar('distancias', g, 0, dist);
    T.checaStub();
    const esperado = [0, 1, 2, 2, 1, 3, INFINITO, INFINITO];
    for (let i = 0; i < V; i++)
        if (T.vGet(dist, i) !== esperado[i]) {
            T.desenhaLista('grafo:', g);
            T.desenhaVetor('suas distancias:', dist, V);
            T.desenhaNumeros('esperado:       ',
                esperado.map(x => x >= INFINITO ? 'inf' : x));
            T.falha('dist[' + i + '] deveria ser ' + esperado[i] + ' e vale ' + T.vGet(dist, i));
        }
};

/* ===================== NIVEL 6 : PONDERADOS ========================== */

export const t6_1 = (T) => {
    const m = T.matriz();
    const custos = T.vetor(V);
    T.cenario('ARMADILHA: aqui o caminho com MENOS arestas nao e o mais BARATO.\n' +
              '  Arestas (dirigidas, com peso):\n' +
              '     0->1 = 1     1->2 = 2     2->3 = 1     0->3 = 9\n' +
              '     0->4 = 4     4->5 = 1     3->5 = 1\n' +
              '  Ate o 3: direto custa 9, mas 0-1-2-3 custa so 4.\n' +
              '  Na matriz, m[i][j] == 0 significa que NAO existe aresta.');
    for (let i = 0; i < V; i++) for (let j = 0; j < V; j++) T.mSet(m, i, j, 0);
    T.mSet(m, 0, 1, 1); T.mSet(m, 1, 2, 2); T.mSet(m, 2, 3, 1); T.mSet(m, 0, 3, 9);
    T.mSet(m, 0, 4, 4); T.mSet(m, 4, 5, 1); T.mSet(m, 3, 5, 1);
    for (let i = 0; i < V; i++) T.vSet(custos, i, -99);
    T.chamar('custo', m, 0, custos);
    T.checaStub();
    const esperado = [0, 1, 3, 4, 4, 5, INFINITO, INFINITO];
    for (let i = 0; i < V; i++)
        if (T.vGet(custos, i) !== esperado[i]) {
            T.desenhaVetor('seus custos:', custos, V);
            T.desenhaNumeros('esperado:   ', esperado.map(x => x >= INFINITO ? 'inf' : x));
            T.falha('custos[' + i + '] deveria ser ' + esperado[i] + ' e vale ' + T.vGet(custos, i));
        }
};

export const t6_2 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Vizinhos do vertice 0: 1, 2 e 3. As cores ja atribuidas sao\n' +
              '  cor[1] = 1, cor[2] = 3, cor[3] = 0 (ainda sem cor).\n' +
              '  A menor cor livre para o 0 e a 2.');
    liga2(T, g, 0, 1); liga2(T, g, 0, 2); liga2(T, g, 0, 3);
    T.vPor(g, 1, 'cor', 1); T.vPor(g, 2, 'cor', 3); T.vPor(g, 3, 'cor', 0);
    T.esperaInt('achar_cor(g, 0)', T.chamar('achar_cor', g, 0), 2);
    T.vPor(g, 3, 'cor', 2);
    const c = T.chamar('achar_cor', g, 0);
    T.checaStub();
    if (c !== 4)
        T.falha('com os vizinhos usando as cores 1, 3 e 2, a menor cor livre\n' +
                '       para o vertice 0 e a 4 (voce devolveu ' + c + ')');
    {
        const h = T.grafoNovo();
        T.esperaInt('achar_cor(h, 5)  -- vertice sem nenhum vizinho', T.chamar('achar_cor', h, 5), 1);
    }
};

export const t6_3 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Coloracao de um TRIANGULO 0-1-2 mais o vertice 3 ligado ao 0.\n' +
              '  Um triangulo exige 3 cores. Vizinhos nunca podem ter a mesma\n' +
              '  cor, e k guarda quantas cores foram usadas.');
    liga2(T, g, 0, 1); liga2(T, g, 1, 2); liga2(T, g, 0, 2); liga2(T, g, 0, 3);
    for (let i = 0; i < V; i++) T.vPor(g, i, 'cor', 0);
    const k = T.celula(0);
    T.chamar('colorir', g, 0, k);
    T.checaStub();
    for (let i = 0; i <= 3; i++)
        if (T.vCampo(g, i, 'cor') <= 0)
            T.falha('o vertice ' + i + ' ficou sem cor (cor = ' + T.vCampo(g, i, 'cor') + ')');
    const mostrarCores = () => {
        let s = '       cores: ';
        for (let j = 0; j < V; j++) s += j + ':' + T.vCampo(g, j, 'cor') + ' ';
        T.imprimir(s + '\n');
    };
    for (let i = 0; i < V; i++)
        for (const p of T.nosDe(g, i)) {
            const viz = T.nCampo(p, 'adj');
            if (T.vCampo(g, i, 'cor') === T.vCampo(g, viz, 'cor')) {
                mostrarCores();
                T.falha('conflito: ' + i + ' e ' + viz + ' sao vizinhos e ficaram os dois com a cor ' +
                        T.vCampo(g, i, 'cor'));
            }
        }
    if (T.lerCelula(k) !== 3) {
        mostrarCores();
        T.falha('k deveria terminar valendo 3 (o triangulo exige 3 cores) e vale ' + T.lerCelula(k));
    }
};

export const t6_4 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Grafo nao-dirigido PONDERADO:\n' +
              '     0 - 1 custa 10     0 - 2 custa 3     1 - 3 custa 7\n' +
              '     4 - 5 custa 5\n' +
              '  Com c = 5, sobram so as arestas de custo MAIOR que 5:\n' +
              '  0-1 (10) e 1-3 (7). Nos dois sentidos, entao 4 arestas.');
    liga2(T, g, 0, 1); liga2(T, g, 0, 2); liga2(T, g, 1, 3); liga2(T, g, 4, 5);
    T.porPeso(g, 0, 1, 10); T.porPeso(g, 1, 0, 10);
    T.porPeso(g, 0, 2, 3);  T.porPeso(g, 2, 0, 3);
    T.porPeso(g, 1, 3, 7);  T.porPeso(g, 3, 1, 7);
    T.porPeso(g, 4, 5, 5);  T.porPeso(g, 5, 4, 5);
    const r = T.chamar('filtrar_custo', g, 5);
    T.checaStub();
    if (!r) T.falha('filtrar_custo devolveu NULL');
    if (!T.temAdj(r, 0, 1) || !T.temAdj(r, 1, 0) || !T.temAdj(r, 1, 3) || !T.temAdj(r, 3, 1)) {
        T.desenhaLista('seu resultado:', r);
        T.falha('faltaram arestas de custo maior que 5 (0-1 vale 10, 1-3 vale 7)');
    }
    if (T.temAdj(r, 0, 2) || T.temAdj(r, 4, 5)) {
        T.desenhaLista('seu resultado:', r);
        T.falha('sobraram arestas baratas: 0-2 custa 3 e 4-5 custa 5.\n' +
                '       O criterio e MAIOR que c, entao custo == 5 tambem sai.');
    }
    if (T.contaArestas(r) !== 4) {
        T.desenhaLista('seu resultado:', r);
        T.falha('o resultado deveria ter 4 arestas, tem ' + T.contaArestas(r));
    }
};

export const t6_5 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Grafo dirigido 0->1, 1->2, 2->3, 0->4, 4->3, 3->5 e 6->7 solto.\n' +
              '  O menor caminho de 0 ate 5 e a lista 0, 4, 3, 5 -- nessa ordem,\n' +
              '  comecando em a e terminando em b.');
    T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 2, 3); T.chamar('inserir_aresta_l', g, 0, 4);
    T.chamar('inserir_aresta_l', g, 4, 3); T.chamar('inserir_aresta_l', g, 3, 5);
    T.chamar('inserir_aresta_l', g, 6, 7);
    {
        const r = T.chamar('caminho_bfs', g, 0, 5);
        T.checaStub();
        if (!r) T.falha('existe caminho de 0 ate 5, mas a funcao devolveu NULL');
        const vet = T.listaParaVetor(r);
        if (vet.length !== 4 || vet[0] !== 0 || vet[1] !== 4 || vet[2] !== 3 || vet[3] !== 5) {
            T.desenhaLista('grafo:', g);
            T.imprimir('       seu caminho: ' + vet.join(' ') + '\n       esperado   : 0 4 3 5\n');
            T.falha('caminho errado (a lista precisa sair de a e chegar em b)');
        }
    }
    {
        const r = T.chamar('caminho_bfs', g, 0, 7);
        T.checaStub();
        if (r !== 0) T.falha('nao existe caminho de 0 ate 7: devolva NULL');
    }
    {
        const r = T.chamar('caminho_bfs', g, 2, 2);
        T.checaStub();
        const vet = T.listaParaVetor(r);
        if (vet.length !== 1 || vet[0] !== 2)
            T.falha('o caminho de 2 ate 2 e uma lista com um unico elemento: 2');
    }
};

/* ===================== NIVEL 7 : DESAFIOS ============================ */

export const t7_1 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Rede de emails. A aresta u -> v com id == 99 quer dizer que u\n' +
              '  mandou a mensagem 99 para v.\n' +
              '     0 -> 1 (99)   1 -> 2 (99)   2 -> 3 (99)   3 -> 1 (99)\n' +
              '     6 -> 7 (99)   4 -> 5 (id 7, outra mensagem)\n' +
              '  Mandaram a 99: 0, 1, 2, 3 e 6.  Receberam a 99: 1, 2, 3 e 7.\n' +
              '  Suspeitos de terem comecado = mandaram mas nunca receberam:\n' +
              '  os usuarios 0 e 6.');
    const par = [[0, 1, 99], [1, 2, 99], [2, 3, 99], [3, 1, 99], [6, 7, 99], [4, 5, 7]];
    for (const [a, b, id] of par) { T.chamar('inserir_aresta_l', g, a, b); T.porId(g, a, b, id); }
    const r = T.chamar('suspeitos_spam', g, 99);
    T.checaStub();
    if (!confereLista(T, r, [0, 6])) {
        T.desenhaLista('grafo:', g);
        mostraLista(T, r);
        T.falha('a lista deveria ter exatamente os usuarios 0 e 6');
    }
};

export const t7_2 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Unidades da empresa e o pais de cada uma:\n' +
              '     0=BR(1) 1=BR(2) 2=AR(3) 3=BR(2) 4=US(4) 5=BR(1) 6=PT(5) 7=BR(1)\n' +
              '  Chamadas: 0 liga para 1, 2 e 3 -> paises {2, 3, 2} = 2 paises.\n' +
              '            1 liga para 4, 6 e 7 -> paises {4, 5, 1} = 3 paises.\n' +
              '            2 liga para 3        -> 1 pais.\n' +
              '  Quem fala com mais paises diferentes e a unidade 1.');
    const paises = [1, 2, 3, 2, 4, 1, 5, 1];
    for (let i = 0; i < V; i++) T.vPor(g, i, 'pais', paises[i]);
    for (const [a, b] of [[0, 1], [0, 2], [0, 3], [1, 4], [1, 6], [1, 7], [2, 3]])
        T.chamar('inserir_aresta_l', g, a, b);
    T.esperaInt('mais_paises(g)', T.chamar('mais_paises', g), 1);
};

export const t7_3 = (T) => {
    T.cenario('ARMADILHA. Num grafo NAO-dirigido toda aresta aparece nos dois\n' +
              '  sentidos, entao ao visitar 1 voce ve o 0 de novo -- e isso NAO e\n' +
              '  ciclo, e so a aresta de volta para o pai. So conta como ciclo o\n' +
              '  vizinho ja visitado que NAO e o pai.');
    {
        const g = T.grafoNovo();
        liga2(T, g, 0, 1); liga2(T, g, 1, 2); liga2(T, g, 2, 3);
        T.esperaBool('tem_ciclo_nao_dir(g)  -- caminho 0-1-2-3, sem ciclo',
                     T.chamar('tem_ciclo_nao_dir', g), FALSE);
        liga2(T, g, 3, 0);
        T.esperaBool('tem_ciclo_nao_dir(g)  -- depois de fechar com 3-0',
                     T.chamar('tem_ciclo_nao_dir', g), TRUE);
    }
    {
        const h = T.grafoNovo();
        liga2(T, h, 0, 1);
        T.chamar('inserir_aresta_l', h, 5, 5);
        T.esperaBool('tem_ciclo_nao_dir(h)  -- laco 5-5 num pedaco separado',
                     T.chamar('tem_ciclo_nao_dir', h), TRUE);
    }
    {
        const k = T.grafoNovo();
        liga2(T, k, 0, 1);
        liga2(T, k, 4, 5); liga2(T, k, 5, 6); liga2(T, k, 6, 4);
        T.esperaBool('tem_ciclo_nao_dir(k)  -- triangulo 4-5-6 longe do vertice 0',
                     T.chamar('tem_ciclo_nao_dir', k), TRUE);
    }
};

export const t7_4 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Grafo dirigido 0->1, 1->2, 2->0 (ciclo) e 3->4 fora dele.\n' +
              '  Tirar UMA aresta de volta ja desfaz o ciclo. Nao vale apagar\n' +
              '  mais do que isso: as outras 3 arestas continuam la.');
    T.chamar('inserir_aresta_l', g, 0, 1); T.chamar('inserir_aresta_l', g, 1, 2);
    T.chamar('inserir_aresta_l', g, 2, 0); T.chamar('inserir_aresta_l', g, 3, 4);
    T.esperaBool('remover_aresta_ciclo(g)  -- existe ciclo para desfazer',
                 T.chamar('remover_aresta_ciclo', g), TRUE);
    T.checaStub();
    if (T.contaArestas(g) !== 3) {
        T.desenhaLista('seu grafo:', g);
        T.falha('deveriam sobrar 3 arestas (uma so foi removida), sobraram ' + T.contaArestas(g));
    }
    T.esperaBool('tem_ciclo_dir(g)  -- o ciclo tem que ter sumido',
                 T.chamar('tem_ciclo_dir', g), FALSE);
    if (!T.temAdj(g, 3, 4)) {
        T.desenhaLista('seu grafo:', g);
        T.falha('a aresta 3->4 nao tinha nada a ver com o ciclo e foi removida');
    }
    T.esperaBool('remover_aresta_ciclo(g)  -- agora nao ha mais ciclo',
                 T.chamar('remover_aresta_ciclo', g), FALSE);
};

export const t7_5 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Grupos: {0,1,4,6} com 4 vertices, {2,3} e {5,7} com 2 cada.\n' +
              '  A resposta e a lista ligada com os vertices do maior grupo.\n' +
              '  A ordem da lista nao importa.');
    liga2(T, g, 0, 1); liga2(T, g, 1, 4); liga2(T, g, 4, 6);
    liga2(T, g, 2, 3);
    liga2(T, g, 5, 7);
    const r = T.chamar('maior_grupo_lista', g);
    T.checaStub();
    if (!confereLista(T, r, [0, 1, 4, 6])) {
        T.desenhaLista('grafo:', g);
        mostraLista(T, r);
        T.falha('a lista deveria ter exatamente 0, 1, 4 e 6');
    }
};

export const t7_6 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Salas de aula. O campo tipo guarda a OCUPACAO: 0 = sala vazia.\n' +
              '     ligacoes: 0-1  0-2  1-3  2-4  0-5\n' +
              '     ocupacao: 0=5  1=0  2=0  3=0  4=7  5=9  6=0  7=0\n' +
              '  Saindo da sala 0: a 1 corredor estao a 1 e a 2, as DUAS vazias.\n' +
              '  A sala 3 tambem esta vazia, mas a 2 corredores: fica de fora.\n' +
              '  Havendo empate, a resposta traz todas as empatadas.');
    liga2(T, g, 0, 1); liga2(T, g, 0, 2); liga2(T, g, 1, 3);
    liga2(T, g, 2, 4); liga2(T, g, 0, 5);
    const ocupacao = [5, 0, 0, 0, 7, 9, 0, 0];
    for (let i = 0; i < V; i++) T.vPor(g, i, 'tipo', ocupacao[i]);
    {
        const r = T.chamar('vazias_mais_proximas', g, 0);
        T.checaStub();
        if (!confereLista(T, r, [1, 2])) {
            T.desenhaLista('grafo:', g);
            mostraLista(T, r);
            T.falha('a lista deveria ter exatamente as salas 1 e 2');
        }
    }
    {
        const r = T.chamar('vazias_mais_proximas', g, 3);
        T.checaStub();
        if (!confereLista(T, r, [3])) {
            mostraLista(T, r);
            T.falha('saindo da sala 3, que ja esta vazia, a resposta e a propria 3');
        }
    }
};

export const t7_7 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Rede de emails dirigida, com o peso da aresta contando quantas\n' +
              '  mensagens foram enviadas naquele sentido:\n' +
              '     0->1 = 3   e   1->0 = 4    -> total entre 0 e 1: 7\n' +
              '     0->2 = 2                   -> total entre 0 e 2: 2\n' +
              '     3->0 = 5                   -> total entre 0 e 3: 5\n' +
              '     0->4 = 1   e   4->0 = 1    -> total entre 0 e 4: 2\n' +
              '  Com k = 5, quem se relaciona com o 0 nesse volume: 1 e 3.');
    for (const [a, b, w] of [[0, 1, 3], [1, 0, 4], [0, 2, 2], [3, 0, 5], [0, 4, 1], [4, 0, 1]]) {
        T.chamar('inserir_aresta_l', g, a, b);
        T.porPeso(g, a, b, w);
    }
    {
        const r = T.chamar('relacionados_k', g, 0, 5);
        T.checaStub();
        if (!confereLista(T, r, [1, 3])) {
            T.desenhaLista('grafo:', g);
            mostraLista(T, r);
            T.falha('a lista deveria ter exatamente os usuarios 1 e 3');
        }
    }
    {
        const r = T.chamar('relacionados_k', g, 0, 100);
        T.checaStub();
        if (r !== 0) { mostraLista(T, r); T.falha('com k = 100 ninguem se qualifica: devolva NULL'); }
    }
};

export const t7_8 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Malha aerea. Cada voo tem uma companhia no campo cia:\n' +
              '     0->1 cia 1    1->3 cia 1    3->5 cia 1\n' +
              '     0->2 cia 2    2->3 cia 2\n' +
              '  Voando so pela companhia 1, de 0 ate 5: 0, 1, 3, 5.\n' +
              '  Voando so pela companhia 2 nao da para chegar no 5.');
    for (const [a, b, c] of [[0, 1, 1], [1, 3, 1], [3, 5, 1], [0, 2, 2], [2, 3, 2]]) {
        T.chamar('inserir_aresta_l', g, a, b);
        T.porCia(g, a, b, c);
    }
    {
        const r = T.chamar('rota_companhia', g, 0, 5, 1);
        T.checaStub();
        if (!r) T.falha('existe rota de 0 ate 5 pela companhia 1, mas veio NULL');
        const vet = T.listaParaVetor(r);
        if (vet.length !== 4 || vet[0] !== 0 || vet[1] !== 1 || vet[2] !== 3 || vet[3] !== 5) {
            mostraLista(T, r);
            T.imprimir('       esperado: 0 1 3 5\n');
            T.falha('rota errada (a lista sai da origem e chega no destino)');
        }
    }
    {
        const r = T.chamar('rota_companhia', g, 0, 5, 2);
        T.checaStub();
        if (r !== 0) {
            mostraLista(T, r);
            T.falha('pela companhia 2 nao ha rota ate o 5: devolva NULL\n' +
                    '       (o trecho 3->5 e da companhia 1)');
        }
    }
};

export const t7_9 = (T) => {
    const g = T.grafoNovo();
    T.cenario('Ruas: 0-1  1-2  0-3  3-4  4-5.\n' +
              '  Pontos de interesse do tipo 9 estao no 2 e no 5.\n' +
              '  Sem bloqueio, o 2 esta a 2 quarteiroes e o 5 a 3: vence o 2.\n' +
              '  Com o vertice 1 interditado, o unico caminho passa a ser\n' +
              '  0-3-4-5, entao a resposta vira 5.');
    liga2(T, g, 0, 1); liga2(T, g, 1, 2); liga2(T, g, 0, 3);
    liga2(T, g, 3, 4); liga2(T, g, 4, 5);
    T.vPor(g, 2, 'tipo', 9);
    T.vPor(g, 5, 'tipo', 9);
    T.esperaInt('tipo_x_evitando(g, 0, 9, 7)  -- o 7 nem esta no caminho',
                T.chamar('tipo_x_evitando', g, 0, 9, 7), 2);
    T.esperaInt('tipo_x_evitando(g, 0, 9, 1)  -- evitando o 1',
                T.chamar('tipo_x_evitando', g, 0, 9, 1), 5);
    T.esperaInt('tipo_x_evitando(g, 0, 9, 3)  -- evitando o 3',
                T.chamar('tipo_x_evitando', g, 0, 9, 3), 2);
    T.esperaInt('tipo_x_evitando(g, 0, 9, 0)  -- interditar a propria origem',
                T.chamar('tipo_x_evitando', g, 0, 9, 0), -1);
    T.esperaInt('tipo_x_evitando(g, 0, 4, 7)  -- nao existe tipo 4 no grafo',
                T.chamar('tipo_x_evitando', g, 0, 4, 7), -1);
};

/* ---------------------------------------------------------------------- */
export const TESTES = {
    t1_1, t1_2, t1_3, t1_4, t1_5, t1_6,
    t2_1, t2_2, t2_3, t2_4, t2_5, t2_6, t2_7,
    t3_1, t3_2, t3_3, t3_4, t3_5, t3_6, t3_7, t3_8, t3_9,
    t4_1, t4_2, t4_3, t4_4, t4_5, t4_6, t4_7, t4_8,
    t5_1, t5_2, t5_3, t5_4, t5_5, t5_6, t5_7,
    t6_1, t6_2, t6_3, t6_4, t6_5,
    t7_1, t7_2, t7_3, t7_4, t7_5, t7_6, t7_7, t7_8, t7_9
};
