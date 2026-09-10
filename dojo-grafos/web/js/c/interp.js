/* ==========================================================================
 *  interp.js -- executa o C do aluno
 *
 *  Interpretador de arvore com memoria real: ponteiros sao enderecos de
 *  verdade dentro do ArrayBuffer, malloc devolve lixo como no C nativo e
 *  cada acesso passa pela sombra de memoria, que e quem produz as mensagens
 *  no lugar de um segfault mudo.
 * ========================================================================== */
import { ErroC } from './lexer.js';
import { Memoria, FalhaMemoria } from './memoria.js';
import { INT, UINT, CHAR, VOID, ponteiro, vetor, nomeTipo, ehPonteiro,
         ehInteiro } from './tipos.js';

export class ErroExec extends Error {
    constructor(msg, dicas, linha) {
        super(msg);
        this.nome = 'ErroExec';
        this.dicas = dicas || [];
        this.linha = linha || 0;
    }
}
export class LimiteExcedido extends Error {
    constructor(msg, dicas) {
        super(msg);
        this.nome = 'LimiteExcedido';
        this.dicas = dicas || [];
    }
}

/* sinais de controle de fluxo */
const QUEBRE = { sinal: 'quebre' };
const SIGA   = { sinal: 'siga' };
class Retorno { constructor(v) { this.v = v; } }

const MAX_PASSOS      = 8000000;
const MAX_PROFUNDIDADE = 400;
const MAX_SAIDA       = 20000;

export class Programa {
    constructor() {
        this.mem       = new Memoria();
        this.funcoes   = new Map();     /* nome (ou modulo::nome) -> declaracao  */
        this.globais   = new Map();     /* nome -> {addr, tipo}                  */
        this.typedefs  = new Map();
        this.structs   = new Map();
        this.literais  = new Map();
        this.modulos   = [];
        this.saida     = '';
        this.stub      = false;
        this.passos    = 0;
        this.profundidade = 0;
        this.tracer    = null;
        this.pilhaChamadas = [];
    }

    tipo(nome) { return this.typedefs.get(nome); }

    /* ---- carga dos modulos ------------------------------------------- */
    adicionarModulo(nomeModulo, arvore) {
        this.modulos.push(nomeModulo);
        for (const [k, v] of arvore.typedefs) if (!this.typedefs.has(k)) this.typedefs.set(k, v);
        for (const [k, v] of arvore.structs)  if (!this.structs.has(k))  this.structs.set(k, v);

        for (const d of arvore.declaracoes) {
            if (d.t === 'funcao') {
                const chave = d.estatica ? nomeModulo + '::' + d.nome : d.nome;
                if (this.funcoes.has(chave) && !d.estatica) {
                    const antiga = this.funcoes.get(chave);
                    throw new ErroC(
                        'a funcao ' + d.nome + ' foi definida duas vezes: em ' +
                        antiga.modulo + ' e em ' + nomeModulo + '.',
                        d.linha, nomeModulo);
                }
                this.funcoes.set(chave, { ...d, modulo: nomeModulo });
            } else if (d.t === 'global') {
                if (d.externa) continue;
                const chave = d.estatica ? nomeModulo + '::' + d.nome : d.nome;
                if (this.globais.has(chave)) continue;
                const addr = this.mem.alocar(Math.max(1, d.tipo.tam), true);
                this.mem.preencher(addr, 0, d.tipo.tam);
                this.globais.set(chave, { addr, tipo: d.tipo, inicial: d.inicial, modulo: nomeModulo });
            }
        }
    }

    /* Roda os inicializadores das variaveis globais. */
    iniciarGlobais() {
        const it = new Interp(this, '<globais>');
        for (const [, g] of this.globais) {
            if (g.inicial) it.inicializar(g.addr, g.tipo, g.inicial, g.modulo);
        }
    }

    literal(txt) {
        if (this.literais.has(txt)) return this.literais.get(txt);
        const addr = this.mem.alocar(txt.length + 1, true);
        for (let i = 0; i < txt.length; i++) this.mem.escreverByte(addr + i, txt.charCodeAt(i) & 0xff);
        this.mem.escreverByte(addr + txt.length, 0);
        this.literais.set(txt, addr);
        return addr;
    }

    escrever(s) {
        if (this.saida.length < MAX_SAIDA) this.saida += s;
    }

