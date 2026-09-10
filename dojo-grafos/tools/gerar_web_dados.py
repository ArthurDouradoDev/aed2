# -*- coding: utf-8 -*-
"""
Gera os dados que o site consome, sempre a partir do proprio C.

    python tools/gerar_web_dados.py

Produz:
    web/dados/catalogo.json    catalogo, niveis e mapa do campus (--dump-json)
    web/dados/grafo.h          copia do include/grafo.h
    web/dados/stubs/*.c        esqueletos iniciais dos 7 arquivos do aluno
    web/dados/materiais/*.md   material de estudo do repositorio

Nada disso deve ser editado a mao: o C e a fonte de verdade.
"""
import json
import os
import shutil
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(RAIZ, "web")
DADOS = os.path.join(WEB, "dados")

ARQUIVOS_ALUNO = ["n1_matriz.c", "n2_lista.c", "n3_transformacoes.c",
                  "n4_profundidade.c", "n5_largura.c", "n6_ponderados.c",
                  "n7_desafios.c"]


def rodar(cmd, **kw):
    return subprocess.run(cmd, cwd=RAIZ, check=True, **kw)


def main():
    os.makedirs(DADOS, exist_ok=True)
    os.makedirs(os.path.join(DADOS, "stubs"), exist_ok=True)
    os.makedirs(os.path.join(DADOS, "materiais"), exist_ok=True)

    binario = os.path.join(RAIZ, "dojo.exe")
    print("  compilando o dojo nativo...")
    rodar(["make", "-s", "dojo.exe"])

    print("  extraindo o catalogo...")
    saida = subprocess.run([binario, "--dump-json"], cwd=RAIZ,
                           check=True, capture_output=True)
    dados = json.loads(saida.stdout.decode("utf-8"))
    if len(dados["exercicios"]) != 51 or len(dados["niveis"]) != 7:
        print("  ERRO: o catalogo veio com %d exercicios em %d niveis"
              % (len(dados["exercicios"]), len(dados["niveis"])))
        return 1
    with open(os.path.join(DADOS, "catalogo.json"), "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=1)

    print("  copiando o grafo.h...")
    shutil.copyfile(os.path.join(RAIZ, "include", "grafo.h"),
                    os.path.join(DADOS, "grafo.h"))

    print("  gerando os esqueletos...")
    rodar([sys.executable, "tools/gerar_stubs.py", "--destino",
           os.path.join(DADOS, "stubs")], capture_output=True)

    faltando = [a for a in ARQUIVOS_ALUNO
                if not os.path.exists(os.path.join(DADOS, "stubs", a))]
    if faltando:
        print("  ERRO: faltaram esqueletos: %s" % ", ".join(faltando))
        return 1

    print("  copiando o material de estudo...")
    materiais = []
    for nome, titulo in [("parte-1.md", "Grafos, parte 1"),
                         ("parte-2.md", "Grafos, parte 2"),
                         ("estudo.md",  "Roteiro de estudo")]:
        origem = os.path.join(os.path.dirname(RAIZ), nome)
        if os.path.exists(origem):
            shutil.copyfile(origem, os.path.join(DADOS, "materiais", nome))
            materiais.append({"arquivo": nome, "titulo": titulo})
    with open(os.path.join(DADOS, "materiais", "indice.json"), "w", encoding="utf-8") as f:
        json.dump(materiais, f, ensure_ascii=False, indent=1)

    print("  pronto: %d exercicios, %d locais do campus, %d material(is)."
          % (len(dados["exercicios"]), len(dados["campus"]["locais"]), len(materiais)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
