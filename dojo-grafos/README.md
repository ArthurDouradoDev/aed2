# Dojo de Grafos — ACH2024

Um sistema para você escrever **na unha**, quantas vezes quiser, todas as
implementações de grafos do caderno do Prof. Ivandré Paraboni — e comprovar,
a cada função, que ela está certa.

São **51 exercícios em 7 níveis**. Você escreve só o corpo das funções; o
resto do sistema já existe e depende do que você escrever.

```bash
cd dojo-grafos && make
```
```powershell
cd dojo-grafos; make
```

---

## A ideia

Nada aqui é decorativo. **As funcionalidades rodam em cima do seu código.**

- Os testes do nível 3 montam os grafos chamando o `inserir_aresta_l` que
  **você** escreveu no nível 2. Se ele estiver errado, o nível 3 inteiro
  desaba — por isso ele fica bloqueado até o nível 2 fechar.
- O `contar_grupos` que você escreve no nível 4 chama o `prof` que você
  escreveu dois exercícios antes.
- O app do campus (`make app`) tem 12 funcionalidades, e cada uma aparece
  **trancada** até o exercício correspondente passar. A rota mais rápida só
  funciona quando o seu Dijkstra funcionar.

Não dá para pular etapa, e não dá para "quase" acertar.

---

## Os comandos

| comando | o que faz |
|---|---|
| `make` | painel: onde você está nos 7 níveis |
| `make n1` … `make n7` | roda um nível e para no primeiro problema |
| `make n3 E=2` | roda só o exercício 3.2 |
| `make dica N=3 E=2` | dica 1: o caminho a seguir |
| `make dica N=3 E=2 G=2` | dica 2: a armadilha que derruba todo mundo |
| `make dica N=3 E=2 G=3` | dica 3: o código |
| `make app` | Campus EACH rodando com o seu código |
| `make conferir` | roda os 51 testes contra o gabarito (não toca no seu código) |
| `make novociclo` | arquiva o que você fez e recomeça do zero |
| `make limpar` | apaga binários |

O ciclo de trabalho é sempre o mesmo: `make n1` diz qual é o próximo
exercício, você abre o arquivo indicado, apaga a linha `FALTA_IMPLEMENTAR()`,
escreve o corpo da função, e roda `make n1` de novo.

---

## Os níveis

| nível | tema | exercícios | arquivo |
|---|---|---|---|
| 1 | Matriz de adjacência | 6 | `src/aluno/n1_matriz.c` |
| 2 | Lista de adjacência | 7 | `src/aluno/n2_lista.c` |
| 3 | Transformações sobre grafos | 9 | `src/aluno/n3_transformacoes.c` |
| 4 | Busca em profundidade | 8 | `src/aluno/n4_profundidade.c` |
| 5 | Fila e busca em largura | 7 | `src/aluno/n5_largura.c` |
| 6 | Ponderados: Dijkstra e coloração | 5 | `src/aluno/n6_ponderados.c` |
| 7 | Desafios da lista | 9 | `src/aluno/n7_desafios.c` |

Os níveis 1 a 6 são o **caderno inteiro**, na ordem em que o professor
apresentou. O nível 7 são os exercícios da **lista** que não têm par no
caderno.

---

## O que o Dojo detecta

Os testes não são genéricos. Cada exercício tem cenários montados para pegar
os erros que de fato acontecem nesse ponto da matéria:

- **`malloc(sizeof(no*))` em vez de `malloc(sizeof(no))`.** O Dojo mede
  quantos bytes o seu `malloc` pediu e diz exatamente o que faltou. (Isso
  funciona porque o Makefile compila os *seus* arquivos com
  `-Dmalloc=dojo_malloc`. Você escreve `malloc` normalmente; a troca é
  invisível e não muda o comportamento.)
- **`excluir_aresta_l` estourando no primeiro nó da lista**, quando `ant`
  ainda é `NULL`.
- **`zerar_flags` mexendo em `inicio` em vez de `flag`**, o que apagaria o
  grafo inteiro em silêncio — o teste confere que as arestas sobreviveram.
- **`entrar_fila` com a fila vazia** (`f->ultimo->prox` com `ultimo == NULL`),
  **rejeitando o vértice 0** (`if (!valor) return`), e **não zerando
  `f->ultimo`** quando o último elemento sai.