    resolverFuncao(nome, modulo) {
        if (modulo && this.funcoes.has(modulo + '::' + nome)) return this.funcoes.get(modulo + '::' + nome);
        if (this.funcoes.has(nome)) return this.funcoes.get(nome);
        for (const m of this.modulos) {
            if (this.funcoes.has(m + '::' + nome)) return this.funcoes.get(m + '::' + nome);
        }
        return null;
    }
    resolverGlobal(nome, modulo) {
        if (modulo && this.globais.has(modulo + '::' + nome)) return this.globais.get(modulo + '::' + nome);
        if (this.globais.has(nome)) return this.globais.get(nome);
        for (const m of this.modulos) {
            if (this.globais.has(m + '::' + nome)) return this.globais.get(m + '::' + nome);
        }
        return null;
    }

    /* Ponto de entrada usado pelo Dojo: chama uma funcao do aluno. */
    chamar(nome, args) {
        const f = this.resolverFuncao(nome, null);
        if (!f) {
            throw new ErroExec(
                'a funcao ' + nome + ' nao existe no seu codigo.',
                ['Ela precisa existir com esse nome exato para o Dojo conseguir',
                 'testar. Se voce apagou a funcao sem querer, use o botao',
                 '"restaurar esqueleto" do exercicio.']);
        }
        const it = new Interp(this, f.modulo);
        return it.chamarFuncao(f, args.map(a => this.paraValor(a)));
    }

    paraValor(a) {
        if (typeof a === 'number') return { lv: false, v: a | 0, tipo: INT };
        return a;
    }
}

export class Interp {
    constructor(prog, modulo) {
        this.p = prog;
        this.mem = prog.mem;
        this.modulo = modulo;
        this.escopos = [];
    }

    erro(msg, dicas, no) {
        throw new ErroExec(msg, dicas, no ? no.linha : 0);
    }

    passo(no) {
        if (++this.p.passos > MAX_PASSOS)
            throw new LimiteExcedido(
                'o seu codigo passou de ' + (MAX_PASSOS / 1000000) + ' milhoes de passos e foi interrompido.',
                ['Isso e um laco que nunca termina. Os classicos:',
                 '  - esquecer o p = p->prox dentro do while (p);',
                 '  - while (i < V) sem o i++;',
                 '  - recursao que nao marca a flag antes de descer.']);
        if (this.p.tracer && no) this.p.tracer.comando(no, this);
    }

    /* ---- escopos ------------------------------------------------------ */
    abrirEscopo() { this.escopos.push(new Map()); }
    fecharEscopo() { this.escopos.pop(); }

    declarar(nome, addr, tipo) {
        this.escopos[this.escopos.length - 1].set(nome, { addr, tipo });
    }
    buscar(nome) {
        for (let i = this.escopos.length - 1; i >= 0; i--) {
            const v = this.escopos[i].get(nome);
            if (v) return v;
        }
        return this.p.resolverGlobal(nome, this.modulo);
    }

    /* ---- chamada de funcao -------------------------------------------- */
    chamarFuncao(f, args) {
        if (++this.p.profundidade > MAX_PROFUNDIDADE) {
            this.p.profundidade--;
            throw new LimiteExcedido(
                'recursao com mais de ' + MAX_PROFUNDIDADE + ' chamadas encaixadas.',
                ['A funcao esta chamando a si mesma sem nunca parar.',
                 'Numa busca em profundidade a parada vem da flag: marque',
                 'g[i].flag ANTES de descer nos vizinhos, e so desca em quem',
                 'estiver com flag == 0.']);
        }
        const it = new Interp(this.p, f.modulo);
        const marca = this.mem.marcaPilha();
        this.p.pilhaChamadas.push({ nome: f.nome, linha: f.linha });

        try {
            it.abrirEscopo();
            const params = f.tipo.params || [];
            for (let i = 0; i < params.length; i++) {
                const pt = params[i].tipo;
                const addr = this.mem.reservarPilha(pt.tam);
                const arg = args[i] !== undefined ? args[i] : { lv: false, v: 0, tipo: pt };
                it.armazenar(addr, pt, arg);
                if (params[i].nome) it.declarar(params[i].nome, addr, pt);
            }
            let ret = { lv: false, v: 0, tipo: f.tipo.retorno };
            try {
                it.executar(f.corpo);
            } catch (e) {
                if (e instanceof Retorno) ret = e.v || { lv: false, v: 0, tipo: f.tipo.retorno };
                else throw e;
            }
            /* Struct devolvida por valor: copia para um lugar que sobrevive
               ao fim do quadro de pilha. */
            if (f.tipo.retorno && f.tipo.retorno.k === 'struct' && ret.lv) {
                const tmp = this.mem.alocar(f.tipo.retorno.tam, true);
                this.mem.copiar(tmp, ret.addr, f.tipo.retorno.tam);
                ret = { lv: true, addr: tmp, tipo: f.tipo.retorno };
            }
            if (f.tipo.retorno && f.tipo.retorno.k !== 'void' && !ret.lv) {
                ret = this.converter(ret, f.tipo.retorno);
            }
            return ret;
        } finally {
            it.fecharEscopo();
            this.mem.soltarPilha(marca);
            this.p.profundidade--;
            this.p.pilhaChamadas.pop();
        }
    }

