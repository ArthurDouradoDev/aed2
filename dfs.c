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

//Função para zerar flags
void zerarFlags(vertice* g){
    int i;
    for(i=0; i<V; i++){
        g[i].flag = 0;
    }
}

//2.4 DFS básica (lista de adjacência)
void prof(vertice *g, int i){
    g[i].flag = 1;
    no* p = g[i].inicio;
    while(p){
        if(g[p->adj].flag == 0){
            prof(g, p->adj);
        }
        p = p->prox;
    }
    g[i].flag = 2;
}

//2.5 DFS para verificar caminho de i até j
void prof(vertice *g, int i, int j, bool *achou) {
    if(i == j){
        *achou = TRUE;
    }
    g[i].flag = 1;
    no* p = g[i].inicio;
    while(p){
        if(g[p->adj].flag == 0){
            prof(g, p->adj, j);
        }
        p = p->prox;
    }
    g[i].flag = 2;
    return;
}

//2.7 DFS para contar salas de tipo X a partir de i
void prof(vertice *g, int i, int* contador, int tipo){
    g[i].flag = 1;
    if(g[i].tipo == tipo){
        *contador = *contador + 1;
    }
    no* p = g[i].inicio;
    while(p){
        if(g[p->adj].flag == 0){
            prof(g, p->adj, contador, tipo);
        }
        p = p->prox;
    }
    g[i].flag = 2;
}

//2.8 Encontrar maior componente conectado
int maior_inicio(vertice *g) {

}

//2.9 Rota usando apenas companhia X
void existe_rota(vertice *g, int i, int f, int companhia, bool *achou) {

}

//2.10 Caminho de i até f passando por m
void prof(vertice* g, int i, int m, int f, bool* achou){

}

//2.11 Ligar vértices não alcançáveis a i
void ligar_nao_alcancaveis(int m[V][V], int i) {

}

//2.12 Exibir até N salas do tipo X
void exibir_N(vertice *g, int i, int *N, int tipoX) {
    
}