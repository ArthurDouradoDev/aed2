# AED2: Grafos — Material Completo (Blocos 1 a 3)

---

## BLOCO 1: Fundação — Conceitos e Estruturas de Dados

### 1.1 O que é um Grafo?

Um grafo é um conjunto de **vértices** (pontos) e **arestas** (conexões entre pontos). Imagine uma cidade: os cruzamentos são vértices e as ruas são arestas. Grafos modelam relações: mapas, redes sociais, dependências entre tarefas, rotas aéreas, circuitos elétricos.

Formalmente: G = (V, E), onde V é o conjunto de vértices e E é o conjunto de arestas.

### 1.2 Terminologia Essencial

**Grafo dirigido vs não dirigido**
- Dirigido: as arestas são pares ordenados. A rua tem mão única: a aresta (A, B) não implica (B, A).
- Não dirigido: as arestas não têm direção. A rua é de mão dupla: se A conecta com B, B conecta com A.

**Grau de um vértice**
- Em grafo não dirigido: o grau é o número total de arestas ligadas ao vértice.
- Em grafo dirigido:
  - Grau de entrada: quantas arestas chegam ao vértice (como contar quantas ruas desembocam num cruzamento).
  - Grau de saída: quantas arestas saem do vértice.

**Vértice fonte e sorvedouro**
- Vértice fonte: grau de entrada zero (nenhuma aresta chega nele, só saem). É como a nascente de um rio.
- Vértice sorvedouro: grau de saída zero (nenhuma aresta sai dele, só chegam). É como um ralo.

**Adjacência**
- Um vértice V1 é adjacente a V2 se existe uma aresta de V2 para V1 (ou entre eles, se não dirigido).

**Grafo ponderado**
- Arestas possuem pesos (custos, distâncias, tempos). Exemplo: GPS onde as ruas têm distâncias diferentes.

**Caminho, circuito e ciclo**
- Caminho: qualquer sequência de vértices adjacentes. Como uma rota no GPS.
- Caminho simples: caminho sem vértices repetidos.
- Circuito: caminho em que o primeiro e o último vértice coincidem (você volta ao ponto de partida).
- Ciclo: circuito em que apenas o primeiro e o último vértices são repetidos (caminho "limpo" de volta).

**Conexidade**
- Grafo conexo: existe caminho entre qualquer par de vértices. É como uma cidade onde todas as ruas são interligadas.
- Grafo desconexo: existem "ilhas" separadas, sem caminho entre elas.

**Laço**
- Aresta que liga um vértice a ele mesmo.

---

### 1.3 Representação: Matriz de Adjacência

Imagine uma tabela de Excel quadrada V×V. A linha representa "de onde saio" e a coluna "para onde vou". Um 1 na célula [i][j] significa "existe aresta de i para j". Um 0 significa "não existe".

Exemplo (dirigido, 6 vértices, arestas: 1→2, 4→4, 0→1, 2→4, 2→0):

```
     Para
     0  1  2  3  4  5
  0 [   1  1         ]
De 1 [1     1        ]
  2 [1  1        1   ]
  3 [                ]
  4 [      1      1  ]
  5 [                ]
```

**Complexidades da Matriz:**
1. Verificar se aresta existe: O(1) — basta olhar m[i][j]
2. Grau de saída de um vértice: O(|V|) — percorre a linha inteira
3. Grau de entrada de um vértice: O(|V|) — percorre a coluna inteira
4. Espaço total: O(|V|²) — a tabela inteira, mesmo que tenha poucas arestas

A matriz é como reservar uma mesa enorme num restaurante para um jantar de 2 pessoas: funciona, mas desperdiça espaço. É ideal quando o grafo é denso (muitas arestas).

#### Função de inicialização

Zera toda a matriz (nenhuma aresta existe no início).

```c
void inicializar(int m[V][V]) {
    int i, j;
    for (i = 0; i < V; i++) {
        for (j = 0; j < V; j++) {
            m[i][j] = 0;
        }
    }
}
```

#### Função para verificar se aresta existe

Olha direto na célula da tabela.