    /* ---- carga e armazenamento ---------------------------------------- */
    carregar(addr, tipo) {
        if (tipo.k === 'array')  return { lv: false, v: addr, tipo: ponteiro(tipo.de) };
        if (tipo.k === 'struct') return { lv: true, addr, tipo };
        if (tipo.k === 'char')   return { lv: false, v: this.mem.lerByte(addr), tipo };
        return { lv: false, v: this.mem.lerInt(addr), tipo };
    }

    armazenar(addr, tipo, val) {
        if (tipo.k === 'struct') {
            if (!val.lv) this.erro('esperava uma struct para atribuir');
            this.mem.copiar(addr, val.addr, tipo.tam);
            return;
        }
        if (tipo.k === 'array') {
            const v = this.converter(val, ponteiro(tipo.de));
            this.mem.copiar(addr, v.v, tipo.tam);
            return;
        }
        const v = this.converter(val, tipo);
        if (tipo.k === 'char') this.mem.escreverByte(addr, v.v);
        else                   this.mem.escreverInt(addr, v.v);
    }

    converter(val, tipo) {
        if (val.lv && val.tipo.k === 'struct') return val;
        let n = this.numero(val);
        if (tipo.k === 'char') n = (n << 24) >> 24;
        else n = n | 0;
        return { lv: false, v: n, tipo };
    }

    numero(x) {
        if (!x.lv) return x.v | 0;
        if (x.tipo.k === 'array')  return x.addr;
        if (x.tipo.k === 'struct') return x.addr;
        return this.carregar(x.addr, x.tipo).v | 0;
    }

    valor(x) {
        if (!x.lv) return x;
        return this.carregar(x.addr, x.tipo);
    }

