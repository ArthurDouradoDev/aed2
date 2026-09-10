/* ==========================================================================
 *  preprocessador.js -- o pre-processador de C
 *
 *  Resolve #include, #define (inclusive com argumentos), #undef e a familia
 *  #if / #ifdef / #ifndef / #elif / #else / #endif. Entra texto, sai a lista
 *  de tokens que o parser vai consumir.
 * ========================================================================== */
import { ErroC, tokenizar, removerComentarios, juntarContinuacoes } from './lexer.js';

function tokensDaLinha(texto, linha, arquivo) {
    const t = tokenizar(texto, arquivo);
    t.pop();                              /* tira o token de fim */
    for (const tk of t) tk.linha = linha;
    return t;
}

/* ---- avaliacao das expressoes de #if --------------------------------- */
function avaliarConstante(tokens, arquivo, linha) {
    let i = 0;
    const olhar = () => tokens[i] ? tokens[i].txt : '';
    const fim = () => i >= tokens.length;
    const erro = (m) => { throw new ErroC('#if: ' + m, linha, arquivo); };

    function primaria() {
        if (fim()) erro('expressao incompleta');
        const tk = tokens[i];
        if (tk.txt === '(') { i++; const v = ternario(); if (olhar() !== ')') erro('falta )'); i++; return v; }
        if (tk.tipo === 'num') { i++; return tk.valor | 0; }
        if (tk.tipo === 'id') { i++; return 0; }   /* identificador nao definido vale 0 */
        if (tk.txt === '!') { i++; return primaria() ? 0 : 1; }
        if (tk.txt === '-') { i++; return -primaria(); }
        if (tk.txt === '+') { i++; return primaria(); }
        if (tk.txt === '~') { i++; return ~primaria(); }
        erro('nao entendi ' + JSON.stringify(tk.txt));
    }
    const NIVEIS = [
        ['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='],
        ['<', '>', '<=', '>='], ['<<', '>>'], ['+', '-'], ['*', '/', '%']
    ];
    function binario(nivel) {
        if (nivel >= NIVEIS.length) return primaria();
        let esq = binario(nivel + 1);
        while (!fim() && NIVEIS[nivel].includes(olhar())) {
            const op = olhar(); i++;
            const dir = binario(nivel + 1);
            switch (op) {
                case '||': esq = (esq || dir) ? 1 : 0; break;
                case '&&': esq = (esq && dir) ? 1 : 0; break;
                case '|':  esq = esq | dir; break;
                case '^':  esq = esq ^ dir; break;
                case '&':  esq = esq & dir; break;
                case '==': esq = esq === dir ? 1 : 0; break;
                case '!=': esq = esq !== dir ? 1 : 0; break;
                case '<':  esq = esq < dir ? 1 : 0; break;
                case '>':  esq = esq > dir ? 1 : 0; break;
                case '<=': esq = esq <= dir ? 1 : 0; break;
                case '>=': esq = esq >= dir ? 1 : 0; break;
                case '<<': esq = esq << dir; break;
                case '>>': esq = esq >> dir; break;
                case '+':  esq = (esq + dir) | 0; break;
                case '-':  esq = (esq - dir) | 0; break;
                case '*':  esq = Math.imul(esq, dir); break;
                case '/':  esq = dir === 0 ? 0 : (esq / dir) | 0; break;
                case '%':  esq = dir === 0 ? 0 : (esq % dir) | 0; break;
            }
        }
        return esq;
    }
    function ternario() {
        const c = binario(0);
        if (olhar() === '?') {
            i++;
            const a = ternario();
            if (olhar() !== ':') erro('falta : no ?:');
            i++;
            const b = ternario();
            return c ? a : b;
        }
        return c;
    }
    return ternario();
}

/* ---- expansao de macros ---------------------------------------------- */
function textoDe(tokens) {
    let s = '';
    for (let i = 0; i < tokens.length; i++) {
        if (i > 0) s += ' ';
        s += tokens[i].tipo === 'str' ? JSON.stringify(tokens[i].txt) : tokens[i].txt;
    }
    return s;
}