```c
bool aresta_existe(int m[V][V], int v1, int v2) {
    if (m[v1][v2] == 1) {
        return true;
    } else {
        return false;
    }
}
```

#### Função para inserir aresta

Marca 1 na célula correspondente. Se o grafo for não dirigido, marca nas duas direções.

```c
void inserir_aresta(int m[V][V], int v1, int v2) {
    m[v1][v2] = 1;
    // se não dirigido: m[v2][v1] = 1;
}
```

#### Função para excluir aresta

Marca 0 na célula. Retorna false se a aresta não existia.

```c
bool excluir_aresta(int m[V][V], int v1, int v2) {
    if (m[v1][v2] == 0) {
        return false;
    }
    m[v1][v2] = 0;
    // se não dirigido: m[v2][v1] = 0;
    return true;
}
```

#### Função para calcular grau de saída

Percorre a linha do vértice, contando os 1s. "Quantas ruas saem deste cruzamento?"

```c
int grau_saida(int m[V][V], int v1) {
    int i;
    int gs = 0;
    for (i = 0; i < V; i++) {
        gs = gs + m[v1][i];
    }
    return gs;
}
```

#### Função para calcular grau de entrada

Percorre a coluna do vértice, contando os 1s. "Quantas ruas chegam neste cruzamento?"

```c
int grau_entrada(int m[V][V], int v1) {
    int i;
    int ge = 0;
    for (i = 0; i < V; i++) {
        ge = ge + m[i][v1];
    }
    return ge;
}
```

---

### 1.4 Representação: Lista de Adjacência

Ao invés de uma tabela enorme, cada vértice tem uma lista encadeada contendo apenas seus vizinhos reais. É como se cada cruzamento tivesse um post-it dizendo "daqui posso ir para: rua A, rua B, rua C".

Exemplo (mesmo grafo anterior):
```
0 → [1] → [2]
1 → [2] → [0]
2 → [0] → [1] → [4]
3 →
4 → [1] → [4]
5 →
```

**Complexidades da Lista:**
1. Verificar se aresta existe: O(|V|) — precisa percorrer a lista do vértice
2. Grau de saída: O(grau do vértice) — conta os nós da lista
3. Grau de entrada: O(|V| + |E|) — precisa percorrer todas as listas
4. Espaço total: O(|V| + |E|) — proporcional ao tamanho real do grafo

A lista é como pedir mesas individuais para cada grupo no restaurante: usa exatamente o espaço necessário. Ideal para grafos esparsos (poucas arestas em relação ao total possível).

#### Estruturas (structs)

```c
typedef struct s {
    int adj;           // índice do vértice vizinho
    struct s *prox;    // próximo vizinho na lista
} no;                  // cada nó representa uma aresta

typedef struct {
    no *inicio;        // ponteiro para o primeiro vizinho
} vertice;
```

A struct `no` é cada item da lista de vizinhos. A struct `vertice` é o "cabeçalho" que aponta para o início da lista. O array de vértices é alocado dinamicamente:

```c
vertice *g = (vertice*) malloc(V * sizeof(vertice));
```

#### Função de inicialização

Todas as listas começam vazias (nenhum vizinho).

```c
void inicializar(vertice *g) {
    int i;
    for (i = 0; i < V; i++) {
        g[i].inicio = NULL;
    }
}
```

#### Função para verificar se aresta existe

Percorre a lista de vizinhos de v1 procurando v2. É como checar item por item num post-it.

```c
bool aresta_existe(vertice *g, int v1, int v2) {
    no *p = g[v1].inicio;
    while (p) {
        if (p->adj == v2) {
            return true;
        }
        p = p->prox;
    }
    return false;
}
// Complexidade: O(|V|) no pior caso
```

#### Função para inserir aresta

Cria um novo nó e insere no início da lista (inserção em O(1)). É como adicionar um item no topo do post-it.

