# Plano: Dojo de Grafos na web

Documento de planejamento para transformar o Dojo de Grafos (hoje um programa
em C rodando no terminal) em um site estático hospedado no GitHub Pages, sem
servidor, acessível de qualquer lugar.

Status: proposta. Nada implementado ainda.

---

## 1. O que precisa continuar valendo

O Dojo atual não é um caderno de exercícios com respostas para conferir. Ele é
um sistema real cujas funcionalidades rodam em cima do código do aluno. Três
propriedades sustentam isso, e nenhuma pode ser perdida na versão web:

1. **É C de verdade.** Os testes pegam `malloc(sizeof(no*))` medindo os bytes
   pedidos, pegam `ant == NULL` na exclusão do primeiro nó da lista, pegam
   `g[i].flag` no lugar de `g[p->adj].flag`. Nada disso existe se o exercício
   virar JavaScript. Reescrever em outra linguagem seria como treinar natação
   na areia: os movimentos são parecidos, mas o que derruba o aluno na prova
   (ponteiro, `sizeof`, memória) simplesmente não aparece.
2. **Dependência real entre níveis.** Os testes do nível 3 montam grafos
   chamando o `inserir_aresta_l` que o aluno escreveu no nível 2. O campus é
   montado com `alocar_l` + `inicializar_l` + `inserir_aresta_l` do aluno.
3. **Isolamento contra código que quebra.** Recursão infinita e acesso
   inválido de memória precisam virar "quebrou", não a página travada.

A versão web precisa das três. E ganha uma quarta: **ver o próprio algoritmo
rodando**, que é justamente a parte que o terminal não dá.

---

## 2. A decisão central: compilar C dentro do navegador

GitHub Pages serve arquivos estáticos e nada mais. Não existe backend para
chamar `gcc`. Só sobram três caminhos, e a escolha define o projeto inteiro.

| caminho | o que custa | o que se perde |
|---|---|---|
| **A. Clang compilado para WebAssembly, rodando no navegador** | download inicial pesado (na casa das dezenas de MB, cacheado depois) | nada de essencial |
| **B. Interpretador C pequeno em WASM** (estilo chibicc/picoc portado) | download leve (~1 MB), mas suporte parcial de C e diagnósticos piores | precisão do compilador, mensagens de erro boas, confiança |
| **C. Compilar em um serviço externo** (Cloudflare Worker gratuito) | sai do "só GitHub Pages", precisa de conta e deploy separado, latência de rede, e não funciona offline | autonomia do projeto |

**Recomendação: caminho A**, com o caminho C guardado como plano B caso o
spike da Fase 0 mostre que o peso é inviável.

O raciocínio: o download grande acontece uma vez. Depois disso o compilador
mora no cache do navegador e o site abre offline. É o mesmo trade que uma
instalação de programa, só que sem instalar nada. E é o único caminho que
mantém as três propriedades da seção 1 intactas.

### 2.1 Como funciona na prática

```
┌─ navegador ────────────────────────────────────────────────┐
│                                                            │
│  aba principal (UI)                                        │
│    editor de código, mapa do campus, painel de progresso    │
│         │  postMessage                                     │
│         ▼                                                  │
│  Worker "compilador"                                       │
│    clang.wasm  : n1_matriz.c  ->  n1_matriz.o              │
│    wasm-ld     : *.o + libdojo.a  ->  dojo.wasm            │
│         │                                                  │
│         ▼                                                  │
│  Worker "execução"  (um worker novo por teste)             │
│    instancia dojo.wasm, chama dojo_roda(indice)            │
│    trap de memória  -> "quebrou"                           │
│    passou do tempo  -> worker.terminate() -> "quebrou"     │
└────────────────────────────────────────────────────────────┘
```

O `libdojo.a` é a parte que **não** muda: núcleo, catálogo, os 51 testes e os
utilitários de diagnóstico, já compilados para WASM na CI e versionados no
site. O navegador só compila os 7 arquivos do aluno, que são pequenos. Isso
transforma cada `make n3` em algo na casa de um a dois segundos, não trinta.

### 2.2 Isolamento: melhor do que o `fork` de hoje

