/* ==========================================================================
 *  campus.js -- o Campus EACH rodando em cima do codigo do aluno
 *
 *  Porte do src/core/campus.c. Cada funcionalidade chama diretamente uma
 *  funcao que o aluno escreveu, e fica trancada enquanto o exercicio
 *  correspondente nao passa. A diferenca para o terminal e que aqui a
 *  resposta tambem vira desenho, e da para assistir a busca acontecendo.
 * ========================================================================== */
import { Contexto, V, INFINITO } from './runtime.js';
import { FalhaMemoria } from '../c/memoria.js';
import { ErroExec, LimiteExcedido } from '../c/interp.js';

const LIMITE_QUADROS = 900;

/* ---- gravador de quadros para a animacao ------------------------------ */
class Gravador {
    constructor(T, g) {
        this.T = T;
        this.g = g;
        this.quadros = [];
        this.ultimo = null;
        this.linhaAnterior = 0;
        this.moduloAnterior = '';
        this.cheio = false;
    }

    ler() {
        const e = { flag: [], dist: [], cor: [] };
        for (let i = 0; i < V; i++) {
            e.flag.push(this.T.vCampo(this.g, i, 'flag'));
            e.dist.push(this.T.vCampo(this.g, i, 'dist'));
            e.cor.push(this.T.vCampo(this.g, i, 'cor'));
        }
        return e;
    }

    igual(a, b) {
        if (!a || !b) return false;
        for (const c of ['flag', 'dist', 'cor'])
            for (let i = 0; i < V; i++) if (a[c][i] !== b[c][i]) return false;
        return true;
    }

    guardar(estado, linha, modulo) {
        this.quadros.push({
            flag: estado.flag.slice(), dist: estado.dist.slice(), cor: estado.cor.slice(),
            linha, arquivo: modulo
        });
        this.ultimo = estado;
    }

    /* chamado pelo interpretador antes de cada comando */
    comando(no, it) {
        if (this.cheio) return;
        const agora = this.ler();
        if (!this.igual(agora, this.ultimo)) {
            this.guardar(agora, this.linhaAnterior, this.moduloAnterior);
            if (this.quadros.length >= LIMITE_QUADROS) this.cheio = true;
        }
        this.linhaAnterior = no.linha;
        this.moduloAnterior = it.modulo;
    }

    comecar() { this.guardar(this.ler(), 0, ''); }
    terminar() {
        const agora = this.ler();
        if (!this.igual(agora, this.ultimo)) this.guardar(agora, this.linhaAnterior, this.moduloAnterior);
    }
}

/* ---- o campus ---------------------------------------------------------- */
export class Campus {
    constructor(dados, motor) {
        this.dados = dados;             /* locais, trechos, menu */
        this.motor = motor;
    }

    liberado(status, nivel, num) {
        const i = this.motor.indiceDe(nivel, num);
        return i >= 0 && status[i] === 0;
    }

    /* Monta o grafo do campus usando alocar_l, inicializar_l e
       inserir_aresta_l DO ALUNO: sem eles nao existe mapa nenhum. */
    montar(prog) {
        const T = new Contexto(prog);
        prog.stub = false;
        const g = T.chamar('alocar_l');
        if (prog.stub || !g) return null;
        T.chamar('inicializar_l', g);
        if (prog.stub) return null;
        for (const t of this.dados.trechos) {
            T.chamar('inserir_aresta_l', g, t.de, t.para);
            T.chamar('inserir_aresta_l', g, t.para, t.de);
            T.porPeso(g, t.de, t.para, t.minutos);
            T.porPeso(g, t.para, t.de, t.minutos);
        }
        if (prog.stub) return null;
        for (const l of this.dados.locais) T.vPor(g, l.id, 'tipo', l.tipo);
        return { T, g };
    }

    matrizPesos(T) {
        const m = T.matriz();
        for (let i = 0; i < V; i++) for (let j = 0; j < V; j++) T.mSet(m, i, j, 0);
        for (const t of this.dados.trechos) {
            T.mSet(m, t.de, t.para, t.minutos);
            T.mSet(m, t.para, t.de, t.minutos);
        }
        return m;
    }

    nome(i) {
        const l = this.dados.locais.find(x => x.id === i);
        return l ? l.nome : ('local ' + i);
    }

