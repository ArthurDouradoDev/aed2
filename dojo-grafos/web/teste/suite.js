/* ==========================================================================
 *  suite.js -- valida o interpretador e os 51 testes fora do navegador
 *
 *      node web/teste/suite.js
 *
 *  Duas provas de ponta a ponta:
 *    1. com o gabarito, os 51 precisam dar "ok";
 *    2. com os esqueletos vazios, os 51 precisam dar "falta implementar".
 *  Mais uma bateria de casos com erros plantados de proposito, para conferir
 *  que o diagnostico e o certo.
 * ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Motor, R_OK, R_STUB, R_FALHOU, R_QUEBROU } from '../js/dojo/motor.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');

const ARQUIVOS = ['n1_matriz.c', 'n2_lista.c', 'n3_transformacoes.c',
                  'n4_profundidade.c', 'n5_largura.c', 'n6_ponderados.c',
                  'n7_desafios.c'];

const catalogo = JSON.parse(fs.readFileSync(path.join(RAIZ, 'web/dados/catalogo.json'), 'utf8'));
const grafoH   = fs.readFileSync(path.join(RAIZ, 'web/dados/grafo.h'), 'utf8');

function ler(dir) {
    return ARQUIVOS.map(n => ({ nome: n, texto: fs.readFileSync(path.join(RAIZ, dir, n), 'utf8') }));
}
const NOME_ST = { [R_OK]: 'ok', [R_STUB]: 'a fazer', [R_FALHOU]: 'falhou', [R_QUEBROU]: 'quebrou' };

let falhas = 0;
function checar(cond, msg) {
    if (!cond) { falhas++; console.log('   FALHOU: ' + msg); }
}

/* ---- 1. gabarito: tudo verde ------------------------------------------ */
console.log('\n[1] os 51 testes contra o gabarito');
const motorGab = new Motor(catalogo, grafoH);
const carga = motorGab.carregar(ler('gabarito'));
if (!carga.ok) {
    console.log('   o gabarito NAO COMPILA:');
    for (const e of carga.erros) console.log('     ' + e.arquivo + ':' + e.linha + ' ' + e.mensagem);
    process.exit(1);
}
const inicio = Date.now();
let okGab = 0;
for (let i = 0; i < catalogo.exercicios.length; i++) {
    const ex = catalogo.exercicios[i];
    const r = motorGab.rodarIndice(i);
    if (r.status === R_OK) okGab++;
    else {
        falhas++;
        console.log('   ' + ex.nivel + '.' + ex.num + ' ' + ex.nome + ' -> ' + NOME_ST[r.status]);
        if (r.msg) console.log('       ' + r.msg.split('\n').join('\n       '));
        if (r.extra) console.log(r.extra);
        if (r.dicasErro) for (const d of r.dicasErro) console.log('       . ' + d);
    }
}
const ms = Date.now() - inicio;
console.log('   ' + okGab + '/' + catalogo.exercicios.length + ' ok  (' + ms + ' ms, ' +
            Math.round(ms / catalogo.exercicios.length) + ' ms por exercicio)');

/* ---- 2. esqueletos: tudo "a fazer" ------------------------------------ */
console.log('\n[2] os 51 testes contra os esqueletos vazios');
const motorStub = new Motor(catalogo, grafoH);
const carga2 = motorStub.carregar(ler('web/dados/stubs'));
if (!carga2.ok) {
    console.log('   os esqueletos NAO COMPILAM:');
    for (const e of carga2.erros) console.log('     ' + e.arquivo + ':' + e.linha + ' ' + e.mensagem);
    process.exit(1);
}
let okStub = 0;
for (let i = 0; i < catalogo.exercicios.length; i++) {
    const r = motorStub.rodarIndice(i);
    if (r.status === R_STUB) okStub++;
    else {
        falhas++;
        const ex = catalogo.exercicios[i];
        console.log('   ' + ex.nivel + '.' + ex.num + ' ' + ex.nome + ' -> ' + NOME_ST[r.status] +
                    (r.msg ? ' :: ' + r.msg.split('\n')[0] : ''));
    }
}
console.log('   ' + okStub + '/' + catalogo.exercicios.length + ' marcados como "a fazer"');

/* ---- 3. erros plantados ----------------------------------------------- */
console.log('\n[3] erros classicos: o diagnostico e o certo?');

