# AED2: Grafos — Material Completo (Blocos 4 a 9)

---

## BLOCO 4: Algoritmo de Dijkstra

### 4.1 A intuição

A BFS encontra o caminho mais curto em número de arestas, como se todas as ruas tivessem o mesmo comprimento. Mas e se cada rua tem um tamanho diferente? O caminho com menos ruas pode não ser o mais curto em metros.

Dijkstra resolve exatamente isso: encontra o caminho de **custo mínimo** num grafo ponderado (com pesos nas arestas), desde que **não existam pesos negativos**.

A analogia: imagine que você está numa cidade com pedágios diferentes em cada rua. Você quer ir do ponto A ao ponto G gastando o mínimo possível. A BFS diria "pegue a rota com menos ruas", mas Dijkstra diz "pegue a rota mais barata, mesmo que tenha mais ruas".

### 4.2 O princípio guloso

Dijkstra é um algoritmo **guloso**: a cada passo, ele "fecha" (marca como processado) o vértice não processado que tem o menor custo acumulado até o momento. A ideia é que, se esse vértice tem o menor custo entre todos os não processados, não existe nenhum outro caminho mais barato para chegar nele (porque qualquer outro caminho passaria por vértices com custo igual ou maior, e ainda somaria mais peso).

É como pagar contas: você sempre paga primeiro a mais barata pendente. Uma vez paga, não tem como "despagar" e encontrar uma forma mais barata.

Essa lógica só funciona sem pesos negativos. Se houvesse uma aresta com peso -100, um caminho aparentemente mais caro poderia ficar mais barato ao passar por ela, quebrando a premissa gulosa.

### 4.3 Structs necessárias

A struct `no` (aresta) ganha o campo `peso`. A struct `vertice` ganha `P` (processado), `CUSTO` (custo acumulado desde a origem) e `VIA` (de onde veio, para reconstruir o caminho).

```c
typedef struct s {
    int adj;            // vértice destino
    int peso;           // peso da aresta
    struct s *prox;
} NO;                   // aresta

typedef struct {
    NO *inicio;         // lista de adjacência
    int flag;           // para buscas
    int P;              // 0 = não processado, 1 = processado
    int CUSTO;          // custo acumulado desde a origem
    int VIA;            // vértice anterior no caminho ótimo
} VERTICE;
```

### 4.4 Os 3 passos do algoritmo

**Inicialização:**
Para cada vértice j: P=0, CUSTO=infinito, VIA=-1.
Para o vértice inicial i: CUSTO=0.

**Passo 1 (Selecionar):**
Entre todos os vértices com P=0 (não processados), escolha o que tem menor CUSTO. Chame-o de `s`. Marque P[s]=1. Se nenhum vértice não processado tem custo finito, o algoritmo termina.

**Passo 2 (Relaxar):**
Para cada vizinho de `s`, calcule `temp = CUSTO[s] + peso_aresta`. Se `temp < CUSTO[vizinho]`, atualize: CUSTO[vizinho] = temp e VIA[vizinho] = s.

**Repetir** passos 1 e 2 até processar todos os vértices ou não haver mais vértices alcançáveis.

### 4.5 Exemplo completo (das anotações)

Grafo com vértices A a G:
```
A --1-- B
A --3-- C
A --1-- D
B --2-- E
C --1-- G
D --1-- C
D --1-- F
E --1-- G (peso não especificado, assumindo estrutura das notas)
F --1-- D (volta)
```

Tabela de execução partindo de A:

```
Estado Inicial:
  Vértice | P | CUSTO | VIA
  --------|---|-------|----
  A       | 0 |   0   | -1
  B       | 0 |   ∞   | -1
  C       | 0 |   ∞   | -1
  D       | 0 |   ∞   | -1
  E       | 0 |   ∞   | -1
  F       | 0 |   ∞   | -1
  G       | 0 |   ∞   | -1

Iteração 1: s = A (menor custo não processado = 0)
  Marcar A como P=1.
  Relaxar vizinhos de A:
    B: 0+1=1 < ∞ → CUSTO[B]=1, VIA[B]=A
    C: 0+1=1+1 (depende do grafo) → atualiza
    D: 0+1=1 < ∞ → CUSTO[D]=1, VIA[D]=A

Iteração 2: s = B ou D (empate, custo=1). Digamos s=B.
  Marcar B como P=1.
  Relaxar vizinhos de B...
  (continua até processar todos)

Resultado final: cada vértice tem o custo mínimo desde A
e o campo VIA permite reconstruir o caminho.
```

Para reconstruir o caminho até G, por exemplo: olhe VIA[G], depois VIA[VIA[G]], e assim por diante até chegar em A. Leia de trás para frente.

### 4.6 Implementação completa (conforme as anotações do professor)