    /* Executa uma funcionalidade. Devolve
       { linhas, estado, quadros, erro }  */
    executar(indiceMenu, params) {
        const prog = this.motor.programaNovo();
        const montado = this.montar(prog);
        if (!montado) {
            return {
                erro: 'O campus nem chega a ser montado. Ele e construido com ' +
                      'alocar_l, inicializar_l e inserir_aresta_l: termine o nivel 2 primeiro.'
            };
        }
        const { T, g } = montado;
        const gravador = new Gravador(T, g);

        const estado = { flag: null, dist: null, cor: null, destaque: [], caminho: [], arestas: [], rotulos: {} };
        const linhas = [];
        const diz = (s) => linhas.push(s);

        const comTrace = (fn) => {
            gravador.comecar();
            prog.tracer = gravador;
            try { return fn(); }
            finally { prog.tracer = null; gravador.terminar(); }
        };

        const lerEstado = () => {
            estado.flag = []; estado.dist = []; estado.cor = [];
            for (let i = 0; i < V; i++) {
                estado.flag.push(T.vCampo(g, i, 'flag'));
                estado.dist.push(T.vCampo(g, i, 'dist'));
                estado.cor.push(T.vCampo(g, i, 'cor'));
            }
        };

        try {
            switch (indiceMenu) {
                case 0: {                                   /* mapa do campus */
                    for (const l of this.dados.locais) {
                        const saidas = T.chamar('grau_saida_l', g, l.id);
                        const viz = T.nosDe(g, l.id).map(p =>
                            this.nome(T.nCampo(p, 'adj')) + ' (' + T.nCampo(p, 'peso') + ' min)');
                        diz(l.nome.padEnd(12) + ' ' + saidas + ' saida(s) -> ' +
                            (viz.length ? viz.join(', ') : 'nenhuma'));
                    }
                    estado.arestas = this.dados.trechos.map(t => [t.de, t.para]);
                    break;
                }
                case 1: {                                   /* existe caminho */
                    const { a, b } = params;
                    T.chamar('zerar_flags', g);
                    const achou = T.celula(0);
                    comTrace(() => T.chamar('prof_caminho', g, a, b, achou));
                    const r = T.lerCelula(achou);
                    diz(r ? 'Da para ir de ' + this.nome(a) + ' ate ' + this.nome(b) + ' a pe.'
                          : 'Nao existe caminho de ' + this.nome(a) + ' ate ' + this.nome(b) + '.');
                    lerEstado();
                    estado.destaque = r ? [a, b] : [];
                    break;
                }
                case 2: {                                   /* alcancaveis */
                    const { a } = params;
                    T.chamar('zerar_flags', g);
                    comTrace(() => T.chamar('prof', g, a));
                    lerEstado();
                    const chega = [];
                    for (let i = 0; i < V; i++) if (i !== a && estado.flag[i] !== 0) chega.push(i);
                    diz('Saindo de ' + this.nome(a) + ' da para chegar em:');
                    diz(chega.length ? chega.map(i => '  - ' + this.nome(i)).join('\n') : '  (nenhum outro local)');
                    estado.destaque = chega.concat([a]);
                    break;
                }
                case 3: {                                   /* comida mais proxima */
                    const { a } = params;
                    const r = comTrace(() => T.chamar('tipo_x_mais_prox', g, a, 2));
                    lerEstado();
                    diz(r < 0 ? 'Nenhum lugar de comida alcancavel.'
                              : 'Comida mais proxima de ' + this.nome(a) + ': ' + this.nome(r));
                    if (r >= 0) estado.destaque = [r];
                    break;
                }
                case 4: {                                   /* rota com menos trechos */
                    const { a, b } = params;
                    const r = comTrace(() => T.chamar('caminho_bfs', g, a, b));
                    lerEstado();
                    if (!r) { diz('Nao ha rota entre esses dois locais.'); break; }
                    const rota = T.listaParaVetor(r);
                    estado.caminho = rota;
                    diz('Rota com menos trechos (' + Math.max(0, rota.length - 1) + '):');
                    diz('  ' + rota.map(i => this.nome(i)).join('  ->  '));
                    break;
                }
                case 5: {                                   /* rota mais rapida */
                    const { a } = params;
                    const m = this.matrizPesos(T);
                    const custos = T.vetor(V);
                    for (let i = 0; i < V; i++) T.vSet(custos, i, -1);
                    T.chamar('custo', m, a, custos);
                    diz('Tempo minimo a pe saindo de ' + this.nome(a) + ':');
                    let melhor = -1, melhorC = INFINITO;
                    for (let i = 0; i < V; i++) {
                        const c = T.vGet(custos, i);
                        diz('  ' + this.nome(i).padEnd(12) + (c >= INFINITO ? ' inalcancavel' : ' ' + c + ' min'));
                        estado.rotulos[i] = c >= INFINITO ? 'inf' : c + 'min';
                        if (i !== a && c < melhorC) { melhorC = c; melhor = i; }
                    }
                    estado.destaque = [a];
                    void melhor;
                    break;
                }
                case 6: {                                   /* raio de N trechos */
                    const { a, n } = params;
                    const r = comTrace(() => T.chamar('vertices_raio_n', g, a, n));
                    lerEstado();
                    const lista = T.listaParaVetor(r);
                    diz('A ate ' + n + ' trecho(s) de ' + this.nome(a) + ':');
                    diz(lista.length ? lista.map(i => '  - ' + this.nome(i)).join('\n') : '  (nada)');
                    estado.destaque = lista;
                    for (const i of lista) estado.rotulos[i] = estado.dist[i] + '';
                    break;
                }
                case 7: {                                   /* interdicao */
                    const { a } = params;
                    const antes = T.chamar('contar_grupos', g);
                    for (let i = 0; i < V; i++) {
                        T.chamar('excluir_aresta_l', g, a, i);
                        T.chamar('excluir_aresta_l', g, i, a);
                    }
                    const depois = T.chamar('contar_grupos', g);
                    diz('Antes da interdicao: ' + antes + ' bloco(s) de campus conectados.');
                    diz('Depois de fechar ' + this.nome(a) + ': ' + depois + ' bloco(s).');
                    diz(depois > antes + 1
                        ? 'Fechar ' + this.nome(a) + ' PARTE o campus em pedacos isolados.'
                        : 'O campus continua inteiro (fora o proprio local).');
                    estado.arestas = this.dados.trechos
                        .filter(t => t.de !== a && t.para !== a).map(t => [t.de, t.para]);
                    estado.apagados = [a];
                    lerEstado();
                    break;
                }
                case 8: {                                   /* mapa invertido */
                    const gt = T.chamar('transposta_l', g);
                    if (!gt) { diz('transposta_l devolveu NULL.'); break; }
                    diz('Quem chega em voce (mapa invertido):');
                    for (let i = 0; i < V; i++) {
                        const de = T.nosDe(gt, i).map(p => this.nome(T.nCampo(p, 'adj')));
                        diz('  ' + this.nome(i).padEnd(12) + ' <- ' + (de.length ? de.join(', ') : '(ninguem)'));
                    }
                    estado.arestas = this.dados.trechos.map(t => [t.de, t.para]);
                    break;
                }
                case 9: {                                   /* grade de horarios */
                    for (let i = 0; i < V; i++) T.vPor(g, i, 'cor', 0);
                    const k = T.celula(0);
                    comTrace(() => T.chamar('colorir', g, 0, k));
                    lerEstado();
                    const faixas = T.lerCelula(k);
                    diz('Locais ligados por um trecho nao podem ter evento no mesmo');
                    diz('horario. Precisamos de ' + faixas + ' faixa(s):');
                    for (let i = 0; i < V; i++) {
                        diz('  ' + this.nome(i).padEnd(12) + ' faixa ' + estado.cor[i]);
                        estado.rotulos[i] = 'faixa ' + estado.cor[i];
                    }
                    estado.usarCor = true;
                    break;
                }
                case 10: {                                  /* comida evitando um local */
                    const { a, n } = params;
                    const r = comTrace(() => T.chamar('tipo_x_evitando', g, a, 2, n));
                    lerEstado();
                    diz(r < 0
                        ? 'Com ' + this.nome(n) + ' interditado nao da para chegar em nenhum lugar de comida.'
                        : 'Comida mais proxima de ' + this.nome(a) + ' sem passar por ' +
                          this.nome(n) + ': ' + this.nome(r));
                    estado.apagados = [n];
                    if (r >= 0) estado.destaque = [r];
                    break;
                }
                case 11: {                                  /* tem circuito */
                    const tem = comTrace(() => T.chamar('tem_ciclo_nao_dir', g));
                    lerEstado();
                    diz(tem
                        ? 'O campus tem pelo menos um circuito fechado: da para sair de um lugar e voltar nele sem repetir trecho.'
                        : 'O campus nao tem nenhum circuito: e uma arvore.');
                    break;
                }
            }
        } catch (e) {
            if (e instanceof FalhaMemoria || e instanceof LimiteExcedido || e instanceof ErroExec) {
                return { erro: e.message, dicas: e.dicas || [] };
            }
            if (e instanceof RangeError)
                return { erro: 'recursao sem parada no seu codigo.', dicas: [] };
            throw e;
        }

        if (!estado.arestas.length)
            estado.arestas = this.dados.trechos.map(t => [t.de, t.para]);

        return { linhas, estado, quadros: gravador.quadros, saida: prog.saida };
    }
}