```c
bool inserir_aresta(vertice *g, int v1, int v2) {
    if (aresta_existe(g, v1, v2)) {
        return false;  // já existe, não duplica
    }
    no *novo = (no*) malloc(sizeof(no));
    novo->adj = v2;
    novo->prox = g[v1].inicio;
    g[v1].inicio = novo;
    return true;
    // complemento: se for não direcionado, inserir também v1 na lista de v2
}
```

#### Função para excluir aresta

Remoção em lista encadeada com ponteiro auxiliar `ant` (anterior). É como riscar um item do post-it, reconectando o item de cima com o de baixo.

```c
bool excluir_aresta(vertice *g, int v1, int v2) {
    no *ant = NULL;
    no *p = g[v1].inicio;
    while (p) {
        if (p->adj == v2) break;   // encontrou
        ant = p;
        p = p->prox;
    }
    if (!p) return false;           // não encontrou
    if (ant) {
        ant->prox = p->prox;       // caso geral: reconecta
    } else {
        g[v1].inicio = p->prox;    // caso especial: era o primeiro
    }
    free(p);
    return true;
    // se for não direcionado, excluir também de g[v2]
}
```

#### Função para exibir o grafo

Percorre cada vértice e imprime sua lista de vizinhos.

```c
void exibir(vertice *g) {
    int i;
    for (i = 0; i < V; i++) {
        printf("%d: ", i);
        no *p = g[i].inicio;
        while (p) {
            printf("%d ", p->adj);
            // estou acessando aresta i, p->adj
            p = p->prox;
        }
        printf("\n");
    }
}
```

#### Problema: Verificar se g1 é subgrafo de g2 (apenas arestas)

Para cada aresta de g1, verifica se ela também existe em g2. Se alguma não existir, não é subgrafo.

```c
bool subgrafo(vertice *g1, vertice *g2) {
    int i;
    for (i = 0; i < V; i++) {
        no *p = g1[i].inicio;
        while (p) {
            if (!aresta_existe(g2, i, p->adj)) {
                return false;
            }
            p = p->prox;
        }
    }
    return true;
}
```

#### Problema: Copiar grafo transposto

O grafo transposto inverte todas as setas: se existia aresta A→B, agora existe B→A. É como inverter o sentido de todas as ruas de uma cidade.

```c
vertice* transposta(vertice *g) {
    vertice *gt = (vertice*) malloc(V * sizeof(vertice));
    inicializar(gt);
    int i;
    for (i = 0; i < V; i++) {
        no *p = g[i].inicio;
        while (p) {
            // aresta original: i → p->adj
            // aresta transposta: p->adj → i
            no *novo = (no*) malloc(sizeof(no));
            novo->adj = i;
            novo->prox = gt[p->adj].inicio;
            gt[p->adj].inicio = novo;
            p = p->prox;
        }
    }
    return gt;
}
```

#### Problema: Converter matriz de adjacência em lista de adjacência

```c
vertice* matriz_p_lista(int m[V][V]) {
    vertice *resp = (vertice*) malloc((V + 1) * sizeof(vertice));
    inicializar(resp);
    int i, j;
    for (i = 1; i <= V; i++) {
        for (j = 1; j <= V; j++) {
            if (m[i][j] == 1) {
                no *novo = (no*) malloc(sizeof(no));
                novo->adj = j;
                novo->prox = resp[i].inicio;
                resp[i].inicio = novo;
            }
        }
    }
    return resp;
}
```

### 1.5 Matriz vs Lista — Comparação Rápida

| Operação                | Matriz      | Lista            |
|------------------------|-------------|------------------|
| Aresta existe?         | O(1)        | O(|V|)           |
| Grau de saída          | O(|V|)      | O(grau)          |
| Grau de entrada        | O(|V|)      | O(|V| + |E|)     |
| Inserir aresta         | O(1)        | O(|V|) com check |
| Excluir aresta         | O(1)        | O(|V|)           |
| Espaço                 | O(|V|²)     | O(|V| + |E|)     |
| Melhor quando...       | Grafo denso | Grafo esparso    |

---

## BLOCO 2: Busca em Profundidade (DFS)

### 2.1 A intuição