function expandir(tokens, macros, bloqueados, arquivo) {
    const saida = [];
    let i = 0;
    let giros = 0;

    while (i < tokens.length) {
        if (++giros > 400000) throw new ErroC('macro expandindo sem parar', tokens[i].linha, arquivo);
        const tk = tokens[i];

        if (tk.tipo !== 'id' || !macros.has(tk.txt) || bloqueados.has(tk.txt)) {
            saida.push(tk); i++; continue;
        }
        const m = macros.get(tk.txt);

        if (m.params === null) {
            const corpo = m.corpo.map(x => ({ ...x, linha: tk.linha }));
            const novos = new Set(bloqueados); novos.add(tk.txt);
            saida.push(...expandir(corpo, macros, novos, arquivo));
            i++;
            continue;
        }

        /* macro com argumentos: precisa de ( logo em seguida */
        let j = i + 1;
        if (!tokens[j] || tokens[j].txt !== '(') { saida.push(tk); i++; continue; }
        j++;
        const args = [];
        let atual = [];
        let profundidade = 0;
        let fechou = false;
        while (j < tokens.length) {
            const x = tokens[j];
            if (x.txt === '(') profundidade++;
            if (x.txt === ')') {
                if (profundidade === 0) { fechou = true; j++; break; }
                profundidade--;
            }
            if (x.txt === ',' && profundidade === 0 &&
                !(m.variadic && args.length >= m.params.length - 1)) {
                args.push(atual); atual = []; j++; continue;
            }
            atual.push(x); j++;
        }
        if (!fechou) throw new ErroC('falta ) na chamada da macro ' + tk.txt, tk.linha, arquivo);
        if (atual.length || args.length) args.push(atual);

        const mapa = new Map();
        for (let k = 0; k < m.params.length; k++) {
            const nome = m.params[k];
            if (m.variadic && k === m.params.length - 1) {
                const resto = [];
                for (let q = k; q < args.length; q++) {
                    if (q > k) resto.push({ tipo: 'pontu', txt: ',', linha: tk.linha, arquivo });
                    resto.push(...(args[q] || []));
                }
                mapa.set('__VA_ARGS__', resto);
            } else {
                mapa.set(nome, args[k] || []);
            }
        }

        /* substitui os parametros no corpo, tratando # e ## */
        const corpo = [];
        for (let k = 0; k < m.corpo.length; k++) {
            const c = m.corpo[k];
            if (c.txt === '#' && m.corpo[k + 1] && mapa.has(m.corpo[k + 1].txt)) {
                corpo.push({ tipo: 'str', txt: textoDe(mapa.get(m.corpo[k + 1].txt)),
                             valor: textoDe(mapa.get(m.corpo[k + 1].txt)),
                             linha: tk.linha, arquivo });
                k++;
                continue;
            }
            if (m.corpo[k + 1] && m.corpo[k + 1].txt === '##' && m.corpo[k + 2]) {
                const esq = mapa.has(c.txt) ? mapa.get(c.txt) : [c];
                const dir = mapa.has(m.corpo[k + 2].txt) ? mapa.get(m.corpo[k + 2].txt) : [m.corpo[k + 2]];
                const a = esq.length ? esq[esq.length - 1].txt : '';
                const b = dir.length ? dir[0].txt : '';
                corpo.push(...esq.slice(0, -1));
                const colados = tokensDaLinha(a + b, tk.linha, arquivo);
                corpo.push(...colados);
                corpo.push(...dir.slice(1));
                k += 2;
                continue;
            }
            if (mapa.has(c.txt)) {
                const arg = mapa.get(c.txt);
                corpo.push(...expandir(arg, macros, bloqueados, arquivo)
                            .map(x => ({ ...x, linha: tk.linha })));
            } else {
                corpo.push({ ...c, linha: tk.linha });
            }
        }

        const novos = new Set(bloqueados); novos.add(tk.txt);
        saida.push(...expandir(corpo, macros, novos, arquivo));
        i = j;
    }
    return saida;
}

