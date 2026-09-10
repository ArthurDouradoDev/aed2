/* ==========================================================================
 *  navegador.mjs -- prova que o site funciona de verdade num navegador
 *
 *      node web/teste/navegador.mjs [--fotos]
 *
 *  Sobe um servidor estatico na pasta web/, abre o Chromium e faz o caminho
 *  do aluno: escreve codigo, roda o nivel, ve o exercicio ficar verde, abre
 *  o campus, assiste a animacao e exporta o zip.
 * ========================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(AQUI, '..');
const RAIZ = path.resolve(WEB, '..');
const FOTOS = process.argv.includes('--fotos');
const DIR_FOTOS = path.join(RAIZ, 'build', 'fotos');

const TIPOS = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.md': 'text/plain; charset=utf-8', '.c': 'text/plain; charset=utf-8',
    '.h': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml'
};

const servidor = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const alvo = path.join(WEB, p);
    if (!alvo.startsWith(WEB) || !fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) {
        res.writeHead(404); res.end('nao encontrado'); return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(alvo)] || 'application/octet-stream' });
    res.end(fs.readFileSync(alvo));
});

const porta = await new Promise(r => servidor.listen(0, () => r(servidor.address().port)));
const BASE = 'http://127.0.0.1:' + porta + '/';

/* O playwright fica instalado globalmente neste ambiente. */
const globais = process.env.NODE_PATH ||
    (await import('node:child_process')).execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
const mod = await import(path.join(globais, 'playwright', 'index.js'));
const chromium = (mod.chromium || (mod.default && mod.default.chromium));
if (!chromium) { console.log('playwright indisponivel: teste de navegador pulado.'); process.exit(0); }
const navegador = await chromium.launch();
let falhas = 0;
const checar = (cond, msg) => {
    console.log((cond ? '  ok  ' : '  X   ') + msg);
    if (!cond) falhas++;
};

async function foto(pagina, nome) {
    if (!FOTOS) return;
    fs.mkdirSync(DIR_FOTOS, { recursive: true });
    await pagina.screenshot({ path: path.join(DIR_FOTOS, nome + '.png'), fullPage: false });
}

const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
const pagina = await ctx.newPage();
const errosJs = [];
pagina.on('pageerror', e => errosJs.push(String(e)));
pagina.on('console', m => { if (m.type() === 'error') errosJs.push('console: ' + m.text()); });

console.log('\n[1] carregar a pagina');
await pagina.goto(BASE, { waitUntil: 'networkidle' });
await pagina.waitForSelector('#niveis .cartao-nivel');
checar((await pagina.locator('#niveis .cartao-nivel').count()) === 7, 'os 7 niveis aparecem no painel');
checar((await pagina.locator('#mapa-painel svg circle').count()) > 8, 'o mapa do campus foi desenhado');
checar((await pagina.locator('#placar-n').textContent()) === '0', 'placar comeca em 0');
await foto(pagina, '01-painel');

console.log('\n[2] escrever codigo e rodar o nivel 1');
await pagina.locator('#abas button[data-tela="treino"]').click();
await pagina.waitForSelector('.ed-texto');
checar(await pagina.locator('.ed-realce .s-com').count() > 0, 'o realce de sintaxe pintou os comentarios');

const gabarito1 = fs.readFileSync(path.join(RAIZ, 'gabarito', 'n1_matriz.c'), 'utf8');
await pagina.locator('.ed-texto').fill(gabarito1);
await pagina.waitForTimeout(900);
await foto(pagina, '02-editor');

await pagina.locator('#bt-rodar').click();
await pagina.waitForFunction(() => document.querySelector('#placar-n').textContent === '6',
                             null, { timeout: 20000 });
checar(true, 'os 6 exercicios do nivel 1 ficaram verdes');
checar((await pagina.locator('#chips .chip.ok').count()) === 6, 'os 6 chips ficaram verdes');
checar((await pagina.locator('#p-resultado .selo.ok').count()) > 0, 'o painel avisa que o nivel fechou');
await foto(pagina, '03-nivel1-ok');