const base = Object.fromEntries(ler('gabarito').map(f => [f.nome, f.texto]));

function comTroca(arquivo, de, para) {
    const copia = { ...base };
    if (!copia[arquivo].includes(de)) throw new Error('trecho nao encontrado em ' + arquivo + ': ' + de);
    copia[arquivo] = copia[arquivo].replace(de, para);
    return ARQUIVOS.map(n => ({ nome: n, texto: copia[n] }));
}

function caso(titulo, fontes, nivel, num, statusEsperado, pedaco) {
    const m = new Motor(catalogo, grafoH);
    const c = m.carregar(fontes);
    if (!c.ok) {
        checar(statusEsperado === 'compilacao',
               titulo + ': nao compilou -> ' + c.erros[0].mensagem.split('\n')[0]);
        if (statusEsperado === 'compilacao')
            checar(c.erros[0].mensagem.includes(pedaco),
                   titulo + ': erro de compilacao sem "' + pedaco + '" (veio: ' +
                   c.erros[0].mensagem.split('\n')[0] + ')');
        return;
    }
    const r = m.rodarIndice(m.indiceDe(nivel, num));
    const texto = (r.msg || '') + ' ' + (r.dicasErro || []).join(' ');
    checar(r.status === statusEsperado,
           titulo + ': esperava ' + NOME_ST[statusEsperado] + ' e veio ' + NOME_ST[r.status] +
           (r.msg ? ' (' + r.msg.split('\n')[0] + ')' : ''));
    if (r.status === statusEsperado && pedaco)
        checar(texto.includes(pedaco),
               titulo + ': a mensagem nao fala de "' + pedaco + '". Veio: ' + texto.slice(0, 160));
    console.log('   ' + (r.status === statusEsperado ? 'ok  ' : 'X   ') + titulo +
                '  ->  ' + NOME_ST[r.status] + (r.msg ? ': ' + r.msg.split('\n')[0].slice(0, 70) : ''));
}

/* o classico malloc(sizeof(no*)) */
caso('malloc(sizeof(no*)) em inserir_aresta_l',
     comTroca('n2_lista.c', 'malloc(sizeof(no))', 'malloc(sizeof(no*))'),
     2, 4, R_FALHOU, 'sizeof(no)');

/* alocar_l com sizeof do ponteiro */
caso('alocar_l com sizeof(vertice*)',
     comTroca('n2_lista.c', 'malloc(V * sizeof(vertice))', 'malloc(V * sizeof(vertice*))'),
     2, 1, R_FALHOU, 'bytes');

/* excluir o primeiro no sem tratar ant == NULL */
caso('excluir_aresta_l sem tratar ant == NULL',
     comTroca('n2_lista.c',
              '    if (ant) ant->prox = p->prox;\n    else     g[v1].inicio = p->prox;',
              '    ant->prox = p->prox;'),
     2, 5, R_QUEBROU, 'NULL');

/* zerar_flags apagando as arestas */
caso('zerar_flags mexendo em inicio',
     comTroca('n4_profundidade.c', 'for (i = 0; i < V; i++) g[i].flag = 0;',
              'for (i = 0; i < V; i++) g[i].inicio = NULL;'),
     4, 1, R_FALHOU, 'flag');

/* prof sem marcar a flag: recursao infinita */
caso('prof sem marcar a flag antes de descer',
     comTroca('n4_profundidade.c',
              'void prof(vertice* g, int i) {\n    no* p;\n    g[i].flag = 1;',
              'void prof(vertice* g, int i) {\n    no* p;'),
     4, 2, R_QUEBROU, 'recurs');

/* entrar_fila com f->ultimo->prox na fila vazia */
caso('entrar_fila usando f->ultimo->prox com a fila vazia',
     comTroca('n5_largura.c',
              '    if (f->ultimo == NULL) f->inicio = novo;\n    else                   f->ultimo->prox = novo;',
              '    f->ultimo->prox = novo;\n    if (f->inicio == NULL) f->inicio = novo;'),
     5, 1, R_QUEBROU, 'NULL');

/* entrar_fila rejeitando o vertice 0 */
caso('entrar_fila com if (!valor) return',
     comTroca('n5_largura.c', 'void entrar_fila(FILA* f, int valor) {\n',
              'void entrar_fila(FILA* f, int valor) {\n    if (!valor) return;\n'),
     5, 1, R_FALHOU, 'FIFO');