Imagine que você está num prédio enorme com vários corredores e salas. Sua estratégia: sempre que encontrar uma porta nova, entre imediatamente e continue explorando o mais fundo possível. Só quando chegar num beco sem saída (todas as portas dali já foram visitadas), você volta para a última bifurcação e tenta outra porta.

O mecanismo é a **recursão**. Cada chamada recursiva é "entrar numa porta". Quando a função retorna, é "voltar pelo corredor".

### 2.2 O sistema de flags (3 cores)

Para não visitar o mesmo vértice duas vezes (e evitar loops infinitos):

- **0 (Branco)**: não descoberto. Você nem sabe que essa sala existe.
- **1 (Cinza)**: descoberto, em exploração. Você entrou nessa sala e está explorando os corredores dela, mas não terminou.
- **2 (Preto)**: concluído. Já visitou tudo acessível a partir dessa sala.

A distinção cinza/preto é essencial para detectar ciclos: se durante a exploração você encontra um vértice cinza, ele ainda está "aberto" na pilha de chamadas, ou seja, você encontrou um caminho de volta para onde já estava. Isso é um ciclo.

### 2.3 Struct estendida (com flag e tipo)

```c
typedef struct s {
    int adj;
    struct s *prox;
} no;

typedef struct {
    no *inicio;
    int flag;       // 0 = branco, 1 = cinza, 2 = preto
    int tipo;       // tipo do vértice (ex: 1=aula, 2=auditório, 3=biblioteca)
} vertice;
```

#### Função para zerar flags

Deve ser chamada ANTES de cada busca.

```c
void zerar_flags(vertice *g) {
    int i;
    for (i = 0; i < V; i++) {
        g[i].flag = 0;
    }
}
```

### 2.4 DFS básica (lista de adjacência)

```c
void prof(vertice *g, int i) {
    g[i].flag = 1;              // entrei na sala (cinza)
    no *p = g[i].inicio;
    while (p) {                 // olho cada porta (vizinho)
        if (g[p->adj].flag == 0) {   // porta leva a sala nova (branca)?
            prof(g, p->adj);         // entro nela (recursão)
        }
        p = p->prox;
    }
    g[i].flag = 2;              // fechei a sala (preto)
}
```

**Ordem de conclusão**: a sequência em que os vértices ficam pretos.
Exemplo: começando do vértice 0 num grafo com arestas 0→1, 0→2, 2→3, 2→4, 4→5, a ordem de conclusão seria 1, 3, 5, 4, 2, 0.
Essa ordem é importante para ordenação topológica e componentes fortemente conectados.

### 2.5 DFS para verificar caminho de i até j

"Existe um caminho do vértice i até o vértice j?"

```c
void prof(vertice *g, int i, int j, bool *achou) {
    if (i == j) {
        *achou = true;
        return;
    }
    g[i].flag = 1;
    no *p = g[i].inicio;
    while (p) {
        if (g[p->adj].flag == 0) {
            prof(g, p->adj, j, achou);
        }
        if (*achou) return;     // PODA: já achei, para tudo
        p = p->prox;
    }
    g[i].flag = 2;
}
```

O `if (*achou) return` é uma **poda**: assim que encontra o destino, para de explorar. Sem isso, o algoritmo continuaria visitando vértices desnecessários. É como gritar "achei!" no prédio e ir voltando direto sem abrir mais portas.

### 2.6 DFS para detectar ciclos

Se ao visitar os vizinhos encontro um vértice **cinza** (flag == 1), ele ainda está na pilha de chamadas. Existe caminho aberto de lá até aqui, e agora estou tentando voltar. Isso é um ciclo.

Se o vizinho estiver **preto** (flag == 2), não é ciclo: ele já foi completamente processado por outro ramo.

```c
void prof(vertice *g, int i) {
    g[i].flag = 1;
    no *p = g[i].inicio;
    while (p) {
        if (g[p->adj].flag == 1) {                 // CINZA = ciclo!
            printf("ciclo %d %d\n", i, p->adj);
        }
        if (g[p->adj].flag == 0) {                 // BRANCO = explorar
            prof(g, p->adj);
        }
        p = p->prox;
    }
    g[i].flag = 2;
}
```

