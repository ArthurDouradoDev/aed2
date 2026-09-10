/* ==========================================================================
 *  diferencial.js -- prova de fidelidade
 *
 *      node web/teste/diferencial.js
 *
 *  Para cada erro plantado, roda os 51 exercicios NO BINARIO NATIVO (gcc) e
 *  NO INTERPRETADOR DO NAVEGADOR, e exige o mesmo veredito nos 51. E o teste
 *  que garante que treinar no site vale para a prova: se o dojo de terminal
 *  reprova, o site reprova; se aprova, o site aprova.
 *
 *  Precisa de gcc e make. Sem eles, o script avisa e sai sem reprovar.
 * ========================================================================== */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Motor, R_OK, R_STUB, R_FALHOU, R_QUEBROU } from '../js/dojo/motor.js';
import { MUTACOES } from './mutacoes.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const ARQUIVOS = ['n1_matriz.c', 'n2_lista.c', 'n3_transformacoes.c',
                  'n4_profundidade.c', 'n5_largura.c', 'n6_ponderados.c', 'n7_desafios.c'];
const NOME_ST = { [R_OK]: 'ok', [R_STUB]: 'a fazer', [R_FALHOU]: 'falhou', [R_QUEBROU]: 'quebrou' };

const catalogo = JSON.parse(fs.readFileSync(path.join(RAIZ, 'web/dados/catalogo.json'), 'utf8'));
const grafoH   = fs.readFileSync(path.join(RAIZ, 'web/dados/grafo.h'), 'utf8');

try { execFileSync('gcc', ['--version'], { stdio: 'ignore' }); }
catch { console.log('gcc nao encontrado: teste diferencial pulado.'); process.exit(0); }

/* O Makefile chama `python` nos utilitarios; em varios sistemas so existe
   `python3`. Descobrimos qual dos dois responde e passamos para o make. */
const PY = (() => {
    for (const nome of ['python3', 'python']) {
        try { execFileSync(nome, ['--version'], { stdio: 'ignore' }); return nome; } catch { }
    }
    return 'python';
})();

/* copia o projeto para um diretorio temporario */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dojo-dif-'));
for (const d of ['include', 'src/core', 'src/testes', 'src/aluno', 'tools', 'gabarito']) {
    fs.mkdirSync(path.join(TMP, d), { recursive: true });
    for (const f of fs.readdirSync(path.join(RAIZ, d)))
        if (fs.statSync(path.join(RAIZ, d, f)).isFile())
            fs.copyFileSync(path.join(RAIZ, d, f), path.join(TMP, d, f));
}
fs.copyFileSync(path.join(RAIZ, 'Makefile'), path.join(TMP, 'Makefile'));

function base() {
    const m = {};
    for (const a of ARQUIVOS) m[a] = fs.readFileSync(path.join(RAIZ, 'gabarito', a), 'utf8');
    return m;
}

/* Roda os 51 no binario nativo, oito de cada vez e com timeout. Sem o
   timeout o teste nunca termina: o dojo de terminal nao tem defesa contra
   laco infinito, e um erro do aluno trava o processo para sempre. E, alias,
   uma das coisas que a versao web resolve. */
async function nativos(fontes) {
    for (const f of fontes) fs.writeFileSync(path.join(TMP, 'src/aluno', f.nome), f.texto);
    fs.rmSync(path.join(TMP, 'build'), { recursive: true, force: true });
    execFileSync('make', ['-s', 'dojo.exe', 'PY=' + PY], { cwd: TMP, stdio: 'pipe' });

    const total = catalogo.exercicios.length;
    const st = new Array(total);
    const um = (i) => new Promise((resolve) => {
        execFile(path.join(TMP, 'dojo.exe'), ['--exec', String(i), '--quieto'],
                 { timeout: 3000, killSignal: 'SIGKILL' }, (erro) => {
            let rc = 0;
            if (erro) rc = typeof erro.code === 'number' ? erro.code : R_QUEBROU;
            st[i] = (rc === R_OK || rc === R_STUB || rc === R_FALHOU) ? rc : R_QUEBROU;
            resolve();
        });
    });
    for (let i = 0; i < total; i += 8)
        await Promise.all(Array.from({ length: Math.min(8, total - i) }, (_, k) => um(i + k)));
    return st;
}