console.log('\n[3] um erro de verdade da a mensagem certa');
await pagina.locator('#abas button[data-tela="treino"]').click();
await pagina.locator('.ed-texto').fill(
    gabarito1.replace('int i, gs = 0;\n    for (i = 0; i < V; i++) gs = gs + m[v1][i];',
                      'int i, gs;\n    for (i = 0; i < V; i++) gs = gs + m[v1][i];'));
await pagina.waitForTimeout(900);
await pagina.locator('#bt-rodar').click();
await pagina.waitForSelector('#p-resultado .selo.quebrou', { timeout: 20000 });
const texto = await pagina.locator('#p-resultado').textContent();
checar(texto.includes('nao recebeu valor'), 'diagnostico de variavel local sem inicializar');
await foto(pagina, '04-erro');

console.log('\n[4] erro de sintaxe aponta a linha');
await pagina.locator('.ed-texto').fill(gabarito1.replace('m[v1][v2] = 1;', 'm[v1][v2] = 1'));
await pagina.waitForTimeout(1000);
checar((await pagina.locator('.ed-gutter .ln.erro').count()) > 0, 'a linha errada fica marcada na regua');
checar((await pagina.locator('#p-resultado .lista-erros li').count()) > 0, 'a lista de erros aparece');
await foto(pagina, '05-sintaxe');

console.log('\n[5] os 51 com o gabarito inteiro');
const nomes = ['n1_matriz.c', 'n2_lista.c', 'n3_transformacoes.c', 'n4_profundidade.c',
               'n5_largura.c', 'n6_ponderados.c', 'n7_desafios.c'];
const fontes = {};
for (const n of nomes) fontes[n] = fs.readFileSync(path.join(RAIZ, 'gabarito', n), 'utf8');
await pagina.evaluate((f) => {
    const bruto = JSON.parse(localStorage.getItem('dojo-grafos:v1'));
    bruto.arquivos = f;
    localStorage.setItem('dojo-grafos:v1', JSON.stringify(bruto));
}, fontes);
await pagina.reload({ waitUntil: 'networkidle' });
await pagina.locator('#bt-conferir').click();
await pagina.waitForFunction(() => document.querySelector('#placar-n').textContent === '51',
                             null, { timeout: 60000 });
checar(true, 'os 51 ficaram verdes no navegador');
checar((await pagina.locator('#niveis .cartao-nivel.completo').count()) === 7, 'os 7 niveis completos');
await foto(pagina, '06-tudo-verde');

console.log('\n[6] o campus abre e roda o codigo do aluno');
await pagina.locator('#abas button[data-tela="campus"]').click();
await pagina.waitForSelector('#func-lista .func');
checar((await pagina.locator('#func-lista .func.aberta').count()) === 12,
       'as 12 funcionalidades destravaram');
await pagina.locator('#func-lista .func').nth(4).click();     /* rota com menos trechos */
await pagina.waitForSelector('#area-resultado pre.saida');
const rota = await pagina.locator('#area-resultado pre.saida').textContent();
checar(rota.includes('->'), 'a rota saiu: ' + rota.split('\n').pop().trim().slice(0, 60));
checar((await pagina.locator('#mapa-campus line[filter]').count()) > 0, 'o caminho acendeu no mapa');
await foto(pagina, '07-campus-rota');

await pagina.locator('#func-lista .func').nth(3).click();     /* comida mais proxima */
await pagina.waitForSelector('#anim-range', { timeout: 10000 });
const quadros = await pagina.locator('#anim-range').getAttribute('max');
checar(+quadros > 2, 'a busca gerou ' + (+quadros + 1) + ' quadros de animacao');
await pagina.locator('#anim-passo').click();
await pagina.locator('#anim-passo').click();
const linhaAtual = await pagina.locator('#anim-linha').textContent();
checar(/n\d_\w+\.c:\d+/.test(linhaAtual), 'a animacao mostra a linha do codigo do aluno: ' +
       linhaAtual.trim().slice(0, 70));