Analogia: imagine um fio de Ariadne que você desenrola conforme explora (vértices cinza = fio passando). Se encontra o fio no chão de uma sala, você deu uma volta. Isso é o ciclo.

### 2.7 DFS para contar salas de tipo X a partir de i

A struct `vertice` tem campo `tipo`. A cada sala visitada, verifico se é do tipo procurado.

```c
void prof(vertice *g, int i, int x, int *cont) {
    g[i].flag = 1;
    if (g[i].tipo == x) {
        *cont = *cont + 1;
    }
    no *p = g[i].inicio;
    while (p) {
        if (g[p->adj].flag == 0) {
            prof(g, p->adj, x, cont);
        }
        p = p->prox;
    }
    g[i].flag = 2;
}
```

### 2.8 Encontrar maior componente conectado

Em grafo não dirigido desconexo, qual o maior "pedaço" interligado? É como um arquipélago: qual ilha tem mais casas?

```c
int maior_inicio(vertice *g) {
    int maior_i = -1;
    int maior_quant = 0;
    zerar_flags(g);
    int i;
    for (i = 1; i <= V; i++) {
        int cont = 0;
        if (g[i].flag == 0) {
            prof(g, i, &cont);   // conta quantos vértices alcança
        }
        if (cont > maior_quant) {
            maior_quant = cont;
            maior_i = i;
        }
    }
    return maior_i;
}
```

Percorre todos os vértices. Cada branco é um pedaço novo. Faz DFS contando o tamanho e guarda o maior.

### 2.9 Rota usando apenas companhia X

Grafo de rotas aéreas com companhias. A struct `no` ganha campo `cia`. Só percorro arestas da companhia desejada.

```c
void existe_rota(vertice *g, int i, int f, int x, bool *achou) {
    if (*achou) return;
    if (i == f) {
        *achou = true;
        return;
    }
    g[i].flag = 1;
    no *p = g[i].inicio;
    while (p) {
        if (g[p->adj].flag == 0 && p->cia == x) {   // filtro de companhia
            existe_rota(g, p->adj, f, x, achou);
            if (*achou) return;
        }
        p = p->prox;
    }
}
```

### 2.10 Caminho de i até f passando por m

Decompõe em dois subproblemas: existe i→m? Se sim, existe m→f? Importante: zerar flags entre as duas buscas.

```c
bool achou = false;
zerar_flags(g);
prof(g, i, m, &achou);
if (!achou) {
    printf("não existe i→m\n");
    return;
}
zerar_flags(g);            // ZERAR DE NOVO!
achou = false;
prof(g, m, f, &achou);
if (!achou) {
    printf("não existe m→f\n");
    return;
}
printf("sucesso!\n");
```

### 2.11 Ligar vértices não alcançáveis a i

Faz DFS a partir de i. Depois, todo vértice que continuou branco é inalcançável. Cria aresta de i até cada um deles.

```c
// Versão com matriz:
void ligar_nao_alcancaveis(int m[V][V], int i) {
    int flags[V];
    zerar_flags(flags);
    prof(m, i, flags);
    int j;
    for (j = 0; j < V; j++) {
        if (flags[j] == 0) {
            m[i][j] = 1;        // cria aresta i→j
        }
    }
}

// Versão com lista:
// ao invés de m[i][j] = 1, criar um novo nó:
no *novo = (no*) malloc(sizeof(no));
novo->adj = j;
novo->prox = g[i].inicio;
g[i].inicio = novo;
```

### 2.12 Exibir até N salas do tipo X

Versão com "freio de mão": para assim que encontrar N resultados.

```c
void exibir_N(vertice *g, int i, int *N, int tipoX) {
    if (*N == 0) return;            // freio: já achei todas
    g[i].flag = 1;
    if (g[i].tipo == tipoX) {
        *N = *N - 1;
        // aqui poderia imprimir o vértice i
        if (*N == 0) return;
    }
    no *p = g[i].inicio;
    while (p) {
        if (g[p->adj].flag == 0) {
            exibir_N(g, p->adj, N, tipoX);
        }
        if (*N == 0) return;        // freio após recursão
        p = p->prox;
    }
}
```