    /* ---- comandos ------------------------------------------------------ */
    executar(no) {
        switch (no.t) {
            case 'bloco': {
                this.abrirEscopo();
                try { for (const it of no.itens) this.executar(it); }
                finally { this.fecharEscopo(); }
                return;
            }
            case 'vazio': case 'caso': case 'padrao': return;

            case 'decl': {
                this.passo(no);
                for (const d of no.itens) {
                    if (d.estatica) {
                        const chave = this.modulo + '::estatica::' + no.linha + '::' + d.nome;
                        let g = this.p.globais.get(chave);
                        if (!g) {
                            const addr = this.mem.alocar(Math.max(1, d.tipo.tam), true);
                            this.mem.preencher(addr, 0, d.tipo.tam);
                            g = { addr, tipo: d.tipo };
                            this.p.globais.set(chave, g);
                            if (d.inicial) this.inicializar(addr, d.tipo, d.inicial, this.modulo);
                        }
                        this.declarar(d.nome, g.addr, g.tipo);
                        continue;
                    }
                    if (d.tipo.k === 'func') continue;
                    if (d.tipo.tam <= 0)
                        this.erro('o vetor ' + d.nome + ' precisa de um tamanho', [], no);
                    const addr = this.mem.reservarPilha(d.tipo.tam);
                    this.declarar(d.nome, addr, d.tipo);
                    if (d.inicial) this.inicializar(addr, d.tipo, d.inicial, this.modulo);
                }
                return;
            }

            case 'expr': this.passo(no); this.avaliar(no.e); return;

            case 'se': {
                this.passo(no);
                if (this.numero(this.avaliar(no.c)) !== 0) this.executar(no.ent);
                else if (no.sen) this.executar(no.sen);
                return;
            }

            case 'enquanto': {
                for (;;) {
                    this.passo(no);
                    if (this.numero(this.avaliar(no.c)) === 0) break;
                    try { this.executar(no.corpo); }
                    catch (e) { if (e === QUEBRE) break; if (e !== SIGA) throw e; }
                }
                return;
            }

            case 'facaEnquanto': {
                for (;;) {
                    this.passo(no);
                    try { this.executar(no.corpo); }
                    catch (e) { if (e === QUEBRE) break; if (e !== SIGA) throw e; }
                    if (this.numero(this.avaliar(no.c)) === 0) break;
                }
                return;
            }

            case 'para': {
                this.abrirEscopo();
                try {
                    if (no.ini) this.executar(no.ini);
                    for (;;) {
                        this.passo(no);
                        if (no.cond && this.numero(this.avaliar(no.cond)) === 0) break;
                        try { this.executar(no.corpo); }
                        catch (e) { if (e === QUEBRE) break; if (e !== SIGA) throw e; }
                        if (no.inc) this.avaliar(no.inc);
                    }
                } finally { this.fecharEscopo(); }
                return;
            }

            case 'escolha': {
                this.passo(no);
                const v = this.numero(this.avaliar(no.e));
                const itens = no.corpo.t === 'bloco' ? no.corpo.itens : [no.corpo];
                let inicio = -1;
                for (let i = 0; i < itens.length; i++)
                    if (itens[i].t === 'caso' && itens[i].v === v) { inicio = i; break; }
                if (inicio < 0)
                    for (let i = 0; i < itens.length; i++)
                        if (itens[i].t === 'padrao') { inicio = i; break; }
                if (inicio < 0) return;
                this.abrirEscopo();
                try {
                    for (let i = inicio; i < itens.length; i++) this.executar(itens[i]);
                } catch (e) {
                    if (e !== QUEBRE) throw e;
                } finally { this.fecharEscopo(); }
                return;
            }

            case 'retorne': {
                this.passo(no);
                throw new Retorno(no.e ? this.valor(this.avaliar(no.e)) : null);
            }
            case 'quebre': this.passo(no); throw QUEBRE;
            case 'siga':   this.passo(no); throw SIGA;

            default:
                this.erro('comando desconhecido: ' + no.t, [], no);
        }
    }

    inicializar(addr, tipo, ini, modulo) {
        if (ini.t === 'lista') {
            if (tipo.k === 'array') {
                for (let i = 0; i < ini.itens.length; i++) {
                    if (i >= tipo.n && tipo.n > 0)
                        this.erro('o inicializador tem mais itens do que o vetor comporta', [], ini);
                    this.inicializar(addr + i * tipo.de.tam, tipo.de, ini.itens[i], modulo);
                }
                const usados = ini.itens.length;
                if (tipo.n > usados) {
                    const resto = (tipo.n - usados) * tipo.de.tam;
                    this.mem.preencher(addr + usados * tipo.de.tam, 0, resto);
                }
                return;
            }
            if (tipo.k === 'struct') {
                for (let i = 0; i < ini.itens.length && i < tipo.campos.length; i++)
                    this.inicializar(addr + tipo.campos[i].off, tipo.campos[i].tipo, ini.itens[i], modulo);
                return;
            }
            if (ini.itens.length) return this.inicializar(addr, tipo, ini.itens[0], modulo);
            this.mem.preencher(addr, 0, tipo.tam);
            return;
        }

        /* char v[] = "texto" */
        if (tipo.k === 'array' && tipo.de.k === 'char' && ini.t === 'str') {
            for (let i = 0; i < tipo.n; i++)
                this.mem.escreverByte(addr + i, i < ini.v.length ? ini.v.charCodeAt(i) & 0xff : 0);
            return;
        }
        const guardado = this.escopos;
        if (!this.escopos.length) this.escopos = [new Map()];
        try {
            const v = this.avaliar(ini);
            this.armazenar(addr, tipo, this.valor(v));
        } finally { this.escopos = guardado; }
    }