```c
void dijkstra(VERTICE *g, int i) {
    int j;

    // INICIALIZAÇÃO
    for (j = 1; j <= V; j++) {
        g[j].flag = 0;
        g[j].P = 0;            // ninguém processado
        g[j].CUSTO = INFINITO;  // custo infinito
        g[j].VIA = -1;         // sem predecessor
    }
    g[i].CUSTO = 0;            // origem tem custo 0

    // LOOP PRINCIPAL
    while (1) {

        // PASSO 1: encontrar s = vértice não processado de menor custo
        int s = -1;
        int s_custo = INFINITO;
        for (j = 1; j <= V; j++) {
            if (g[j].P == 0 && g[j].CUSTO < s_custo) {
                s = j;
                s_custo = g[j].CUSTO;
            }
        }

        // Se não encontrou nenhum (todos processados ou inalcançáveis)
        if (s == -1) return;

        // Marcar s como processado
        g[s].P = 1;

        // PASSO 2: relaxar vizinhos de s
        NO *p = g[s].inicio;
        while (p) {
            int temp = g[s].CUSTO + p->peso;
            if (temp < g[p->adj].CUSTO) {
                g[p->adj].CUSTO = temp;
                g[p->adj].VIA = s;
            }
            p = p->prox;
        }
    }
}
```

### 4.7 Análise linha por linha

**Inicialização (for):** Zera tudo. Todo mundo começa não processado, com custo infinito e sem predecessor. Só a origem recebe custo 0.

**Passo 1 (for interno):** Percorre todos os vértices procurando o não processado (P==0) com menor custo. É como olhar para todas as contas pendentes e escolher a mais barata. Se nenhum tem custo finito, `s` fica -1 e o algoritmo para.

**Marcação:** `g[s].P = 1` "fecha" o vértice s. A partir de agora, o custo dele está definitivo e não muda mais. É como carimbar "PAGO" na conta.

**Passo 2 (while p):** Para cada vizinho de s, calcula se ir por s é mais barato do que o caminho atual. Se `custo_de_s + peso_da_aresta < custo_atual_do_vizinho`, atualiza. Isso é chamado de **relaxamento**. É como descobrir um atalho: "ei, se eu for por aqui, fica mais barato!".

### 4.8 Complexidade

Com a implementação acima (busca linear pelo mínimo): **O(|V|²)**

O loop externo roda |V| vezes (um vértice processado por iteração). O passo 1 (busca pelo mínimo) percorre |V| vértices. O passo 2 percorre os vizinhos de s.

Com fila de prioridade (heap): O((|V| + |E|) log |V|), mais eficiente para grafos esparsos. Mas o professor usa a versão com busca linear.

### 4.9 Dijkstra vs BFS em grafo ponderado

A BFS do bloco 3 (função `custo`) simplesmente soma os pesos na ordem de descoberta. O problema é que ela processa por "número de arestas", não por "custo acumulado". Pode processar um vértice cedo (por ter poucas arestas até ele) antes de descobrir um caminho mais barato com mais arestas.

Dijkstra corrige isso: sempre processa o vértice de menor custo global, independente de quantas arestas tem o caminho.

Analogia: BFS é como um carteiro que entrega por proximidade de quadras. Dijkstra é como um motorista de app que escolhe a rota mais barata em pedágio, mesmo que seja mais longa em quilômetros.

---

## BLOCO 5: Floyd-Warshall

### 5.1 A intuição

Dijkstra resolve "qual o menor custo de um vértice i para todos os outros". Floyd resolve "qual o menor custo entre TODOS os pares de vértices", de uma vez só.

É como aquelas tabelas de distância entre cidades que aparecem em mapas rodoviários: uma matriz completa onde cada célula [i][j] diz a menor distância de i até j.

### 5.2 A ideia central

Floyd usa **programação dinâmica**. A pergunta que ele faz é:

"Para ir de i até j, compensa passar por um vértice intermediário k?"

Se `dist[i][k] + dist[k][j] < dist[i][j]`, então sim, o caminho via k é melhor.

Ele testa isso para TODOS os possíveis intermediários k, para TODOS os pares (i, j). São três fors aninhados, elegantemente simples.

Analogia: imagine que você está montando uma tabela de fretes entre cidades. Para cada par de cidades (i, j), você verifica: "e se a mercadoria fizer escala na cidade k? Fica mais barato?" Se sim, atualiza a tabela.

### 5.3 Implementação

Usa matriz de adjacência. A matriz `dist` começa como cópia da matriz de pesos do grafo.

```c
void floyd(int dist[V][V]) {
    // dist já está inicializada:
    // dist[i][j] = peso da aresta i→j se existe
    // dist[i][j] = INFINITO se não existe aresta
    // dist[i][i] = 0 para todo i

    int k, i, j;
    for (k = 0; k < V; k++) {           // para cada intermediário k
        for (i = 0; i < V; i++) {        // para cada origem i
            for (j = 0; j < V; j++) {    // para cada destino j
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }
}
```

