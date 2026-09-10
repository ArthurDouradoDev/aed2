/* ==========================================================================
 *  app.js -- a interface do Dojo de Grafos
 * ========================================================================== */
import { Motor, R_OK, R_STUB, R_FALHOU, R_QUEBROU } from './dojo/motor.js';
import { Campus } from './dojo/campus.js';
import { Editor } from './ui/editor.js';
import { Mapa } from './ui/mapa.js';
import { Armazem, ARQUIVOS, baixar } from './ui/armazenamento.js';
import { renderizarMarkdown } from './ui/markdown.js';

const $ = (s) => document.querySelector(s);
const pausa = () => new Promise(r => setTimeout(r, 0));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const NOME_STATUS = { [R_OK]: 'ok', [R_STUB]: 'a fazer', [R_FALHOU]: 'falhou', [R_QUEBROU]: 'quebrou' };
const CLASSE_STATUS = { [R_OK]: 'ok', [R_STUB]: 'stub', [R_FALHOU]: 'falhou', [R_QUEBROU]: 'quebrou' };

const estado = {
    catalogo: null, grafoH: '', stubs: {}, materiais: [],
    motor: null, campus: null, armazem: null,
    editor: null, mapaPainel: null, mapaCampus: null,
    arquivo: 0, exercicio: 0, nivel: 1,
    status: [], sujos: new Set(), rodando: false,
    ultimoResultado: null, funcSelecionada: -1,
    animacao: null
};

/* ====================================================================== */
async function iniciar() {
    try {
        const [cat, gh, mats] = await Promise.all([
            fetch('dados/catalogo.json').then(r => r.json()),
            fetch('dados/grafo.h').then(r => r.text()),
            fetch('dados/materiais/indice.json').then(r => r.json()).catch(() => [])
        ]);
        estado.catalogo = cat;
        estado.grafoH = gh;
        estado.materiais = mats;

        const textos = await Promise.all(
            ARQUIVOS.map(n => fetch('dados/stubs/' + n).then(r => r.text())));
        ARQUIVOS.forEach((n, i) => { estado.stubs[n] = textos[i]; });
    } catch (e) {
        document.body.innerHTML =
            '<div style="padding:40px;font-family:system-ui">' +
            '<h2>Nao consegui carregar os dados do Dojo.</h2>' +
            '<p>Se voce abriu o index.html com duplo clique, o navegador bloqueia a ' +
            'leitura dos arquivos ao lado. Sirva a pasta por HTTP (por exemplo ' +
            '<code>python -m http.server</code> dentro de <code>web/</code>) ou use a ' +
            'versao publicada.</p><pre>' + esc(e && e.message) + '</pre></div>';
        return;
    }

    estado.armazem = new Armazem();
    estado.armazem.iniciarSeVazio(estado.stubs);
    estado.status = estado.armazem.dados.status.length === estado.catalogo.exercicios.length
        ? estado.armazem.dados.status.slice()
        : new Array(estado.catalogo.exercicios.length).fill(R_STUB);
    estado.arquivo = estado.armazem.dados.ultimoArquivo || 0;
    estado.exercicio = estado.armazem.dados.ultimoExercicio || 0;
    estado.nivel = estado.catalogo.exercicios[estado.exercicio].nivel;

    document.documentElement.setAttribute('data-tema', estado.armazem.dados.tema || 'escuro');

    estado.motor = new Motor(estado.catalogo, estado.grafoH);
    estado.campus = new Campus(estado.catalogo.campus, estado.motor);

    montarEditor();
    montarNavegacao();
    montarCampus();
    montarMaterial();
    recompilar();
    desenharTudo();
    trocarTela(estado.armazem.dados.status.length ? 'painel' : 'painel');
}

/* ---- compilacao -------------------------------------------------------- */
function recompilar() {
    const r = estado.motor.carregar(estado.armazem.fontes());
    mostrarErrosCompilacao(r.ok ? null : r.erros);
    return r.ok;
}

function mostrarErrosCompilacao(erros) {
    const nomeArquivo = ARQUIVOS[estado.arquivo];
    if (!erros) {
        estado.editor.marcar([]);
        $('#estado').textContent = '';
        return;
    }
    estado.editor.marcar(erros.filter(e => e.arquivo === nomeArquivo)
                              .map(e => ({ linha: e.linha, texto: e.mensagem.split('\n')[0] })));
    $('#estado').innerHTML = '<span style="color:var(--erro)">o codigo nao compila</span>';
    const html = '<div class="selo falhou">o codigo nao compila</div>' +
        '<p style="color:var(--fraco)">O Dojo nem chega a rodar os testes enquanto o C nao ' +
        'fecha. Clique na linha para ir ate ela.</p><ul class="lista-erros">' +
        erros.map(e =>
            '<li><span class="linha-clicavel" data-arq="' + esc(e.arquivo) + '" data-linha="' + e.linha + '">' +
            esc(e.arquivo) + ':' + e.linha + '</span> <code>' +
            esc(e.mensagem.split('\n')[0]) + '</code>' +
            (e.mensagem.includes('\n') ? '<div style="color:var(--fraco);white-space:pre-wrap">' +
                esc(e.mensagem.split('\n').slice(1).join('\n')) + '</div>' : '') + '</li>').join('') +
        '</ul>';
    $('#p-resultado').innerHTML = html;
    for (const el of $('#p-resultado').querySelectorAll('.linha-clicavel')) {
        el.addEventListener('click', () => {
            const i = ARQUIVOS.indexOf(el.dataset.arq);
            if (i >= 0) trocarArquivo(i);
            estado.editor.irParaLinha(+el.dataset.linha);
        });
    }
    trocarPainelLado('resultado');
}