    /* ---- expressoes ----------------------------------------------------- */
    avaliar(e) {
        if (++this.p.passos > MAX_PASSOS)
            throw new LimiteExcedido(
                'o seu codigo passou de ' + (MAX_PASSOS / 1000000) + ' milhoes de passos e foi interrompido.',
                ['Isso e um laco que nunca termina.']);

        switch (e.t) {
            case 'num': return { lv: false, v: e.v | 0, tipo: INT };
            case 'str': return { lv: false, v: this.p.literal(e.v), tipo: ponteiro(CHAR) };

            case 'id': {
                const v = this.buscar(e.nome);
                if (!v) {
                    const f = this.p.resolverFuncao(e.nome, this.modulo);
                    if (f) return { lv: false, v: 0, tipo: INT, funcao: f };
                    if (BUILTINS[e.nome]) return { lv: false, v: 0, tipo: INT, builtin: e.nome };
                    this.erro('nao existe nada chamado ' + e.nome + ' aqui.',
                              ['Confira se voce declarou a variavel, ou se o nome',
                               'esta escrito exatamente igual.'], e);
                }
                return { lv: true, addr: v.addr, tipo: v.tipo };
            }

            case 'virgula': this.avaliar(e.a); return this.avaliar(e.b);

            case 'cast': {
                const v = this.valor(this.avaliar(e.e));
                if (e.tipo.k === 'void') return { lv: false, v: 0, tipo: VOID };
                return { lv: false, v: this.numero(v) | 0, tipo: e.tipo };
            }

            case 'sizeofTipo': return { lv: false, v: e.tipo.tam, tipo: UINT };
            case 'sizeofExpr': {
                const v = this.avaliar(e.e);
                return { lv: false, v: v.tipo.tam, tipo: UINT };
            }

            case 'cond':
                return this.numero(this.avaliar(e.c)) !== 0
                     ? this.valor(this.avaliar(e.a))
                     : this.valor(this.avaliar(e.b));

            case 'un':  return this.unaria(e);
            case 'bin': return this.binaria(e);

            case 'pre': {
                const alvo = this.avaliar(e.a);
                if (!alvo.lv) this.erro('so da para usar ++ ou -- numa variavel', [], e);
                const antes = this.valor(alvo);
                const novo = this.somarPasso(antes, e.op === '++' ? 1 : -1);
                this.armazenar(alvo.addr, alvo.tipo, novo);
                return this.carregar(alvo.addr, alvo.tipo);
            }
            case 'pos': {
                const alvo = this.avaliar(e.a);
                if (!alvo.lv) this.erro('so da para usar ++ ou -- numa variavel', [], e);
                const antes = this.valor(alvo);
                const novo = this.somarPasso(antes, e.op === '++' ? 1 : -1);
                this.armazenar(alvo.addr, alvo.tipo, novo);
                return antes;
            }

            case 'atrib': {
                const alvo = this.avaliar(e.alvo);
                if (!alvo.lv) this.erro('o lado esquerdo de = precisa ser uma variavel', [], e);
                let valor;
                if (e.op === '=') {
                    valor = this.valor(this.avaliar(e.valor));
                } else {
                    const op = e.op.slice(0, -1);
                    valor = this.aplicarBin(op, this.valor(alvo), this.valor(this.avaliar(e.valor)), e);
                }
                this.armazenar(alvo.addr, alvo.tipo, valor);
                return this.carregar(alvo.addr, alvo.tipo);
            }

            case 'indice': {
                const base = this.avaliar(e.a);
                const idx  = this.numero(this.avaliar(e.b));
                return this.deslocar(base, idx, e);
            }

            case 'campo': {
                let base = this.avaliar(e.a);
                let addr, st;
                if (e.seta) {
                    const pv = this.valor(base);
                    if (!ehPonteiro(pv.tipo))
                        this.erro('-> so funciona em ponteiro. ' + nomeTipo(pv.tipo) +
                                  ' nao e ponteiro; talvez voce queira o ponto.', [], e);
                    st = pv.tipo.para;
                    addr = pv.v;
                    if (addr === 0)
                        throw new FalhaMemoria(
                            'uso de ponteiro NULL com ->' + e.nome + '.',
                            ['O ponteiro estava NULL na hora de ler o campo ' + e.nome + '.',
                             'Antes de usar p->' + e.nome + ', garanta que p nao e NULL.']);
                } else {
                    if (base.tipo.k === 'ptr')
                        this.erro('use -> em vez de . : ' + e.nome + ' esta dentro de um ponteiro', [], e);
                    if (!base.lv) this.erro('esperava uma struct antes de .' + e.nome, [], e);
                    st = base.tipo;
                    addr = base.addr;
                }
                if (!st || st.k !== 'struct')
                    this.erro('nao existe campo ' + e.nome + ' em ' + nomeTipo(st), [], e);
                const campo = st.mapa.get(e.nome);
                if (!campo)
                    this.erro('a struct ' + st.tag + ' nao tem o campo ' + e.nome + '.',
                              ['Campos disponiveis: ' + st.campos.map(c => c.nome).join(', ')], e);
                return { lv: true, addr: addr + campo.off, tipo: campo.tipo };
            }

            case 'chamada': return this.chamada(e);

            default: this.erro('expressao desconhecida: ' + e.t, [], e);
        }
    }

