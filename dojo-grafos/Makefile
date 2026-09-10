# ============================================================================
#  Dojo de Grafos -- ACH2024
#
#    make            painel de progresso
#    make n1 .. n7   roda os testes de um nivel
#    make n3 E=2     roda so um exercicio do nivel
#    make dica N=3 E=2 [G=2]   dica progressiva (G vai de 1 a 3)
#    make app        abre o Campus EACH rodando com o SEU codigo
#    make conferir   roda a suite contra o gabarito (nao mexe no seu codigo)
#    make novociclo  arquiva o que voce fez e recomeca do zero
#    make limpar
# ============================================================================

CC      = gcc
CFLAGS  = -Iinclude -Wall -O0 -g
PY      = python

CORE    = src/core/dojo.c src/core/apoio.c src/core/catalogo.c \
          src/core/campus.c src/core/main.c
TESTES  = src/testes/testes_n1n2.c src/testes/testes_n3n4.c \
          src/testes/testes_n5n6.c src/testes/testes_n7.c

ALUNO   = $(wildcard src/aluno/*.c)
GABAR   = $(wildcard gabarito/*.c)

OBJ_ALUNO = $(patsubst src/aluno/%.c,build/al_%.o,$(ALUNO))
OBJ_GABAR = $(patsubst gabarito/%.c,build/gb_%.o,$(GABAR))

EXE     = dojo.exe
EXE_GAB = dojo_gabarito.exe

G ?= 1

# ---------------------------------------------------------------------------
.PHONY: painel n1 n2 n3 n4 n5 n6 n7 dica app conferir novociclo limpar ajuda

painel: $(EXE)
	@$(PY) tools/run.py $(EXE)

n1: $(EXE)
	@$(PY) tools/run.py $(EXE) 1 $(E)
n2: $(EXE)
	@$(PY) tools/run.py $(EXE) 2 $(E)
n3: $(EXE)
	@$(PY) tools/run.py $(EXE) 3 $(E)
n4: $(EXE)
	@$(PY) tools/run.py $(EXE) 4 $(E)
n5: $(EXE)
	@$(PY) tools/run.py $(EXE) 5 $(E)
n6: $(EXE)
	@$(PY) tools/run.py $(EXE) 6 $(E)
n7: $(EXE)
	@$(PY) tools/run.py $(EXE) 7 $(E)

dica: $(EXE)
	@$(PY) tools/run.py $(EXE) dica $(N) $(E) $(G)

app: $(EXE)
	@$(PY) tools/run.py $(EXE) app

conferir: $(EXE_GAB)
	@$(PY) tools/run.py $(EXE_GAB)

# ---------------------------------------------------------------------------
$(EXE): $(OBJ_ALUNO) $(CORE) $(TESTES) include/grafo.h include/dojo.h
	@$(CC) $(CFLAGS) $(CORE) $(TESTES) $(OBJ_ALUNO) -o $(EXE)

$(EXE_GAB): $(OBJ_GABAR) $(CORE) $(TESTES) include/grafo.h include/dojo.h
	@$(CC) $(CFLAGS) $(CORE) $(TESTES) $(OBJ_GABAR) -o $(EXE_GAB)

# O -Dmalloc troca malloc por dojo_malloc SO nos arquivos de implementacao,
# para o Dojo conseguir medir quantos bytes voce pediu (pega o classico
# malloc(sizeof(no*))). Voce continua escrevendo malloc normalmente.
build/al_%.o: src/aluno/%.c include/grafo.h include/dojo.h
	@$(PY) -c "import os;os.makedirs('build',exist_ok=True)"
	@$(CC) $(CFLAGS) -Dmalloc=dojo_malloc -c $< -o $@

build/gb_%.o: gabarito/%.c include/grafo.h include/dojo.h
	@$(PY) -c "import os;os.makedirs('build',exist_ok=True)"
	@$(CC) $(CFLAGS) -Dmalloc=dojo_malloc -c $< -o $@

# ---------------------------------------------------------------------------
novociclo:
	@$(PY) tools/novociclo.py

limpar:
	@$(PY) tools/limpar.py

ajuda:
	@$(PY) tools/run.py --ajuda
