/* ==========================================================================
 *  sw.js -- service worker
 *
 *  Guarda o site inteiro no navegador na primeira visita. Depois disso o
 *  Dojo abre sem rede: da para treinar no onibus, no metro ou com o celular
 *  em modo aviao. A estrategia e servir do cache e conferir a rede em
 *  segundo plano, entao uma versao nova entra sozinha na proxima abertura.
 * ========================================================================== */
const CACHE = 'dojo-grafos-v1';

const ESSENCIAIS = [
    './', './index.html', './css/estilo.css',
    './js/app.js',
    './js/c/lexer.js', './js/c/preprocessador.js', './js/c/parser.js',
    './js/c/tipos.js', './js/c/memoria.js', './js/c/interp.js', './js/c/api.js',
    './js/dojo/runtime.js', './js/dojo/testes.js', './js/dojo/motor.js', './js/dojo/campus.js',
    './js/ui/editor.js', './js/ui/mapa.js', './js/ui/markdown.js',
    './js/ui/armazenamento.js', './js/ui/zip.js',
    './dados/catalogo.json', './dados/grafo.h',
    './dados/stubs/n1_matriz.c', './dados/stubs/n2_lista.c',
    './dados/stubs/n3_transformacoes.c', './dados/stubs/n4_profundidade.c',
    './dados/stubs/n5_largura.c', './dados/stubs/n6_ponderados.c',
    './dados/stubs/n7_desafios.c',
    './dados/materiais/indice.json'
];

self.addEventListener('install', (ev) => {
    ev.waitUntil((async () => {
        const c = await caches.open(CACHE);
        /* addAll falha inteiro se um item falhar; aqui cada um vai por si */
        await Promise.all(ESSENCIAIS.map(u => c.add(u).catch(() => {})));
        self.skipWaiting();
    })());
});

self.addEventListener('activate', (ev) => {
    ev.waitUntil((async () => {
        for (const nome of await caches.keys())
            if (nome !== CACHE) await caches.delete(nome);
        self.clients.claim();
    })());
});

self.addEventListener('fetch', (ev) => {
    const req = ev.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    ev.respondWith((async () => {
        const cache = await caches.open(CACHE);
        const guardado = await cache.match(req, { ignoreSearch: true });
        const rede = fetch(req).then(res => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
        }).catch(() => null);
        return guardado || (await rede) || new Response('offline', { status: 503 });
    })());
});
