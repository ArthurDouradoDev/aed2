/* ==========================================================================
 *  runtime.js -- o micro-framework de testes do Dojo, versao web
 *
 *  Espelho do include/dojo.h + src/core/dojo.c: as mesmas asserções, os
 *  mesmos utilitarios de verificacao (que NAO usam codigo do aluno) e os
 *  mesmos desenhos de diagnostico.
 * ========================================================================== */
import { FalhaMemoria } from '../c/memoria.js';
import { ErroExec, LimiteExcedido } from '../c/interp.js';

export const R_OK = 0, R_STUB = 1, R_FALHOU = 2, R_QUEBROU = 3;
export const V = 8;
export const INFINITO = 1000000;
export const TRUE = 1, FALSE = 0;

const MAX_NOS = 4096;          /* trava contra lista circular do aluno */

class SinalStub  { }
class SinalFalha { constructor(msg) { this.msg = msg; } }

export class Contexto {
    constructor(prog) {
        this.prog  = prog;
        this.mem   = prog.mem;
        this.ctx   = '';
        this.extra = '';
        this.tNo      = prog.tipo('no');
        this.tVertice = prog.tipo('vertice');
        this.tFila    = prog.tipo('FILA');
        if (!this.tNo || !this.tVertice || !this.tFila)
            throw new Error('grafo.h nao definiu no / vertice / FILA');
        this.oNo = {};
        for (const c of this.tNo.campos) this.oNo[c.nome] = c.off;
        this.oVe = {};
        for (const c of this.tVertice.campos) this.oVe[c.nome] = c.off;
        this.oFi = {};
        for (const c of this.tFila.campos) this.oFi[c.nome] = c.off;
    }

    /* ---- asserções ---------------------------------------------------- */
    cenario(txt)  { this.ctx = txt; }
    imprimir(txt) { this.extra += txt; }
    falha(msg)    { throw new SinalFalha(msg); }
    checaStub()   { if (this.prog.stub) throw new SinalStub(); }

    esperaInt(rotulo, obtido, esperado) {
        this.checaStub();
        if ((obtido | 0) !== (esperado | 0))
            this.falha(rotulo + '\n       esperado: ' + esperado + '\n       obtido  : ' + obtido);
    }
    esperaBool(rotulo, obtido, esperado) {
        this.checaStub();
        if (!!obtido !== !!esperado)
            this.falha(rotulo + '\n       esperado: ' + (esperado ? 'TRUE' : 'FALSE') +
                       '\n       obtido  : ' + (obtido ? 'TRUE' : 'FALSE'));
    }

    /* ---- chamadas ao codigo do aluno ---------------------------------- */
    chamar(nome, ...args) {
        const r = this.prog.chamar(nome, args);
        return r ? (r.lv ? r.addr : (r.v | 0)) : 0;
    }

    grafoNovo() {
        const g = this.chamar('alocar_l');
        this.checaStub();
        if (!g) this.falha('alocar_l() devolveu NULL');
        this.chamar('inicializar_l', g);
        this.checaStub();
        return g;
    }

    /* ---- memoria de trabalho do proprio teste ------------------------- */
    matriz() {
        const addr = this.mem.alocarTrabalho(V * V * 4);
        return addr;
    }
    mSet(m, i, j, v) { this.mem.escreverInt(m + (i * V + j) * 4, v); }
    mGet(m, i, j)    { return this.mem.lerInt(m + (i * V + j) * 4); }

    vetor(n)          { return this.mem.alocarTrabalho(n * 4); }
    vSet(a, i, v)     { this.mem.escreverInt(a + i * 4, v); }
    vGet(a, i)        { return this.mem.lerInt(a + i * 4); }

    celula(valor) {
        const a = this.mem.alocarTrabalho(4);
        this.mem.escreverInt(a, valor | 0);
        return a;
    }
    lerCelula(a) { return this.mem.lerInt(a); }

