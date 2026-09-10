/* ==========================================================================
 *  parser.js -- analisador sintatico de C (subconjunto do curso)
 *
 *  Cobre o que a materia usa: structs, typedef, ponteiros, vetores de uma e
 *  duas dimensoes, funcoes (inclusive static e recursivas), todos os
 *  comandos de controle e o conjunto completo de operadores inteiros.
 * ========================================================================== */
import { ErroC } from './lexer.js';
import { INT, UINT, CHAR, VOID, ponteiro, vetor, novaStruct, fecharStruct,
         nomeTipo } from './tipos.js';

const CHAVES_TIPO = new Set([
    'void', 'char', 'short', 'int', 'long', 'signed', 'unsigned', 'float',
    'double', 'struct', 'union', 'enum', '_Bool'
]);
const CHAVES_ARMAZ = new Set(['typedef', 'static', 'extern', 'auto', 'register', 'inline']);
const CHAVES_QUAL  = new Set(['const', 'volatile']);

export class Parser {
    constructor(tokens) {
        this.tk = tokens;
        this.i = 0;
        this.typedefs = new Map();
        this.structs  = new Map();
        this.enums    = new Map();
        this.declaracoes = [];
    }

    /* ---- utilidades ------------------------------------------------- */
    atual()  { return this.tk[this.i]; }
    olhar(n) { return this.tk[this.i + (n || 0)]; }
    txt(n)   { const t = this.olhar(n); return t ? t.txt : ''; }
    avancar(){ return this.tk[this.i++]; }
    ehTxt(s) { return this.txt() === s; }

    comer(s) {
        if (this.txt() !== s) this.erro('esperava ' + JSON.stringify(s) + ' e veio ' + JSON.stringify(this.txt()));
        return this.avancar();
    }
    aceitar(s) { if (this.txt() === s) { this.avancar(); return true; } return false; }

    erro(msg, tk) {
        const t = tk || this.atual() || { linha: 0, arquivo: '' };
        throw new ErroC(msg, t.linha, t.arquivo);
    }

    ehInicioDeTipo(n) {
        const t = this.olhar(n || 0);
        if (!t) return false;
        if (t.tipo === 'chave')
            return CHAVES_TIPO.has(t.txt) || CHAVES_ARMAZ.has(t.txt) || CHAVES_QUAL.has(t.txt);
        if (t.tipo === 'id') return this.typedefs.has(t.txt);
        return false;
    }

    /* ---- especificadores de tipo ------------------------------------ */
    lerEspecificadores() {
        let base = null;
        let armazenamento = null;
        let vistos = [];
        let semSinal = false;

        for (;;) {
            const t = this.atual();
            if (!t) break;

            if (t.tipo === 'chave' && CHAVES_ARMAZ.has(t.txt)) {
                armazenamento = t.txt; this.avancar(); continue;
            }
            if (t.tipo === 'chave' && CHAVES_QUAL.has(t.txt)) { this.avancar(); continue; }

            if (t.tipo === 'chave' && (t.txt === 'struct' || t.txt === 'union')) {
                if (base) break;
                base = this.lerStruct();
                continue;
            }
            if (t.tipo === 'chave' && t.txt === 'enum') {
                if (base) break;
                base = this.lerEnum();
                continue;
            }
            if (t.tipo === 'chave' && CHAVES_TIPO.has(t.txt)) {
                if (t.txt === 'float' || t.txt === 'double')
                    this.erro('este ambiente roda C com inteiros e ponteiros;\n' +
                              'nao ha suporte a ponto flutuante (' + t.txt + ').');
                if (t.txt === 'unsigned') semSinal = true;
                vistos.push(t.txt); this.avancar(); continue;
            }
            if (t.tipo === 'id' && !base && vistos.length === 0 && this.typedefs.has(t.txt)) {
                base = this.typedefs.get(t.txt);
                this.avancar();
                continue;
            }
            break;
        }

        if (!base) {
            if (vistos.length === 0) return null;
            if (vistos.includes('void')) base = VOID;
            else if (vistos.includes('char')) base = CHAR;
            else base = semSinal ? UINT : INT;
        }
        return { base, armazenamento };
    }

