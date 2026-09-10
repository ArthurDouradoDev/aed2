/* ==========================================================================
 *  editor.js -- editor de C com realce de sintaxe
 *
 *  Um <textarea> transparente por cima de um <pre> colorido. Simples de
 *  proposito: nao depende de nenhuma biblioteca externa, funciona sem rede
 *  depois da primeira visita e nao briga com o teclado do celular.
 * ========================================================================== */

const CHAVES = new Set(['auto', 'break', 'case', 'const', 'continue', 'default',
    'do', 'else', 'enum', 'extern', 'for', 'goto', 'if', 'inline', 'register',
    'return', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
    'volatile', 'while']);
const TIPOS = new Set(['char', 'double', 'float', 'int', 'long', 'short',
    'signed', 'unsigned', 'void', 'bool', 'size_t', 'no', 'vertice', 'FILA']);
const CONSTS = new Set(['NULL', 'TRUE', 'FALSE', 'V', 'INFINITO']);

function escapar(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function realcarC(src) {
    let out = '';
    let i = 0;
    const n = src.length;
    while (i < n) {
        const c = src[i];

        if (c === '/' && src[i + 1] === '*') {
            let j = src.indexOf('*/', i + 2);
            j = j < 0 ? n : j + 2;
            out += '<span class="s-com">' + escapar(src.slice(i, j)) + '</span>';
            i = j; continue;
        }
        if (c === '/' && src[i + 1] === '/') {
            let j = src.indexOf('\n', i);
            if (j < 0) j = n;
            out += '<span class="s-com">' + escapar(src.slice(i, j)) + '</span>';
            i = j; continue;
        }
        if (c === '#' && (i === 0 || src[i - 1] === '\n')) {
            let j = src.indexOf('\n', i);
            if (j < 0) j = n;
            out += '<span class="s-pre">' + escapar(src.slice(i, j)) + '</span>';
            i = j; continue;
        }
        if (c === '"' || c === "'") {
            let j = i + 1;
            while (j < n && src[j] !== c) { if (src[j] === '\\') j++; j++; }
            j = Math.min(j + 1, n);
            out += '<span class="s-txt">' + escapar(src.slice(i, j)) + '</span>';
            i = j; continue;
        }
        if (/[0-9]/.test(c) && !/[A-Za-z0-9_]/.test(src[i - 1] || '')) {
            let j = i;
            while (j < n && /[0-9A-Fa-fxX]/.test(src[j])) j++;
            out += '<span class="s-num">' + escapar(src.slice(i, j)) + '</span>';
            i = j; continue;
        }
        if (/[A-Za-z_]/.test(c)) {
            let j = i;
            while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
            const p = src.slice(i, j);
            let k = j;
            while (k < n && src[k] === ' ') k++;
            let cls = '';
            if (CHAVES.has(p)) cls = 's-chave';
            else if (TIPOS.has(p)) cls = 's-tipo';
            else if (CONSTS.has(p)) cls = 's-const';
            else if (src[k] === '(') cls = 's-fun';
            out += cls ? '<span class="' + cls + '">' + escapar(p) + '</span>' : escapar(p);
            i = j; continue;
        }
        if ('+-*/%=<>!&|^~?:'.includes(c)) {
            out += '<span class="s-op">' + escapar(c) + '</span>';
            i++; continue;
        }
        out += escapar(c);
        i++;
    }
    return out;
}

const SIMBOLOS = ['{', '}', '(', ')', '[', ']', ';', '*', '->', '=', '!', '&', '<', '>'];

export class Editor {
    constructor(raiz, aoMudar) {
        this.raiz = raiz;
        this.aoMudar = aoMudar;
        this.marcas = [];
        raiz.innerHTML =
            '<div class="ed-simbolos"></div>' +
            '<div class="ed-corpo">' +
              '<div class="ed-gutter" aria-hidden="true"></div>' +
              '<div class="ed-area">' +
                '<pre class="ed-realce" aria-hidden="true"><code></code></pre>' +
                '<textarea class="ed-texto" spellcheck="false" autocapitalize="off" ' +
                  'autocomplete="off" autocorrect="off" wrap="off" ' +
                  'aria-label="editor de codigo C"></textarea>' +
              '</div>' +
            '</div>';

        this.gutter = raiz.querySelector('.ed-gutter');
        this.realce = raiz.querySelector('.ed-realce code');
        this.pre    = raiz.querySelector('.ed-realce');
        this.ta     = raiz.querySelector('.ed-texto');
        this.barra  = raiz.querySelector('.ed-simbolos');

        for (const s of SIMBOLOS) {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = s;
            b.tabIndex = -1;
            b.addEventListener('mousedown', (ev) => { ev.preventDefault(); this.inserir(s); });
            this.barra.appendChild(b);
        }

        this.ta.addEventListener('input', () => this.atualizar(true));
        this.ta.addEventListener('scroll', () => this.sincronizar());
        this.ta.addEventListener('keydown', (ev) => this.tecla(ev));
        this.ta.addEventListener('click', () => this.mostrarPosicao());
        this.ta.addEventListener('keyup', () => this.mostrarPosicao());
    }

    valor() { return this.ta.value; }

    definir(texto, semAvisar) {
        this.ta.value = texto;
        this.marcas = [];
        this.atualizar(!semAvisar);
    }

    focar() { this.ta.focus(); }

    inserir(txt) {
        const ini = this.ta.selectionStart, fim = this.ta.selectionEnd;
        this.ta.setRangeText(txt, ini, fim, 'end');
        this.atualizar(true);
        this.ta.focus();
    }

    tecla(ev) {
        if (ev.key === 'Tab') {
            ev.preventDefault();
            this.inserir('    ');
            return;
        }
        if (ev.key === 'Enter') {
            const pos = this.ta.selectionStart;
            const antes = this.ta.value.slice(0, pos);
            const linha = antes.slice(antes.lastIndexOf('\n') + 1);
            const recuo = (linha.match(/^[ \t]*/) || [''])[0];
            const extra = /\{\s*$/.test(linha) ? '    ' : '';
            const depois = this.ta.value.slice(this.ta.selectionEnd);
            ev.preventDefault();
            if (extra && depois.trimStart().startsWith('}')) {
                this.inserir('\n' + recuo + extra + '\n' + recuo);
                const p = this.ta.selectionStart - (recuo.length + 1);
                this.ta.setSelectionRange(p, p);
                this.atualizar(true);
            } else {
                this.inserir('\n' + recuo + extra);
            }
            return;
        }
        if (ev.key === '}' ) {
            const pos = this.ta.selectionStart;
            const antes = this.ta.value.slice(0, pos);
            const linha = antes.slice(antes.lastIndexOf('\n') + 1);
            if (/^[ \t]+$/.test(linha) && linha.length >= 4) {
                ev.preventDefault();
                const ini = pos - 4;
                this.ta.setRangeText('}', ini, pos, 'end');
                this.atualizar(true);
            }
        }
    }

    mostrarPosicao() {
        const pos = this.ta.selectionStart;
        const antes = this.ta.value.slice(0, pos);
        const linha = antes.split('\n').length;
        const col = pos - antes.lastIndexOf('\n');
        this.raiz.dispatchEvent(new CustomEvent('posicao', { detail: { linha, col } }));
    }

    marcar(marcas) {
        this.marcas = marcas || [];
        this.desenharGutter();
    }

    irParaLinha(n) {
        const linhas = this.ta.value.split('\n');
        let pos = 0;
        for (let i = 0; i < Math.min(n - 1, linhas.length); i++) pos += linhas[i].length + 1;
        this.ta.focus();
        this.ta.setSelectionRange(pos, pos + (linhas[n - 1] || '').length);
        const alturaLinha = this.pre.getBoundingClientRect().height / Math.max(1, linhas.length);
        this.ta.scrollTop = Math.max(0, (n - 4) * alturaLinha);
        this.sincronizar();
    }

    desenharGutter() {
        const total = this.ta.value.split('\n').length;
        const erradas = new Map();
        for (const m of this.marcas) erradas.set(m.linha, m.texto || '');
        let html = '';
        for (let i = 1; i <= total; i++) {
            html += erradas.has(i)
                ? '<span class="ln erro" title="' + escapar(erradas.get(i)) + '">' + i + '</span>'
                : '<span class="ln">' + i + '</span>';
        }
        this.gutter.innerHTML = html;
    }

    atualizar(avisar) {
        this.realce.innerHTML = realcarC(this.ta.value) + '\n';
        this.desenharGutter();
        this.sincronizar();
        if (avisar && this.aoMudar) this.aoMudar(this.ta.value);
    }

    sincronizar() {
        this.pre.scrollTop = this.ta.scrollTop;
        this.pre.scrollLeft = this.ta.scrollLeft;
        this.gutter.scrollTop = this.ta.scrollTop;
    }
}
