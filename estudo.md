Boa, Arthur. Agora o escopo ficou bem mais claro. Com esses tópicos adicionais (Dijkstra, Ordenação Topológica, Árvore Geradora Mínima, Componente Fortemente Conectado e Floyd), o plano precisa ser mais enxuto e estratégico. Vou reorganizar tudo.

## Plano Atualizado: 5h Teoria + Implementações

**Bloco 1 (30 min): Fundação e Estruturas de Dados**

Conceitos rápidos (página 2 do PDF): grau, adjacência, caminho, ciclo, conexo/desconexo, dirigido/não dirigido, ponderado. Diferença entre matriz e lista de adjacência. Pense na matriz como uma tabela de Excel onde você marca "1" se existe rua entre dois cruzamentos, e na lista como cada cruzamento tendo um post-it com a lista de ruas que saem dele. Matriz é O(1) para consultar aresta, mas gasta O(|V|²) de espaço. Lista gasta O(|V|+|E|) mas consultar aresta é O(|V|). Passe os olhos nas funções de manipulação (inicializar, inserir, excluir, grau) sem decorar linha por linha, entendendo a lógica.

**Bloco 2 (50 min): DFS (Busca em Profundidade)**

O algoritmo mais versátil da matéria. Funciona como explorar um labirinto sempre seguindo em frente até não ter saída, e então voltando. Sistema de 3 cores: branco (0) = não vi, cinza (1) = estou explorando, preto (2) = terminei. Estude nesta ordem: DFS básica (página 6), verificar caminho i→j (página 7), detectar ciclos (se encontro cinza, é ciclo, página 7), contar salas de tipo X (página 8). Os exercícios aplicados (rota por companhia, caminho passando por ponto, ligar não alcançáveis) são variações do mesmo padrão: DFS + condição extra no `if`.

**Bloco 3 (40 min): BFS (Busca em Largura)**

Se DFS é um explorador solitário, BFS é uma onda se expandindo em círculos concêntricos a partir de uma pedra jogada na água. Por isso encontra o caminho mais curto (em número de arestas). Usa fila ao invés de recursão. Estude: BFS básica (página 10), tipo X mais próximo (página 11), comprimento do caminho mais curto com campo `dist` (página 12), vértices em raio N (página 12).

**Bloco 4 (40 min): Dijkstra**

Aqui entra o conteúdo das suas fotos. Dijkstra é como a BFS, mas para grafos ponderados sem pesos negativos. A analogia: imagine que você está numa cidade e quer o caminho mais barato (não o mais curto em arestas) para todos os destinos. A cada passo, você "fecha" o vértice não processado (P=0) com menor custo acumulado, e a partir dele atualiza os custos dos vizinhos. Conforme suas anotações, a struct `NO` ganha o campo `peso`, e a struct `VERTICE` ganha `P` (processado), `CUSTO` e `VIA`. Os dois passos internos do `while(true)` são: (passo 1) encontrar o `s` não processado de menor custo, (passo 2) para cada vizinho de `s`, se `custo[s] + peso_aresta < custo[vizinho]`, atualizar. Trace manualmente o exemplo A→G das suas anotações para fixar.

**Bloco 5 (30 min): Floyd-Warshall**

Floyd resolve "qual o menor custo entre TODOS os pares de vértices". É como preencher uma tabela completa de distâncias, como aquelas tabelas de distância entre cidades na beira da estrada. O algoritmo é elegantemente simples: três fors aninhados. Para cada vértice intermediário `k`, para cada par `(i, j)`, verifica se `dist[i][k] + dist[k][j] < dist[i][j]`. Se sim, atualiza. Complexidade O(|V|³). Funciona com pesos negativos (diferente de Dijkstra), mas não com ciclos negativos.

**Bloco 6 (25 min): Ordenação Topológica**

Só funciona em grafos dirigidos acíclicos (DAGs). Pense em pré-requisitos de disciplinas: você só pode cursar AED2 depois de AED1. A ordenação topológica dá uma ordem linear que respeita todas as dependências. O método mais comum: faça uma DFS completa e anote os vértices na ordem de conclusão (quando ficam pretos). Depois inverta essa ordem. Ou, alternativamente, vá removendo vértices com grau de entrada zero (como tirar disciplinas sem pré-requisito da lista, e repetir). Pela sua foto (imagem 3), o professor mostrou o grafo com a numeração resultante ao lado.

**Bloco 7 (20 min): Árvore Geradora Mínima (AGM)**

O problema: conectar todos os vértices de um grafo não dirigido com o menor custo total, sem ciclos. Pense em cabear internet para um condomínio: você quer ligar todas as casas gastando o mínimo de cabo. Dois algoritmos clássicos: Prim (cresce uma árvore a partir de um vértice, sempre adicionando a aresta mais barata que conecta um vértice novo, parecido com Dijkstra) e Kruskal (ordena todas as arestas por peso e vai adicionando, pulando as que criariam ciclo).

**Bloco 8 (15 min): Componentes Fortemente Conectados (CFC)**

Em um grafo dirigido, um CFC é um grupo de vértices onde todos conseguem chegar em todos (por caminhos dirigidos). Pense em um grupo de amigos onde todo mundo segue todo mundo no Instagram. Algoritmo de Kosaraju: (1) faça DFS no grafo original e anote a ordem de conclusão, (2) construa o grafo transposto (inverte todas as arestas, como a função `transposta` da página 6 do PDF), (3) faça DFS no transposto seguindo a ordem de conclusão invertida. Cada árvore DFS formada no passo 3 é um CFC.

**Bloco 9 (10 min): Coloração (revisão)**

Já estava no PDF (página 14). Atribuir cores sem conflito entre vizinhos. Começar pelo vértice de maior grau. Função `achar_cor` marca quais cores os vizinhos já usam e retorna a primeira livre.

## Projeto Prático Atualizado (2h): Mapa do Campus EACH

Agora que Dijkstra entrou no escopo, o projeto fica mais rico. Você modela o campus com grafo ponderado (distâncias reais em metros entre prédios) e implementa:

Representação por lista de adjacência com campos `tipo`, `peso`, `dist`, `custo`, `via`, `P`, `flag`. Funções básicas (inicializar, inserir aresta ponderada, exibir). BFS para caminho mais curto em número de passos. Dijkstra para caminho mais barato (distância real). Encontrar tipo X mais próximo (ex: "banheiro mais perto do bloco A?"). Coloração para alocação de recursos sem conflito. Detecção de ciclos via DFS.

Eu gero o visualizador interativo em HTML e a estrutura do código C com as assinaturas das funções para você preencher. Quer que eu comece?