### 5.4 Inicialização da matriz

Antes de chamar Floyd, a matriz precisa ser preparada:

```c
void inicializar_floyd(int m[V][V], int dist[V][V]) {
    int i, j;
    for (i = 0; i < V; i++) {
        for (j = 0; j < V; j++) {
            if (i == j) {
                dist[i][j] = 0;           // distância de si mesmo = 0
            } else if (m[i][j] > 0) {
                dist[i][j] = m[i][j];     // peso da aresta
            } else {
                dist[i][j] = INFINITO;    // sem aresta = infinito
            }
        }
    }
}
```

### 5.5 Reconstrução do caminho (com matriz VIA)

Para saber não apenas o custo, mas QUAL é o caminho, mantemos uma matriz `via` paralela:

```c
void floyd_com_caminho(int dist[V][V], int via[V][V]) {
    int k, i, j;

    // Inicialização da matriz via
    for (i = 0; i < V; i++) {
        for (j = 0; j < V; j++) {
            if (dist[i][j] < INFINITO && i != j) {
                via[i][j] = i;     // predecessor direto
            } else {
                via[i][j] = -1;    // sem caminho
            }
        }
    }

    // Algoritmo principal
    for (k = 0; k < V; k++) {
        for (i = 0; i < V; i++) {
            for (j = 0; j < V; j++) {
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                    via[i][j] = via[k][j];   // atualiza predecessor
                }
            }
        }
    }
}
```

### 5.6 Exemplo passo a passo

Grafo com 4 vértices, arestas: 1→2 (peso 3), 1→3 (peso 7), 2→3 (peso 1), 3→4 (peso 2):

```
Matriz inicial dist:
     1    2    3    4
1 [  0    3    7    ∞  ]
2 [  ∞    0    1    ∞  ]
3 [  ∞    ∞    0    2  ]
4 [  ∞    ∞    ∞    0  ]

k=1 (intermediário = vértice 1):
  Verifica se i→1→j melhora i→j para todos os pares.
  Nenhuma melhoria (nada chega em 1 com custo finito, exceto 1 mesmo).

k=2 (intermediário = vértice 2):
  dist[1][3]: 1→2→3 = 3+1 = 4 < 7 → ATUALIZA! dist[1][3] = 4

k=3 (intermediário = vértice 3):
  dist[1][4]: 1→3→4 = 4+2 = 6 < ∞ → ATUALIZA! dist[1][4] = 6
  dist[2][4]: 2→3→4 = 1+2 = 3 < ∞ → ATUALIZA! dist[2][4] = 3

k=4: nenhuma melhoria.

Resultado final:
     1    2    3    4
1 [  0    3    4    6  ]
2 [  ∞    0    1    3  ]
3 [  ∞    ∞    0    2  ]
4 [  ∞    ∞    ∞    0  ]
```

O caminho 1→3 melhorou de 7 (direto) para 4 (via vértice 2). O algoritmo descobriu que fazer escala no vértice 2 é mais barato.

### 5.7 Detecção de ciclos negativos

Se após rodar Floyd algum `dist[i][i] < 0`, existe um ciclo negativo passando por i. Ciclos negativos tornam o problema indefinido (você poderia dar voltas infinitas diminuindo o custo).

```c
bool tem_ciclo_negativo(int dist[V][V]) {
    int i;
    for (i = 0; i < V; i++) {
        if (dist[i][i] < 0) return true;
    }
    return false;
}
```

### 5.8 Complexidade e comparação

Floyd: **O(|V|³)** tempo, **O(|V|²)** espaço.

| Aspecto              | Dijkstra          | Floyd               |
|---------------------|-------------------|---------------------|
| Resolve             | 1 origem → todos  | Todos → todos       |
| Pesos negativos     | NÃO suporta       | Suporta (sem ciclo neg.) |
| Complexidade        | O(|V|²)           | O(|V|³)             |
| Estrutura           | Lista ou matriz   | Matriz              |
| Quando usar         | 1 origem específica| Tabela completa     |

Se você precisa da distância mínima de TODOS para TODOS, rodar Dijkstra |V| vezes dá O(|V|³) também, então Floyd é mais simples. Se precisa de apenas uma origem, Dijkstra é melhor.

---

## BLOCO 6: Ordenação Topológica

### 6.1 A intuição

Só funciona em **grafos dirigidos acíclicos (DAGs)**. A ordenação topológica produz uma sequência linear dos vértices que respeita todas as dependências: se existe aresta A→B, então A aparece antes de B na sequência.