/* ---- editor ------------------------------------------------------------ */
function montarEditor() {
    estado.editor = new Editor($('#editor'), (texto) => {
        estado.armazem.definirArquivo(ARQUIVOS[estado.arquivo], texto);
        estado.sujos.add(estado.arquivo);
        desenharAbasArquivo();
        clearTimeout(estado.temporizador);
        estado.temporizador = setTimeout(() => { recompilar(); }, 700);
    });
    estado.editor.definir(estado.armazem.arquivo(ARQUIVOS[estado.arquivo]) || '', true);

    document.addEventListener('keydown', (ev) => {
        if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); rodarNivel(); }
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); estado.armazem.salvar(); avisarEstado('salvo no navegador'); }
    });
}

function trocarArquivo(i) {
    estado.arquivo = i;
    estado.armazem.dados.ultimoArquivo = i;
    estado.armazem.salvar();
    estado.editor.definir(estado.armazem.arquivo(ARQUIVOS[i]) || '', true);
    desenharAbasArquivo();
    const r = estado.motor.erros;
    if (r) mostrarErrosCompilacao(r);
}

function desenharAbasArquivo() {
    const alvo = $('#abas-arquivo');
    alvo.innerHTML = estado.catalogo.niveis.map((n, i) =>
        '<button data-i="' + i + '" class="' + (i === estado.arquivo ? 'ativa' : '') + '">' +
        'N' + n.numero + ' ' + esc(ARQUIVOS[i].replace(/^n\d_/, '').replace('.c', '')) +
        (estado.sujos.has(i) ? ' <span class="ponto">&bull;</span>' : '') + '</button>').join('');
    for (const b of alvo.querySelectorAll('button'))
        b.addEventListener('click', () => trocarArquivo(+b.dataset.i));
}