    deslocar(base, idx, e) {
        if (base.lv && base.tipo.k === 'array') {
            const el = base.tipo.de;
            return { lv: true, addr: base.addr + idx * el.tam, tipo: el };
        }
        const pv = this.valor(base);
        if (!ehPonteiro(pv.tipo))
            this.erro('so da para indexar ponteiro ou vetor (' + nomeTipo(pv.tipo) + ' nao serve)', [], e);
        const el = pv.tipo.para;
        if (pv.v === 0)
            throw new FalhaMemoria(
                'indexacao de um ponteiro NULL.',
                ['Voce usou [] num ponteiro que vale NULL.']);
        return { lv: true, addr: pv.v + idx * el.tam, tipo: el };
    }

    somarPasso(val, delta) {
        if (ehPonteiro(val.tipo))
            return { lv: false, v: val.v + delta * val.tipo.para.tam, tipo: val.tipo };
        return { lv: false, v: (this.numero(val) + delta) | 0, tipo: val.tipo };
    }

    unaria(e) {
        if (e.op === '&') {
            const a = this.avaliar(e.a);
            if (!a.lv) this.erro('& so funciona em variavel, campo ou posicao de vetor', [], e);
            return { lv: false, v: a.addr, tipo: ponteiro(a.tipo) };
        }
        if (e.op === '*') {
            const a = this.valor(this.avaliar(e.a));
            if (!ehPonteiro(a.tipo))
                this.erro('* so funciona em ponteiro (' + nomeTipo(a.tipo) + ' nao e)', [], e);
            if (a.v === 0)
                throw new FalhaMemoria('uso de * num ponteiro NULL.',
                    ['O ponteiro vale NULL e voce tentou ler o que ele aponta.']);
            return { lv: true, addr: a.v, tipo: a.tipo.para };
        }
        const a = this.valor(this.avaliar(e.a));
        const n = this.numero(a);
        switch (e.op) {
            case '-': return { lv: false, v: (-n) | 0, tipo: INT };
            case '+': return { lv: false, v: n | 0, tipo: a.tipo };
            case '!': return { lv: false, v: n === 0 ? 1 : 0, tipo: INT };
            case '~': return { lv: false, v: ~n, tipo: INT };
        }
        this.erro('operador unario desconhecido ' + e.op, [], e);
    }

    binaria(e) {
        if (e.op === '&&') {
            if (this.numero(this.avaliar(e.a)) === 0) return { lv: false, v: 0, tipo: INT };
            return { lv: false, v: this.numero(this.avaliar(e.b)) !== 0 ? 1 : 0, tipo: INT };
        }
        if (e.op === '||') {
            if (this.numero(this.avaliar(e.a)) !== 0) return { lv: false, v: 1, tipo: INT };
            return { lv: false, v: this.numero(this.avaliar(e.b)) !== 0 ? 1 : 0, tipo: INT };
        }
        const a = this.valor(this.avaliar(e.a));
        const b = this.valor(this.avaliar(e.b));
        return this.aplicarBin(e.op, a, b, e);
    }