Analogia: pense em pré-requisitos de disciplinas na faculdade. Você não pode cursar AED2 sem ter feito AED1. A ordenação topológica dá uma ordem válida para cursar todas as disciplinas sem violar nenhum pré-requisito.

Outros exemplos: ordem de compilação de módulos, sequência de tarefas num projeto, ordem de vestir roupas (cueca antes da calça).

### 6.2 Propriedade fundamental

Um grafo admite ordenação topológica **se e somente se** não possui ciclos (é um DAG). Se existe ciclo (A depende de B que depende de C que depende de A), não há como ordenar linearmente.

### 6.3 Método 1: Via DFS (ordem de conclusão invertida)

Esse é o método mais elegante. Execute uma DFS completa e anote a **ordem de conclusão** (quando cada vértice fica preto). Depois **inverta** essa ordem. O resultado é uma ordenação topológica válida.

Por que funciona? Na DFS, um vértice só fica preto depois que todos os seus "dependentes" já ficaram pretos. Então, invertendo a ordem de conclusão, os "pré-requisitos" ficam primeiro.

```c
int ordem[V];      // array para guardar a ordem
int pos;           // posição atual no array

void dfs_topologica(VERTICE *g, int i) {
    g[i].flag = 1;
    NO *p = g[i].inicio;
    while (p) {
        if (g[p->adj].flag == 0) {
            dfs_topologica(g, p->adj);
        }
        p = p->prox;
    }
    g[i].flag = 2;
    ordem[pos] = i;    // anota na ordem de conclusão
    pos--;             // preenche de trás para frente (já inverte)
}

void ordenacao_topologica(VERTICE *g) {
    zerar_flags(g);
    pos = V - 1;       // começa preenchendo do final
    int i;
    for (i = 0; i < V; i++) {
        if (g[i].flag == 0) {
            dfs_topologica(g, i);
        }
    }
    // array 'ordem' agora contém a ordenação topológica
    printf("Ordenação topológica: ");
    for (i = 0; i < V; i++) {
        printf("%d ", ordem[i]);
    }
    printf("\n");
}
```

O `for` externo garante que todos os vértices sejam visitados, mesmo em grafos desconexos. Ao preencher o array de trás para frente (`pos--`), a inversão já acontece automaticamente.

### 6.4 Método 2: Via grau de entrada (Algoritmo de Kahn)

Ideia alternativa: encontre vértices com grau de entrada zero (sem pré-requisitos), remova-os do grafo, atualize os graus, e repita.

É como montar um quebra-cabeça: comece pelas peças que não dependem de nenhuma outra.

```c
void kahn(VERTICE *g) {
    int grau_ent[V];
    int i, j;

    // Calcular grau de entrada de cada vértice
    for (i = 0; i < V; i++) grau_ent[i] = 0;
    for (i = 0; i < V; i++) {
        NO *p = g[i].inicio;
        while (p) {
            grau_ent[p->adj]++;
            p = p->prox;
        }
    }

    FILA F;
    inicializar(&F);

    // Colocar todos com grau de entrada 0 na fila
    for (i = 0; i < V; i++) {
        if (grau_ent[i] == 0) {
            entrar_fila(&F, i);
        }
    }

    int cont = 0;   // conta vértices processados
    while (F->inicio) {
        i = sair_fila(&F);
        printf("%d ", i);   // imprime na ordem topológica
        cont++;

        NO *p = g[i].inicio;
        while (p) {
            grau_ent[p->adj]--;
            if (grau_ent[p->adj] == 0) {
                entrar_fila(&F, p->adj);
            }
            p = p->prox;
        }
    }

    if (cont != V) {
        printf("\nGrafo contém ciclo! Ordenação impossível.\n");
    }
}
```

O bônus desse método: se `cont < V`, significa que sobraram vértices que nunca ficaram com grau 0, indicando um ciclo.

### 6.5 Exemplo (das anotações, imagem 3)

Grafo com vértices 0 a 8, com arestas dirigidas formando um DAG.
A DFS partindo dos vértices fonte produziria uma ordem de conclusão. Invertendo, obtemos a ordem topológica.

Se o grafo representa disciplinas: a saída seria algo como "faça primeiro a disciplina 3, depois 2, depois 0, depois 1..." respeitando todos os pré-requisitos.

---

## BLOCO 7: Árvore Geradora Mínima (AGM)

### 7.1 A intuição

Dado um grafo não dirigido, conexo e ponderado, a AGM é um subgrafo que conecta TODOS os vértices com o menor custo total possível, sem formar ciclos.

Analogia: imagine que você é engenheiro e precisa conectar todas as casas de um condomínio com cabos de internet. Cada possível caminho de cabo tem um custo diferente. Você quer conectar todas as casas gastando o mínimo de cabo, sem redundância (sem ciclos).

