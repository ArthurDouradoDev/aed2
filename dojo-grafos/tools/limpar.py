# -*- coding: utf-8 -*-
"""Apaga binarios e objetos, sem tocar no seu codigo."""
import os
import shutil

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

for nome in ("dojo.exe", "dojo", "dojo_gabarito.exe", "dojo_gabarito"):
    p = os.path.join(RAIZ, nome)
    if os.path.exists(p):
        os.remove(p)
        print("  removido: %s" % nome)

build = os.path.join(RAIZ, "build")
if os.path.isdir(build):
    shutil.rmtree(build)
    print("  removido: build/")