await foto(pagina, '08-campus-animacao');

await pagina.locator('#func-lista .func').nth(9).click();     /* grade de horarios */
await pagina.waitForSelector('#area-resultado pre.saida');
checar((await pagina.locator('#area-resultado pre.saida').textContent()).includes('faixa'),
       'a coloracao virou grade de horarios');
await foto(pagina, '09-campus-cores');

console.log('\n[7] material de estudo');
await pagina.locator('#abas button[data-tela="material"]').click();
await pagina.waitForSelector('#doc h1');
const titulos = await pagina.locator('#doc h1').count() + await pagina.locator('#doc h2').count() +
                await pagina.locator('#doc h3').count();
checar(titulos > 10, 'o material renderizou com ' + titulos + ' titulos');
checar((await pagina.locator('#pilulas-material button').count()) === 3, 'os 3 materiais aparecem');
checar((await pagina.locator('#doc pre code').count()) > 3, 'os blocos de codigo apareceram');
await foto(pagina, '10-material');

console.log('\n[8] exportar o zip');
await pagina.locator('#bt-config').click();
await pagina.waitForSelector('#cfg-zip');
const espera = pagina.waitForEvent('download');
await pagina.locator('#cfg-zip').click();
const baixado = await espera;
const destino = path.join(RAIZ, 'build', 'teste-export.zip');
fs.mkdirSync(path.dirname(destino), { recursive: true });
await baixado.saveAs(destino);
checar(fs.statSync(destino).size > 500, 'o zip baixou com ' + fs.statSync(destino).size + ' bytes');
await foto(pagina, '11-opcoes');
await pagina.keyboard.press('Escape');
checar(!(await pagina.locator('#cortina').evaluate(el => el.classList.contains('aberta'))),
       'a tecla Esc fecha a caixa de opcoes');

console.log('\n[9] tema claro');
await pagina.locator('#abas button[data-tela="painel"]').click();
await pagina.locator('#bt-tema').click();
await pagina.waitForTimeout(200);
checar((await pagina.evaluate(() => document.documentElement.getAttribute('data-tema'))) === 'claro',
       'o tema claro liga');
const contraste = await pagina.evaluate(() => {
    const c = getComputedStyle(document.body);
    const n = (s) => s.match(/\d+/g).slice(0, 3).map(Number);
    const lum = (r) => { const v = r.map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); });
                         return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
    const a = lum(n(c.color)), b = lum(n(c.backgroundColor));
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
});
checar(contraste >= 4.5, 'contraste do texto no tema claro: ' + contraste.toFixed(1) + ':1');
await foto(pagina, '13-tema-claro');
await pagina.locator('#bt-tema').click();

console.log('\n[10] celular');
const ctxM = await navegador.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
});
const movel = await ctxM.newPage();
movel.on('pageerror', e => errosJs.push('mobile: ' + String(e)));
await movel.goto(BASE, { waitUntil: 'networkidle' });
await movel.waitForSelector('#niveis .cartao-nivel');
const larguraDoc = await movel.evaluate(() => document.documentElement.scrollWidth);
checar(larguraDoc <= 391, 'nao ha rolagem horizontal no celular (' + larguraDoc + 'px)');
await movel.locator('#abas button[data-tela="treino"]').click();
await movel.waitForSelector('.ed-texto');
checar(await movel.locator('.ed-simbolos button').first().isVisible(),
       'a barra de simbolos aparece no celular');
if (FOTOS) { fs.mkdirSync(DIR_FOTOS, { recursive: true }); await movel.screenshot({ path: path.join(DIR_FOTOS, '12-celular.png') }); }

console.log('\n[11] erros de JavaScript');
checar(errosJs.length === 0, errosJs.length ? 'houve erro no console: ' + errosJs[0] : 'nenhum erro no console');

await navegador.close();
servidor.close();
console.log('\n' + (falhas === 0 ? 'NAVEGADOR: tudo passou.' : falhas + ' problema(s) no navegador.'));
process.exit(falhas === 0 ? 0 : 1);
