#include <stdio.h>
#include <malloc.h>

#define TRUE 1
#define FALSE 0
#define bool int
#define V 100

typedef struct s{
    int adj;
    struct s* prox;
} no; //aresta

typedef struct{
    no* inicio;
} vertice;

//Alocar
vertice* alocarLista(){
    vertice* g  = (vertice*) malloc(V * sizeof(vertice*));
    return g;
}

// Inicializar
void inicializarLista(vertice* g){
    for(int i = 0; i < V; i++){
        g[i].inicio = NULL;
    }
}

// Verificar se existe
bool aresta_existe(vertice *g, int v1, int v2) {
    no* p = g[v1].inicio;
    while(p){
        if(p->adj == v2){
            return TRUE;
        }
        p = p->prox;
    }
    return FALSE;
}

// Incluir
bool inserir_aresta(vertice *g, int v1, int v2) {
    if(aresta_existe(g, v1, v2)){
        return FALSE;
    }
    no* novo = (no*) malloc(sizeof(no*));
    novo->adj = v2;
    novo->prox = g[v1].inicio;
    g[v1].inicio = novo;
    return TRUE;
}

// Excluir
bool excluir_aresta(vertice *g, int v1, int v2){
    if(!aresta_existe(g, v1, v2)){
        return FALSE;
    }
    no* anterior = NULL;
    no* p = g[v1].inicio;
    while(p){
        if(p->adj == v2){
            break;
        }
        anterior = p;
        p = p->prox;
    }
    if(p->adj == v2){
        anterior->prox = p->prox;
        free(p);
        return TRUE;
    }
    return FALSE;
}
// Grau
int grau_saida(vertice* g, int v1){
    no* p = g[v1].inicio;
    int contador = 0;
    while(p){
        contador += 1;
        p = p->prox;
    }
    return contador;
}

int grau_entrada(vertice* g, int v1){
    no* p = NULL;
    int ge = 0;
    int i;
    for(i = 0; i<V; i++){
        p = g[i].inicio;
        while(p){
            if(p->adj == v1){
                ge += 1;
            }
            p = p->prox;
        }
    }
    return ge;
}

void exibir_grafo(vertice* g, int v){
    no* p = NULL;
    int i;
    for(i = 0; i < v; i++){
        p = g[i].inicio;
        printf("|%d|", i);
        while(p){
            printf(" -> %d", p->adj);
            p = p->prox;
        }
        printf("\n");
    }
}

bool subgrafo(vertice* g1, vertice* g2){
    int i;
    for(i=0; i<V; i++){
        no*p = g1[i].inicio;
        while(p){
            if(!aresta_existe(g2, i, p->adj)){
                return FALSE;
            }
            p = p->prox;
        }
    }
    return TRUE;
}

vertice* grafo_transposto(vertice*g){
    vertice* g2 = alocarLista(V);
    inicializarLista(g2, V);
    int i;
    for(i = 0; i < V; i++){
        no* p = g[i].inicio;
        while(p){
            inserir_aresta(g2, p->adj, i);
            p = p->prox;
        }
    }
    return g2;
}

vertice* matriz_p_lista(int m[V][V]){
    vertice* g = (vertice*) malloc(V * sizeof(vertice*));
    inicializarLista(g);
    int i, j;
    for(i = 0; i < V; i++){
        for(j=0; j < V; j++){
            if(m[i][j] == 1){
                no* novo = (no*) malloc(sizeof(no*));
                novo->adj = j;
                novo->prox = g[i].inicio;
                g[i].inicio = novo;
            }
        }
    }
    return g;
}