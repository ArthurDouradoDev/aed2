/* ==========================================================================
 *  tipos.js -- o sistema de tipos
 *  Ponteiros tem 4 bytes, int tem 4, char tem 1. Isso mantem a armadilha do
 *  sizeof(no*) vs sizeof(no) exatamente com o mesmo sentido do C nativo.
 * ========================================================================== */

export const INT    = { k: 'int',  tam: 4, nome: 'int' };
export const UINT   = { k: 'int',  tam: 4, nome: 'unsigned int', semSinal: true };
export const CHAR   = { k: 'char', tam: 1, nome: 'char' };
export const VOID   = { k: 'void', tam: 1, nome: 'void' };

export function ponteiro(para) { return { k: 'ptr', para, tam: 4 }; }
export function vetor(de, n)   { return { k: 'array', de, n, tam: de.tam * n }; }

export function novaStruct(tag) {
    return { k: 'struct', tag: tag || '(anonima)', campos: [], mapa: new Map(),
             tam: 0, completa: false };
}

export function fecharStruct(st, campos) {
    let off = 0, maiorAlinhamento = 1;
    for (const c of campos) {
        const al = alinhamento(c.tipo);
        if (al > maiorAlinhamento) maiorAlinhamento = al;
        off = Math.ceil(off / al) * al;
        c.off = off;
        off += c.tipo.tam;
        st.mapa.set(c.nome, c);
    }
    st.campos = campos;
    st.tam = Math.max(1, Math.ceil(off / maiorAlinhamento) * maiorAlinhamento);
    st.completa = true;
    return st;
}

export function alinhamento(t) {
    switch (t.k) {
        case 'char':   return 1;
        case 'array':  return alinhamento(t.de);
        case 'struct': return t.campos.reduce((m, c) => Math.max(m, alinhamento(c.tipo)), 1);
        default:       return 4;
    }
}

export function ehPonteiro(t)  { return t.k === 'ptr'; }
export function ehInteiro(t)   { return t.k === 'int' || t.k === 'char'; }
export function ehEscalar(t)   { return ehInteiro(t) || ehPonteiro(t); }

/* Vetor vira ponteiro para o primeiro elemento em quase todo lugar. */
export function decair(t) {
    if (t.k === 'array') return ponteiro(t.de);
    return t;
}

export function nomeTipo(t) {
    if (!t) return '?';
    switch (t.k) {
        case 'int': case 'char': case 'void': return t.nome;
        case 'ptr':    return nomeTipo(t.para) + '*';
        case 'array':  return nomeTipo(t.de) + '[' + t.n + ']';
        case 'struct': return 'struct ' + t.tag;
        case 'func':   return nomeTipo(t.retorno) + '()';
        default:       return '?';
    }
}