/* ---- navegacao --------------------------------------------------------- */
function montarNavegacao() {
    for (const b of $('#abas').querySelectorAll('button'))
        b.addEventListener('click', () => trocarTela(b.dataset.tela));

    for (const b of $('#abas-lado').querySelectorAll('button'))
        b.addEventListener('click', () => trocarPainelLado(b.dataset.p));

    $('#bt-rodar').addEventListener('click', () => rodarNivel());
    $('#bt-rodar-um').addEventListener('click', () => rodarUm(estado.exercicio));
    $('#bt-restaurar').addEventListener('click', () => restaurarEsqueleto());
    $('#bt-conferir').addEventListener('click', () => rodarTudo());
    $('#bt-continuar').addEventListener('click', () => {
        const prox = estado.motor.proximoExercicio(estado.status);
        if (prox !== null) irParaExercicio(prox);
        trocarTela('treino');
    });
    $('#bt-tema').addEventListener('click', () => {
        const novo = document.documentElement.getAttribute('data-tema') === 'claro' ? 'escuro' : 'claro';
        document.documentElement.setAttribute('data-tema', novo);
        estado.armazem.dados.tema = novo;
        estado.armazem.salvar();
    });
    $('#bt-config').addEventListener('click', abrirConfig);
    $('#cortina').addEventListener('click', (e) => { if (e.target === $('#cortina')) fecharCaixa(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharCaixa(); });
}

function trocarTela(nome) {
    for (const s of document.querySelectorAll('.tela')) s.classList.remove('ativa');
    $('#tela-' + nome).classList.add('ativa');
    for (const b of $('#abas').querySelectorAll('button'))
        b.classList.toggle('ativa', b.dataset.tela === nome);
    if (nome === 'campus') desenharCampus();
    if (nome === 'painel') desenharPainel();
    if (nome === 'treino') estado.editor.atualizar(false);
}

function trocarPainelLado(nome) {
    for (const p of document.querySelectorAll('.painel-lado')) p.classList.remove('ativa');
    $('#p-' + nome).classList.add('ativa');
    for (const b of $('#abas-lado').querySelectorAll('button'))
        b.classList.toggle('ativa', b.dataset.p === nome);
}

function avisarEstado(txt, cor) {
    $('#estado').innerHTML = cor ? '<span style="color:' + cor + '">' + esc(txt) + '</span>' : esc(txt);
}

/* ---- execucao ---------------------------------------------------------- */
function salvarStatus() {
    estado.armazem.dados.status = estado.status.slice();
    estado.armazem.salvar();
}

async function rodarUm(indice) {
    if (estado.rodando) return;
    if (!recompilar()) return;
    estado.rodando = true;
    avisarEstado('rodando...');
    await pausa();
    const r = estado.motor.rodarIndice(indice);
    estado.status[indice] = r.status;
    limparSujo();
    salvarStatus();
    mostrarResultado(r);
    desenharTudo();
    estado.rodando = false;
    return r;
}

async function rodarNivel(nivel) {
    if (estado.rodando) return;
    if (!recompilar()) return;
    const n = nivel || estado.nivel;

    if (estado.motor.nivelBloqueado(estado.status, n)) {
        $('#p-resultado').innerHTML =
            '<div class="selo stub">nivel ' + n + ' bloqueado</div>' +
            '<p>Os exercicios do nivel ' + n + ' usam as funcoes que voce escreve no nivel ' +
            (n - 1) + '. Enquanto elas nao estiverem certas, nada aqui pode ser testado de ' +
            'verdade: os testes montam os grafos chamando o SEU codigo.</p>' +
            '<button class="bt principal" id="bt-ir-anterior">Ir para o nivel ' + (n - 1) + '</button>';
        $('#bt-ir-anterior').addEventListener('click', () => { escolherNivel(n - 1); rodarNivel(n - 1); });
        trocarPainelLado('resultado');
        return;
    }

    estado.rodando = true;
    const indices = estado.catalogo.exercicios
        .map((e, i) => ({ e, i })).filter(x => x.e.nivel === n).map(x => x.i);

    let parou = null;
    for (const i of indices) {
        avisarEstado('rodando ' + estado.catalogo.exercicios[i].nivel + '.' +
                     estado.catalogo.exercicios[i].num + '...');
        await pausa();
        const r = estado.motor.rodarIndice(i);
        estado.status[i] = r.status;
        desenharChips();
        if (r.status !== R_OK) { parou = r; break; }
    }
    limparSujo();
    salvarStatus();

    if (parou) {
        irParaExercicio(parou.indice, true);
        mostrarResultado(parou);
    } else {
        const proximo = n < 7 ? n + 1 : null;
        $('#p-resultado').innerHTML =
            '<div class="selo ok">nivel ' + n + ' completo</div>' +
            '<p>Os ' + indices.length + ' exercicios do nivel ' + n + ' passaram.</p>' +
            (proximo
                ? '<button class="bt principal" id="bt-prox-nivel">Abrir o nivel ' + proximo + '</button>'
                : '<p><b>Voce fechou os 51.</b> Rode o Campus para ver tudo funcionando, ' +
                  'ou comece um ciclo novo pelas opcoes.</p>');
        if (proximo) $('#bt-prox-nivel').addEventListener('click', () => {
            escolherNivel(proximo);
            const prox = estado.motor.proximoExercicio(estado.status);
            if (prox !== null) irParaExercicio(prox);
        });
        trocarPainelLado('resultado');
        avisarEstado('nivel ' + n + ' completo', 'var(--destaque)');
    }
    desenharTudo();
    estado.rodando = false;
}

async function rodarTudo() {
    if (estado.rodando) return;
    if (!recompilar()) { trocarTela('treino'); return; }
    estado.rodando = true;
    const total = estado.catalogo.exercicios.length;
    for (let i = 0; i < total; i++) {
        $('#hero-texto').textContent = 'conferindo... ' + (i + 1) + ' de ' + total;
        if (i % 4 === 0) await pausa();
        estado.status[i] = estado.motor.rodarIndice(i).status;
    }
    limparSujo();
    salvarStatus();
    desenharTudo();
    estado.rodando = false;
}

function limparSujo() { estado.sujos.clear(); desenharAbasArquivo(); }

function irParaExercicio(indice, semTrocarTela) {
    estado.exercicio = indice;
    estado.nivel = estado.catalogo.exercicios[indice].nivel;
    estado.armazem.dados.ultimoExercicio = indice;
    const arq = estado.nivel - 1;
    if (arq !== estado.arquivo) trocarArquivo(arq);
    estado.armazem.salvar();
    desenharEnunciado();
    desenharDicas();
    desenharChips();
    desenharPilulas();
    if (!semTrocarTela) trocarTela('treino');
}

function escolherNivel(n) {
    estado.nivel = n;
    const primeiro = estado.catalogo.exercicios.findIndex(e => e.nivel === n);
    const pendente = estado.catalogo.exercicios.findIndex((e, i) => e.nivel === n && estado.status[i] !== R_OK);
    irParaExercicio(pendente >= 0 ? pendente : primeiro, true);
}

/* ---- resultado --------------------------------------------------------- */
function mostrarResultado(r) {
    const ex = r.exercicio || estado.catalogo.exercicios[r.indice];
    let h = '<div class="selo ' + CLASSE_STATUS[r.status] + '">' +
            ex.nivel + '.' + ex.num + ' ' + esc(ex.nome) + ': ' + NOME_STATUS[r.status] + '</div>';

    if (r.status === R_OK) {
        h += '<p>Passou. ' + (r.aviso
            ? '<b style="color:var(--alerta)">Mas atencao:</b>' : 'Pode seguir para o proximo.') + '</p>';
        if (r.aviso) h += '<pre class="saida">' + esc(r.aviso) + '</pre>';
    } else if (r.status === R_STUB) {
        h += '<p>Este exercicio ainda esta com o <code>FALTA_IMPLEMENTAR()</code>. ' +
             'Apague essa linha e escreva o corpo da funcao.</p>';
    } else {
        if (r.ctx) h += '<div class="rotulo">cenario do teste</div><pre class="saida">' + esc(r.ctx) + '</pre>';
        if (r.extra) h += '<div class="rotulo">o que o Dojo viu</div><pre class="saida">' + esc(r.extra) + '</pre>';
        if (r.status === R_FALHOU) {
            h += '<div class="rotulo">falhou</div><pre class="saida">' + esc(r.msg) + '</pre>';
        } else {
            h += '<div class="rotulo">o seu codigo quebrou</div>' +
                 '<pre class="saida">' + esc(r.msg) + '</pre>' +
                 '<p style="color:var(--fraco)">Cada teste roda numa memoria propria, entao o ' +
                 'Dojo continua de pe e ainda consegue contar o que aconteceu.</p>';
            if (r.dicasErro && r.dicasErro.length)
                h += '<pre class="saida">' + esc(r.dicasErro.join('\n')) + '</pre>';
        }
    }
    if (r.saida)
        h += '<div class="rotulo">o que o seu printf escreveu</div><pre class="saida">' + esc(r.saida) + '</pre>';

    $('#p-resultado').innerHTML = h;
    trocarPainelLado('resultado');
    avisarEstado(ex.nivel + '.' + ex.num + ': ' + NOME_STATUS[r.status],
                 r.status === R_OK ? 'var(--destaque)' : 'var(--erro)');
    estado.ultimoResultado = r;
}

/* ---- enunciado e dicas -------------------------------------------------- */
function desenharEnunciado() {
    const ex = estado.catalogo.exercicios[estado.exercicio];
    const nivel = estado.catalogo.niveis[ex.nivel - 1];
    $('#p-enunciado').innerHTML =
        '<div class="enunciado">' +
        '<h2>' + ex.nivel + '.' + ex.num + '  ' + esc(ex.nome) + '</h2>' +
        '<div class="ref">' + esc(nivel.titulo) + ' &middot; ' + esc(ex.referencia) + '</div>' +
        '<div class="assinatura">' + esc(ex.assinatura) + '</div>' +
        '<div class="rotulo">o que a funcao deve fazer</div>' +
        '<div class="texto">' + esc(ex.enunciado) + '</div>' +
        '<div class="rotulo">onde escrever</div>' +
        '<div>No arquivo <code>' + esc(nivel.arquivo) + '</code>, ache a funcao ' +
        '<code>' + esc(ex.nome) + '</code>, apague o <code>FALTA_IMPLEMENTAR()</code> ' +
        'e escreva o corpo dela.</div>' +
        '</div>';
}

function desenharDicas() {
    const ex = estado.catalogo.exercicios[estado.exercicio];
    const chave = ex.nivel + '.' + ex.num;
    const abertas = estado.armazem.dados.dicasAbertas[chave] || 0;
    const titulos = ['DICA 1 &middot; o caminho',
                     'DICA 2 &middot; o detalhe que derruba todo mundo',
                     'DICA 3 &middot; o codigo'];
    let h = '<p style="color:var(--fraco)">As dicas abrem uma de cada vez, de proposito. ' +
            'Tente antes: o que voce descobre sozinho e o que fica.</p>';
    for (let i = 0; i < 3; i++) {
        if (i < abertas) {
            h += '<div class="dica"><h4>' + titulos[i] + '</h4><pre>' + esc(ex.dicas[i]) + '</pre></div>';
        } else if (i === abertas) {
            h += '<div class="dica bloqueada"><button class="bt" id="bt-dica">' +
                 'Abrir a dica ' + (i + 1) + '</button></div>';
            break;
        }
    }
    if (abertas >= 3) h += '<p style="color:var(--fraco)">Acabaram as dicas deste exercicio.</p>';
    $('#p-dicas').innerHTML = h;
    const b = $('#bt-dica');
    if (b) b.addEventListener('click', () => {
        estado.armazem.dados.dicasAbertas[chave] = abertas + 1;
        estado.armazem.salvar();
        desenharDicas();
    });
    const aviso = $('#abas-lado').querySelector('[data-p="dicas"]');
    aviso.classList.toggle('aviso', abertas > 0);
}

/* ---- faixas do treino --------------------------------------------------- */
function desenharPilulas() {
    const alvo = $('#pilulas');
    alvo.innerHTML = estado.catalogo.niveis.map(n => {
        const bloqueado = estado.motor.nivelBloqueado(estado.status, n.numero);
        const completo = estado.motor.nivelCompleto(estado.status, n.numero);
        return '<button data-n="' + n.numero + '" title="' + esc(n.titulo) + '" class="' +
               (n.numero === estado.nivel ? 'ativa ' : '') +
               (bloqueado ? 'travado ' : '') + (completo ? 'pronto' : '') + '">N' + n.numero +
               (bloqueado ? ' \u{1F512}' : completo ? ' ✓' : '') + '</button>';
    }).join('');
    for (const b of alvo.querySelectorAll('button'))
        b.addEventListener('click', () => escolherNivel(+b.dataset.n));
}

function desenharChips() {
    const alvo = $('#chips');
    alvo.innerHTML = estado.catalogo.exercicios.map((ex, i) => {
        if (ex.nivel !== estado.nivel) return '';
        return '<button class="chip ' + CLASSE_STATUS[estado.status[i]] +
               (i === estado.exercicio ? ' ativa' : '') + '" data-i="' + i + '" title="' +
               esc(ex.nome) + ' -- ' + NOME_STATUS[estado.status[i]] + '">' +
               ex.nivel + '.' + ex.num + ' ' + esc(ex.nome) + '</button>';
    }).join('');
    for (const b of alvo.querySelectorAll('button'))
        b.addEventListener('click', () => irParaExercicio(+b.dataset.i, true));
}

/* ---- painel ------------------------------------------------------------- */
function desenharTudo() {
    desenharPilulas();
    desenharChips();
    desenharEnunciado();
    desenharDicas();
    desenharAbasArquivo();
    desenharPainel();
    $('#placar-n').textContent = estado.status.filter(s => s === R_OK).length;
}

function anelSvg(feitos, total) {
    const raio = 52, circ = 2 * Math.PI * raio;
    const frac = total ? feitos / total : 0;
    return '<svg viewBox="0 0 130 130" width="130" height="130" aria-label="' +
        feitos + ' de ' + total + '">' +
        '<circle cx="65" cy="65" r="' + raio + '" fill="none" stroke="var(--fundo3)" stroke-width="12"/>' +
        '<circle cx="65" cy="65" r="' + raio + '" fill="none" stroke="var(--destaque)" stroke-width="12" ' +
        'stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' +
        (circ * (1 - frac)) + '" transform="rotate(-90 65 65)"/>' +
        '<text x="65" y="62" text-anchor="middle" font-size="26" font-weight="700" fill="var(--texto)">' +
        feitos + '</text>' +
        '<text x="65" y="82" text-anchor="middle" font-size="13" fill="var(--fraco)">de ' + total + '</text>' +
        '</svg>';
}

const FRASES = [
    'O campus esta apagado. Escreva a matriz de adjacencia para acender as luzes.',
    'As estruturas existem. Falta ligar as ruas: e o inserir_aresta_l que desenha o mapa.',
    'O mapa esta de pe. Agora da para transformar o grafo: inverter, comparar, completar.',
    'A busca em profundidade abriu: o campus ganha as cores branco, cinza e preto.',
    'A largura chegou. As distancias em numero de trechos aparecem no mapa.',
    'Com peso nas ruas, o Dijkstra acende a rota mais rapida e a coloracao monta a grade.',
    'Ultimo nivel. Depois disso o campus inteiro roda no seu codigo.',
    'Os 51 estao verdes. O campus inteiro funciona com o codigo que voce escreveu.'
];

function desenharPainel() {
    const total = estado.catalogo.exercicios.length;
    const feitos = estado.status.filter(s => s === R_OK).length;
    $('#anel').innerHTML = anelSvg(feitos, total);

    let nivelAtual = 8;
    for (let n = 1; n <= 7; n++)
        if (!estado.motor.nivelCompleto(estado.status, n)) { nivelAtual = n; break; }

    $('#hero-titulo').textContent = feitos === 0
        ? 'Bem-vindo ao Dojo'
        : feitos === total ? 'Campus completo' : 'Nivel ' + nivelAtual + ' em andamento';
    $('#hero-texto').textContent = FRASES[Math.min(7, nivelAtual - 1)];

    const prox = estado.motor.proximoExercicio(estado.status);
    $('#bt-continuar').textContent = prox === null
        ? 'Rever os exercicios'
        : (feitos === 0 ? 'Comecar pelo 1.1' : 'Continuar no ' +
           estado.catalogo.exercicios[prox].nivel + '.' + estado.catalogo.exercicios[prox].num);

    $('#niveis').innerHTML = estado.catalogo.niveis.map(n => {
        const doNivel = estado.catalogo.exercicios
            .map((e, i) => ({ e, i })).filter(x => x.e.nivel === n.numero);
        const ok = doNivel.filter(x => estado.status[x.i] === R_OK).length;
        const bloqueado = estado.motor.nivelBloqueado(estado.status, n.numero);
        return '<button class="cartao-nivel ' + (bloqueado ? 'bloqueado ' : '') +
            (ok === doNivel.length ? 'completo' : '') + '" data-n="' + n.numero + '">' +
            '<div class="cab"><span class="num">' + n.numero + '</span><h3>' + esc(n.titulo) + '</h3></div>' +
            '<p class="sub">' + esc(n.subtitulo) + '</p>' +
            '<div class="barra"><i style="width:' + (100 * ok / doNivel.length) + '%"></i></div>' +
            '<div class="conta"><span>' + ok + ' de ' + doNivel.length + '</span><span>' +
            (bloqueado ? 'bloqueado ate fechar o nivel ' + (n.numero - 1) : esc(n.arquivo)) +
            '</span></div></button>';
    }).join('');
    for (const b of $('#niveis').querySelectorAll('button'))
        b.addEventListener('click', () => { escolherNivel(+b.dataset.n); trocarTela('treino'); });

    if (!estado.mapaPainel) {
        estado.mapaPainel = new Mapa($('#mapa-painel'), estado.catalogo.campus);
    }
    pintarMapaProgresso(estado.mapaPainel);

    const hist = estado.armazem.dados.historico;
    $('#historico').innerHTML = hist.length
        ? '<pre class="saida">' + hist.map(h =>
            'ciclo ' + h.ciclo + '  ' + h.data + '   ' + h.feitos + '/' + h.total).join('\n') + '</pre>'
        : '<p style="color:var(--fraco)">Nenhum ciclo fechado ainda. Quando terminar os 51, ' +
          'as opcoes tem um botao para arquivar tudo e recomecar do zero.</p>';
}

function pintarMapaProgresso(mapa) {
    const menu = estado.catalogo.campus.menu;
    const abertas = menu.filter(m => estado.campus.liberado(estado.status, m.nivel, m.num)).length;
    const legenda = $('#legenda-progresso');

    if (!estado.motor.nivelCompleto(estado.status, 2)) {
        mapa.apagado('o mapa acende quando o nivel 2 fechar');
        legenda.textContent = 'O campus e montado com alocar_l, inicializar_l e ' +
            'inserir_aresta_l. Sem o nivel 2 nao existe mapa.';
        return;
    }
    mapa.pintar({});
    legenda.textContent = abertas + ' de ' + menu.length +
        ' funcionalidades do campus ja rodam com o seu codigo.';
}

/* ---- campus ------------------------------------------------------------- */
function montarCampus() {
    estado.mapaCampus = new Mapa($('#mapa-campus'), estado.catalogo.campus);
    $('#legenda-campus').innerHTML = Mapa.legenda();
}

const PRECISA = {
    1: ['a', 'b'], 2: ['a'], 3: ['a'], 4: ['a', 'b'], 5: ['a'],
    6: ['a', 'n'], 7: ['a'], 10: ['a', 'n']
};
const ROTULO_PARAM = { a: 'de onde voce esta', b: 'para onde quer ir', n: 'quantos trechos / qual local' };

function desenharCampus() {
    const menu = estado.catalogo.campus.menu;
    $('#func-lista').innerHTML = menu.map((m, i) => {
        const aberto = estado.campus.liberado(estado.status, m.nivel, m.num);
        return '<button class="func ' + (aberto ? 'aberta' : '') + '" data-i="' + i + '"' +
               (aberto ? '' : ' disabled') + '>' + esc(m.rotulo) +
               '<span class="cadeado">' + (aberto ? '✓' : '\u{1F512} ' + m.nivel + '.' + m.num +
               ' ' + esc(m.funcao)) + '</span></button>';
    }).join('');
    for (const b of $('#func-lista').querySelectorAll('button'))
        b.addEventListener('click', () => selecionarFuncionalidade(+b.dataset.i));

    if (!estado.motor.nivelCompleto(estado.status, 2)) {
        estado.mapaCampus.apagado('o campus e montado com o seu nivel 2');
        $('#area-params').innerHTML = '';
        $('#area-resultado').innerHTML =
            '<div class="aviso-caixa">O campus e construido chamando <code>alocar_l</code>, ' +
            '<code>inicializar_l</code> e <code>inserir_aresta_l</code> que voce escreveu. ' +
            'Enquanto o nivel 2 nao fechar, nao existe mapa nenhum para desenhar.</div>';
        return;
    }
    if (estado.funcSelecionada < 0) {
        estado.mapaCampus.pintar({});
        $('#area-resultado').innerHTML =
            '<p style="color:var(--fraco)">Escolha uma funcionalidade a direita.</p>';
    }
}

function selecionarFuncionalidade(i) {
    estado.funcSelecionada = i;
    pararAnimacao();
    const precisa = PRECISA[i] || [];
    const locais = estado.catalogo.campus.locais;
    const opcoes = (sel) => locais.map(l =>
        '<option value="' + l.id + '"' + (l.id === sel ? ' selected' : '') + '>' +
        l.id + ' - ' + esc(l.nome) + ' (' + esc(l.rotulo) + ')</option>').join('');

    let h = '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">';
    for (const p of precisa) {
        if (p === 'n' && i === 6) {
            h += '<label style="display:block"><span style="font-size:12px;color:var(--fraco)">' +
                 'quantos trechos de distancia</span><br><input type="number" id="par-n" value="2" ' +
                 'min="0" max="7" style="width:80px;padding:7px;border-radius:8px;' +
                 'background:var(--fundo3);border:1px solid var(--borda)"></label>';
        } else {
            const rot = (i === 10 && p === 'n') ? 'qual local esta interditado' : ROTULO_PARAM[p];
            h += '<label style="display:block"><span style="font-size:12px;color:var(--fraco)">' +
                 esc(rot) + '</span><br><select id="par-' + p + '" style="padding:7px;border-radius:8px;' +
                 'background:var(--fundo3);border:1px solid var(--borda)">' +
                 opcoes(p === 'b' ? 3 : (p === 'n' ? 1 : 0)) + '</select></label>';
        }
    }
    h += '<button class="bt principal" id="bt-rodar-func">Rodar com o meu codigo</button></div>';
    $('#area-params').innerHTML = h;
    $('#bt-rodar-func').addEventListener('click', () => rodarFuncionalidade(i));
    $('#area-resultado').innerHTML = '';
    rodarFuncionalidade(i);
}

function rodarFuncionalidade(i) {
    const par = {};
    const ea = $('#par-a'), eb = $('#par-b'), en = $('#par-n');
    if (ea) par.a = +ea.value;
    if (eb) par.b = +eb.value;
    if (en) par.n = +en.value;

    let r;
    try { r = estado.campus.executar(i, par); }
    catch (e) { r = { erro: String(e && e.message || e) }; }

    if (r.erro) {
        $('#area-resultado').innerHTML =
            '<div class="selo quebrou">o seu codigo quebrou</div><pre class="saida">' +
            esc(r.erro) + (r.dicas && r.dicas.length ? '\n\n' + esc(r.dicas.join('\n')) : '') + '</pre>';
        return;
    }

    estado.mapaCampus.pintar(r.estado);
    let h = '<pre class="saida">' + esc(r.linhas.join('\n')) + '</pre>';
    if (r.quadros && r.quadros.length > 1) {
        h += '<div class="rotulo">assistir a sua busca rodando</div>' +
             '<div class="controles-anim">' +
             '<button class="bt" id="anim-play">&#9654; tocar</button>' +
             '<button class="bt" id="anim-passo">passo</button>' +
             '<input type="range" id="anim-range" min="0" max="' + (r.quadros.length - 1) + '" value="0">' +
             '<span id="anim-conta" style="color:var(--fraco);font-size:12.5px"></span></div>' +
             '<div class="linha-codigo" id="anim-linha"></div>';
    }
    $('#area-resultado').innerHTML = h;

    if (r.quadros && r.quadros.length > 1) montarAnimacao(r, i === 9);
}

function pararAnimacao() {
    if (estado.animacao) { clearInterval(estado.animacao.timer); estado.animacao = null; }
}

function montarAnimacao(r, usarCor) {
    pararAnimacao();
    const quadros = r.quadros;
    const range = $('#anim-range');
    const conta = $('#anim-conta');
    const linha = $('#anim-linha');
    const play = $('#anim-play');

    const mostrar = (k) => {
        const q = quadros[k];
        estado.mapaCampus.mostrarQuadro(q, usarCor);
        range.value = k;
        conta.textContent = 'quadro ' + (k + 1) + ' de ' + quadros.length;
        if (q.linha > 0) {
            const texto = linhaDoArquivo(q.arquivo, q.linha);
            linha.innerHTML = esc(q.arquivo || '') + ':' + q.linha + '  <b>' + esc(texto.trim()) + '</b>';
        } else {
            linha.textContent = 'antes de comecar';
        }
    };

    range.addEventListener('input', () => { pararTimer(); mostrar(+range.value); });
    $('#anim-passo').addEventListener('click', () => {
        pararTimer();
        mostrar(Math.min(quadros.length - 1, +range.value + 1));
    });

    const pararTimer = () => {
        if (estado.animacao && estado.animacao.timer) {
            clearInterval(estado.animacao.timer);
            estado.animacao.timer = null;
            play.innerHTML = '&#9654; tocar';
        }
    };

    play.addEventListener('click', () => {
        if (estado.animacao && estado.animacao.timer) { pararTimer(); return; }
        let k = +range.value;
        if (k >= quadros.length - 1) k = 0;
        play.innerHTML = '&#10073;&#10073; pausar';
        estado.animacao = {
            timer: setInterval(() => {
                mostrar(k);
                k++;
                if (k >= quadros.length) pararTimer();
            }, 420)
        };
    });

    estado.animacao = { timer: null };
    mostrar(0);
}

function linhaDoArquivo(arquivo, n) {
    const txt = estado.armazem.arquivo(arquivo);
    if (!txt) return '';
    const linhas = txt.split('\n');
    return linhas[n - 1] || '';
}

/* ---- material ----------------------------------------------------------- */
function montarMaterial() {
    const alvo = $('#pilulas-material');
    if (!estado.materiais.length) {
        $('#doc').innerHTML = '<p>Nenhum material foi publicado com esta versao.</p>';
        return;
    }
    alvo.innerHTML = estado.materiais.map((m, i) =>
        '<button data-i="' + i + '" class="' + (i === 0 ? 'ativa' : '') + '">' +
        esc(m.titulo) + '</button>').join('');
    for (const b of alvo.querySelectorAll('button'))
        b.addEventListener('click', () => abrirMaterial(+b.dataset.i));
    abrirMaterial(0);
}

async function abrirMaterial(i) {
    for (const b of $('#pilulas-material').querySelectorAll('button'))
        b.classList.toggle('ativa', +b.dataset.i === i);
    $('#doc').innerHTML = '<p style="color:var(--fraco)">carregando...</p>';
    try {
        const txt = await fetch('dados/materiais/' + estado.materiais[i].arquivo).then(r => r.text());
        $('#doc').innerHTML = renderizarMarkdown(txt);
        $('#tela-material').scrollTop = 0;
    } catch {
        $('#doc').innerHTML = '<p>Nao consegui carregar este material.</p>';
    }
}

/* ---- opcoes -------------------------------------------------------------- */
function abrirCaixa(html) {
    $('#caixa').innerHTML = html;
    $('#cortina').classList.add('aberta');
}
function fecharCaixa() { $('#cortina').classList.remove('aberta'); }

function abrirConfig() {
    const naoExportado = estado.armazem.temTrabalhoNaoExportado();
    abrirCaixa(
        '<h3>Seu codigo e o seu progresso</h3>' +
        '<p>Tudo fica guardado neste navegador. Limpar os dados do navegador apaga ' +
        'o que nao tiver sido exportado.</p>' +
        (naoExportado ? '<div class="aviso-caixa">Voce tem trabalho que ainda nao foi ' +
            'exportado. Vale baixar o .zip antes de fechar.</div>' : '') +
        '<div class="linha-bt">' +
        '<button class="bt principal" id="cfg-zip">Baixar src/aluno (.zip)</button>' +
        '<button class="bt" id="cfg-json">Backup completo (.json)</button>' +
        '<button class="bt" id="cfg-importar">Importar</button>' +
        '</div>' +
        '<p style="margin-top:16px">O .zip sai no formato exato que o <code>make</code> do ' +
        'repositorio espera: e so copiar por cima de <code>src/aluno/</code>. Para trazer de ' +
        'volta, importe o .zip, os <code>.c</code> soltos ou o backup .json.</p>' +
        '<div class="rotulo">recomecar</div>' +
        '<div class="linha-bt">' +
        '<button class="bt" id="cfg-ciclo">Novo ciclo (arquiva e zera os 7 arquivos)</button>' +
        '<button class="bt" id="cfg-fechar">Fechar</button>' +
        '</div>' +
        '<input type="file" id="cfg-arquivo" multiple accept=".zip,.json,.c" style="display:none">');

    $('#cfg-fechar').addEventListener('click', fecharCaixa);
    $('#cfg-zip').addEventListener('click', () => estado.armazem.exportarZip());
    $('#cfg-json').addEventListener('click', () => estado.armazem.exportarJson());
    $('#cfg-importar').addEventListener('click', () => $('#cfg-arquivo').click());
    $('#cfg-arquivo').addEventListener('change', async (ev) => {
        try {
            const n = await estado.armazem.importar(ev.target.files);
            estado.status = estado.armazem.dados.status.length === estado.catalogo.exercicios.length
                ? estado.armazem.dados.status.slice()
                : new Array(estado.catalogo.exercicios.length).fill(R_STUB);
            estado.editor.definir(estado.armazem.arquivo(ARQUIVOS[estado.arquivo]) || '', true);
            recompilar();
            desenharTudo();
            fecharCaixa();
            avisarEstado(n + ' arquivo(s) importado(s)', 'var(--destaque)');
        } catch (e) {
            abrirCaixa('<h3>Nao consegui importar</h3><pre class="saida">' +
                       esc(e.message) + '</pre><div class="linha-bt">' +
                       '<button class="bt" onclick="document.getElementById(\'cortina\')' +
                       '.classList.remove(\'aberta\')">Fechar</button></div>');
        }
    });
    $('#cfg-ciclo').addEventListener('click', () => {
        abrirCaixa('<h3>Comecar um ciclo novo?</h3>' +
            '<p>Os seus 7 arquivos vao para o historico e voltam a ser esqueletos vazios. ' +
            'O placar zera. Isso e o equivalente ao <code>make novociclo</code>.</p>' +
            '<div class="linha-bt"><button class="bt principal" id="ciclo-sim">Sim, arquivar e zerar</button>' +
            '<button class="bt" id="ciclo-nao">Cancelar</button></div>');
        $('#ciclo-nao').addEventListener('click', fecharCaixa);
        $('#ciclo-sim').addEventListener('click', () => {
            estado.armazem.novoCiclo(estado.stubs, estado.status, estado.catalogo);
            estado.status = new Array(estado.catalogo.exercicios.length).fill(R_STUB);
            estado.editor.definir(estado.armazem.arquivo(ARQUIVOS[estado.arquivo]) || '', true);
            recompilar();
            irParaExercicio(0, true);
            desenharTudo();
            fecharCaixa();
        });
    });
}

function restaurarEsqueleto() {
    const nome = ARQUIVOS[estado.arquivo];
    abrirCaixa('<h3>Restaurar o esqueleto de ' + esc(nome) + '?</h3>' +
        '<p>O que voce escreveu neste arquivo vai embora e ele volta ao estado inicial, ' +
        'com os <code>FALTA_IMPLEMENTAR()</code>. Os outros arquivos nao mudam.</p>' +
        '<div class="linha-bt"><button class="bt principal" id="rest-sim">Restaurar</button>' +
        '<button class="bt" id="rest-nao">Cancelar</button></div>');
    $('#rest-nao').addEventListener('click', fecharCaixa);
    $('#rest-sim').addEventListener('click', () => {
        estado.armazem.restaurar(nome, estado.stubs);
        estado.editor.definir(estado.stubs[nome], true);
        recompilar();
        fecharCaixa();
    });
}

window.addEventListener('beforeunload', (e) => {
    if (estado.armazem && estado.armazem.temTrabalhoNaoExportado() && estado.sujos.size) {
        e.preventDefault();
        e.returnValue = '';
    }
});

iniciar();