    lerStruct() {
        this.avancar();                       /* struct / union */
        let tag = null;
        if (this.atual() && this.atual().tipo === 'id') tag = this.avancar().txt;

        let st;
        if (tag && this.structs.has(tag)) st = this.structs.get(tag);
        else { st = novaStruct(tag); if (tag) this.structs.set(tag, st); }

        if (!this.ehTxt('{')) {
            if (!tag) this.erro('struct sem nome e sem corpo');
            return st;
        }
        this.comer('{');
        const campos = [];
        while (!this.ehTxt('}')) {
            if (this.atual().tipo === 'fim') this.erro('falta } fechando a struct');
            const esp = this.lerEspecificadores();
            if (!esp) this.erro('campo de struct sem tipo');
            do {
                const d = this.lerDeclarador(esp.base);
                if (!d.nome) this.erro('campo de struct sem nome');
                campos.push({ nome: d.nome, tipo: d.tipo });
            } while (this.aceitar(','));
            this.comer(';');
        }
        this.comer('}');
        fecharStruct(st, campos);
        return st;
    }

    lerEnum() {
        this.avancar();
        let tag = null;
        if (this.atual() && this.atual().tipo === 'id') tag = this.avancar().txt;
        if (this.ehTxt('{')) {
            this.comer('{');
            let valor = 0;
            while (!this.ehTxt('}')) {
                const nome = this.avancar().txt;
                if (this.aceitar('=')) {
                    const e = this.expressaoAtribuicao();
                    valor = this.constante(e);
                }
                this.enums.set(nome, valor);
                valor++;
                if (!this.aceitar(',')) break;
            }
            this.comer('}');
        }
        return INT;
    }

    /* ---- declaradores ------------------------------------------------ */
    lerDeclarador(base) {
        let tipo = base;
        while (this.aceitar('*')) {
            while (this.atual() && this.atual().tipo === 'chave' && CHAVES_QUAL.has(this.txt()))
                this.avancar();
            tipo = ponteiro(tipo);
        }
        return this.lerDeclaradorDireto(tipo);
    }

    lerDeclaradorDireto(tipo) {
        let nome = null;
        let interno = null;

        if (this.ehTxt('(') && (this.olhar(1).txt === '*' ||
            (this.olhar(1).tipo === 'id' && !this.ehInicioDeTipo(1)))) {
            this.comer('(');
            interno = this.lerDeclarador(VOID);      /* base provisoria */
            this.comer(')');
            nome = interno.nome;
        } else if (this.atual() && this.atual().tipo === 'id') {
            nome = this.avancar().txt;
        }

        /* sufixos: [] e () */
        const sufixos = [];
        for (;;) {
            if (this.ehTxt('[')) {
                this.comer('[');
                let n = null;
                if (!this.ehTxt(']')) n = this.constante(this.expressaoAtribuicao());
                this.comer(']');
                sufixos.push({ tipo: 'vetor', n });
            } else if (this.ehTxt('(')) {
                this.comer('(');
                const params = [];
                let variadica = false;
                if (!this.ehTxt(')')) {
                    do {
                        if (this.ehTxt('...')) { this.avancar(); variadica = true; break; }
                        const esp = this.lerEspecificadores();
                        if (!esp) this.erro('parametro sem tipo');
                        const d = this.lerDeclarador(esp.base);
                        if (d.tipo === VOID && !d.nome && params.length === 0) break;
                        let pt = d.tipo;
                        if (pt.k === 'array') pt = ponteiro(pt.de);
                        params.push({ nome: d.nome, tipo: pt });
                    } while (this.aceitar(','));
                }
                this.comer(')');
                sufixos.push({ tipo: 'func', params, variadica });
            } else break;
        }

        /* aplica os sufixos de fora para dentro */
        for (let k = sufixos.length - 1; k >= 0; k--) {
            const s = sufixos[k];
            if (s.tipo === 'vetor') tipo = vetor(tipo, s.n === null ? 0 : s.n);
            else tipo = { k: 'func', retorno: tipo, params: s.params, variadica: s.variadica, tam: 4 };
        }

        if (interno) {
            /* ponteiro para funcao e afins: recoloca a base */
            const recolocar = (t) => {
                if (t === VOID) return tipo;
                if (t.k === 'ptr')   return ponteiro(recolocar(t.para));
                if (t.k === 'array') return vetor(recolocar(t.de), t.n);
                if (t.k === 'func')  return { ...t, retorno: recolocar(t.retorno) };
                return tipo;
            };
            tipo = recolocar(interno.tipo);
        }
        return { nome, tipo };
    }

