/* ==========================================================================
 *  zip.js -- leitura e escrita de .zip sem biblioteca externa
 *
 *  Escreve sem compressao (metodo "store"), que qualquer descompactador abre.
 *  Le tanto "store" quanto "deflate", usando o DecompressionStream do proprio
 *  navegador. Serve para levar a pasta src/aluno daqui para o seu PC e de
 *  volta, sem digitar nada.
 * ========================================================================== */

const TAB_CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        t[n] = c >>> 0;
    }
    return t;
})();

function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = TAB_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

function dataDos(d) {
    const hora = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff;
    const data = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;
    return { hora, data };
}

/* arquivos: [{nome, texto}] -> Blob */
export function criarZip(arquivos) {
    const cod = new TextEncoder();
    const partes = [];
    const central = [];
    let deslocamento = 0;
    const { hora, data } = dataDos(new Date());

    for (const a of arquivos) {
        const nome = cod.encode(a.nome);
        const dados = cod.encode(a.texto);
        const crc = crc32(dados);

        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(6, 0, true);
        local.setUint16(8, 0, true);          /* store */
        local.setUint16(10, hora, true);
        local.setUint16(12, data, true);
        local.setUint32(14, crc, true);
        local.setUint32(18, dados.length, true);
        local.setUint32(22, dados.length, true);
        local.setUint16(26, nome.length, true);
        local.setUint16(28, 0, true);
        partes.push(new Uint8Array(local.buffer), nome, dados);

        const c = new DataView(new ArrayBuffer(46));
        c.setUint32(0, 0x02014b50, true);
        c.setUint16(4, 20, true); c.setUint16(6, 20, true);
        c.setUint16(8, 0, true);  c.setUint16(10, 0, true);
        c.setUint16(12, hora, true); c.setUint16(14, data, true);
        c.setUint32(16, crc, true);
        c.setUint32(20, dados.length, true);
        c.setUint32(24, dados.length, true);
        c.setUint16(28, nome.length, true);
        c.setUint32(42, deslocamento, true);
        central.push(new Uint8Array(c.buffer), nome);

        deslocamento += 30 + nome.length + dados.length;
    }

    let tamCentral = 0;
    for (const p of central) tamCentral += p.length;

    const fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true);
    fim.setUint16(8, arquivos.length, true);
    fim.setUint16(10, arquivos.length, true);
    fim.setUint32(12, tamCentral, true);
    fim.setUint32(16, deslocamento, true);

    return new Blob([...partes, ...central, new Uint8Array(fim.buffer)],
                    { type: 'application/zip' });
}

async function inflar(bytes) {
    if (typeof DecompressionStream === 'undefined')
        throw new Error('este navegador nao sabe abrir zip comprimido; ' +
                        'mande os arquivos .c soltos');
    const fluxo = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(fluxo).arrayBuffer());
}

/* ArrayBuffer -> [{nome, texto}] */
export async function lerZip(buffer) {
    const v = new DataView(buffer);
    const b = new Uint8Array(buffer);
    const dec = new TextDecoder();

    /* acha o fim do diretorio central, de tras para frente */
    let fim = -1;
    for (let i = b.length - 22; i >= 0 && i > b.length - 66000; i--) {
        if (v.getUint32(i, true) === 0x06054b50) { fim = i; break; }
    }
    if (fim < 0) throw new Error('nao parece um arquivo .zip');

    const total = v.getUint16(fim + 10, true);
    let p = v.getUint32(fim + 16, true);
    const saida = [];

    for (let k = 0; k < total; k++) {
        if (v.getUint32(p, true) !== 0x02014b50) break;
        const metodo = v.getUint16(p + 10, true);
        const compr  = v.getUint32(p + 20, true);
        const tamNome = v.getUint16(p + 28, true);
        const tamExtra = v.getUint16(p + 30, true);
        const tamCom = v.getUint16(p + 32, true);
        const local = v.getUint32(p + 42, true);
        const nome = dec.decode(b.subarray(p + 46, p + 46 + tamNome));
        p += 46 + tamNome + tamExtra + tamCom;

        if (nome.endsWith('/')) continue;
        const nomeLocal = v.getUint16(local + 26, true);
        const extraLocal = v.getUint16(local + 28, true);
        const ini = local + 30 + nomeLocal + extraLocal;
        const cru = b.subarray(ini, ini + compr);
        const dados = metodo === 0 ? cru : await inflar(cru);
        saida.push({ nome: nome.split('/').pop(), texto: dec.decode(dados) });
    }
    return saida;
}