O resultado é uma **árvore** (grafo conexo sem ciclos) que **gera** (conecta) todos os vértices do grafo original, com peso total **mínimo**.

### 7.2 Propriedades de uma árvore

Uma árvore com N vértices sempre tem exatamente N-1 arestas. Se adicionar mais uma aresta, cria ciclo. Se remover uma, desconecta. É o número mínimo de arestas para manter o grafo conexo.

### 7.3 Algoritmo de Prim

Prim funciona de forma muito parecida com Dijkstra. Começa de um vértice e vai "crescendo" a árvore, sempre adicionando a aresta mais barata que conecta um vértice novo (não processado) à árvore existente.

A diferença sutil com Dijkstra: em Dijkstra, o CUSTO é o custo acumulado desde a origem. Em Prim, o CUSTO é apenas o peso da aresta que conecta o vértice à árvore (não acumula).

```c
void prim(VERTICE *g, int inicio) {
    int j;
    for (j = 0; j < V; j++) {
        g[j].P = 0;
        g[j].CUSTO = INFINITO;
        g[j].VIA = -1;
    }
    g[inicio].CUSTO = 0;

    int custo_total = 0;

    while (1) {
        // Encontrar vértice não processado de menor custo
        int s = -1;
        int s_custo = INFINITO;
        for (j = 0; j < V; j++) {
            if (g[j].P == 0 && g[j].CUSTO < s_custo) {
                s = j;
                s_custo = g[j].CUSTO;
            }
        }
        if (s == -1) break;

        g[s].P = 1;
        custo_total += g[s].CUSTO;

        // Atualizar custos dos vizinhos
        NO *p = g[s].inicio;
        while (p) {
            // DIFERENÇA DO DIJKSTRA: compara com peso da aresta,
            // não com custo acumulado
            if (g[p->adj].P == 0 && p->peso < g[p->adj].CUSTO) {
                g[p->adj].CUSTO = p->peso;
                g[p->adj].VIA = s;
            }
            p = p->prox;
        }
    }

    printf("Custo total da AGM: %d\n", custo_total);

    // Exibir arestas da AGM
    for (j = 0; j < V; j++) {
        if (g[j].VIA != -1) {
            printf("Aresta: %d -- %d (peso %d)\n", g[j].VIA, j, g[j].CUSTO);
        }
    }
}
```

### 7.4 Prim vs Dijkstra: a diferença crucial

A estrutura do código é quase idêntica. A única diferença está no relaxamento:

```c
// DIJKSTRA: custo acumulado desde a origem
if (g[s].CUSTO + p->peso < g[p->adj].CUSTO)
    g[p->adj].CUSTO = g[s].CUSTO + p->peso;

// PRIM: apenas o peso da aresta para conectar
if (p->peso < g[p->adj].CUSTO)
    g[p->adj].CUSTO = p->peso;
```

Dijkstra pergunta: "qual o custo total para chegar aqui?"
Prim pergunta: "qual o custo para conectar este vértice à árvore?"

Analogia: Dijkstra é como calcular o custo total de uma viagem (soma todos os pedágios). Prim é como escolher o cabo mais barato para conectar a próxima casa (só o trecho, sem acumular).

### 7.5 Algoritmo de Kruskal

Abordagem diferente: ao invés de crescer uma árvore, Kruskal ordena TODAS as arestas por peso e vai adicionando da mais barata para a mais cara, pulando as que criariam ciclo.

Para detectar ciclos eficientemente, usa a estrutura Union-Find (conjuntos disjuntos).

```c
// Estrutura de aresta para ordenação
typedef struct {
    int origem;
    int destino;
    int peso;
} ARESTA;

// Union-Find simplificado
int pai[V];

void inicializar_uf() {
    int i;
    for (i = 0; i < V; i++) pai[i] = i;
}

int encontrar(int x) {
    while (pai[x] != x) x = pai[x];
    return x;
}

bool unir(int a, int b) {
    int ra = encontrar(a);
    int rb = encontrar(b);
    if (ra == rb) return false;   // já estão no mesmo conjunto (ciclo!)
    pai[ra] = rb;
    return true;
}

void kruskal(ARESTA arestas[], int num_arestas) {
    // 1. Ordenar arestas por peso (crescente)
    // (usar qualquer algoritmo de ordenação)
    ordenar_por_peso(arestas, num_arestas);

    inicializar_uf();
    int custo_total = 0;
    int arestas_usadas = 0;
    int i;

    for (i = 0; i < num_arestas && arestas_usadas < V - 1; i++) {
        // 2. Tentar adicionar aresta
        if (unir(arestas[i].origem, arestas[i].destino)) {
            // Não criou ciclo, adicionar à AGM
            printf("Aresta: %d -- %d (peso %d)\n",
                   arestas[i].origem, arestas[i].destino, arestas[i].peso);
            custo_total += arestas[i].peso;
            arestas_usadas++;
        }
        // Se criou ciclo, pula para a próxima aresta
    }

    printf("Custo total da AGM: %d\n", custo_total);
}
```