    /* Avalia uma expressao constante simples (tamanhos de vetor). */
    constante(e) {
        const v = this.avaliarConst(e);
        if (v === null) this.erro('esperava um tamanho constante aqui');
        return v;
    }
    avaliarConst(e) {
        switch (e.t) {
            case 'num': return e.v | 0;
            case 'id':  return this.enums.has(e.nome) ? this.enums.get(e.nome) : null;
            case 'un': {
                const a = this.avaliarConst(e.a);
                if (a === null) return null;
                if (e.op === '-') return -a;
                if (e.op === '+') return a;
                if (e.op === '!') return a ? 0 : 1;
                if (e.op === '~') return ~a;
                return null;
            }
            case 'bin': {
                const a = this.avaliarConst(e.a), b = this.avaliarConst(e.b);
                if (a === null || b === null) return null;
                switch (e.op) {
                    case '+': return a + b; case '-': return a - b;
                    case '*': return a * b; case '/': return b ? (a / b) | 0 : 0;
                    case '%': return b ? a % b : 0;
                    case '<<': return a << b; case '>>': return a >> b;
                    default: return null;
                }
            }
            case 'sizeofTipo': return e.tipo.tam;
            default: return null;
        }
    }

    /* ---- programa ----------------------------------------------------- */
    parsePrograma() {
        while (this.atual() && this.atual().tipo !== 'fim') {
            if (this.aceitar(';')) continue;
            this.declaracaoExterna();
        }
        return {
            declaracoes: this.declaracoes,
            structs: this.structs,
            typedefs: this.typedefs,
            enums: this.enums
        };
    }

    declaracaoExterna() {
        const linha = this.atual().linha;
        const esp = this.lerEspecificadores();
        if (!esp) this.erro('nao entendi esta declaracao');

        if (this.aceitar(';')) return;             /* so declarou a struct */

        let primeiro = true;
        do {
            const d = this.lerDeclarador(esp.base);
            if (esp.armazenamento === 'typedef') {
                if (d.nome) this.typedefs.set(d.nome, d.tipo);
                primeiro = false;
                continue;
            }
            if (!d.nome) this.erro('declaracao sem nome');

            if (d.tipo.k === 'func' && primeiro && this.ehTxt('{')) {
                const corpo = this.bloco();
                this.declaracoes.push({
                    t: 'funcao', nome: d.nome, tipo: d.tipo,
                    estatica: esp.armazenamento === 'static', corpo, linha
                });
                return;
            }
            if (d.tipo.k === 'func') {
                this.declaracoes.push({ t: 'prototipo', nome: d.nome, tipo: d.tipo, linha });
            } else {
                let inicial = null;
                if (this.aceitar('=')) inicial = this.inicializador();
                this.declaracoes.push({
                    t: 'global', nome: d.nome, tipo: d.tipo, inicial,
                    externa: esp.armazenamento === 'extern',
                    estatica: esp.armazenamento === 'static', linha
                });
            }
            primeiro = false;
        } while (this.aceitar(','));
        this.comer(';');
    }

    inicializador() {
        if (this.ehTxt('{')) {
            const linha = this.atual().linha;
            this.comer('{');
            const itens = [];
            while (!this.ehTxt('}')) {
                itens.push(this.inicializador());
                if (!this.aceitar(',')) break;
            }
            this.comer('}');
            return { t: 'lista', itens, linha };
        }
        return this.expressaoAtribuicao();
    }

    /* ---- comandos ----------------------------------------------------- */
    bloco() {
        const linha = this.atual().linha;
        this.comer('{');
        const itens = [];
        while (!this.ehTxt('}')) {
            if (this.atual().tipo === 'fim') this.erro('falta } fechando o bloco');
            itens.push(this.comandoOuDeclaracao());
        }
        this.comer('}');
        return { t: 'bloco', itens, linha };
    }

    comandoOuDeclaracao() {
        if (this.ehInicioDeTipo() &&
            !(this.atual().tipo === 'id' && this.txt(1) === ':')) {
            return this.declaracaoLocal();
        }
        return this.comando();
    }

    declaracaoLocal() {
        const linha = this.atual().linha;
        const esp = this.lerEspecificadores();
        if (!esp) this.erro('declaracao local sem tipo');
        const itens = [];
        if (!this.ehTxt(';')) {
            do {
                const d = this.lerDeclarador(esp.base);
                if (esp.armazenamento === 'typedef') {
                    if (d.nome) this.typedefs.set(d.nome, d.tipo);
                    continue;
                }
                if (!d.nome) this.erro('declaracao sem nome');
                let inicial = null;
                if (this.aceitar('=')) inicial = this.inicializador();
                itens.push({ nome: d.nome, tipo: d.tipo, inicial,
                             estatica: esp.armazenamento === 'static' });
            } while (this.aceitar(','));
        }
        this.comer(';');
        return { t: 'decl', itens, linha };
    }

