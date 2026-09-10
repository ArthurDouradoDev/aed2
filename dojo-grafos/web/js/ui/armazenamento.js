/* ==========================================================================
 *  armazenamento.js -- o que fica guardado no navegador
 *
 *  Salva os 7 arquivos, o placar e o historico de ciclos no localStorage, e
 *  exporta/importa a pasta src/aluno em .zip para o dojo do terminal
 *  continuar de onde o site parou (e vice-versa).
 * ========================================================================== */
import { criarZip, lerZip } from './zip.js';

const CHAVE = 'dojo-grafos:v1';

export const ARQUIVOS = ['n1_matriz.c', 'n2_lista.c', 'n3_transformacoes.c',
                         'n4_profundidade.c', 'n5_largura.c', 'n6_ponderados.c',
                         'n7_desafios.c'];

function vazio() {
    return {
        arquivos: {}, status: [], historico: [], ciclo: 1,
        dicasAbertas: {}, tema: 'escuro', ultimoArquivo: 0, ultimoExercicio: 0,
        exportadoEm: 0, salvoEm: 0
    };
}

export class Armazem {
    constructor() { this.dados = this.ler(); }

    ler() {
        try {
            const bruto = localStorage.getItem(CHAVE);
            if (!bruto) return vazio();
            return Object.assign(vazio(), JSON.parse(bruto));
        } catch { return vazio(); }
    }

    salvar() {
        this.dados.salvoEm = Date.now();
        try {
            localStorage.setItem(CHAVE, JSON.stringify(this.dados));
            return true;
        } catch {
            return false;      /* modo privado, cota cheia... */
        }
    }

    temTrabalhoNaoExportado() {
        return this.dados.salvoEm > (this.dados.exportadoEm || 0) &&
               Object.keys(this.dados.arquivos).length > 0;
    }

    arquivo(nome)          { return this.dados.arquivos[nome]; }
    definirArquivo(n, txt) { this.dados.arquivos[n] = txt; this.salvar(); }
    fontes() { return ARQUIVOS.map(n => ({ nome: n, texto: this.dados.arquivos[n] || '' })); }

    iniciarSeVazio(stubs) {
        let mudou = false;
        for (const n of ARQUIVOS)
            if (typeof this.dados.arquivos[n] !== 'string') { this.dados.arquivos[n] = stubs[n]; mudou = true; }
        if (mudou) this.salvar();
    }

    restaurar(nome, stubs) { this.dados.arquivos[nome] = stubs[nome]; this.salvar(); }

    novoCiclo(stubs, status, catalogo) {
        const feitos = status.filter(s => s === 0).length;
        this.dados.historico.unshift({
            ciclo: this.dados.ciclo,
            data: new Date().toISOString().slice(0, 10),
            feitos, total: catalogo.exercicios.length,
            arquivos: { ...this.dados.arquivos }
        });
        this.dados.historico = this.dados.historico.slice(0, 12);
        this.dados.ciclo++;
        for (const n of ARQUIVOS) this.dados.arquivos[n] = stubs[n];
        this.dados.status = [];
        this.dados.dicasAbertas = {};
        this.salvar();
    }

    async exportarZip() {
        const arqs = ARQUIVOS.map(n => ({ nome: 'src/aluno/' + n, texto: this.dados.arquivos[n] || '' }));
        arqs.push({ nome: 'LEIA.txt', texto: LEIA });
        const blob = criarZip(arqs);
        baixar(blob, 'dojo-grafos-src-aluno-' +
               new Date().toISOString().slice(0, 10) + '.zip');
        this.dados.exportadoEm = Date.now();
        this.salvar();
    }

    exportarJson() {
        const blob = new Blob([JSON.stringify(this.dados, null, 1)], { type: 'application/json' });
        baixar(blob, 'dojo-grafos-backup-' + new Date().toISOString().slice(0, 10) + '.json');
        this.dados.exportadoEm = Date.now();
        this.salvar();
    }

    /* aceita .zip, .json e arquivos .c soltos */
    async importar(fileList) {
        let trocados = 0;
        for (const f of fileList) {
            const nome = f.name.toLowerCase();
            if (nome.endsWith('.zip')) {
                for (const a of await lerZip(await f.arrayBuffer()))
                    if (ARQUIVOS.includes(a.nome)) { this.dados.arquivos[a.nome] = a.texto; trocados++; }
            } else if (nome.endsWith('.json')) {
                const d = JSON.parse(await f.text());
                if (d && d.arquivos) {
                    this.dados = Object.assign(vazio(), d);
                    trocados += Object.keys(d.arquivos).length;
                }
            } else if (nome.endsWith('.c')) {
                const base = f.name.split(/[\\/]/).pop();
                if (ARQUIVOS.includes(base)) { this.dados.arquivos[base] = await f.text(); trocados++; }
            }
        }
        this.salvar();
        return trocados;
    }
}

const LEIA =
`Esta pasta veio do Dojo de Grafos na web.

Para continuar no seu computador, copie o conteudo de src/aluno/ por cima
da pasta src/aluno/ do repositorio e rode:

    make        (painel)
    make n1     (roda o nivel 1)

Os arquivos sao exatamente os mesmos que o Makefile espera.
`;

export function baixar(blob, nome) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
}