### 2.13 O padrão universal da DFS

Todas as implementações seguem o mesmo esqueleto:

```
marcar i como cinza
[ação específica com i]
para cada vizinho de i:
    [verificar condição extra]
    se vizinho é branco:
        chamar recursivamente
    [verificar se pode parar]
marcar i como preto
```

É como um carro base onde você troca acessórios: o motor (DFS) é sempre o mesmo, mas você encaixa sensor (contar tipo X), GPS (verificar caminho), alarme (detectar ciclo) ou limitador de velocidade (exibir N).

---

## BLOCO 3: Busca em Largura (BFS)

### 3.1 A intuição

Se a DFS é um explorador que sempre vai fundo, a BFS é uma onda que se espalha em círculos concêntricos a partir de uma pedra jogada na água. Primeiro atinge tudo a 1 metro, depois 2, depois 3.

No grafo: primeiro visita todos os vizinhos diretos (distância 1), depois os vizinhos dos vizinhos (distância 2), e assim por diante. Essa exploração "por camadas" garante que o primeiro caminho encontrado até qualquer vértice é o **mais curto** (em número de arestas).

### 3.2 Por que fila?

A DFS usa recursão (internamente uma pilha: último a entrar, primeiro a sair), que faz ela "mergulhar fundo". A BFS precisa processar na ordem de descoberta: o primeiro descoberto é o primeiro processado. Isso é exatamente o comportamento de uma **fila** (primeiro a entrar, primeiro a sair).

DFS: anota vértices num post-it e sempre pega o de cima (pilha).
BFS: coloca numa fila de banco e atende na ordem de chegada.

### 3.3 O sistema de flags na BFS

Os mesmos 3 estados, mas o momento de marcação muda:

- **0 (Branco)**: não descoberto.
- **1 (Cinza)**: descoberto e colocado na fila, aguardando processamento. A marcação como cinza acontece **ao entrar na fila**, não ao sair. Isso evita que o mesmo vértice entre na fila duas vezes.
- **2 (Preto)**: retirado da fila e processado.

Ciclo de vida: Branco → Cinza (entra na fila) → Preto (sai da fila e é processado). Nunca pula etapa, nunca volta.

### 3.4 BFS básica (lista de adjacência)

```c
void largura(vertice *g, int i) {
    zerar_flags(g);
    FILA F;
    inicializar(&F);
    entrar_fila(&F, i);         // primeiro cliente na fila
    g[i].flag = 1;              // pulseirinha: já está na fila

    while (F->inicio) {         // enquanto fila não vazia
        i = sair_fila(&F);     // atendo o próximo (FIFO)
        no *p = g[i].inicio;
        while (p) {
            if (g[p->adj].flag == 0) {      // vizinho novo?
                g[p->adj].flag = 1;          // dou pulseirinha
                entrar_fila(&F, p->adj);     // coloco na fila
            }
            p = p->prox;
        }
        g[i].flag = 2;          // atendimento concluído (preto)
    }
}
```

**Passo a passo** (grafo: 1→{2,4}, 2→{3}, 3→{4}, 4→{}):

```
Início: Fila=[1], Flags: 1=cinza, resto=branco

Iteração 1: sai 1. Vizinhos 2,4 brancos → entram na fila.
  Fila=[2,4], Flags: 1=preto, 2=cinza, 4=cinza

Iteração 2: sai 2. Vizinho 3 branco → entra na fila.
  Fila=[4,3], Flags: 1=preto, 2=preto, 3=cinza, 4=cinza

Iteração 3: sai 4. Vizinho 3 já cinza → ignora.
  Fila=[3], Flags: 1=preto, 2=preto, 3=cinza, 4=preto

Iteração 4: sai 3. Vizinho 4 já preto → ignora.
  Fila=vazia, Flags: todos preto → termina.

Ordem de visita: 1, 2, 4, 3 (por camadas)
```