### 7.6 Prim vs Kruskal

| Aspecto              | Prim               | Kruskal             |
|---------------------|--------------------|--------------------|
| Estratégia          | Cresce uma árvore  | Junta florestas     |
| Melhor para         | Grafos densos      | Grafos esparsos     |
| Precisa de          | Lista/matriz adj.  | Lista de arestas    |
| Complexidade        | O(|V|²) simples    | O(|E| log |E|)      |
| Parecido com        | Dijkstra           | Ordenação + Union-Find |

### 7.7 Exemplo

Grafo: A--B(4), A--C(2), B--C(1), B--D(5), C--D(8), C--E(10), D--E(2)

**Kruskal**: ordena arestas: B-C(1), A-C(2), D-E(2), A-B(4), B-D(5), C-D(8), C-E(10).
Adiciona B-C(1) → ok.
Adiciona A-C(2) → ok.
Adiciona D-E(2) → ok.
Adiciona A-B(4) → ciclo (A,B,C já conectados) → PULA.
Adiciona B-D(5) → ok. Agora temos V-1=4 arestas → PARA.
AGM: {B-C, A-C, D-E, B-D}, custo total = 1+2+2+5 = 10.

**Prim** (partindo de A): seleciona A(0), relaxa vizinhos. Menor: C(2). Seleciona C, relaxa. Menor: B(1, via C). Seleciona B, relaxa. Menor: D(5, via B). Seleciona D, relaxa. Menor: E(2, via D). Mesmo resultado, mesma AGM.

---

## BLOCO 8: Componentes Fortemente Conectados (CFC)

### 8.1 A intuição

Em um grafo dirigido, um componente fortemente conectado é um grupo maximal de vértices onde **todos conseguem chegar em todos** por caminhos dirigidos.

Analogia: numa rede social direcional (como o antigo Twitter), um CFC seria um grupo de pessoas onde A segue B, B segue C, e C segue A (direta ou indiretamente). Todo mundo consegue "alcançar" todo mundo dentro do grupo através de cadeias de "seguir".

É diferente de componente conexo em grafo não dirigido. Num dirigido, pode existir caminho de A para B mas não de B para A. CFC exige os dois sentidos.

### 8.2 Algoritmo de Kosaraju

O algoritmo mais intuitivo. Usa duas DFS e o grafo transposto (que você já sabe construir do Bloco 1).

**Passo 1**: Execute DFS no grafo original e anote a ordem de conclusão (quando cada vértice fica preto).

**Passo 2**: Construa o grafo transposto (inverta todas as arestas).

**Passo 3**: Execute DFS no grafo transposto, processando os vértices na ordem de conclusão invertida (do último a ficar preto até o primeiro).

Cada árvore DFS formada no passo 3 é um CFC.

### 8.3 Por que funciona?

O grafo transposto inverte a "direção de alcance". Se no grafo original A alcança B, no transposto B alcança A.

A ordem de conclusão da primeira DFS garante que começamos pelo vértice que "terminou por último" (que potencialmente alcança mais vértices). Ao rodar DFS no transposto nessa ordem, verificamos quem alcança esse vértice de volta. Quem é alcançado no transposto = quem alcançava no original. A interseção (alcança E é alcançado) = fortemente conectado.

### 8.4 Implementação

```c
int pilha[V];      // simula pilha com array
int topo = -1;

// Passo 1: DFS no grafo original, empilhando na conclusão
void dfs_ordem(VERTICE *g, int i) {
    g[i].flag = 1;
    NO *p = g[i].inicio;
    while (p) {
        if (g[p->adj].flag == 0) {
            dfs_ordem(g, p->adj);
        }
        p = p->prox;
    }
    g[i].flag = 2;
    topo++;
    pilha[topo] = i;    // empilha na ordem de conclusão
}

// Passo 3: DFS no transposto, imprimindo o CFC
void dfs_cfc(VERTICE *gt, int i, int componente) {
    gt[i].flag = 1;
    printf("  Vértice %d pertence ao CFC %d\n", i, componente);
    NO *p = gt[i].inicio;
    while (p) {
        if (gt[p->adj].flag == 0) {
            dfs_cfc(gt, p->adj, componente);
        }
        p = p->prox;
    }
    gt[i].flag = 2;
}

void kosaraju(VERTICE *g) {
    // Passo 1: DFS no original, montar ordem de conclusão
    zerar_flags(g);
    int i;
    for (i = 0; i < V; i++) {
        if (g[i].flag == 0) {
            dfs_ordem(g, i);
        }
    }

    // Passo 2: Construir grafo transposto
    VERTICE *gt = transposta(g);   // função do Bloco 1

    // Passo 3: DFS no transposto na ordem inversa de conclusão
    zerar_flags(gt);
    int componente = 0;
    while (topo >= 0) {
        i = pilha[topo];     // desempilha (ordem inversa de conclusão)
        topo--;
        if (gt[i].flag == 0) {
            componente++;
            printf("CFC %d:\n", componente);
            dfs_cfc(gt, i, componente);
        }
    }
}
```