    novaFila() { return this.mem.alocarTrabalho(this.tFila.tam); }
    filaInicio(f) { return this.mem.espiarInt(f + this.oFi.inicio); }
    filaUltimo(f) { return this.mem.espiarInt(f + this.oFi.ultimo); }

    /* ---- leitura do grafo sem usar o codigo do aluno ------------------ */
    vCampo(g, i, campo) { return this.mem.espiarInt(g + i * this.tVertice.tam + this.oVe[campo]); }
    vPor(g, i, campo, valor) {
        this.mem.escreverInt(g + i * this.tVertice.tam + this.oVe[campo], valor);
    }
    nCampo(p, campo) { return this.mem.espiarInt(p + this.oNo[campo]); }

    nosDe(g, v) {
        const saida = [];
        let p = this.vCampo(g, v, 'inicio');
        let n = 0;
        while (p !== 0 && n++ < MAX_NOS) {
            if (!this.mem.enderecoValido(p, this.tNo.tam)) { saida.quebrado = true; break; }
            saida.push(p);
            p = this.nCampo(p, 'prox');
        }
        if (n >= MAX_NOS) saida.circular = true;
        return saida;
    }

    contaAdj(g, v)  { return this.nosDe(g, v).length; }
    temAdj(g, v, alvo) {
        for (const p of this.nosDe(g, v)) if (this.nCampo(p, 'adj') === alvo) return true;
        return false;
    }
    contaArestas(g) {
        let t = 0;
        for (let i = 0; i < V; i++) t += this.contaAdj(g, i);
        return t;
    }

    confereAdj(g, v, esperados) {
        const obtidos = this.nosDe(g, v).map(p => this.nCampo(p, 'adj'));
        let err = '';
        if (obtidos.length !== esperados.length)
            err += 'vertice ' + v + ' deveria ter ' + esperados.length +
                   ' adjacente(s), tem ' + obtidos.length + '\n';
        for (const e of esperados)
            if (!obtidos.includes(e)) err += '       falta a aresta ' + v + ' -> ' + e + '\n';
        for (const o of obtidos)
            if (!esperados.includes(o)) err += '       sobra  a aresta ' + v + ' -> ' + o + '\n';
        return err === '' ? null : err;
    }

    listaParaVetor(l) {
        const saida = [];
        let p = l, n = 0;
        while (p !== 0 && n++ < MAX_NOS) {
            if (!this.mem.enderecoValido(p, this.tNo.tam)) break;
            saida.push(this.nCampo(p, 'adj'));
            p = this.nCampo(p, 'prox');
        }
        return saida;
    }

    /* Insere aresta SEM usar o codigo do aluno. */
    liga(g, v1, v2) {
        if (this.temAdj(g, v1, v2)) return;
        const novo = this.mem.alocar(this.tNo.tam, true);
        this.mem.preencher(novo, 0, this.tNo.tam);
        this.mem.escreverInt(novo + this.oNo.adj, v2);
        this.mem.escreverInt(novo + this.oNo.peso, 1);
        this.mem.escreverInt(novo + this.oNo.prox, this.vCampo(g, v1, 'inicio'));
        this.vPor(g, v1, 'inicio', novo);
    }

    porCampo(g, v1, v2, campo, valor) {
        for (const p of this.nosDe(g, v1))
            if (this.nCampo(p, 'adj') === v2) this.mem.escreverInt(p + this.oNo[campo], valor);
    }
    porPeso(g, a, b, v) { this.porCampo(g, a, b, 'peso', v); }
    porId(g, a, b, v)   { this.porCampo(g, a, b, 'id', v); }
    porCia(g, a, b, v)  { this.porCampo(g, a, b, 'cia', v); }

