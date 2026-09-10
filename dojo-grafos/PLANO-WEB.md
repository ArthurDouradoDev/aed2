# Dojo de Grafos na web: plano e o que foi construído

Este documento nasceu como plano de migração do Dojo de Grafos (um programa
em C de terminal) para um site estático hospedável no GitHub Pages. A
implementação está feita, e o documento foi atualizado para registrar o que
saiu diferente do plano original e por quê.

**Estado: implementado.** Ver a seção "O Dojo no navegador" do `README.md`
para o manual de uso.

---

## 1. O que precisava continuar valendo

O Dojo não é um caderno de exercícios com respostas para conferir. Ele é um
sistema real cujas funcionalidades rodam em cima do código do aluno. Três
propriedades sustentam isso, e nenhuma podia ser perdida:

1. **É C de verdade.** Os testes pegam `malloc(sizeof(no*))` medindo os bytes
   pedidos, pegam `ant == NULL` na exclusão do primeiro nó, pegam
   `g[i].flag` no lugar de `g[p->adj].flag`. Nada disso existe se o exercício
   virar JavaScript. Reescrever em outra linguagem seria treinar natação na
   areia: os movimentos são parecidos, mas o que derruba na prova (ponteiro,
   `sizeof`, memória) simplesmente não aparece.
2. **Dependência real entre níveis.** Os testes do nível 3 montam grafos
   chamando o `inserir_aresta_l` do nível 2. O campus é montado com
   `alocar_l` + `inicializar_l` + `inserir_aresta_l` do aluno.
3. **Isolamento contra código que quebra.** Recursão infinita e acesso
   inválido de memória precisam virar "quebrou", não a página travada.

As três estão de pé. E apareceu uma quarta, que o terminal nunca deu:
**ver o próprio algoritmo rodando**.

---

## 2. A decisão central, e por que ela mudou

GitHub Pages serve arquivos estáticos e nada mais. Não existe backend para
chamar `gcc`. O plano original listava três caminhos e recomendava o A:

| caminho | avaliação original |
|---|---|
| **A. Clang compilado para WebAssembly** | recomendado; download de dezenas de MB, cacheado |
| **B. Interpretador de C no próprio site** | descartado por "suporte parcial de C e diagnósticos piores" |
| **C. Compilar num serviço externo** | plano B; sai do "só GitHub Pages" |

**O que foi construído é o caminho B, e a avaliação original dele estava
errada em dois pontos.**

O que mudou a conta:

- **O subconjunto de C é pequeno e conhecido.** Não é preciso suportar C
  inteiro, só o que a matéria usa: structs, typedef, ponteiros, vetores de
  uma e duas dimensões, funções (inclusive `static` e recursivas), todos os
  comandos de controle e o conjunto completo de operadores inteiros. Isso
  cabe em um lexer, um pré-processador, um parser e um interpretador, todos
  em JavaScript puro.
- **Os diagnósticos ficaram melhores, não piores.** Este foi o ponto onde a
  previsão errou mais feio. Controlando o interpretador, dá para manter uma
  **sombra de memória byte a byte** e responder com a causa em vez de um
  segfault mudo. O `clang` em WASM entregaria o mesmo silêncio do gcc.

E o custo desapareceu: o site inteiro tem algumas centenas de KB, abre
instantâneo, roda no celular e funciona offline. Não há download de compilador,
não há build, não há dependência externa. É HTML, CSS e módulos ES.

O preço pago é real e vale declarar: **o interpretador é uma reimplementação,
e reimplementação pode divergir do compilador de verdade.** A resposta a esse
risco é a seção 6.

---

## 3. Como funciona

```
o aluno digita  ->  lexer  ->  pré-processador  ->  parser  ->  árvore
                                                                  |
                                          uma memória nova por teste
                                                                  v
   os 51 testes  ->  chamam as funções do aluno  ->  interpretador
                                                                  |
                     sombra de memória diz o que aconteceu  <-----+
```

**Memória de verdade.** Um `ArrayBuffer` faz as vezes de heap e pilha.
Ponteiros são endereços reais dentro dele; `sizeof(no)` são 20 bytes,
`sizeof(no*)` são 4. Um vetor sombra guarda, byte a byte, se aquele endereço
está alocado, se já foi escrito, se veio da pilha ou se passou por `free`.

