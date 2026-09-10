/* ==========================================================================
 *  memoria.js -- a memoria do programa em C
 *
 *  Um unico ArrayBuffer que faz as vezes de heap e pilha, mais um vetor
 *  "sombra" que guarda, byte a byte, o estado daquele endereco. E a sombra
 *  que permite dar mensagens de verdade em vez de um segfault mudo:
 *
 *    - ponteiro NULL          -> os primeiros 4 KB nunca sao validos
 *    - uso depois do free     -> o byte fica marcado como LIBERADA
 *    - leitura de lixo        -> o byte esta ALOCADA mas nunca foi escrito
 *    - estouro de vetor       -> o byte esta fora de qualquer bloco
 * ========================================================================== */

export const INVALIDA   = 0;   /* fora de qualquer bloco valido        */
export const HEAP_CRUA  = 1;   /* malloc devolveu, ninguem escreveu    */
export const HEAP_OK    = 2;   /* alocada e ja escrita                 */
export const LIBERADA   = 3;   /* passou por free()                    */
export const PILHA_CRUA = 4;   /* variavel local ainda sem valor       */
export const PILHA_OK   = 5;   /* variavel local ja escrita            */
export const HEAP_FOLGA = 6;   /* logo depois do fim de um malloc      */

export class FalhaMemoria extends Error {
    constructor(msg, dicas) {
        super(msg);
        this.nome = 'FalhaMemoria';
        this.dicas = dicas || [];
    }
}

const TOTAL       = 6 * 1024 * 1024;
const ZONA_NULA   = 4096;
const TAM_PILHA   = 512 * 1024;
const FIM_HEAP    = TOTAL - TAM_PILHA;
const LIXO_PILHA  = 0x5a;

/* Depois de cada bloco do malloc fica uma folga. Ela existe para o
   interpretador se comportar como o C nativo, onde escrever alem do bloco
   nao explode na hora: o programa segue e o Dojo consegue dar a mensagem
   boa ("seu malloc pediu N bytes"). A diferenca e que aqui a invasao fica
   registrada, entao ela nunca passa despercebida. */
const FOLGA = 64;

export class Memoria {
    constructor() {
        this.buf    = new ArrayBuffer(TOTAL);
        this.vista  = new DataView(this.buf);
        this.bytes  = new Uint8Array(this.buf);
        this.sombra = new Uint8Array(TOTAL);
        this.reiniciar();
    }

    reiniciar() {
        this.sombra.fill(INVALIDA);
        this.bytes.fill(0);
        this.blocos        = [{ ini: ZONA_NULA, tam: FIM_HEAP - ZONA_NULA, livre: true }];
        this.ocupados      = new Map();
        this.pilha         = TOTAL;
        this.ultimoMalloc  = 0;
        this.estouros      = [];
        this.totalMalloc   = 0;
        this.totalFree     = 0;
        this.vivos         = 0;
    }

    /* ---- diagnostico de um endereco ---------------------------------- */
    explicar(addr, tam, escrita) {
        if (addr === 0)
            return new FalhaMemoria(
                'uso de ponteiro NULL.',
                ['Algum ponteiro estava NULL e mesmo assim voce usou -> ou * nele.',
                 'Os suspeitos de sempre: p->adj com p == NULL (a lista acabou),',
                 'f->ultimo->prox com a fila vazia, ant->prox quando o no removido',
                 'era o primeiro da lista.']);
        if (addr < ZONA_NULA)
            return new FalhaMemoria(
                'uso de um ponteiro perto do NULL (endereco ' + addr + ').',
                ['Provavelmente voce fez p->campo com p == NULL: o campo somou',
                 'alguns bytes ao endereco zero.']);
        if (addr >= TOTAL || addr < 0)
            return new FalhaMemoria(
                'endereco fora da memoria (' + addr + ').',
                ['O ponteiro nunca recebeu um valor valido, ou recebeu lixo.']);

        const est = this.sombra[addr];
        if (est === HEAP_FOLGA) { this.anotarEstouro(addr); return null; }
        if (est === LIBERADA)
            return new FalhaMemoria(
                'uso de memoria que ja passou por free().',
                ['Voce liberou o no e continuou usando o ponteiro dele.',
                 'O jeito certo e guardar p->prox ANTES do free:',
                 '   no* t = p->prox;  free(p);  p = t;']);
        if (est === INVALIDA)
            return new FalhaMemoria(
                'acesso fora de qualquer area valida (endereco ' + addr + ').',
                ['Ou o ponteiro nunca foi inicializado, ou voce passou do fim',
                 'de um vetor, ou usou um indice maior que o tamanho.']);
        if (!escrita && (est === HEAP_CRUA || est === PILHA_CRUA)) {
            if (est === HEAP_CRUA)
                return new FalhaMemoria(
                    'leitura de um campo que nunca foi inicializado depois do malloc.',
                    ['malloc devolve memoria com lixo dentro: nada e zerado sozinho.',
                     'Depois de criar o no voce precisa dar valor a TODOS os campos',
                     'que vai usar. O esquecido mais comum e o novo->prox.']);
            return new FalhaMemoria(
                'leitura de uma variavel local que ainda nao recebeu valor.',
                ['Uma variavel local comeca com lixo. Coisas como',
                 '   int gs;  gs = gs + m[v1][i];',
                 'somam em cima de lixo. Inicialize: int gs = 0;']);
        }
        return null;
    }