### 8.5 Exemplo

Grafo: 0→1, 1→2, 2→0, 1→3, 3→4, 4→5, 5→3

```
Passo 1 DFS (partindo de 0):
  0→1→2→(volta pra 0, ciclo)→3→4→5→(volta pra 3, ciclo)
  Ordem de conclusão: 2, 0 não, vamos traçar...
  Empilha: 2, 0, 5, 3, 4, 1 (exemplo simplificado)

Passo 2 Transposto:
  0←1 vira 1→0
  1←2 vira 2→1
  2←0 vira 0→2
  1←3 vira 3→1
  3←4 vira 4→3
  4←5 vira 5→4
  5←3 vira 3→5

Passo 3 DFS no transposto (da pilha, de cima para baixo):
  Começa por 1: alcança 0 (via transposta 3→1? não, 0→2→1)
  CFC 1: {0, 1, 2} (todos se alcançam mutuamente)
  CFC 2: {3, 4, 5} (todos se alcançam mutuamente)
```

### 8.6 Complexidade

O(|V| + |E|): duas DFS (cada uma O(|V|+|E|)) mais a construção do transposto (O(|V|+|E|)).

---

## BLOCO 9: Coloração de Grafos

### 9.1 A intuição

O problema de coloração: atribuir uma "cor" (recurso) a cada vértice de modo que **nenhum par de vértices adjacentes tenha a mesma cor**.

Analogia: imagine que você precisa montar a grade de provas da faculdade. Cada disciplina é um vértice. Se duas disciplinas têm alunos em comum, existe aresta entre elas (não podem ser no mesmo horário). Cada "cor" é um horário. Colorir o grafo é montar a grade sem conflitos.

Outros exemplos: alocação de frequências de rádio (estações vizinhas não podem usar a mesma), atribuição de registradores em compiladores, coloração de mapas (países vizinhos com cores diferentes).

### 9.2 Número cromático

O número cromático K é o número mínimo de cores necessárias para colorir o grafo. Encontrar K exato é um problema NP-difícil, mas heurísticas gulosas funcionam bem na prática.

### 9.3 Estratégia do professor

A abordagem das anotações é gulosa: comece pelo vértice de **maior grau** (mais restrições) e atribua cores começando de 1. Para cada vértice, verifique quais cores seus vizinhos já usam e atribua a menor cor disponível.

Começar pelo vértice de maior grau é como resolver primeiro a disciplina com mais conflitos de horário: ela tem menos opções, então é melhor atendê-la primeiro.

### 9.4 Struct estendida

```c
typedef struct {
    NO *inicio;
    int flag;
    int cor;        // 0 = sem cor, 1..K = cor atribuída
} VERTICE;
```

### 9.5 Função achar_cor

Determina qual cor atribuir a um vértice. Verifica as cores dos vizinhos e retorna a menor cor não usada por nenhum deles.

```c
int achar_cor(VERTICE *g, int i) {
    bool tem_cor[5];    // índices 1 a 4 (assumindo no máximo 4 cores)
    int j;
    for (j = 1; j <= 4; j++) {
        tem_cor[j] = false;
    }

    // Marcar quais cores os vizinhos já usam
    NO *p = g[i].inicio;
    while (p) {
        if (g[p->adj].cor > 0) {          // vizinho já tem cor?
            tem_cor[g[p->adj].cor] = true; // marca como usada
        }
        p = p->prox;
    }

    // Retornar a menor cor disponível
    for (j = 1; j <= 4; j++) {
        if (!tem_cor[j]) {
            return j;
        }
    }

    return 0;   // não encontrou (precisaria de mais de 4 cores)
}
```

Analogia: é como chegar num estacionamento e ver quais vagas (cores) os carros vizinhos já ocuparam. Você pega a primeira vaga livre.

### 9.6 Coloração via DFS

O professor usa DFS para percorrer o grafo, colorindo cada vértice ao visitá-lo. Começa pelo vértice de maior grau. A variável `k` rastreia o número cromático (maior cor usada até agora).

```c
void prof_coloracao(VERTICE *g, int i, int *k) {
    g[i].cor = achar_cor(g, i);     // atribui a menor cor disponível
    if (g[i].cor > *k) {
        *k = *k + 1;               // precisou de uma cor nova
    }
    NO *p = g[i].inicio;
    while (p) {
        if (g[p->adj].cor == 0) {   // vizinho sem cor = não visitado
            prof_coloracao(g, p->adj, k);
        }
        p = p->prox;
    }
}
```