Hoje o Dojo roda cada teste num subprocesso via `system()` e lê o código de
saída. Na web isso fica **mais** limpo, não menos:

- **Acesso inválido de memória** vira um trap do WASM, que chega ao JavaScript
  como uma exceção normal. Nada de sinal, nada de `setjmp`.
- **Recursão infinita** estoura a pilha do WASM, que também é trap.
- **Laço infinito** não é trap, mas o worker é descartável: `terminate()` depois
  de N segundos e pronto. Isso funciona sem `SharedArrayBuffer`, o que importa
  porque o GitHub Pages não manda os cabeçalhos COOP/COEP necessários para SAB.
- **Instância nova por teste** garante que memória suja de um exercício não
  contamina o seguinte, exatamente como o subprocesso faz hoje.

Um ponto honesto: no WASM o endereço 0 é memória válida, então
`p->adj` com `p == NULL` pode **não** dar trap, ao contrário do nativo. Mitigação
planejada: fazer o `dojo_malloc` (que já existe e já é interceptado via
`-Dmalloc=dojo_malloc`) reservar os primeiros KB da heap como zona proibida
preenchida com um padrão sentinela, e o harness conferir o padrão depois de
cada teste. Não é tão bom quanto uma page fault, mas pega a maioria dos casos e
dá uma mensagem melhor do que um segfault genérico ("você desreferenciou NULL
em algum ponto entre X e Y").

---

## 3. Fonte única de verdade

O maior risco de longo prazo não é técnico, é de manutenção: acabar com os 51
exercícios descritos em dois lugares (o `catalogo.c` e um JSON do site) que
divergem em três semanas.

**Regra do projeto: o C é a fonte de verdade. O site deriva dele, nunca o
contrário.**

Implementação:

1. Adicionar ao `main.c` um modo `--dump-json` que imprime `NIVEIS[]` e
   `CATALOGO[]` (nível, número, nome, assinatura, enunciado, referência, as 3
   dicas) como JSON.
2. A CI roda o binário nativo com esse modo e gera `web/public/catalogo.json`.
3. A CI também roda `tools/gerar_stubs.py` para gerar os esqueletos iniciais dos
   7 arquivos do aluno, que o site usa como estado inicial do editor.
4. A CI compila `src/core/*.c` + `src/testes/*.c` para `libdojo.a` (WASM).

Consequência boa: qualquer exercício novo, dica nova ou correção de enunciado
feita no C aparece no site no próximo deploy, sem tocar em nada do front. O
site e o dojo local nunca podem discordar porque são o mesmo código.

O `campus.c` e o `main.c` atuais são interface de terminal e **não** entram no
`libdojo.a`. A lógica deles (quais exercícios destravam quais funcionalidades,
quais são os trechos e tipos do campus) migra para dados: um
`web/public/campus.json` gerado a partir das mesmas tabelas, para não duplicar
o mapa.

---

## 4. A camada lúdica: o Campus EACH que se acende

Aqui está a parte que o terminal nunca vai dar, e é o motivo mais forte para
fazer a versão web.

### 4.1 A metáfora

O campus começa **apagado**. Um mapa noturno com oito prédios escuros, sem
caminhos desenhados entre eles, e um painel lateral de doze funcionalidades
todas trancadas. À medida que os exercícios passam, o campus literalmente
ganha vida:

- **Nível 1 e 2 (estruturas):** os prédios aparecem, e depois as ruas entre
  eles são desenhadas. É a planta baixa sendo construída. Antes do nível 2
  fechar não existe mapa nenhum, porque é o `inserir_aresta_l` do aluno que
  monta o grafo (isso já é verdade hoje, só que invisível).
- **Nível 3 (transformações):** aparece o botão de inverter o mapa, o
  complemento, o subgrafo. Cada transformação anima os arcos girando ou
  aparecendo.
- **Nível 4 (profundidade):** os prédios ganham as cores branco / cinza / preto
  e a busca é animada passo a passo. A simulação de interdição fecha um prédio
  e o campus se parte em pedaços coloridos na tela.
- **Nível 5 (largura):** a onda concêntrica. A BFS saindo da Portaria pinta
  anéis de distância 1, 2, 3. É aqui que a diferença entre profundidade e
  largura para de ser abstrata.
- **Nível 6 (ponderados):** as ruas ganham espessura proporcional aos minutos,
  e o Dijkstra acende a rota mais rápida em verde. A coloração vira uma grade
  de horários colorida de verdade.
- **Nível 7 (desafios):** as funcionalidades finais, incluindo rotas evitando
  um local interditado.

A barra de progresso não é "23/51". É um mapa que sai do escuro. A diferença é
a mesma entre ver o saldo da poupança e ver a casa sendo construída.

### 4.2 Como o mapa é desenhado

SVG, não canvas. São 8 vértices e no máximo algumas dezenas de arestas, então
performance não é problema, e SVG dá de graça: transições CSS, elementos
clicáveis, acessibilidade e um DOM inspecionável quando algo estiver errado.

Posições dos 8 locais fixas e desenhadas à mão (não force-directed): um mapa de
campus precisa ser **o mesmo** toda vez para o aluno criar memória espacial. Se
o layout dança a cada render, ele nunca aprende que o Bandejão fica ao lado da
Biblioteca.

Os estados visuais de um vértice mapeiam direto nos campos da struct que o aluno
já conhece: `flag` vira cor da borda (branco / cinza / preto), `dist` vira um
número na etiqueta, `cor` vira preenchimento, `tipo` vira ícone. Ou seja, o
desenho é uma leitura literal da `struct vertice`. Nada de mágica: o aluno
consegue apontar qual campo produziu qual pixel.

### 4.3 Ver o próprio algoritmo rodando (o diferencial)

Isso é a Fase 4 e é opcional, mas é a maior vantagem do formato web.

A ideia: depois de um teste passar, o aluno pode apertar "assistir" e ver a
**sua** função executando passo a passo sobre o mapa do campus.

Mecanismo proposto, do mais simples ao mais completo:

- **Nível 1 de trace (barato):** o `wasm-ld` aceita `--wrap=prof`. Isso permite
  interceptar as chamadas às funções do próprio aluno sem tocar no código dele.
  A cada entrada e saída de `prof`, `largura_l`, `entrar_fila`, `sair_fila`, o
  host tira um retrato do grafo (as 8 structs `vertice` mais as listas) lendo a
  memória linear do WASM direto do JavaScript. O resultado é uma sequência de
  quadros que a linha do tempo reproduz.
- **Nível 2 de trace (mais fino):** compilar os arquivos do aluno com
  `-finstrument-functions` para pegar entrada e saída de toda função, montando
  a árvore de recursão completa. Útil principalmente para o nível 4: ver a
  recursão da busca em profundidade descendo e voltando explica sozinha por que
  cinza e preto são coisas diferentes.

Ler a memória do WASM a partir do JS é direto: `instance.exports.memory.buffer`
é um `ArrayBuffer` comum, e o layout da `struct vertice` é conhecido (basta
exportar os offsets a partir do C com `offsetof` para não chutar).

### 4.4 Quando algo falha

A saída de erro atual já é excelente (cenário, esperado, obtido, desenho das
listas). Na web ela ganha:

- o **cenário do teste desenhado no mesmo mapa**, com o grafo esperado e o
  grafo obtido lado a lado, e as arestas divergentes destacadas;
- os erros do clang ancorados na linha certa do editor;
- as três dicas atrás de um botão que se abre progressivamente, como já é hoje
  com `make dica G=1,2,3`. A progressão precisa continuar custando um clique
  consciente, senão vira resposta pronta.

---

## 5. Progresso, persistência e ida e volta com o dojo local

Sem servidor, o estado mora no navegador. Três camadas:

1. **Automático:** `localStorage` (ou IndexedDB, se o volume crescer) guarda os
   7 arquivos do aluno, o status dos 51 exercícios, o ciclo atual e o histórico.
   Salva a cada pausa de digitação. É a rede de segurança contra fechar a aba.
2. **Exportar / importar:** um botão gera um `.zip` com a pasta `src/aluno/`
   exatamente no formato que o `make` local espera, e outro botão aceita esse
   zip de volta. Assim, o que foi escrito no ônibus continua no PC e vice-versa,
   e o repositório continua sendo o mesmo projeto, não dois.
3. **Sincronia opcional via GitHub Gist:** com um token pessoal que o aluno cola
   e que nunca sai do `localStorage`, o site salva o progresso num gist privado.
   Isso resolve trocar de dispositivo sem carregar zip na mão. É opcional e fica
   por último, porque envolve token e merece cuidado.

O `make novociclo` vira um botão "novo ciclo" com a mesma semântica: arquiva o
ciclo atual no histórico local, registra o placar, e regenera os esqueletos.

**Aviso a colocar na interface:** limpar dados do navegador apaga tudo o que não
foi exportado. Vale um lembrete discreto e persistente enquanto houver trabalho
não exportado.

---

## 6. Celular, tablet e a verdade sobre teclado

Escrever C de ponteiro num teclado de celular é sofrimento. Fingir que não é
seria vender uma promessa que o projeto não cumpre. Postura proposta:

- **Notebook e tablet com teclado:** experiência completa, é o alvo principal.
- **Celular:** modo leitura de primeira classe. Ver o progresso, ver o mapa do
  campus, reler enunciados e dicas, revisar o código já escrito, assistir às
  animações dos algoritmos. Editar é possível mas não é o foco.

Concretamente isso significa: layout responsivo de verdade, o mapa e o painel
funcionando bem em tela estreita, e o editor colapsável em vez de espremido.

Editor: **CodeMirror 6** com `@codemirror/lang-cpp`. Leve (centenas de KB, não
megabytes), funciona em toque, e o realce de C é suficiente. O Monaco daria
autocomplete melhor, mas pesa demais para um site cujo orçamento de download já
está comprometido com o compilador.

---

## 7. Hospedagem e CI

- Site estático publicado por GitHub Actions no GitHub Pages, a partir de um
  workflow que roda a cada push na branch principal.
- O job de build: compila o dojo nativo, gera `catalogo.json` e os stubs, roda
  `make conferir` para garantir que os 51 testes continuam passando contra o
  gabarito (regressão), compila `libdojo.a` para WASM, empacota o front e
  publica.
- Os artefatos do clang em WASM ficam versionados no repositório ou baixados de
  uma release fixada. Nunca de um CDN de terceiros sem versão travada: se o
  compilador mudar sozinho debaixo do projeto, os erros ficam impossíveis de
  reproduzir.
- **Service worker** para cache do compilador e do `libdojo.a`, com o site
  funcionando offline depois da primeira visita. O download inicial pesado
  precisa de um botão explícito, com barra de progresso e o tamanho declarado
  antes de começar. Ninguém deve descobrir um download de dezenas de MB pelo
  consumo de dados no fim do mês.

---

## 8. Riscos e o que fazer com cada um

| risco | probabilidade | plano |
|---|---|---|
| Clang em WASM pesado ou instável demais | média | Fase 0 é exatamente o spike para descobrir isso antes de construir qualquer outra coisa. Se falhar: plano B é o caminho C da seção 2 (compilar num Worker gratuito da Cloudflare), que preserva C de verdade e sacrifica só o "puramente estático" |
| Versão do clang do build (CI) incompatível com a do navegador na hora de linkar | média | travar a **mesma** versão nos dois lados, declarada num único arquivo de configuração, e um teste de CI que faz o link de ponta a ponta |
| `NULL` não dando trap no WASM | alta (é certo) | zona sentinela no `dojo_malloc`, conforme 2.2. Documentar a limitação em vez de escondê-la |
| Catálogo do site divergir do C | alta se nada for feito | a regra da seção 3 existe só por causa disso. Gerar, nunca escrever à mão |
| Escopo do campus visual crescer sem fim | alta | o campus visual é Fase 3, e só começa depois da Fase 2 estar fechada e utilizável. O site precisa já servir para estudar antes de ficar bonito |
| Perda de progresso por limpeza de navegador | média | export em zip desde a Fase 2, não no fim |

---

## 9. Roadmap

Cada fase termina em algo que dá para usar. Nada de fase que só entrega
infraestrutura invisível.

### Fase 0: spike do compilador (o portão)
Não construir mais nada antes disso responder sim.
- Provar, num HTML solto, que dá para: compilar um `.c` no navegador, linkar
  com um `libdojo.a` pré-compilado na CI, rodar e ler o resultado.
- Medir: tamanho do download, tempo do primeiro load, tempo de recompilar um
  arquivo do aluno.
- Provar que um acesso inválido de memória vira exceção capturável e que um
  laço infinito é interrompido por `terminate()`.
- **Entregável:** um relatório curto com os números e a decisão entre caminho A
  e caminho C. Tudo depois disso pressupõe essa resposta.

### Fase 1: o dojo funcionando na web
- `--dump-json` no C, geração do catálogo e dos stubs na CI.
- `libdojo.a` compilado na CI.
- Editor com os 7 arquivos, compilação, execução dos 51 testes, painel de
  progresso, saída de erro fiel à do terminal, as 3 dicas progressivas.
- **Entregável:** dá para fazer os 51 exercícios do celular ou de qualquer
  máquina emprestada. Feio, mas completo e correto.

### Fase 2: não perder trabalho
- Persistência automática, export/import do zip compatível com o `make` local,
  novo ciclo, histórico.
- Deploy no GitHub Pages com service worker e cache offline.
- **Entregável:** o site substitui o PC de verdade, com ida e volta segura.

### Fase 3: o campus se acende
- Mapa SVG dos 8 locais, estados visuais lidos da `struct vertice`.
- As 12 funcionalidades destravando conforme os exercícios, agora visualmente.
- A progressão do escuro para o campus iluminado.
- **Entregável:** a parte lúdica que motiva voltar amanhã.

### Fase 4: assistir ao próprio algoritmo
- Trace por `--wrap` nas funções de entrada, retratos da memória, linha do tempo
  com play, pause e passo a passo.
- Começar pelo nível 5 (a onda da busca em largura), que é onde a animação
  ensina mais por unidade de esforço.
- **Entregável:** a ferramenta didática que o terminal jamais teve.

### Fase 5: acabamento
- Responsividade fina, acessibilidade (contraste, teclado, leitor de tela nos
  estados do mapa), atalhos, tema claro e escuro, textos de erro revisados.

---

## 10. Estrutura de pastas proposta

```
dojo-grafos/
├── include/            (inalterado, compartilhado entre nativo e web)
├── src/                (inalterado; main.c ganha --dump-json)
├── gabarito/           (inalterado)
├── tools/              (inalterado; ganha o script de build wasm)
├── web/
│   ├── src/
│   │   ├── ui/         painel, editor, saída de testes
│   │   ├── campus/     mapa SVG, animações, linha do tempo
│   │   ├── runtime/    workers de compilação e execução, shim WASI
│   │   └── storage/    localStorage, zip, gist
│   ├── public/
│   │   ├── catalogo.json     GERADO, não editar
│   │   ├── campus.json       GERADO, não editar
│   │   ├── stubs/            GERADO, não editar
│   │   └── wasm/             libdojo.a + artefatos do clang
│   └── index.html
└── .github/workflows/deploy.yml
```

O dojo local continua funcionando exatamente como hoje. A versão web é um
consumidor a mais do mesmo C, não um fork.

---

## 11. Decisões que ainda precisam da sua palavra

1. **Nome e endereço do site.** Sugestão: publicar em
   `https://<usuario>.github.io/aed2/` ou mover o dojo para um repositório
   próprio. Repositório próprio deixa o Pages mais limpo, mas separa o dojo dos
   materiais de estudo (`parte-1.md`, `parte-2.md`) que hoje moram juntos.
2. **Os materiais de estudo entram no site?** Os dois markdown grandes de estudo
   caem bem como uma aba de consulta ao lado do editor, e isso é barato de
   fazer na Fase 1. Vale decidir cedo porque muda o layout.
3. **Sincronia por gist:** entra ou fica de fora? Adiciona conveniência real e
   também a única parte do projeto que lida com credencial.
4. **Prioridade entre Fase 3 e Fase 4** caso o tempo aperte: campus bonito ou
   algoritmo animado? A recomendação é campus primeiro (motiva mais no dia a
   dia), mas a animação ensina mais.