/* largura sem pintar de preto quem sai da fila */
caso('largura_l sem marcar preto quem sai da fila',
     comTroca('n5_largura.c',
              '            p = p->prox;\n        }\n        g[i].flag = 2;\n    }\n}\n\nvoid largura_m',
              '            p = p->prox;\n        }\n    }\n}\n\nvoid largura_m'),
     5, 2, R_FALHOU, 'flag');

/* no com prox nao inicializado */
caso('inserir_aresta_l esquecendo o novo->prox',
     comTroca('n2_lista.c', '    novo->prox = g[v1].inicio;\n    g[v1].inicio = novo;',
              '    g[v1].inicio = novo;'),
     2, 4, R_QUEBROU, 'inicializad');

/* uso depois do free */
caso('destruir_arestas_l usando p->prox depois do free',
     comTroca('n3_transformacoes.c',
              '            no* t = p->prox;\n            free(p);\n            p = t;',
              '            free(p);\n            p = p->prox;'),
     3, 6, R_QUEBROU, 'free');

/* variavel local sem inicializar */
caso('grau_saida_m somando em cima de lixo',
     comTroca('n1_matriz.c', 'int i, gs = 0;\n    for (i = 0; i < V; i++) gs = gs + m[v1][i];',
              'int i, gs;\n    for (i = 0; i < V; i++) gs = gs + m[v1][i];'),
     1, 5, R_QUEBROU, 'nao recebeu valor');

/* laco infinito */
caso('aresta_existe_l sem o p = p->prox',
     comTroca('n2_lista.c', '        if (p->adj == v2) return TRUE;\n        p = p->prox;',
              '        if (p->adj == v2) return TRUE;'),
     2, 3, R_QUEBROU, 'laco');

/* erro de sintaxe */
caso('ponto e virgula faltando',
     comTroca('n1_matriz.c', 'm[v1][v2] = 1;', 'm[v1][v2] = 1'),
     1, 3, 'compilacao', 'esperava');

/* funcao apagada */
caso('funcao apagada pelo aluno',
     comTroca('n1_matriz.c',
              'int grau_entrada_m(int m[V][V], int v1) {\n    int i, ge = 0;\n    for (i = 0; i < V; i++) ge = ge + m[i][v1];\n    return ge;\n}', ''),
     1, 6, R_QUEBROU, 'nao existe');

/* ---- 4. checagens do interpretador ------------------------------------- */
console.log('\n[4] tamanhos e semantica');
const prog = motorGab.programaNovo();
checar(prog.tipo('no').tam === 20, 'sizeof(no) deveria ser 20 e e ' + prog.tipo('no').tam);
checar(prog.tipo('vertice').tam === 24, 'sizeof(vertice) deveria ser 24 e e ' + prog.tipo('vertice').tam);
checar(prog.tipo('FILA').tam === 8, 'sizeof(FILA) deveria ser 8 e e ' + prog.tipo('FILA').tam);
console.log('   sizeof: no=' + prog.tipo('no').tam + ' vertice=' + prog.tipo('vertice').tam +
            ' FILA=' + prog.tipo('FILA').tam);

/* memoria devolvida ao final: o gabarito nao vaza nos testes que dao free */
const p2 = motorGab.programaNovo();
const g2 = p2.chamar('alocar_l', []).v;
p2.chamar('inicializar_l', [g2]);
for (let i = 0; i < 6; i++) p2.chamar('inserir_aresta_l', [g2, 0, i]);
const vivosAntes = p2.mem.vivos;
p2.chamar('destruir_arestas_l', [g2]);
checar(p2.mem.vivos === vivosAntes - 6,
       'destruir_arestas_l deveria liberar 6 nos (vivos ' + vivosAntes + ' -> ' + p2.mem.vivos + ')');
console.log('   free de verdade: ' + (vivosAntes - p2.mem.vivos) + ' nos liberados');

/* ---- resultado --------------------------------------------------------- */
console.log('\n' + (falhas === 0
    ? 'TUDO CERTO: ' + okGab + ' ok com gabarito, ' + okStub + ' a fazer com esqueleto, diagnosticos conferidos.'
    : falhas + ' PROBLEMA(S) encontrados.'));
process.exit(falhas === 0 ? 0 : 1);