- **Confundir vizinho preto com ciclo**: o teste usa um diamante acíclico
  (`0->1, 0->2, 1->3, 2->3`) onde o vértice 3 é alcançado duas vezes sem que
  isso seja ciclo.
- **Usar profundidade onde só largura serve**: em `tipo_x_mais_prox` o grafo
  é montado de forma que a busca em profundidade dá a resposta errada.
- **Marcar `g[i].flag` em vez de `g[p->adj].flag`** na busca em largura.

Se o seu código **quebrar** (acesso inválido de memória, recursão infinita),
o Dojo continua de pé: cada teste roda num processo separado. Você vê
`quebrou` no lugar de `falhou`, com a lista dos culpados prováveis.

Quando um teste falha, a saída traz o cenário do grafo, o valor esperado, o
valor obtido, e — quando ajuda — o desenho das listas, da matriz ou das flags.

---

## Treinar várias vezes

Terminou os 51? `make novociclo`:

1. copia o seu `src/aluno/` para `historico/ciclo-NN-<data>/`;
2. anota o placar daquele ciclo em `historico/registro.md`;
3. regenera os esqueletos vazios.

Aí é só recomeçar. Os ciclos antigos ficam guardados para você comparar o que
melhorou de uma passada para a outra.

---

## Cobertura

**Caderno (`AED2_COO.pdf`) — 100%.** Todas as funções escritas nas 15 páginas
estão no Dojo, com a referência da página em cada exercício.

**Lista de exercícios — os 28.**

| lista | onde | | lista | onde |
|---|---|---|---|---|
| 1 | 3.4 | | 15 | 4.7 e 7.5 |
| 2 | 3.5 | | 16 | 4.3 |
| 3 | 3.6 | | 17 | 5.5 |
| 4 | 3.1 | | 18 | 6.5 |
| 5 | 3.2 | | 19 | 3.8 |
| 6 | 4.8 | | 20 | 3.9 |
| 7 | 6.4 | | 21 | 5.4 |
| 8 | 3.3 | | 22 | 7.6 |
| 9 | 3.7 | | 23 | 5.7 |
| 10 | 7.1 | | 24 | 5.6 |
| 11 | 7.2 | | 25 | 7.7 |
| 12 | 4.4 (dirigido) e 7.3 (não-dirigido) | | 26 | 7.8 |
| 13 | 7.4 | | 27 | 5.4 e 7.9 |
| 14 | 4.6 | | 28 | 7.9 |

---

## Quatro decisões que valem saber

**1. Sufixos `_m` e `_l`.** O professor chama as duas versões de
`inicializar`, `inserir_aresta` etc. Como matriz e lista convivem no mesmo
programa, o linker não aceita nomes repetidos — daí `inicializar_m` e
`inicializar_l`. **Na prova, escreva sem o sufixo.** Corpo e assinatura são
idênticos ao do caderno.

**2. `V` é 8 e é constante de compilação**, porque o professor declara as
matrizes como `int m[V][V]`. Os grafos dos testes cabem em 8 vértices.

**3. `vertices_raio_n` está corrigido.** A versão do caderno (pág. 12) aborta
a busca assim que *enxerga* um vértice distante demais, e com isso perde os
irmãos dele no mesmo nível. No Dojo, a estrutura é a mesma, mas em vez de
abortar você simplesmente não enfileira quem passaria de N. Está explicado na
dica 2 do exercício 5.6.

**4. `arvore_enraizada` segue a definição do enunciado ao pé da letra**
(dirigido + acíclico + conexo + uma única fonte). Um dos casos de teste é um
DAG onde um vértice tem dois pais: pela definição dada, isso **passa**. É
proposital — o exercício é implementar a especificação, não o palpite.

---

## Estrutura

```
dojo-grafos/
├── include/grafo.h        structs e assinaturas (leia antes de começar)
├── include/dojo.h         framework de testes
├── src/aluno/             >>> VOCÊ ESCREVE AQUI <<<
├── src/core/              painel, catálogo de exercícios, app do campus
├── src/testes/            os 51 testes
├── gabarito/              respostas (só abra depois de tentar)
├── historico/             seus ciclos anteriores
└── tools/                 geração de esqueletos, reset, utilitários
```

Só é preciso `gcc` e `make` — ambos já estão instalados aqui. O `python` é
usado apenas pelos utilitários do Makefile.
