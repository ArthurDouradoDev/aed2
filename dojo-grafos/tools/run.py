# -*- coding: utf-8 -*-
"""Executa o binario do Dojo. Existe para o Makefile funcionar igual
   no PowerShell, no cmd e no bash."""
import os
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

AJUDA = """
  Dojo de Grafos -- comandos

    make                       painel de progresso
    make n1 ... make n6        roda os testes de um nivel
    make n3 E=2                roda so o exercicio 2 do nivel 3
    make dica N=3 E=2          dica 1 do exercicio 3.2
    make dica N=3 E=2 G=3      dica 3 (mostra o codigo)
    make app                   Campus EACH rodando com o SEU codigo
    make conferir              roda a suite contra o gabarito
    make novociclo             arquiva o que voce fez e recomeca do zero
    make limpar                apaga os binarios
"""


def main():
    args = sys.argv[1:]
    if not args or args[0] == "--ajuda":
        print(AJUDA)
        return 0
    alvo = args[0]
    caminho = os.path.join(RAIZ, alvo)
    if not os.path.exists(caminho) and os.path.exists(caminho + ".exe"):
        caminho += ".exe"
    if not os.path.exists(caminho):
        print("  binario nao encontrado: %s" % alvo)
        return 1
    resto = [a for a in args[1:] if a != ""]
    return subprocess.call([caminho] + resto, cwd=RAIZ)


if __name__ == "__main__":
    sys.exit(main())