    /* ---- desenhos de diagnostico -------------------------------------- */
    desenhaLista(titulo, g) {
        this.imprimir('       ' + titulo + '\n');
        if (!g) { this.imprimir('       (NULL)\n'); return; }
        for (let i = 0; i < V; i++) {
            const nos = this.nosDe(g, i);
            let linha = '       [' + i + ']';
            for (const p of nos) linha += ' -> ' + this.nCampo(p, 'adj');
            if (nos.circular) linha += ' -> ... (a lista nunca acaba: ha um ciclo nela)';
            if (nos.quebrado) linha += ' -> ??? (ponteiro invalido)';
            this.imprimir(linha + '\n');
        }
    }
    desenhaMatriz(titulo, m) {
        this.imprimir('       ' + titulo + '\n');
        let cab = '       de -> para';
        for (let j = 0; j < V; j++) cab += ' ' + j;
        this.imprimir(cab + '\n');
        for (let i = 0; i < V; i++) {
            let linha = '       [' + i + ']    ';
            for (let j = 0; j < V; j++) linha += ' ' + this.mem.espiarInt(m + (i * V + j) * 4);
            this.imprimir(linha + '\n');
        }
    }
    desenhaFlags(titulo, g) {
        this.imprimir('       ' + titulo + '  (0=branco 1=cinza 2=preto)\n');
        let a = '       vertice:', b = '       flag   :';
        for (let i = 0; i < V; i++) { a += ' ' + i; b += ' ' + (g ? this.vCampo(g, i, 'flag') : -1); }
        this.imprimir(a + '\n' + b + '\n');
    }
    desenhaVetor(titulo, addr, n) {
        this.imprimir('       ' + titulo + '\n       ');
        let s = '';
        for (let i = 0; i < n; i++) {
            const v = this.mem.espiarInt(addr + i * 4);
            s += (v >= INFINITO ? ' inf' : ' ' + String(v).padStart(3));
        }
        this.imprimir(s + '\n');
    }
    desenhaNumeros(titulo, valores) {
        this.imprimir('       ' + titulo + ' ' + valores.join(' ') + '\n');
    }
}

/* ==========================================================================
 *  Execucao de um exercicio.
 *  Devolve { status, msg, ctx, extra, saida, dicasErro }.
 * ========================================================================== */
export function rodarTeste(prog, teste) {
    const T = new Contexto(prog);
    const invasao = () => prog.mem.relatoEstouros(T.tNo ? T.tNo.tam : 0);
    try {
        teste(T);
        if (prog.stub) return { status: R_STUB, msg: '', ctx: T.ctx, extra: T.extra, saida: prog.saida };
        /* Passou, mas escreveu fora do bloco do malloc. Em C isso costuma
           passar batido (foi o que aconteceu aqui), e por isso mesmo e
           perigoso: o Dojo aprova o exercicio e avisa do risco, sem
           inventar uma reprovacao que o gcc nao daria. */
        return { status: R_OK, msg: '', ctx: T.ctx, extra: T.extra,
                 saida: prog.saida, aviso: invasao() };
    } catch (e) {
        if (e instanceof SinalStub)
            return { status: R_STUB, msg: '', ctx: T.ctx, extra: T.extra, saida: prog.saida };
        if (e instanceof SinalFalha) {
            if (prog.stub)
                return { status: R_STUB, msg: '', ctx: T.ctx, extra: T.extra, saida: prog.saida };
            const inv = invasao();
            return { status: R_FALHOU, msg: e.msg + (inv ? '\n\n       Alem disso, ' + inv : ''),
                     ctx: T.ctx, extra: T.extra, saida: prog.saida };
        }
        if (e instanceof FalhaMemoria || e instanceof LimiteExcedido || e instanceof ErroExec) {
            return {
                status: R_QUEBROU, msg: e.message, ctx: T.ctx, extra: T.extra,
                saida: prog.saida, dicasErro: e.dicas || [], linha: e.linha || 0
            };
        }
        if (e instanceof RangeError) {
            return {
                status: R_QUEBROU,
                msg: 'a pilha do navegador estourou: recursao sem parada.',
                ctx: T.ctx, extra: T.extra, saida: prog.saida,
                dicasErro: ['A funcao chama a si mesma e nunca para.',
                            'Marque a flag do vertice ANTES de descer nos vizinhos.']
            };
        }
        throw e;
    }
}