    comando() {
        const t = this.atual();
        const linha = t.linha;

        if (t.txt === '{') return this.bloco();
        if (this.aceitar(';')) return { t: 'vazio', linha };

        if (t.tipo === 'chave') {
            switch (t.txt) {
                case 'if': {
                    this.avancar(); this.comer('(');
                    const c = this.expressao(); this.comer(')');
                    const ent = this.comandoOuDeclaracao();
                    let sen = null;
                    if (this.atual() && this.txt() === 'else') { this.avancar(); sen = this.comandoOuDeclaracao(); }
                    return { t: 'se', c, ent, sen, linha };
                }
                case 'while': {
                    this.avancar(); this.comer('(');
                    const c = this.expressao(); this.comer(')');
                    const corpo = this.comandoOuDeclaracao();
                    return { t: 'enquanto', c, corpo, linha };
                }
                case 'do': {
                    this.avancar();
                    const corpo = this.comandoOuDeclaracao();
                    if (this.txt() !== 'while') this.erro('falta o while do do-while');
                    this.avancar(); this.comer('(');
                    const c = this.expressao();
                    this.comer(')'); this.comer(';');
                    return { t: 'facaEnquanto', corpo, c, linha };
                }
                case 'for': {
                    this.avancar(); this.comer('(');
                    let ini = null;
                    if (this.ehTxt(';')) this.avancar();
                    else if (this.ehInicioDeTipo()) ini = this.declaracaoLocal();
                    else { ini = { t: 'expr', e: this.expressao(), linha }; this.comer(';'); }
                    let cond = null;
                    if (!this.ehTxt(';')) cond = this.expressao();
                    this.comer(';');
                    let inc = null;
                    if (!this.ehTxt(')')) inc = this.expressao();
                    this.comer(')');
                    const corpo = this.comandoOuDeclaracao();
                    return { t: 'para', ini, cond, inc, corpo, linha };
                }
                case 'return': {
                    this.avancar();
                    let e = null;
                    if (!this.ehTxt(';')) e = this.expressao();
                    this.comer(';');
                    return { t: 'retorne', e, linha };
                }
                case 'break':    this.avancar(); this.comer(';'); return { t: 'quebre', linha };
                case 'continue': this.avancar(); this.comer(';'); return { t: 'siga', linha };
                case 'switch': {
                    this.avancar(); this.comer('(');
                    const e = this.expressao(); this.comer(')');
                    const corpo = this.comandoOuDeclaracao();
                    return { t: 'escolha', e, corpo, linha };
                }
                case 'case': {
                    this.avancar();
                    const v = this.constante(this.expressaoCondicional());
                    this.comer(':');
                    return { t: 'caso', v, linha };
                }
                case 'default': this.avancar(); this.comer(':'); return { t: 'padrao', linha };
                case 'goto':
                    this.erro('goto nao e suportado neste ambiente (e nem cai na prova)');
            }
        }

        /* rotulo */
        if (t.tipo === 'id' && this.txt(1) === ':') {
            this.avancar(); this.avancar();
            return this.comandoOuDeclaracao();
        }

        const e = this.expressao();
        this.comer(';');
        return { t: 'expr', e, linha };
    }

    /* ---- expressoes --------------------------------------------------- */
    expressao() {
        let e = this.expressaoAtribuicao();
        while (this.ehTxt(',')) {
            const linha = this.atual().linha;
            this.avancar();
            e = { t: 'virgula', a: e, b: this.expressaoAtribuicao(), linha };
        }
        return e;
    }

    expressaoAtribuicao() {
        const inicio = this.i;
        const esq = this.expressaoCondicional();
        const op = this.txt();
        if (['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>='].includes(op)) {
            const linha = this.atual().linha;
            this.avancar();
            const dir = this.expressaoAtribuicao();
            return { t: 'atrib', op, alvo: esq, valor: dir, linha };
        }
        void inicio;
        return esq;
    }

