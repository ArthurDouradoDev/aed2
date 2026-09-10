/* ==========================================================================
 *  mapa.js -- o desenho do Campus EACH
 *
 *  As posicoes sao fixas de proposito: um mapa que muda de lugar a cada
 *  desenho nunca vira memoria espacial. O desenho e uma leitura literal da
 *  struct vertice -- flag vira a borda, dist e cor viram etiqueta e
 *  preenchimento -- para o aluno conseguir apontar qual campo produziu
 *  qual pixel.
 * ========================================================================== */

/* Desenho planar do campus: nenhuma rua cruza outra. */
const POS = {
    0: { x: 240, y: 350 },   /* Portaria   */
    1: { x: 450, y: 370 },   /* Bloco A1   */
    2: { x: 560, y: 200 },   /* Bandejao   */
    3: { x: 390, y:  90 },   /* Biblioteca */
    4: { x: 200, y: 150 },   /* Bloco A2   */
    5: { x:  70, y: 250 },   /* Lab Redes  */
    6: { x: 700, y: 260 },   /* Cantina    */
    7: { x: 230, y: 470 }    /* Auditorio  */
};

const ICONE = { 1: '\u{1F6AA}', 2: '\u{1F374}', 3: '\u{1F4DA}', 4: '\u{1F5A5}', 5: '\u{1F3AD}' };

const CORES_FAIXA = ['#4dd4ac', '#59a5ff', '#ffb454', '#b980f0', '#ff6b6b',
                     '#4ecdc4', '#f78fb3', '#c7d64f', '#8d9cae'];

const NS = 'http://www.w3.org/2000/svg';
function cria(tag, atrs) {
    const el = document.createElementNS(NS, tag);
    for (const k in atrs) el.setAttribute(k, atrs[k]);
    return el;
}

export class Mapa {
    constructor(raiz, dados) {
        this.raiz = raiz;
        this.dados = dados;
        this.aoClicar = null;
        this.svg = cria('svg', { viewBox: '0 0 780 540', role: 'img',
                                 'aria-label': 'mapa do campus' });
        raiz.innerHTML = '';
        raiz.appendChild(this.svg);
        this.desenhar();
    }

