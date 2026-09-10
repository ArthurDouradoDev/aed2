/* ==========================================================================
 *  api.js -- junta lexer, pre-processador, parser e interpretador
 *
 *  compilar([{nome, texto}], grafoH) devolve um Programa pronto para o Dojo
 *  chamar as funcoes do aluno. Cada arquivo do aluno vira um modulo separado
 *  (como um .o), e as funcoes static de um arquivo continuam privadas dele.
 * ========================================================================== */
import { ErroC } from './lexer.js';
import { preprocessar } from './preprocessador.js';
import { analisar } from './parser.js';
import { Programa } from './interp.js';

/* Cabecalhos que este ambiente oferece. O grafo.h de verdade vem de fora
   (e o mesmo arquivo do projeto), para nao existirem duas versoes. */
export function cabecalhos(grafoH) {
    return {
        'grafo.h': grafoH,

        'dojo.h':
`#ifndef DOJO_H_WEB
#define DOJO_H_WEB
/* Versao web do dojo.h: o aluno so precisa do FALTA_IMPLEMENTAR(). */
#include "grafo.h"
void dojo_falta_implementar(void);
#define FALTA_IMPLEMENTAR() dojo_falta_implementar()
#endif
`,
        'stddef.h':
`#ifndef STDDEF_H_WEB
#define STDDEF_H_WEB
typedef unsigned int size_t;
#define NULL 0
#endif
`,
        'stdio.h':
`#ifndef STDIO_H_WEB
#define STDIO_H_WEB
#include <stddef.h>
int printf(const char* fmt);
int puts(const char* s);
int putchar(int c);
#endif
`,
        'stdlib.h':
`#ifndef STDLIB_H_WEB
#define STDLIB_H_WEB
#include <stddef.h>
void* malloc(size_t n);
void* calloc(size_t n, size_t t);
void free(void* p);
int abs(int x);
void exit(int c);
#endif
`,
        'string.h':
`#ifndef STRING_H_WEB
#define STRING_H_WEB
#include <stddef.h>
size_t strlen(const char* s);
int strcmp(const char* a, const char* b);
void* memset(void* d, int c, size_t n);
void* memcpy(void* d, const void* o, size_t n);
#endif
`,
        'limits.h': '#define INT_MAX 2147483647\n#define INT_MIN (-2147483648)\n',
        'stdbool.h': '#define bool int\n#define true 1\n#define false 0\n'
    };
}

export class ErroCompilacao extends Error {
    constructor(erros) {
        super(erros.map(e => e.mensagem).join('\n'));
        this.nome = 'ErroCompilacao';
        this.erros = erros;
    }
}

/* Fase 1: le e analisa os arquivos do aluno. So precisa rodar quando o
   codigo muda. fontes: [{nome, texto}]   grafoH: conteudo de include/grafo.h */
export function analisarFontes(fontes, grafoH) {
    const base = cabecalhos(grafoH);
    const arvores = [];
    const erros = [];

    for (const f of fontes) {
        const fs = { ...base };
        fs[f.nome] = f.texto;
        try {
            const { tokens } = preprocessar(f.nome, fs, {});
            arvores.push({ nome: f.nome, arvore: analisar(tokens) });
        } catch (e) {
            if (e instanceof ErroC) {
                erros.push({
                    arquivo: e.arquivo || f.nome,
                    linha: e.linha,
                    mensagem: e.message,
                    doAluno: (e.arquivo || f.nome) === f.nome
                });
            } else {
                erros.push({ arquivo: f.nome, linha: 0,
                             mensagem: String((e && e.message) || e), doAluno: true });
            }
        }
    }
    if (erros.length) throw new ErroCompilacao(erros);
    return arvores;
}

/* Fase 2: memoria nova e limpa a partir das arvores ja analisadas. E o
   equivalente ao subprocesso do Dojo de terminal: cada teste comeca do zero,
   entao lixo deixado por um exercicio nunca contamina o seguinte. */
export function instanciar(arvores) {
    const prog = new Programa();
    for (const m of arvores) prog.adicionarModulo(m.nome, m.arvore);
    prog.iniciarGlobais();
    return prog;
}

export function compilar(fontes, grafoH) {
    return instanciar(analisarFontes(fontes, grafoH));
}

export { Programa };