    /* Guarda quem passou do fim de um bloco e por quanto. */
    anotarEstouro(addr) {
        if (this.estouros.length >= 8) return;
        for (const b of this.ocupados.values()) {
            if (addr >= b.ini + b.pedido && addr < b.ini + b.pedido + FOLGA) {
                for (const e of this.estouros) if (e.bloco === b.ini) return;
                this.estouros.push({ bloco: b.ini, pedido: b.pedido,
                                     byte: addr - b.ini });
                return;
            }
        }
    }

    verificar(addr, tam, escrita) {
        for (let i = 0; i < tam; i++) {
            const e = this.explicar(addr + i, tam, escrita);
            if (e) throw e;
            if (this.sombra[addr + i] === HEAP_FOLGA) continue;
        }
    }

    marcarEscrito(addr, tam) {
        for (let i = 0; i < tam; i++) {
            const s = this.sombra[addr + i];
            if (s === HEAP_CRUA)  this.sombra[addr + i] = HEAP_OK;
            if (s === PILHA_CRUA) this.sombra[addr + i] = PILHA_OK;
        }
    }

    /* ---- leitura e escrita ------------------------------------------- */
    lerInt(addr)  { this.verificar(addr, 4, false); return this.vista.getInt32(addr, true); }
    lerByte(addr) { this.verificar(addr, 1, false); return this.vista.getInt8(addr); }

    escreverInt(addr, v) {
        this.verificar(addr, 4, true);
        this.vista.setInt32(addr, v | 0, true);
        this.marcarEscrito(addr, 4);
    }
    escreverByte(addr, v) {
        this.verificar(addr, 1, true);
        this.vista.setInt8(addr, v | 0);
        this.marcarEscrito(addr, 1);
    }

    /* leitura sem checagem: usada pelo proprio Dojo para desenhar o estado */
    espiarInt(addr) {
        if (addr < 0 || addr + 4 > TOTAL) return 0;
        return this.vista.getInt32(addr, true);
    }
    enderecoValido(addr, tam) {
        if (addr < ZONA_NULA || addr + tam > TOTAL) return false;
        for (let i = 0; i < tam; i++) {
            const s = this.sombra[addr + i];
            if (s === INVALIDA || s === LIBERADA) return false;
        }
        return true;
    }

    /* Texto pronto para o diagnostico, quando alguem passou do fim. */
    relatoEstouros(tamNo) {
        if (!this.estouros.length) return null;
        const e = this.estouros[0];
        let t = 'o seu codigo escreveu no byte ' + e.byte + ' de um bloco que o\n' +
                '       malloc devolveu com apenas ' + e.pedido + ' byte(s).';
        if (e.pedido === 4)
            t += '\n       Pedir 4 bytes e pedir o tamanho de um PONTEIRO. Voce escreveu\n' +
                 '       malloc(sizeof(no*)) no lugar de malloc(sizeof(no))?' +
                 (tamNo ? ' Um no ocupa ' + tamNo + ' bytes.' : '');
        else
            t += '\n       Em C isso nao para o programa na hora: ele corrompe a memoria\n' +
                 '       vizinha e o erro aparece la na frente, sem relacao aparente.';
        return t;
    }