    desenhar() {
        const svg = this.svg;
        svg.innerHTML = '';

        const defs = cria('defs');
        defs.innerHTML =
            '<filter id="brilho" x="-60%" y="-60%" width="220%" height="220%">' +
            '<feGaussianBlur stdDeviation="7" result="b"/>' +
            '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
        svg.appendChild(defs);

        this.gArestas = cria('g');
        this.gRotulos = cria('g');
        this.gNos     = cria('g');
        svg.appendChild(this.gArestas);
        svg.appendChild(this.gRotulos);
        svg.appendChild(this.gNos);

        this.arestas = new Map();
        for (const t of this.dados.trechos) {
            const a = POS[t.de], b = POS[t.para];
            const linha = cria('line', {
                x1: a.x, y1: a.y, x2: b.x, y2: b.y,
                stroke: 'var(--borda)', 'stroke-width': 3 + Math.min(6, t.minutos) * 0.6,
                'stroke-linecap': 'round', class: 'rua'
            });
            this.gArestas.appendChild(linha);
            const meio = cria('text', {
                x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 7,
                'text-anchor': 'middle', class: 'peso',
                fill: 'var(--apagado)', 'font-size': 13
            });
            meio.textContent = t.minutos + ' min';
            this.gArestas.appendChild(meio);
            this.arestas.set(t.de + '-' + t.para, { linha, meio });
            this.arestas.set(t.para + '-' + t.de, { linha, meio });
        }

        this.nos = [];
        for (const l of this.dados.locais) {
            const p = POS[l.id];
            const g = cria('g', { class: 'no-campus', tabindex: '0', role: 'button',
                                  'aria-label': l.nome });
            const halo = cria('circle', { cx: p.x, cy: p.y, r: 33, fill: 'none',
                                          stroke: 'none', 'stroke-width': 4 });
            const circ = cria('circle', { cx: p.x, cy: p.y, r: 25,
                                          fill: 'var(--fundo3)', stroke: 'var(--borda)',
                                          'stroke-width': 3 });
            const ico = cria('text', { x: p.x, y: p.y + 6, 'text-anchor': 'middle',
                                       'font-size': 18 });
            ico.textContent = ICONE[l.tipo] || '?';
            const nome = cria('text', { x: p.x, y: p.y + 47, 'text-anchor': 'middle',
                                        'font-size': 14, fill: 'var(--texto)',
                                        'font-weight': '600' });
            nome.textContent = l.nome;
            const etiq = cria('text', { x: p.x, y: p.y - 34, 'text-anchor': 'middle',
                                        'font-size': 13, fill: 'var(--destaque)',
                                        'font-weight': '700' });
            const numero = cria('text', { x: p.x + 20, y: p.y - 16, 'text-anchor': 'middle',
                                          'font-size': 11, fill: 'var(--apagado)' });
            numero.textContent = l.id;

            g.append(halo, circ, ico, nome, etiq, numero);
            g.addEventListener('click', () => this.aoClicar && this.aoClicar(l.id));
            g.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.aoClicar && this.aoClicar(l.id); }
            });
            this.gNos.appendChild(g);
            this.nos.push({ g, circ, halo, nome, etiq, ico, local: l });
        }
    }

    /* Mapa apagado enquanto o aluno nao tem as arestas de pe. */
    apagado(mensagem) {
        for (const { linha, meio } of new Set(this.arestas.values())) {
            linha.setAttribute('stroke', 'var(--fundo3)');
            linha.setAttribute('opacity', '0.35');
            meio.setAttribute('opacity', '0');
        }
        for (const n of this.nos) {
            n.circ.setAttribute('fill', 'var(--fundo2)');
            n.circ.setAttribute('stroke', 'var(--fundo3)');
            n.circ.setAttribute('filter', '');
            n.g.setAttribute('opacity', '0.35');
            n.etiq.textContent = '';
        }
        this.mensagem(mensagem);
    }

    mensagem(txt) {
        if (this.aviso) { this.aviso.remove(); this.aviso = null; }
        if (!txt) return;
        const g = cria('g');
        /* Fica no topo, onde nao existe nenhum local, para nao tampar nome nenhum. */
        const r = cria('rect', { x: 140, y: 2, width: 500, height: 40, rx: 10,
                                 fill: 'var(--fundo2)', stroke: 'var(--borda)' });
        const t = cria('text', { x: 390, y: 28, 'text-anchor': 'middle',
                                 'font-size': 16, fill: 'var(--fraco)' });
        t.textContent = txt;
        g.append(r, t);
        this.svg.appendChild(g);
        this.aviso = g;
    }

    /* estado: { flag, dist, cor, destaque, caminho, arestas, rotulos,
                 apagados, usarCor } */
    pintar(estado) {
        this.mensagem(null);
        const e = estado || {};
        const vivos = new Set((e.arestas || this.dados.trechos.map(t => [t.de, t.para]))
                              .map(([a, b]) => a + '-' + b));
        const noCaminho = new Set();
        if (e.caminho) {
            for (let i = 0; i + 1 < e.caminho.length; i++) {
                noCaminho.add(e.caminho[i] + '-' + e.caminho[i + 1]);
                noCaminho.add(e.caminho[i + 1] + '-' + e.caminho[i]);
            }
        }

        for (const t of this.dados.trechos) {
            const chave = t.de + '-' + t.para;
            const { linha, meio } = this.arestas.get(chave);
            const existe = vivos.has(chave) || vivos.has(t.para + '-' + t.de);
            if (noCaminho.has(chave)) {
                linha.setAttribute('stroke', 'var(--destaque)');
                linha.setAttribute('opacity', '1');
                linha.setAttribute('filter', 'url(#brilho)');
            } else {
                linha.setAttribute('stroke', existe ? 'var(--borda)' : 'var(--erro)');
                linha.setAttribute('opacity', existe ? '1' : '0.25');
                linha.setAttribute('filter', '');
            }
            meio.setAttribute('opacity', existe ? '0.85' : '0.2');
        }

        const destaque = new Set(e.destaque || []);
        const apagados = new Set(e.apagados || []);

        for (const n of this.nos) {
            const i = n.local.id;
            let preenche = 'var(--fundo3)';
            let borda = 'var(--borda)';

            if (e.usarCor && e.cor && e.cor[i] > 0) {
                preenche = CORES_FAIXA[(e.cor[i] - 1) % CORES_FAIXA.length];
            } else if (e.flag) {
                if (e.flag[i] === 1) { preenche = 'var(--alerta)'; borda = 'var(--alerta)'; }
                else if (e.flag[i] === 2) { preenche = 'var(--fundo)'; borda = 'var(--texto)'; }
            }
            if (destaque.has(i)) borda = 'var(--destaque)';
            if (apagados.has(i)) { preenche = 'var(--fundo2)'; borda = 'var(--erro)'; }

            n.circ.setAttribute('fill', preenche);
            n.circ.setAttribute('stroke', borda);
            n.circ.setAttribute('filter', destaque.has(i) ? 'url(#brilho)' : '');
            n.g.setAttribute('opacity', apagados.has(i) ? '0.4' : '1');

            let etiqueta = '';
            if (e.rotulos && e.rotulos[i] !== undefined) etiqueta = String(e.rotulos[i]);
            n.etiq.textContent = etiqueta;
        }
    }

    /* Um quadro da animacao: so flag, dist e cor mudam. */
    mostrarQuadro(q, usarCor) {
        this.pintar({ flag: q.flag, dist: q.dist, cor: q.cor, usarCor,
                      rotulos: usarCor ? Object.fromEntries(q.cor.map((c, i) => [i, c ? 'faixa ' + c : ''])) :
                               Object.fromEntries(q.dist.map((d, i) => [i, d > 0 && d < 1000 ? String(d) : ''])) });
    }

    static legenda() {
        return '<span><i class="bolinha" style="background:var(--fundo3)"></i> branco: nao visitado</span>' +
               '<span><i class="bolinha" style="background:var(--alerta);border-color:var(--alerta)"></i> cinza: na fila / sendo visitado</span>' +
               '<span><i class="bolinha" style="background:var(--fundo);border-color:var(--texto)"></i> preto: terminado</span>' +
               '<span><i class="bolinha" style="border-color:var(--destaque)"></i> resposta</span>';
    }
}