    expressaoCondicional() {
        const c = this.binaria(0);
        if (this.ehTxt('?')) {
            const linha = this.atual().linha;
            this.avancar();
            const a = this.expressao();
            this.comer(':');
            const b = this.expressaoCondicional();
            return { t: 'cond', c, a, b, linha };
        }
        return c;
    }

    static NIVEIS = [
        ['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='],
        ['<', '>', '<=', '>='], ['<<', '>>'], ['+', '-'], ['*', '/', '%']
    ];

    binaria(nivel) {
        if (nivel >= Parser.NIVEIS.length) return this.unaria();
        let esq = this.binaria(nivel + 1);
        for (;;) {
            const op = this.txt();
            if (!Parser.NIVEIS[nivel].includes(op)) break;
            const linha = this.atual().linha;
            this.avancar();
            const dir = this.binaria(nivel + 1);
            esq = { t: 'bin', op, a: esq, b: dir, linha };
        }
        return esq;
    }

    unaria() {
        const t = this.atual();
        const linha = t.linha;

        if (['-', '+', '!', '~', '*', '&'].includes(t.txt) && t.tipo === 'pontu') {
            this.avancar();
            return { t: 'un', op: t.txt, a: this.unaria(), linha };
        }
        if (t.txt === '++' || t.txt === '--') {
            this.avancar();
            return { t: 'pre', op: t.txt, a: this.unaria(), linha };
        }
        if (t.tipo === 'chave' && t.txt === 'sizeof') {
            this.avancar();
            if (this.ehTxt('(') && this.ehInicioDeTipo(1)) {
                this.comer('(');
                const tipo = this.nomeDeTipo();
                this.comer(')');
                return { t: 'sizeofTipo', tipo, linha };
            }
            return { t: 'sizeofExpr', e: this.unaria(), linha };
        }
        /* cast */
        if (t.txt === '(' && this.ehInicioDeTipo(1)) {
            const salvo = this.i;
            this.comer('(');
            const tipo = this.nomeDeTipo();
            if (this.ehTxt(')')) {
                this.comer(')');
                return { t: 'cast', tipo, e: this.unaria(), linha };
            }
            this.i = salvo;
        }
        return this.posfixa();
    }

    nomeDeTipo() {
        const esp = this.lerEspecificadores();
        if (!esp) this.erro('esperava um tipo');
        const d = this.lerDeclarador(esp.base);
        return d.tipo;
    }

    posfixa() {
        let e = this.primaria();
        for (;;) {
            const t = this.atual();
            if (!t) break;
            if (t.txt === '[') {
                this.avancar();
                const idx = this.expressao();
                this.comer(']');
                e = { t: 'indice', a: e, b: idx, linha: t.linha };
            } else if (t.txt === '(') {
                this.avancar();
                const args = [];
                if (!this.ehTxt(')')) {
                    do { args.push(this.expressaoAtribuicao()); } while (this.aceitar(','));
                }
                this.comer(')');
                e = { t: 'chamada', alvo: e, args, linha: t.linha };
            } else if (t.txt === '.' || t.txt === '->') {
                this.avancar();
                const nome = this.avancar();
                if (nome.tipo !== 'id' && nome.tipo !== 'chave')
                    this.erro('esperava o nome de um campo depois de ' + t.txt, nome);
                e = { t: 'campo', a: e, nome: nome.txt, seta: t.txt === '->', linha: t.linha };
            } else if (t.txt === '++' || t.txt === '--') {
                this.avancar();
                e = { t: 'pos', op: t.txt, a: e, linha: t.linha };
            } else break;
        }
        return e;
    }

    primaria() {
        const t = this.atual();
        if (!t || t.tipo === 'fim') this.erro('a expressao terminou antes da hora');
        const linha = t.linha;

        if (t.tipo === 'num') { this.avancar(); return { t: 'num', v: t.valor | 0, linha }; }
        if (t.tipo === 'str') { this.avancar(); return { t: 'str', v: t.txt, linha }; }
        if (t.tipo === 'id')  {
            this.avancar();
            if (this.enums.has(t.txt)) return { t: 'num', v: this.enums.get(t.txt), linha };
            return { t: 'id', nome: t.txt, linha };
        }
        if (t.txt === '(') {
            this.avancar();
            const e = this.expressao();
            this.comer(')');
            return e;
        }
        this.erro('nao entendi ' + JSON.stringify(t.txt) + ' aqui');
    }
}

export function analisar(tokens) {
    return new Parser(tokens).parsePrograma();
}
export { nomeTipo };
