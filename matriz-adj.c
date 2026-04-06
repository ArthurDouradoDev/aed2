// I nicializar
// V erficar se aresta existe
// I ncluir
// E xcluir
// G rau - se for direcionado, há grau v1 entrada e v1 saída
#include <stdio.h>;
#include <malloc.h>;

#define TRUE 1
#define FALSE 0
#define bool int

bool Direcionado;

int** alocaMatriz(int vertices){
    int ** matriz = (int**)malloc(sizeof(int**)*vertices);
    for(int i = 0; i < vertices; i++){
        matriz[i] = (int*)malloc(sizeof(int*)*vertices);
    }

    return matriz;
}

bool inicializarMatriz(int** matriz, int vertices){
    for(int i=0; i<vertices; i++){
        for(int j=0; j<vertices; j++){
            matriz[i][j] = 0;
        }
    }

    return TRUE;
}

bool verificarAresta(int** matriz, int v1, int v2){
    if(Direcionado == TRUE){
        if(matriz[v1][v2] == 1){
        return TRUE;
        }
        return FALSE;
    }
    if(matriz[v1][v2] == 1 && matriz[v2][v1] ==1){
        return TRUE;
    } return FALSE;
}

bool inserirAresta(int** matriz, int v1, int v2){
    if(matriz[v1][v2] == 0){
        matriz[v1][v2] == 1;
    }
    if(Direcionado == FALSE){
        if(matriz[v2][v1] == 0){
            matriz[v2][v1] == 1;
        }
    }
    return TRUE;
}

bool excluirAresta(int** matriz, int v1, int v2){
    if(matriz[v1][v2] == 1){
        matriz[v1][v2] == 0;
    }
    if(Direcionado == FALSE){
        matriz[v2][v1] = 0;
    }
    return TRUE;
}

int grauEntrada(int** matriz, int v){
    int grau = 0;
    for(int i = 0; i < v; i++){
        grau += matriz[i][v];
    }
    return grau;
}

int grauSaida(int** matriz, int v){
    int grau = 0;
    for(int i = 0; i < v; i++){
        grau += matriz[v][i];
    }
    return grau;
}