O vértice 4 quase entrou na fila duas vezes (vizinho de 1 e de 3), mas a "pulseirinha" (flag=1 ao entrar) impediu a duplicata.

### 3.5 BFS com matriz de adjacência

A única diferença é como percorremos os vizinhos. Ao invés da lista encadeada, percorremos a linha i da matriz.

```c
void largura(int m[V][V], int i) {
    int flags[V];
    zerar_flags(flags);
    FILA F;
    inicializar(&F);
    entrar_fila(&F, i);
    flags[i] = 1;

    while (F->inicio) {
        i = sair_fila(&F);
        int j;
        for (j = 1; j <= V; j++) {
            if (m[i][j] == 1 && flags[j] == 0) {
                flags[j] = 1;
                entrar_fila(&F, j);
            }
        }
        flags[i] = 2;
    }
}
```

O `for (j=1; j<=V; j++)` com `m[i][j]==1` faz o papel do `while(p)` com `p->adj`. Na matriz, verifica todos os V vértices; na lista, só os vizinhos reais. Por isso BFS com matriz é O(|V|²) e com lista é O(|V|+|E|).

### 3.6 Encontrar tipo X mais próximo

A BFS explora por camadas, então o primeiro vértice do tipo desejado que encontrar é o mais próximo. É como procurar o banheiro mais perto no shopping: pergunta para todos os vizinhos antes de ir ao próximo corredor.

```c
int tipo_x_mais_prox(int m[V][V], int i, int tipoX, int tipos[]) {
    int flags[V];
    zerar_flags(flags);
    FILA F;
    inicializar(&F);
    entrar_fila(&F, i);
    flags[i] = 1;

    while (F->inicio) {
        i = sair_fila(&F);
        if (tipos[i] == tipoX) {
            // esvazia a fila (limpeza)
            while (F->inicio) {
                sair_fila(&F);
            }
            return i;               // primeiro encontrado = mais próximo
        }
        int j;
        for (j = 1; j <= V; j++) {
            if (m[i][j] == 1 && flags[j] == 0) {
                flags[j] = 1;
                entrar_fila(&F, j);
            }
        }
        flags[i] = 2;
    }
    return -1;                      // não encontrou
}
```

A diferença: o `if (tipos[i] == tipoX)` aparece logo ao retirar da fila, ANTES de processar vizinhos. Se for o que procuro, esvazio a fila e retorno.

### 3.7 Comprimento do caminho mais curto

Agora a struct `vertice` ganha o campo `dist`:

```c
typedef struct {
    no *inicio;
    int flag;
    int dist;       // distância em arestas a partir da origem
} vertice;
```

```c
int comprimento(vertice *g, int v1, int v2) {
    zerar_flags(g);
    int j;
    for (j = 1; j <= V; j++) {
        if (j == v1) g[j].dist = 0;
        else g[j].dist = INFINITO;
    }

    FILA F;
    inicializar(&F);
    entrar_fila(&F, v1);
    g[v1].flag = 1;

    while (F->inicio) {
        int i = sair_fila(&F);
        if (i == v2) {
            // achei o destino
            while (F->inicio) sair_fila(&F);
            return g[i].dist;
        }
        no *p = g[i].inicio;
        while (p) {
            if (g[p->adj].flag == 0) {
                g[p->adj].flag = 1;
                g[p->adj].dist = g[i].dist + 1;   // pai + 1
                entrar_fila(&F, p->adj);
            }
            p = p->prox;
        }
        g[i].flag = 2;
    }
    return INFINITO;    // caminho não existe
}
```

A linha central é `g[p->adj].dist = g[i].dist + 1`. Quando descubro um vizinho, sua distância é a do vértice atual + 1. Como a BFS processa por camadas, a primeira descoberta de cada vértice já é pelo caminho mais curto.

Analogia: corrida de revezamento. Cada corredor passa o bastão (distância) adicionando 1. O primeiro bastão a chegar no destino veio pelo caminho mais curto.

### 3.8 Vértices em raio N

Lista com todos os vértices a no máximo N arestas de distância de i. É como definir o "raio de entrega" de um delivery.