function web(fontes) {
    const m = new Motor(catalogo, grafoH);
    const c = m.carregar(fontes);
    if (!c.ok) return null;
    return m.rodarTodos();
}

let divergencias = 0, comparados = 0;
const casos = [{ nome: 'gabarito sem mudanca', arquivo: null }].concat(MUTACOES);

for (const mut of casos) {
    const arq = base();
    if (mut.arquivo) {
        if (!arq[mut.arquivo].includes(mut.de)) {
            console.log('  X  ' + mut.nome + ': trecho nao encontrado em ' + mut.arquivo);
            divergencias++;
            continue;
        }
        arq[mut.arquivo] = arq[mut.arquivo].replace(mut.de, mut.para);
    }
    const fontes = ARQUIVOS.map(n => ({ nome: n, texto: arq[n] }));

    const stWeb = web(fontes);
    if (stWeb === null) { console.log('  X  ' + mut.nome + ': nao compilou no interpretador'); divergencias++; continue; }
    const stNat = await nativos(fontes);

    const difs = [];
    let rigorExtra = 0, rotuloDif = 0;
    for (let i = 0; i < stNat.length; i++) {
        if (stNat[i] === stWeb[i]) continue;
        const ex = catalogo.exercicios[i];
        const aprovaGcc = stNat[i] === R_OK;
        const aprovaWeb = stWeb[i] === R_OK;

        /* 1. O site aprovar onde o gcc reprova e sempre erro: seria um falso
              verde, o pior defeito possivel num dojo. */
        if (aprovaWeb && !aprovaGcc) {
            difs.push('FALSO VERDE  ' + ex.nivel + '.' + ex.num + ' ' + ex.nome +
                      ': gcc=' + NOME_ST[stNat[i]] + ' web=ok');
            continue;
        }
        /* 2. Os dois reprovam, so mudou o rotulo (falhou x quebrou). O aluno
              e barrado dos dois lados; a mensagem do site costuma ser mais
              precisa porque ele enxerga a memoria. */
        if (!aprovaGcc && !aprovaWeb) { rotuloDif++; continue; }
        /* 3. O gcc aprovou por sorte um comportamento indefinido. So vale
              para as mutacoes declaradas como tal. */
        if (mut.estrito && aprovaGcc && !aprovaWeb) { rigorExtra++; continue; }

        difs.push(ex.nivel + '.' + ex.num + ' ' + ex.nome +
                  ': gcc=' + NOME_ST[stNat[i]] + ' web=' + NOME_ST[stWeb[i]]);
    }
    comparados++;
    if (difs.length) {
        divergencias++;
        console.log('  X  ' + mut.nome);
        for (const d of difs) console.log('       ' + d);
    } else {
        const reprovados = stNat.filter(s => s !== R_OK).length;
        console.log('  ok ' + mut.nome.padEnd(42) + ' ' + String(reprovados).padStart(2) +
                    ' reprovado(s) nos dois' +
                    (rigorExtra ? ', +' + rigorExtra + ' so o site pega' : '') +
                    (rotuloDif ? ', ' + rotuloDif + ' com rotulo diferente' : ''));
    }
}

fs.rmSync(TMP, { recursive: true, force: true });
console.log('\n' + (divergencias === 0
    ? comparados + ' cenarios conferidos nos 51 exercicios. Garantias verificadas:\n' +
      '  - o site nunca aprova um exercicio que o gcc reprova (nada de falso verde);\n' +
      '  - o site nunca deixa passar um erro que o gcc pega;\n' +
      '  - onde os dois divergem, e comportamento indefinido em C e o site e o\n' +
      '    mais rigoroso dos dois.'
    : divergencias + ' cenario(s) divergiram do gcc.'));
process.exit(divergencias === 0 ? 0 : 1);
