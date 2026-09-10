/* ==========================================================================
 *  markdown.js -- renderizador do material de estudo
 *  Subconjunto suficiente para os .md do repositorio: titulos, listas,
 *  tabelas, blocos de codigo, citacao, negrito, italico, links e regua.
 * ========================================================================== */
import { realcarC } from './editor.js';

const MARCA = String.fromCharCode(1);

function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function embutido(s) {
    let t = esc(s);
    const codigos = [];
    t = t.replace(/`([^`]+)`/g, (m, c) => {
        codigos.push(c);
        return MARCA + (codigos.length - 1) + MARCA;
    });
    t = t.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
                  '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(new RegExp(MARCA + '(\\d+)' + MARCA, 'g'),
                  (m, i) => '<code>' + codigos[+i] + '</code>');
    return t;
}

function tabela(linhas) {
    const celulas = (l) => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    const cab = celulas(linhas[0]);
    let h = '<table><thead><tr>';
    for (const c of cab) h += '<th>' + embutido(c) + '</th>';
    h += '</tr></thead><tbody>';
    for (let i = 2; i < linhas.length; i++) {
        h += '<tr>';
        for (const c of celulas(linhas[i])) h += '<td>' + embutido(c) + '</td>';
        h += '</tr>';
    }
    return h + '</tbody></table>';
}

export function renderizarMarkdown(src) {
    const linhas = src.replace(/\r/g, '').split('\n');
    let html = '';
    let i = 0;
    const pilhaLista = [];

    const fecharListas = (ate) => {
        while (pilhaLista.length > ate) html += pilhaLista.pop() === 'ol' ? '</ol>' : '</ul>';
    };

    while (i < linhas.length) {
        const l = linhas[i];

        if (/^```/.test(l)) {
            const lingua = l.slice(3).trim().toLowerCase();
            const corpo = [];
            i++;
            while (i < linhas.length && !/^```/.test(linhas[i])) { corpo.push(linhas[i]); i++; }
            i++;
            fecharListas(0);
            const texto = corpo.join('\n');
            html += '<pre><code>' +
                    (lingua === 'c' || lingua === '' ? realcarC(texto) : esc(texto)) +
                    '</code></pre>';
            continue;
        }

        if (/^\s*$/.test(l)) { fecharListas(0); i++; continue; }

        const th = l.match(/^(#{1,6})\s+(.*)$/);
        if (th) {
            fecharListas(0);
            const n = Math.min(6, th[1].length);
            html += '<h' + n + '>' + embutido(th[2]) + '</h' + n + '>';
            i++; continue;
        }

        if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) {
            fecharListas(0); html += '<hr>'; i++; continue;
        }

        if (/^\s*\|/.test(l) && /^\s*\|?[\s:|-]*$/.test(linhas[i + 1] || '') &&
            (linhas[i + 1] || '').includes('-')) {
            const bloco = [];
            while (i < linhas.length && /^\s*\|/.test(linhas[i])) { bloco.push(linhas[i].trim()); i++; }
            fecharListas(0);
            html += tabela(bloco);
            continue;
        }

        if (/^\s*>/.test(l)) {
            const bloco = [];
            while (i < linhas.length && /^\s*>/.test(linhas[i])) {
                bloco.push(linhas[i].replace(/^\s*>\s?/, '')); i++;
            }
            fecharListas(0);
            html += '<blockquote>' + renderizarMarkdown(bloco.join('\n')) + '</blockquote>';
            continue;
        }

        const li = l.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
        if (li) {
            const nivel = Math.floor(li[1].replace(/\t/g, '    ').length / 2) + 1;
            const tipo = /\d/.test(li[2]) ? 'ol' : 'ul';
            while (pilhaLista.length > nivel) html += pilhaLista.pop() === 'ol' ? '</ol>' : '</ul>';
            while (pilhaLista.length < nivel) { pilhaLista.push(tipo); html += '<' + tipo + '>'; }
            html += '<li>' + embutido(li[3]) + '</li>';
            i++; continue;
        }

        const paragrafo = [];
        while (i < linhas.length && !/^\s*$/.test(linhas[i]) &&
               !/^(#{1,6}\s|```|\s*[-*+]\s|\s*\d+[.)]\s|\s*>|\s*\|)/.test(linhas[i])) {
            paragrafo.push(linhas[i]); i++;
        }
        if (paragrafo.length) {
            fecharListas(0);
            html += '<p>' + embutido(paragrafo.join('\n')) + '</p>';
        } else { i++; }
    }
    fecharListas(0);
    return html;
}