    copiar(destino, origem, tam) {
        this.verificar(origem, tam, false);
        this.verificar(destino, tam, true);
        this.bytes.copyWithin(destino, origem, origem + tam);
        this.marcarEscrito(destino, tam);
    }

    preencher(addr, valor, tam) {
        this.verificar(addr, tam, true);
        this.bytes.fill(valor & 0xff, addr, addr + tam);
        this.marcarEscrito(addr, tam);
    }

    /* ---- heap --------------------------------------------------------- */
    alocar(tam, jaEscrita) {
        this.ultimoMalloc = tam;
        if (tam <= 0) tam = 1;
        const pedido = (tam + 3) & ~3;
        const total  = pedido + FOLGA;

        for (let i = 0; i < this.blocos.length; i++) {
            const b = this.blocos[i];
            if (!b.livre || b.tam < total) continue;
            if (b.tam > total + 16) {
                this.blocos.splice(i + 1, 0, { ini: b.ini + total, tam: b.tam - total, livre: true });
                b.tam = total;
            }
            b.livre = false;
            b.pedido = pedido;
            this.ocupados.set(b.ini, b);
            this.sombra.fill(jaEscrita ? HEAP_OK : HEAP_CRUA, b.ini, b.ini + pedido);
            this.sombra.fill(HEAP_FOLGA, b.ini + pedido, b.ini + b.tam);
            this.bytes.fill(jaEscrita ? 0 : 0xcd, b.ini, b.ini + b.tam);
            this.totalMalloc++;
            this.vivos++;
            return b.ini;
        }
        throw new FalhaMemoria(
            'a memoria acabou (malloc numero ' + (this.totalMalloc + 1) + ').',
            ['Quase sempre isso e um laco que nunca termina chamando malloc.',
             'Verifique se voce esta andando na lista com p = p->prox.']);
    }

    liberar(addr) {
        if (addr === 0) return;                    /* free(NULL) e legal */
        const b = this.ocupados.get(addr);
        if (!b) {
            const est = (addr >= 0 && addr < TOTAL) ? this.sombra[addr] : INVALIDA;
            if (est === LIBERADA)
                throw new FalhaMemoria('free() no mesmo endereco duas vezes.',
                    ['Cada no so pode ser liberado uma vez.']);
            throw new FalhaMemoria('free() num endereco que nao veio de malloc.',
                ['So da para liberar exatamente o ponteiro que o malloc devolveu.']);
        }
        this.ocupados.delete(addr);
        b.livre = true;
        this.sombra.fill(LIBERADA, b.ini, b.ini + b.tam);
        this.totalFree++;
        this.vivos--;
        this.juntarLivres();
    }

    juntarLivres() {
        for (let i = 0; i < this.blocos.length - 1; ) {
            const a = this.blocos[i], b = this.blocos[i + 1];
            if (a.livre && b.livre) { a.tam += b.tam; this.blocos.splice(i + 1, 1); }
            else i++;
        }
    }

    /* ---- pilha -------------------------------------------------------- */
    marcaPilha() { return this.pilha; }

    reservarPilha(tam) {
        const pedido = (tam + 3) & ~3;
        const novo = this.pilha - pedido;
        if (novo <= FIM_HEAP)
            throw new FalhaMemoria(
                'a pilha estourou.',
                ['Isso e recursao que nunca para. Verifique se voce marca a flag',
                 'do vertice ANTES de descer nos vizinhos.']);
        this.pilha = novo;
        this.sombra.fill(PILHA_CRUA, novo, novo + pedido);
        this.bytes.fill(LIXO_PILHA, novo, novo + pedido);
        return novo;
    }

    soltarPilha(marca) {
        if (marca <= this.pilha) return;
        this.sombra.fill(INVALIDA, this.pilha, marca);
        this.pilha = marca;
    }

    /* Area de trabalho do proprio Dojo (matrizes e vetores dos testes).
       Vem preenchida com lixo, igual a uma variavel local em C, mas ja
       marcada como legivel: o teste e quem decide o conteudo. */
    alocarTrabalho(tam) {
        const addr = this.alocar(tam, true);
        this.bytes.fill(LIXO_PILHA, addr, addr + tam);
        return addr;
    }
}
