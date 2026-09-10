/* ==========================================================================
 *  motor.js -- amarra catalogo, testes e interpretador
 *
 *  Guarda as arvores ja analisadas dos arquivos do aluno e, para cada teste,
 *  monta uma memoria nova. E o equivalente ao subprocesso do Dojo de
 *  terminal: nada que um exercicio deixou sujo alcanca o proximo.
 * ========================================================================== */
import { analisarFontes, instanciar, ErroCompilacao } from '../c/api.js';
import { rodarTeste, R_OK, R_STUB, R_FALHOU, R_QUEBROU } from './runtime.js';
import { TESTES } from './testes.js';

export { R_OK, R_STUB, R_FALHOU, R_QUEBROU, ErroCompilacao };

export class Motor {
    constructor(catalogo, grafoH) {
        this.catalogo = catalogo;
        this.grafoH   = grafoH;
        this.arvores  = null;
        this.erros    = null;
        this.cache    = new Map();
    }

    /* fontes: [{nome, texto}] */
    carregar(fontes) {
        this.cache.clear();
        this.arvores = null;
        this.erros = null;
        try {
            this.arvores = analisarFontes(fontes, this.grafoH);
            return { ok: true };
        } catch (e) {
            if (e instanceof ErroCompilacao) { this.erros = e.erros; return { ok: false, erros: e.erros }; }
            throw e;
        }
    }

    chaveTeste(ex) { return 't' + ex.nivel + '_' + ex.num; }

    programaNovo() { return instanciar(this.arvores); }

    rodarIndice(indice) {
        if (this.erros) return { status: R_QUEBROU, msg: 'o codigo nao compila', ctx: '', extra: '' };
        const ex = this.catalogo.exercicios[indice];
        const teste = TESTES[this.chaveTeste(ex)];
        if (!teste) return { status: R_FALHOU, msg: 'teste nao encontrado', ctx: '', extra: '' };
        const prog = this.programaNovo();
        const r = rodarTeste(prog, teste);
        r.indice = indice;
        r.exercicio = ex;
        return r;
    }

    /* Roda tudo e devolve so o status de cada exercicio. */
    rodarTodos(aoAndar) {
        const total = this.catalogo.exercicios.length;
        const status = new Array(total).fill(R_STUB);
        if (this.erros) return status;
        for (let i = 0; i < total; i++) {
            status[i] = this.rodarIndice(i).status;
            if (aoAndar) aoAndar(i + 1, total);
        }
        return status;
    }

    /* Um nivel so fica liberado quando o anterior fecha inteiro. */
    nivelCompleto(status, nivel) {
        return this.catalogo.exercicios.every(
            (ex, i) => ex.nivel !== nivel || status[i] === R_OK);
    }
    nivelBloqueado(status, nivel) {
        return nivel > 1 && !this.nivelCompleto(status, nivel - 1);
    }
    indiceDe(nivel, num) {
        return this.catalogo.exercicios.findIndex(e => e.nivel === nivel && e.num === num);
    }
    proximoExercicio(status) {
        for (let n = 1; n <= this.catalogo.niveis.length; n++) {
            if (this.nivelBloqueado(status, n)) return null;
            for (let i = 0; i < status.length; i++) {
                const ex = this.catalogo.exercicios[i];
                if (ex.nivel === n && status[i] !== R_OK) return i;
            }
        }
        return null;
    }
}