**Isolamento.** Cada teste recebe uma memória nova, exatamente como o
subprocesso do dojo de terminal. Lixo que um exercício deixou nunca alcança o
seguinte. Laço infinito morre num limite de passos (meio segundo); recursão
sem parada morre num limite de profundidade.

**Uma folga proposital.** Depois de cada bloco do `malloc` ficam 64 bytes de
folga. Ela existe para o interpretador se comportar como o C nativo, onde
escrever além do bloco não explode na hora: o programa segue e o teste
consegue dar a mensagem boa ("seu malloc pediu 4 bytes, mas `sizeof(no)` é
20"). A diferença é que a invasão fica registrada e vira aviso, então nunca
passa despercebida.

---

## 4. Fonte única de verdade

O maior risco de longo prazo não é técnico, é de manutenção: acabar com os 51
exercícios descritos em dois lugares que divergem em três semanas.

**O C é a fonte de verdade. O site deriva dele.** Na prática:

- `main.c` ganhou `--dump-json`, que despeja `NIVEIS[]`, `CATALOGO[]` (com os
  enunciados e as três dicas) e o mapa do campus;
- `campus.c` ganhou `campus_dump_json()`, que despeja os locais, as ruas com
  os minutos e a tabela de destravamento das 12 funcionalidades;
- `tools/gerar_web_dados.py` roda o binário, copia o `include/grafo.h` de
  verdade, gera os esqueletos com o mesmo `tools/gerar_stubs.py` do
  `make novociclo` e copia o material de estudo;
- tudo isso cai em `web/dados/`, que é **gerado, nunca editado à mão**, e é
  regerado no deploy.

Exercício novo, dica corrigida ou rua nova no campus aparece no site no
próximo deploy, sem tocar em nada do front.

Os 51 testes são a única coisa que existe duas vezes: em `src/testes/*.c` e
portados em `web/js/dojo/testes.js`. Interpretar também os testes teria
exigido um pré-processador completo com macros variádicas e `va_list`, o que
dobrava a superfície de risco. A resposta a essa duplicação é, de novo, a
seção 6: o teste diferencial roda os dois lados e exige o mesmo veredito.

---

## 5. A camada lúdica: o campus que se acende

O Campus EACH virou mapa SVG com os oito locais em posições fixas (um mapa
que muda de lugar a cada desenho nunca vira memória espacial) e desenho
planar, sem rua cruzando rua.

O desenho é uma **leitura literal da `struct vertice`**: a `flag` vira a cor
do círculo (branco, cinza, preto), a `dist` vira etiqueta, a `cor` vira
preenchimento, o `tipo` vira ícone. Nada de mágica: o aluno consegue apontar
qual campo produziu qual pixel.

A progressão é a mesma do `make app`, agora visível:

- antes do nível 2, o mapa está **apagado** e o site diz por quê: é o
  `inserir_aresta_l` do aluno que constrói o grafo;
- cada uma das 12 funcionalidades acende quando o exercício de que ela
  depende passa;
- a barra de progresso do painel não é "23/51", é um campus saindo do escuro.

**Assistir ao próprio algoritmo.** Esta era a Fase 4 do plano, marcada como
opcional, e acabou saindo junto porque ficou barata: o interpretador aceita um
gravador que tira um retrato dos oito vértices sempre que `flag`, `dist` ou
`cor` mudam, guardando a linha do arquivo do aluno que causou a mudança.
A linha do tempo reproduz os quadros com o mapa mudando e a linha do código
destacada. A onda concêntrica da busca em largura sai do papel.

---

## 6. Por que dá para confiar (a resposta ao risco da seção 2)

Três provas, todas rodando no `make testes-tudo` e no deploy:

**1. Suíte (`web/teste/suite.js`).** Os 51 testes contra o gabarito precisam
dar "ok"; contra os esqueletos vazios precisam dar "a fazer". Mais uma bateria
de erros plantados conferindo que o diagnóstico é o certo.

**2. Teste diferencial (`web/teste/diferencial.js`).** Este é o que sustenta
tudo. Vinte e cinco erros que aluno comete de verdade, cada um rodado nos
**51 exercícios com o gcc e com o interpretador**, comparando os dois
vereditos. São 1326 comparações por execução. O contrato verificado:

- o site **nunca aprova** um exercício que o gcc reprova (nada de falso
  verde, o pior defeito possível num dojo);
- o site **nunca deixa passar** um erro que o gcc pega;
- onde os dois divergem, é **comportamento indefinido em C** e o site é o mais
  rigoroso dos dois. Esses casos são declarados um a um nas mutações: ler
  memória não inicializada, usar memória depois do `free`, escrever além do
  bloco. O gcc às vezes aprova por sorte (o lixo calhou de ser zero, o chunk
  liberado ainda tinha o conteúdo antigo); o interpretador percebe sempre.

**3. Teste de navegador (`web/teste/navegador.mjs`).** Chromium de verdade:
escreve código no editor, roda o nível, confere as mensagens de erro, abre o
campus, assiste à animação, exporta o zip, mede a tela do celular e falha se
houver qualquer erro no console.

### Dois defeitos reais que esses testes encontraram

O trabalho de garantir fidelidade acabou encontrando problemas no dojo de
terminal, e os dois foram corrigidos no C:

- **O painel mostrava 0/51 no Linux e no macOS.** O `system()` montava o
  comando com as aspas duplas extras do `cmd` do Windows, que o `sh` não
  aceita. Só o Windows funcionava.
- **O teste 5.4 não pegava o que dizia pegar.** O comentário promete que ali
  "a profundidade daria a resposta errada", mas, como `inserir_aresta_l`
  insere na cabeça, a ordem das arestas fazia a profundidade acertar por
  acaso. Trocando a ordem de inserção, o teste passou a cumprir a promessa.

---

## 7. Levar o trabalho de um lado para o outro

Sem servidor, o estado mora no navegador:

- **automático:** `localStorage` guarda os 7 arquivos, o placar, o ciclo e o
  histórico, salvando a cada pausa de digitação;
- **exportar/importar:** o botão gera um `.zip` com `src/aluno/` no formato
  exato que o `Makefile` espera (é só descompactar por cima e rodar
  `make n3`); a volta aceita `.zip`, `.c` soltos ou o backup `.json`;
- **novo ciclo:** o equivalente ao `make novociclo`, arquivando no histórico.

Aviso que fica visível na interface: limpar os dados do navegador apaga o que
não foi exportado.

O plano previa também sincronia por gist com token pessoal. **Ficou de fora**,
de propósito: é a única parte do projeto que lidaria com credencial, e o zip
resolve o caso real (trocar de máquina) sem esse risco.

---

## 8. Celular, e a verdade sobre teclado

Escrever C de ponteiro num teclado de celular é sofrimento, e fingir o
contrário seria vender uma promessa que o projeto não cumpre. A postura, que
se manteve do plano:

- **notebook e tablet com teclado:** experiência completa, é o alvo principal;
- **celular:** modo leitura de primeira classe (progresso, mapa, enunciados,
  dicas, revisar o código, assistir às animações), com edição possível e
  ajudada por uma barra de símbolos (`{ } ( ) [ ] ; * -> =`), mas sem fingir
  que é confortável.

Na prática: navegação no rodapé onde o polegar alcança, nenhuma rolagem
horizontal, e o teste de navegador mede isso a cada execução.

---

## 9. O que não foi feito

Vale registrar o que ficou fora, para ninguém procurar:

- **sincronia por gist** (seção 7), por causa do token;
- **interpretar também os testes em C** (seção 4), por causa do custo de um
  pré-processador completo; a duplicação é coberta pelo teste diferencial;
- **`float` e `double`**: o interpretador recusa com uma mensagem explícita.
  A matéria de grafos é inteira em inteiros e ponteiros;
- **`goto`**: recusado com mensagem, e não cai na prova.

---

## 10. Estrutura final

```
dojo-grafos/
├── include/, src/, gabarito/    o dojo de terminal, praticamente intocado
│   └── src/core/main.c          + --dump-json  (e o conserto do system())
├── tools/gerar_web_dados.py     gera web/dados/ a partir do C
└── web/
    ├── index.html, css/, sw.js, manifest.webmanifest
    ├── js/c/                    lexer, pré-processador, parser, tipos,
    │                            memória e interpretador de C
    ├── js/dojo/                 runtime de testes, os 51 testes, motor,
    │                            Campus EACH
    ├── js/ui/                   editor, mapa SVG, markdown, zip, storage
    ├── dados/                   GERADO -- catálogo, grafo.h, esqueletos,
    │                            material de estudo
    └── teste/                   suíte, mutações, diferencial, navegador
```

O dojo de terminal continua funcionando como sempre. O site é mais um
consumidor do mesmo C, não um fork.
