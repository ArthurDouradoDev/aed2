#include <stdio.h>
#include <malloc.h>

#define TRUE 1
#define FALSE 0
#define bool int
#define V 10

//2.3 Struct estendida (com flag e tipo)
typedef struct s{
    int adj;
    struct s* prox;
} no;

typedef struct{
    no* inicio;
    int flag;
    int tipo;
    int cia;
} vertice;

typedef struct{
    no* inicio;
    no* ultimo;
} FILA;

void inicializar(FILA* f){
    f->inicio = NULL;
    f->ultimo = NULL;
}

void entrar_fila(FILA* f, int valor){
    if(!valor || !f){
        return;
    }
    no* novo = (no*) malloc(sizeof(no*));
    novo->adj = valor;
    novo->prox = NULL;
    f->ultimo->prox = novo;
    f->ultimo = novo;
}

int sair_fila(FILA *f){
    int valor = f->inicio->adj;
    f->inicio = f->inicio->prox;
    return valor;
}

void zerar_flags(vertice* g){
    int i;
    for(i = 0; i < V; i++){
        g[i].inicio = NULL;
    }
}

void largura(vertice *g, int i) {

}

/*
1- Zerar as flags
2- Criar a fila
3- 
*/