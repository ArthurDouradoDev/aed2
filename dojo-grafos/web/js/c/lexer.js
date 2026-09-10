/* ==========================================================================
 *  lexer.js -- analisador lexico de C
 *
 *  Transforma texto em tokens. Guarda linha e coluna de cada token para que
 *  as mensagens de erro apontem o lugar certo no editor.
 * ========================================================================== */

export class ErroC extends Error {
    constructor(msg, linha, arquivo) {
        super(msg);
        this.nome = 'ErroC';
        this.linha = linha || 0;
        this.arquivo = arquivo || '';
    }
}

const PALAVRAS = new Set([
    'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
    'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'int',
    'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
    'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile',
    'while', 'inline', '_Bool'
]);

const PONTU3 = ['<<=', '>>=', '...'];
const PONTU2 = ['->', '++', '--', '<<', '>>', '<=', '>=', '==', '!=', '&&',
                '||', '+=', '-=', '*=', '/=', '%=', '&=', '^=', '|=', '##'];
const PONTU1 = '[](){}.&*+-~!/%<>^|?:;=,#';

export function ehPalavraChave(s) { return PALAVRAS.has(s); }

/* Remove comentarios preservando as quebras de linha, para que os numeros
   de linha continuem batendo com o que o aluno ve no editor. */
export function removerComentarios(src) {
    let out = '';
    let i = 0;
    const n = src.length;
    while (i < n) {
        const c = src[i];
        if (c === '/' && src[i + 1] === '*') {
            i += 2;
            while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
                out += (src[i] === '\n') ? '\n' : ' ';
                i++;
            }
            i += 2;
            out += ' ';
        } else if (c === '/' && src[i + 1] === '/') {
            while (i < n && src[i] !== '\n') i++;
            out += ' ';
        } else if (c === '"' || c === "'") {
            const aspa = c;
            out += c; i++;
            while (i < n && src[i] !== aspa) {
                if (src[i] === '\\') { out += src[i]; i++; if (i < n) { out += src[i]; i++; } }
                else { out += src[i]; i++; }
            }
            if (i < n) { out += src[i]; i++; }
        } else {
            out += c; i++;
        }
    }
    return out;
}

/* Junta linhas terminadas em barra invertida, mantendo a contagem de linhas
   com quebras vazias no lugar. */
export function juntarContinuacoes(src) {
    const linhas = src.split('\n');
    const saida = [];
    let acumulado = '';
    let pendentes = 0;
    for (const linha of linhas) {
        if (linha.endsWith('\\')) {
            acumulado += linha.slice(0, -1);
            pendentes++;
        } else {
            saida.push(acumulado + linha);
            for (let k = 0; k < pendentes; k++) saida.push('');
            acumulado = '';
            pendentes = 0;
        }
    }
    if (acumulado) saida.push(acumulado);
    return saida.join('\n');
}

export function escapar(c) {
    switch (c) {
        case 'n': return 10; case 't': return 9;  case 'r': return 13;
        case '0': return 0;  case '\\': return 92; case "'": return 39;
        case '"': return 34; case 'a': return 7;  case 'b': return 8;
        case 'f': return 12; case 'v': return 11; case '?': return 63;
        default:  return c.charCodeAt(0);
    }
}

/* Devolve a lista de tokens de um texto ja sem comentarios.
   Cada token: { tipo, txt, valor, linha, inicioLinha } */
export function tokenizar(src, arquivo) {
    const t = [];
    let i = 0, linha = 1;
    const n = src.length;
    let inicioLinha = true;

    const erro = (m) => { throw new ErroC(m, linha, arquivo); };

    while (i < n) {
        const c = src[i];

        if (c === '\n') { linha++; i++; inicioLinha = true; continue; }
        if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v') { i++; continue; }

        const linhaTok = linha;
        const iniTok = inicioLinha;
        inicioLinha = false;

        /* identificador ou palavra-chave */
        if (/[A-Za-z_]/.test(c)) {
            let j = i;
            while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
            const txt = src.slice(i, j);
            t.push({ tipo: PALAVRAS.has(txt) ? 'chave' : 'id', txt,
                     linha: linhaTok, inicioLinha: iniTok, arquivo });
            i = j;
            continue;
        }

        /* numero */
        if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
            let j = i, ehFloat = false;
            if (c === '0' && (src[i + 1] === 'x' || src[i + 1] === 'X')) {
                j = i + 2;
                while (j < n && /[0-9a-fA-F]/.test(src[j])) j++;
                const valor = parseInt(src.slice(i + 2, j), 16);
                while (j < n && /[uUlL]/.test(src[j])) j++;
                t.push({ tipo: 'num', txt: src.slice(i, j), valor,
                         linha: linhaTok, inicioLinha: iniTok, arquivo });
                i = j;
                continue;
            }
            while (j < n && /[0-9]/.test(src[j])) j++;
            if (src[j] === '.') { ehFloat = true; j++; while (j < n && /[0-9]/.test(src[j])) j++; }
            if (src[j] === 'e' || src[j] === 'E') {
                ehFloat = true; j++;
                if (src[j] === '+' || src[j] === '-') j++;
                while (j < n && /[0-9]/.test(src[j])) j++;
            }
            const texto = src.slice(i, j);
            while (j < n && /[uUlLfF]/.test(src[j])) j++;
            if (ehFloat) {
                erro('numero com ponto flutuante (' + texto + '). Este ambiente\n' +
                     'roda apenas C com inteiros e ponteiros, que e o que a\n' +
                     'materia de grafos usa.');
            }
            t.push({ tipo: 'num', txt: texto, valor: parseInt(texto, 10) | 0,
                     linha: linhaTok, inicioLinha: iniTok, arquivo });
            i = j;
            continue;
        }

        /* caractere */
        if (c === "'") {
            i++;
            let valor = 0;
            if (src[i] === '\\') { i++; valor = escapar(src[i]); i++; }
            else { valor = src.charCodeAt(i); i++; }
            if (src[i] !== "'") erro("caractere mal formado (falta fechar a aspa simples)");
            i++;
            t.push({ tipo: 'num', txt: String(valor), valor,
                     linha: linhaTok, inicioLinha: iniTok, arquivo });
            continue;
        }

        /* texto */
        if (c === '"') {
            i++;
            let s = '';
            while (i < n && src[i] !== '"') {
                if (src[i] === '\\') { i++; s += String.fromCharCode(escapar(src[i])); i++; }
                else { s += src[i]; i++; }
            }
            if (i >= n) erro('texto sem fechar (falta a aspa dupla)');
            i++;
            t.push({ tipo: 'str', txt: s, valor: s,
                     linha: linhaTok, inicioLinha: iniTok, arquivo });
            continue;
        }

        /* pontuacao */
        const tres = src.substr(i, 3);
        if (PONTU3.includes(tres)) {
            t.push({ tipo: 'pontu', txt: tres, linha: linhaTok, inicioLinha: iniTok, arquivo });
            i += 3; continue;
        }
        const dois = src.substr(i, 2);
        if (PONTU2.includes(dois)) {
            t.push({ tipo: 'pontu', txt: dois, linha: linhaTok, inicioLinha: iniTok, arquivo });
            i += 2; continue;
        }
        if (PONTU1.includes(c)) {
            t.push({ tipo: 'pontu', txt: c, linha: linhaTok, inicioLinha: iniTok, arquivo });
            i++; continue;
        }

        erro('caractere inesperado: ' + JSON.stringify(c));
    }

    t.push({ tipo: 'fim', txt: '<fim>', linha, inicioLinha: true, arquivo });
    return t;
}