    aplicarBin(op, a, b, e) {
        const pa = ehPonteiro(a.tipo), pb = ehPonteiro(b.tipo);

        if (op === '+' && pa && !pb)
            return { lv: false, v: a.v + this.numero(b) * a.tipo.para.tam, tipo: a.tipo };
        if (op === '+' && pb && !pa)
            return { lv: false, v: b.v + this.numero(a) * b.tipo.para.tam, tipo: b.tipo };
        if (op === '-' && pa && !pb)
            return { lv: false, v: a.v - this.numero(b) * a.tipo.para.tam, tipo: a.tipo };
        if (op === '-' && pa && pb)
            return { lv: false, v: ((a.v - b.v) / a.tipo.para.tam) | 0, tipo: INT };

        const x = this.numero(a), y = this.numero(b);
        switch (op) {
            case '+':  return { lv: false, v: (x + y) | 0, tipo: INT };
            case '-':  return { lv: false, v: (x - y) | 0, tipo: INT };
            case '*':  return { lv: false, v: Math.imul(x, y), tipo: INT };
            case '/':
                if (y === 0) this.erro('divisao por zero.', [], e);
                return { lv: false, v: (x / y) | 0, tipo: INT };
            case '%':
                if (y === 0) this.erro('resto de divisao por zero.', [], e);
                return { lv: false, v: (x % y) | 0, tipo: INT };
            case '<':  return { lv: false, v: x < y ? 1 : 0, tipo: INT };
            case '>':  return { lv: false, v: x > y ? 1 : 0, tipo: INT };
            case '<=': return { lv: false, v: x <= y ? 1 : 0, tipo: INT };
            case '>=': return { lv: false, v: x >= y ? 1 : 0, tipo: INT };
            case '==': return { lv: false, v: x === y ? 1 : 0, tipo: INT };
            case '!=': return { lv: false, v: x !== y ? 1 : 0, tipo: INT };
            case '&':  return { lv: false, v: x & y, tipo: INT };
            case '|':  return { lv: false, v: x | y, tipo: INT };
            case '^':  return { lv: false, v: x ^ y, tipo: INT };
            case '<<': return { lv: false, v: x << y, tipo: INT };
            case '>>': return { lv: false, v: x >> y, tipo: INT };
        }
        this.erro('operador desconhecido ' + op, [], e);
    }

    chamada(e) {
        if (e.alvo.t !== 'id')
            this.erro('so da para chamar funcoes pelo nome neste ambiente', [], e);
        const nome = e.alvo.nome;

        const f = this.p.resolverFuncao(nome, this.modulo);
        if (f) {
            const params = f.tipo.params || [];
            const args = [];
            for (let i = 0; i < e.args.length; i++) {
                const v = this.valor(this.avaliar(e.args[i]));
                args.push(params[i] ? this.ajustarArg(v, params[i].tipo) : v);
            }
            if (params.length > args.length && !f.tipo.variadica) {
                this.erro('a funcao ' + nome + ' espera ' + params.length +
                          ' argumento(s) e voce passou ' + args.length + '.', [], e);
            }
            return this.chamarFuncao(f, args);
        }

        const b = BUILTINS[nome];
        if (b) {
            const args = e.args.map(a => this.valor(this.avaliar(a)));
            return b(this, args, e);
        }

        this.erro('a funcao ' + nome + ' nao existe.',
                  ['Se ela devia estar em outro nivel, termine aquele nivel antes.',
                   'Se e uma funcao da biblioteca padrao, este ambiente so tem',
                   'malloc, free, printf, puts, putchar, abs, strlen, strcmp,',
                   'memset e memcpy.'], e);
    }

    ajustarArg(v, tipo) {
        if (tipo.k === 'struct') return v;
        if (v.lv && v.tipo.k === 'struct' && tipo.k === 'ptr') return v;
        return { lv: false, v: this.numero(v) | 0, tipo };
    }

    lerTexto(addr, max) {
        let s = '';
        for (let i = 0; i < (max || 4096); i++) {
            if (!this.mem.enderecoValido(addr + i, 1)) break;
            const c = this.mem.bytes[addr + i];
            if (c === 0) break;
            s += String.fromCharCode(c);
        }
        return s;
    }