/* ---- o pre-processador ------------------------------------------------ */
export function preprocessar(arquivoPrincipal, sistemaArquivos, definesIniciais) {
    const macros = new Map();
    const saida = [];
    const incluidos = new Set();

    for (const [nome, corpo] of Object.entries(definesIniciais || {})) {
        macros.set(nome, { params: null, corpo: tokensDaLinha(String(corpo), 0, '<inicial>') });
    }

    function processar(arquivo, profundidade) {
        if (profundidade > 24) throw new ErroC('#include em circulo', 0, arquivo);
        let src = sistemaArquivos[arquivo];
        if (src === undefined) throw new ErroC('arquivo nao encontrado: ' + arquivo, 0, arquivo);
        src = removerComentarios(juntarContinuacoes(src));
        const linhas = src.split('\n');

        /* pilha de condicionais: {ativo, jaPegouRamo, viuElse} */
        const pilha = [];
        const ativo = () => pilha.every(p => p.ativo);

        for (let ln = 0; ln < linhas.length; ln++) {
            const bruta = linhas[ln];
            const texto = bruta.trim();
            const numLinha = ln + 1;

            if (texto.startsWith('#')) {
                const corpo = texto.slice(1).trim();
                const esp = corpo.search(/[\s(]/);
                const nome = esp < 0 ? corpo : corpo.slice(0, esp);
                const resto = esp < 0 ? '' : corpo.slice(esp).trim();

                switch (nome) {
                    case '': break;
                    case 'pragma': case 'line': break;

                    case 'ifdef': case 'ifndef': {
                        const alvo = resto.split(/[^A-Za-z0-9_]/)[0];
                        const tem = macros.has(alvo);
                        const val = (nome === 'ifdef') ? tem : !tem;
                        pilha.push({ ativo: ativo() && val, jaPegouRamo: val, viuElse: false });
                        break;
                    }
                    case 'if': {
                        let v = false;
                        if (ativo()) {
                            const tks = prepararCondicional(resto, numLinha, arquivo, macros);
                            v = avaliarConstante(tks, arquivo, numLinha) !== 0;
                        }
                        pilha.push({ ativo: ativo() && v, jaPegouRamo: v, viuElse: false });
                        break;
                    }
                    case 'elif': {
                        if (!pilha.length) throw new ErroC('#elif sem #if', numLinha, arquivo);
                        const topo = pilha[pilha.length - 1];
                        if (topo.viuElse) throw new ErroC('#elif depois de #else', numLinha, arquivo);
                        const paisAtivos = pilha.slice(0, -1).every(p => p.ativo);
                        let v = false;
                        if (paisAtivos && !topo.jaPegouRamo) {
                            const tks = prepararCondicional(resto, numLinha, arquivo, macros);
                            v = avaliarConstante(tks, arquivo, numLinha) !== 0;
                        }
                        topo.ativo = paisAtivos && v && !topo.jaPegouRamo;
                        if (topo.ativo) topo.jaPegouRamo = true;
                        break;
                    }
                    case 'else': {
                        if (!pilha.length) throw new ErroC('#else sem #if', numLinha, arquivo);
                        const topo = pilha[pilha.length - 1];
                        const paisAtivos = pilha.slice(0, -1).every(p => p.ativo);
                        topo.viuElse = true;
                        topo.ativo = paisAtivos && !topo.jaPegouRamo;
                        if (topo.ativo) topo.jaPegouRamo = true;
                        break;
                    }
                    case 'endif': {
                        if (!pilha.length) throw new ErroC('#endif sem #if', numLinha, arquivo);
                        pilha.pop();
                        break;
                    }

                    case 'include': {
                        if (!ativo()) break;
                        let alvo = null;
                        const m1 = resto.match(/^"([^"]+)"/);
                        const m2 = resto.match(/^<([^>]+)>/);
                        if (m1) alvo = m1[1];
                        else if (m2) alvo = m2[1];
                        else {
                            const exp = expandir(tokensDaLinha(resto, numLinha, arquivo),
                                                 macros, new Set(), arquivo);
                            const t = textoDe(exp);
                            const m3 = t.match(/[<"]\s*([^>"]+)\s*[>"]/);
                            if (m3) alvo = m3[1].trim();
                        }
                        if (alvo === null) throw new ErroC('#include mal escrito', numLinha, arquivo);
                        if (sistemaArquivos[alvo] === undefined) {
                            throw new ErroC(
                                'nao existe o arquivo "' + alvo + '" para incluir.\n' +
                                'Aqui existem: ' + Object.keys(sistemaArquivos).join(', '),
                                numLinha, arquivo);
                        }
                        if (incluidos.has(alvo) && /^[a-z]+\.h$/.test(alvo)) break;
                        incluidos.add(alvo);
                        processar(alvo, profundidade + 1);
                        break;
                    }

                    case 'define': {
                        if (!ativo()) break;
                        const mm = resto.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
                        if (!mm) throw new ErroC('#define sem nome', numLinha, arquivo);
                        const alvo = mm[1];
                        let depois = resto.slice(alvo.length);
                        if (depois.startsWith('(')) {
                            const fecha = depois.indexOf(')');
                            if (fecha < 0) throw new ErroC('#define sem ) na lista de parametros', numLinha, arquivo);
                            const listaTxt = depois.slice(1, fecha).trim();
                            let params = listaTxt.length ? listaTxt.split(',').map(s => s.trim()) : [];
                            const variadic = params.length > 0 && params[params.length - 1] === '...';
                            if (variadic) params[params.length - 1] = '__VA_ARGS__';
                            macros.set(alvo, {
                                params, variadic,
                                corpo: tokensDaLinha(depois.slice(fecha + 1), numLinha, arquivo)
                            });
                        } else {
                            macros.set(alvo, {
                                params: null,
                                corpo: tokensDaLinha(depois, numLinha, arquivo)
                            });
                        }
                        break;
                    }
                    case 'undef': {
                        if (!ativo()) break;
                        const alvo = resto.split(/[^A-Za-z0-9_]/)[0];
                        macros.delete(alvo);
                        break;
                    }
                    case 'error': {
                        if (!ativo()) break;
                        throw new ErroC('#error: ' + resto, numLinha, arquivo);
                    }
                    default:
                        if (ativo()) throw new ErroC('diretiva desconhecida: #' + nome, numLinha, arquivo);
                }
                continue;
            }

            if (!ativo() || texto === '') continue;
            const tks = tokensDaLinha(bruta, numLinha, arquivo);
            saida.push(...expandir(tks, macros, new Set(), arquivo));
        }

        if (pilha.length) throw new ErroC('falta #endif', linhas.length, arquivo);
    }

    function prepararCondicional(resto, numLinha, arquivo, macros) {
        let tks = tokensDaLinha(resto, numLinha, arquivo);
        /* resolve defined(X) antes de expandir as macros */
        const semDefined = [];
        for (let i = 0; i < tks.length; i++) {
            if (tks[i].tipo === 'id' && tks[i].txt === 'defined') {
                let j = i + 1, temPar = false;
                if (tks[j] && tks[j].txt === '(') { temPar = true; j++; }
                const alvo = tks[j] ? tks[j].txt : '';
                j++;
                if (temPar) { if (!tks[j] || tks[j].txt !== ')') throw new ErroC('defined sem )', numLinha, arquivo); j++; }
                semDefined.push({ tipo: 'num', txt: macros.has(alvo) ? '1' : '0',
                                  valor: macros.has(alvo) ? 1 : 0, linha: numLinha, arquivo });
                i = j - 1;
            } else {
                semDefined.push(tks[i]);
            }
        }
        return expandir(semDefined, macros, new Set(), arquivo);
    }

    processar(arquivoPrincipal, 0);
    saida.push({ tipo: 'fim', txt: '<fim>', linha: 0, arquivo: arquivoPrincipal });
    return { tokens: saida, macros };
}