Note que aqui a verificação é `cor == 0` ao invés de `flag == 0`. A cor 0 funciona como o "branco" da flag: significa não processado. Não precisa de flag separada.

### 9.7 Chamada principal

```c
void colorir_grafo(VERTICE *g) {
    // Zerar todas as cores
    int i;
    for (i = 0; i < V; i++) {
        g[i].cor = 0;
    }

    // Encontrar vértice de maior grau
    int maior_grau = -1;
    int v_inicio = 0;
    for (i = 0; i < V; i++) {
        int grau = 0;
        NO *p = g[i].inicio;
        while (p) {
            grau++;
            p = p->prox;
        }
        if (grau > maior_grau) {
            maior_grau = grau;
            v_inicio = i;
        }
    }

    // Colorir a partir do vértice de maior grau
    int k = 0;
    prof_coloracao(g, v_inicio, &k);

    printf("Número cromático: %d\n", k);
    for (i = 0; i < V; i++) {
        printf("Vértice %d: cor %d\n", i, g[i].cor);
    }
}
```

### 9.8 Exemplo completo (das anotações)

```
Grafo:
A -- B, A -- F
B -- A, B -- C, B -- D
C -- B, C -- D, C -- E
D -- B, D -- C, D -- E, D -- F
E -- C, E -- D, E -- F
F -- A, F -- D, F -- E (corrigido conforme notas: A--D--C)

Adjacências:
A: B, C          → grau 2
B: A, C, D       → grau 3
C: B, D, E       → grau 3
D: B, C, E, F    → grau 4  ← MAIOR GRAU, começa aqui
E: C, D, F       → grau 3
F: A, D, C       → grau 3

Coloração começando por D (maior grau = 4):
D → vizinhos sem cor → cor 1
B → vizinho D tem cor 1 → cor 2
A → vizinho B tem cor 2 → cor 1
C → vizinhos B(2), D(1) → cor 3
E → vizinhos C(3), D(1) → cor 2
F → vizinhos A(1), D(1), E(2) → cor 3... depende da ordem DFS

Resultado: K = 3 ou 4 (depende da ordem de visita)
```

### 9.9 Limitações da heurística gulosa

A coloração gulosa **não garante** o número cromático ótimo. A ordem de visita dos vértices influencia o resultado. Começar pelo vértice de maior grau é uma boa heurística, mas não é perfeita.

O Teorema das 4 Cores garante que qualquer grafo planar (que pode ser desenhado sem cruzar arestas, como um mapa) pode ser colorido com no máximo 4 cores. Para grafos gerais, pode precisar de mais.

---

## Resumo Geral: Quando Usar Cada Algoritmo

| Problema                              | Algoritmo            | Complexidade    |
|--------------------------------------|---------------------|-----------------|
| Existe caminho i→j?                  | DFS                  | O(|V|+|E|)     |
| Caminho mais curto (arestas)         | BFS                  | O(|V|+|E|)     |
| Caminho mais barato (pesos ≥ 0)      | Dijkstra             | O(|V|²)        |
| Menor custo todos→todos              | Floyd                | O(|V|³)        |
| Detectar ciclos (dirigido)           | DFS (flag cinza)     | O(|V|+|E|)     |
| Ordem sem violar dependências        | Ord. Topológica      | O(|V|+|E|)     |
| Conectar tudo com custo mínimo       | Prim ou Kruskal      | O(|V|²) / O(|E|log|E|) |
| Grupos mutuamente alcançáveis        | Kosaraju (CFC)       | O(|V|+|E|)     |
| Atribuir recursos sem conflito       | Coloração            | O(|V|+|E|)     |
| Pesos negativos, sem ciclo negativo  | Floyd                | O(|V|³)        |

---

## Mapa Mental das Conexões

Os algoritmos se conectam entre si:

- **DFS** é a base para: detecção de ciclos, ordenação topológica, CFC (Kosaraju), coloração.
- **BFS** é a base para: caminho mais curto por arestas, tipo mais próximo, raio N.
- **Dijkstra** é BFS "melhorada" para grafos ponderados (troca fila por seleção do mínimo).
- **Prim** é Dijkstra "adaptado" para AGM (muda o critério de relaxamento).
- **Floyd** é a abordagem "força bruta elegante" para todos os pares.
- **Kosaraju** usa DFS + grafo transposto (duas ferramentas do Bloco 1).
- **Coloração** usa DFS como motor de percurso + heurística gulosa.

Tudo começa nas duas buscas fundamentais. Domine DFS e BFS, e os demais algoritmos são variações e extensões delas.