```c
no* vertices_raio_n(vertice *g, int i, int N) {
    no *resp = NULL;
    // inicializar dist com infinito e dist[i] = 0
    zerar_flags(g);
    FILA F;
    inicializar(&F);
    entrar_fila(&F, i);
    g[i].flag = 1;

    while (F->inicio) {
        i = sair_fila(&F);
        no *p = g[i].inicio;
        while (p) {
            if (g[p->adj].flag == 0) {
                g[p->adj].dist = g[i].dist + 1;
                if (g[p->adj].dist > N) {
                    // passou do raio, para tudo
                    while (F->inicio) sair_fila(&F);
                    return resp;
                }
                g[p->adj].flag = 1;
                entrar_fila(&F, p->adj);
            }
            p = p->prox;
        }
        g[i].flag = 2;
        // adiciona i à lista de resposta
        no *novo = (no*) malloc(sizeof(no));
        novo->adj = i;
        novo->prox = resp;
        resp = novo;
    }
    return resp;
}
```

Como BFS processa por camadas crescentes de distância, no momento que `dist` ultrapassa N, tudo na fila também ultrapassará. Pode parar imediatamente. DFS não permite esse corte porque pula entre distâncias de forma imprevisível.

### 3.9 Custo do caminho em grafo ponderado (via BFS)

Usa a matriz onde `m[i][j]` é o peso (ao invés de 0/1).

```c
void custo(int m[V][V], int i, int custos[]) {
    // custo(i) = 0, demais = infinito
    int flags[V];
    zerar_flags(flags);
    FILA F;
    inicializar(&F);
    entrar_fila(&F, i);
    flags[i] = 1;

    while (F->inicio) {
        i = sair_fila(&F);
        int c;
        for (c = 1; c <= V; c++) {
            if (m[i][c] > 0 && flags[c] == 0) {
                flags[c] = 1;
                entrar_fila(&F, c);
                custos[c] = custos[i] + m[i][c];   // acumula peso
            }
        }
        flags[i] = 2;
    }
}
```

**ATENÇÃO**: essa implementação NÃO garante custo mínimo em grafos ponderados. Ela encontra o custo pelo caminho com menos arestas, mas um caminho com mais arestas pode ser mais barato. Para custo mínimo real, é necessário usar **Dijkstra**. BFS só garante "mais curto" quando todas as arestas têm peso igual.

### 3.10 O padrão universal da BFS

Assim como a DFS, todas as implementações seguem o mesmo esqueleto:

```
zerar flags
criar e inicializar fila
colocar vértice inicial na fila, marcar cinza
enquanto fila não vazia:
    retirar i da fila
    [verificar condição especial com i]
    para cada vizinho j de i:
        se j é branco:
            [calcular dist/custo de j]
            [verificar condição de parada]
            marcar j como cinza
            colocar j na fila
    marcar i como preto
```

O motor é sempre o mesmo. O que muda são os "plugins": buscar tipo X, calcular distância, limitar raio, acumular custo.

### 3.11 BFS vs DFS — Quando usar cada uma

| Situação                          | Usar    | Por quê                                         |
|----------------------------------|---------|--------------------------------------------------|
| Caminho mais curto (arestas)     | BFS     | Explora por camadas crescentes de distância      |
| Tipo X mais próximo              | BFS     | Primeiro encontrado = mais próximo               |
| Vértices em raio N               | BFS     | Pode parar quando dist > N                       |
| Existe caminho i→j?              | DFS     | Mais simples, menos overhead                     |
| Detectar ciclos                  | DFS     | Usa a distinção cinza/preto                      |
| Componentes conectados           | DFS     | Cada DFS de branco = componente novo             |
| Ordem de conclusão               | DFS     | Necessária para ord. topológica e CFC            |
| Explorar tudo                    | Ambos   | Ambos visitam todos os vértices alcançáveis       |

Regra geral: se a pergunta envolve "mais próximo", "mais curto", "camadas" → BFS.
Se envolve "existe?", "ciclo", "componentes", "ordem" → DFS.
DFS é o canivete suíço. BFS é a régua de precisão.