    formatar(fmt, args) {
        let out = '';
        let ai = 0;
        for (let i = 0; i < fmt.length; i++) {
            if (fmt[i] !== '%') { out += fmt[i]; continue; }
            i++;
            if (fmt[i] === '%') { out += '%'; continue; }
            let flags = '';
            while ('-+ 0#'.includes(fmt[i])) { flags += fmt[i]; i++; }
            let largura = '';
            while (/[0-9]/.test(fmt[i])) { largura += fmt[i]; i++; }
            let precisao = '';
            if (fmt[i] === '.') { i++; while (/[0-9]/.test(fmt[i])) { precisao += fmt[i]; i++; } }
            while ('lhzjt'.includes(fmt[i])) i++;
            const conv = fmt[i];
            const arg = args[ai++];
            let s;
            switch (conv) {
                case 'd': case 'i': s = String(arg ? this.numero(arg) : 0); break;
                case 'u': s = String((arg ? this.numero(arg) : 0) >>> 0); break;
                case 'x': s = ((arg ? this.numero(arg) : 0) >>> 0).toString(16); break;
                case 'X': s = ((arg ? this.numero(arg) : 0) >>> 0).toString(16).toUpperCase(); break;
                case 'p': s = '0x' + ((arg ? this.numero(arg) : 0) >>> 0).toString(16); break;
                case 'c': s = String.fromCharCode(arg ? this.numero(arg) : 0); break;
                case 's': s = arg ? this.lerTexto(this.numero(arg)) : '(null)'; break;
                default:  s = '%' + (conv || ''); ai--; break;
            }
            if (precisao !== '' && conv === 's') s = s.slice(0, parseInt(precisao, 10));
            const w = parseInt(largura || '0', 10);
            if (s.length < w) {
                const pad = (flags.includes('0') && !flags.includes('-') && conv !== 's') ? '0' : ' ';
                s = flags.includes('-') ? s + ' '.repeat(w - s.length)
                                        : pad.repeat(w - s.length) + s;
            }
            out += s;
        }
        return out;
    }
}

/* ---- funcoes de biblioteca disponiveis ------------------------------- */
const BUILTINS = {
    malloc(it, args) {
        const tam = it.numero(args[0]);
        if (tam < 0 || tam > 4 * 1024 * 1024)
            throw new FalhaMemoria('malloc de ' + tam + ' bytes: valor sem sentido.',
                ['Confira o que voce passou para o malloc.']);
        const addr = it.mem.alocar(tam, false);
        return { lv: false, v: addr, tipo: ponteiro(VOID) };
    },
    calloc(it, args) {
        const tam = it.numero(args[0]) * it.numero(args[1]);
        const addr = it.mem.alocar(tam, true);
        it.mem.preencher(addr, 0, tam);
        return { lv: false, v: addr, tipo: ponteiro(VOID) };
    },
    free(it, args) { it.mem.liberar(it.numero(args[0])); return { lv: false, v: 0, tipo: VOID }; },
    printf(it, args) {
        const fmt = it.lerTexto(it.numero(args[0]));
        const s = it.formatar(fmt, args.slice(1));
        it.p.escrever(s);
        return { lv: false, v: s.length, tipo: INT };
    },
    puts(it, args) {
        const s = it.lerTexto(it.numero(args[0]));
        it.p.escrever(s + '\n');
        return { lv: false, v: 0, tipo: INT };
    },
    putchar(it, args) {
        const c = it.numero(args[0]);
        it.p.escrever(String.fromCharCode(c));
        return { lv: false, v: c, tipo: INT };
    },
    abs(it, args)  { return { lv: false, v: Math.abs(it.numero(args[0])) | 0, tipo: INT }; },
    exit()         { throw new Retorno(null); },
    strlen(it, args) { return { lv: false, v: it.lerTexto(it.numero(args[0])).length, tipo: INT }; },
    strcmp(it, args) {
        const a = it.lerTexto(it.numero(args[0])), b = it.lerTexto(it.numero(args[1]));
        return { lv: false, v: a < b ? -1 : (a > b ? 1 : 0), tipo: INT };
    },
    memset(it, args) {
        const d = it.numero(args[0]);
        it.mem.preencher(d, it.numero(args[1]), it.numero(args[2]));
        return { lv: false, v: d, tipo: ponteiro(VOID) };
    },
    memcpy(it, args) {
        const d = it.numero(args[0]);
        it.mem.copiar(d, it.numero(args[1]), it.numero(args[2]));
        return { lv: false, v: d, tipo: ponteiro(VOID) };
    },
    dojo_falta_implementar(it) {
        it.p.stub = true;
        return { lv: false, v: 0, tipo: VOID };
    }
};

export { BUILTINS, Retorno };
