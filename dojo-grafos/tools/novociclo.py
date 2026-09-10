# -*- coding: utf-8 -*-
"""
Fecha o ciclo de treino atual e comeca outro do zero.

  1. copia src/aluno/ para historico/ciclo-NN-<data>/
  2. anota no historico/registro.md quanto voce acertou neste ciclo
  3. regenera os esqueletos vazios em src/aluno/

O objetivo e poder refazer as mesmas implementacoes varias vezes e
enxergar a evolucao entre um ciclo e outro.
"""
import datetime
import os
import re
import shutil
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALUNO = os.path.join(RAIZ, "src", "aluno")
HIST = os.path.join(RAIZ, "historico")
REGISTRO = os.path.join(HIST, "registro.md")


def placar():
    """Roda o dojo e extrai a linha TOTAL. Devolve (feitos, total) ou None."""
    exe = os.path.join(RAIZ, "dojo.exe")
    if not os.path.exists(exe):
        exe = os.path.join(RAIZ, "dojo")
    if not os.path.exists(exe):
        return None
    try:
        saida = subprocess.check_output([exe], cwd=RAIZ,
                                        stderr=subprocess.STDOUT).decode("utf-8", "replace")
    except Exception:
        return None
    m = re.search(r"TOTAL: (\d+) de (\d+)", saida)
    return (int(m.group(1)), int(m.group(2))) if m else None


def proximo_numero():
    os.makedirs(HIST, exist_ok=True)
    maior = 0
    for nome in os.listdir(HIST):
        m = re.match(r"ciclo-(\d+)", nome)
        if m:
            maior = max(maior, int(m.group(1)))
    return maior + 1


def main():
    if not os.path.isdir(ALUNO):
        print("  src/aluno/ nao existe. Rode: python tools/gerar_stubs.py")
        return 1

    tem_codigo = any(f.endswith(".c") for f in os.listdir(ALUNO))
    if not tem_codigo:
        print("  nao ha nada em src/aluno/ para arquivar.")
    else:
        n = proximo_numero()
        data = datetime.date.today().isoformat()
        destino = os.path.join(HIST, "ciclo-%02d-%s" % (n, data))
        shutil.copytree(ALUNO, destino)

        p = placar()
        os.makedirs(HIST, exist_ok=True)
        if not os.path.exists(REGISTRO):
            with open(REGISTRO, "w", encoding="utf-8") as f:
                f.write("# Historico de ciclos\n\n"
                        "Cada linha e uma passada completa pelas implementacoes.\n\n"
                        "| ciclo | data | placar | pasta |\n"
                        "|---|---|---|---|\n")
        with open(REGISTRO, "a", encoding="utf-8") as f:
            marca = "%d/%d" % p if p else "nao medido"
            f.write("| %d | %s | %s | `%s` |\n"
                    % (n, data, marca, os.path.basename(destino)))

        print("  ciclo %d arquivado em historico/%s" % (n, os.path.basename(destino)))
        if p:
            print("  placar deste ciclo: %d de %d" % p)

    ger = os.path.join(RAIZ, "tools", "gerar_stubs.py")
    subprocess.call([sys.executable, ger, "--forcar"], cwd=RAIZ)
    print("\n  tudo zerado. comece de novo com: make n1\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
