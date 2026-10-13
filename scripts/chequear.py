#!/usr/bin/env python3
"""Chequeos de la web antes de pasar un cambio a main.

Uso (desde la raiz del repo, parado en la rama del cambio):

    python3 scripts/chequear.py              # compara contra origin/main
    python3 scripts/chequear.py --base main  # contra otra referencia

Hace dos cosas:

1. Chequeos generales sobre todas las paginas (tambien las nuevas): HTML
   que abre y cierra, title/description/canonical, archivos locales que
   existan, formularios apuntando a webhooks y tokens conocidos, etiquetas de
   Google Ads y Meta en las paginas con formulario, sitemap, secretos.
2. Compara lo PROTEGIDO de cada pagina que ya existia en la base (webhooks,
   tokens, data-formulario, nombres de campos, valores de los select,
   etiquetas, noscript, robots, canonical) y avisa si algo cambio. Un cambio
   protegido no es necesariamente un error, pero tiene que aprobarse a
   sabiendas: rompe la carga de leads en n8n/Bitrix sin avisar.

Sale con codigo 1 si hay ERRORES. Los AVISOS no frenan.
"""
from __future__ import annotations

import argparse
import html.parser
import os
import re
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

WEBHOOKS = {
    "https://diegooabanto.app.n8n.cloud/webhook/home-boxer",
    "https://diegooabanto.app.n8n.cloud/webhook/clases-ia-boxer",
    "https://diegooabanto.app.n8n.cloud/webhook/landing-alta-intencion",
    "https://diegooabanto.app.n8n.cloud/webhook/boxer-cerac",
}
TOKENS = {"boxer-home-2026", "boxer-clases-ia-2026", "boxer-landing-casas-de-repuestos-2026"}
GOOGLE_ADS_ID = "AW-432396317"
META_PIXEL_ID = "1084727415780829"
# Paginas viejas que no siguen el estandar actual: solo se chequea que no cambien.
LEGADO = {"cerac-locro-2026.html"}

SECRETOS = [
    (r"bitrix24\.[a-z.]+/rest/\d+/[A-Za-z0-9]+", "URL de webhook REST de Bitrix (lleva token)"),
    (r"ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}", "token de GitHub"),
    (r"\bsk-(ant-)?[A-Za-z0-9_-]{20,}", "clave de API"),
    (r"AKIA[0-9A-Z]{16}", "clave de AWS"),
    (r"\"nodes\"\s*:\s*\[.*\"connections\"", "export de un flujo de n8n"),
]

errores: list[str] = []
avisos: list[str] = []
protegidos: list[str] = []


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=RAIZ, capture_output=True, text=True).stdout


def leer(ruta: str) -> str:
    with open(os.path.join(RAIZ, ruta), encoding="utf-8", errors="replace") as fh:
        return fh.read()


class Balance(html.parser.HTMLParser):
    """Detecta etiquetas estructurales sin cerrar o cerradas de mas."""

    VIGILADAS = {"html", "head", "body", "form", "select", "script", "style", "main",
                 "section", "header", "footer", "nav", "noscript"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.pila: list[str] = []
        self.problemas: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in self.VIGILADAS:
            self.pila.append(tag)

    def handle_endtag(self, tag):
        if tag not in self.VIGILADAS:
            return
        if tag in self.pila:
            while self.pila and self.pila[-1] != tag:
                self.problemas.append(f"<{self.pila.pop()}> sin cerrar")
            self.pila.pop()
        else:
            self.problemas.append(f"</{tag}> sin apertura (linea {self.getpos()[0]})")


def huella(txt: str) -> dict[str, list[str]]:
    """Lo protegido de una pagina, en forma comparable."""
    sel = []
    for nombre, cuerpo in re.findall(r'<select[^>]*name="([^"]+)"[^>]*>(.*?)</select>', txt, re.S):
        vals = re.findall(r'<option[^>]*value="([^"]*)"', cuerpo)
        sel.append(f'{nombre}: {", ".join(v for v in vals if v)}')
    return {
        "webhooks": sorted(set(re.findall(r"https://[a-z0-9.-]*n8n\.cloud/webhook/[A-Za-z0-9_-]+", txt))),
        "tokens": sorted(set(re.findall(r'data-token="([^"]*)"', txt)
                             + [t for t in re.findall(r'name="token"[^>]*value="([^"]*)"', txt) if t])),
        "data-formulario": sorted(set(re.findall(r'data-formulario="([^"]*)"', txt))),
        "campos": sorted(set(re.findall(r'<(?:input|select|textarea)[^>]*\bname="([^"]+)"', txt))),
        "select": sorted(sel),
        "etiquetas": sorted(set(re.findall(r'src="(assets/(?:google-ads|meta-pixel|boxer)\.js)"', txt))),
        "noscript": ["si"] if "<noscript" in txt else [],
        "robots": re.findall(r'<meta name="robots" content="([^"]*)"', txt),
        "canonical": re.findall(r'<link rel="canonical" href="([^"]*)"', txt),
    }


def refs_locales(txt: str) -> set[str]:
    refs = set()
    for r in re.findall(r'(?:src|href|poster)="([^"#?]+)', txt):
        if re.match(r"^(https?:|mailto:|tel:|data:|javascript:|//|\{)", r):
            continue
        refs.add(r.lstrip("/"))
    for r in re.findall(r"url\(['\"]?([^'\")]+)", txt):
        if not re.match(r"^(https?:|data:|//|#)", r):
            refs.add(r.lstrip("/"))
    return refs


def existe(ref: str) -> bool:
    ref = ref.split("#")[0]
    if ref in ("", "."):
        return True
    p = os.path.join(RAIZ, ref)
    return os.path.exists(p) or os.path.exists(p + ".html") or os.path.exists(os.path.join(p, "index.html"))


def chequear_pagina(pag: str, base_txt: str | None):
    txt = leer(pag)
    legado = pag in LEGADO

    b = Balance()
    try:
        b.feed(txt)
        b.close()
    except Exception as e:  # noqa: BLE001
        errores.append(f"{pag}: el HTML no se pudo leer ({e})")
    if b.pila:
        b.problemas += [f"<{t}> sin cerrar" for t in b.pila]
    for p in b.problemas[:5]:
        (avisos if legado else errores).append(f"{pag}: {p}")

    if not legado:
        if not re.search(r"<title>[^<]+</title>", txt):
            errores.append(f"{pag}: falta <title>")
        if 'name="description"' not in txt:
            errores.append(f"{pag}: falta <meta name=\"description\">")
        if 'rel="canonical"' not in txt:
            avisos.append(f"{pag}: falta canonical")
        if "viewport" not in txt:
            errores.append(f"{pag}: falta <meta name=\"viewport\"> (se ve mal en celular)")

    faltan = sorted(r for r in refs_locales(txt) if not existe(r))
    for r in faltan:
        errores.append(f"{pag}: apunta a un archivo que no existe: {r}")

    h = huella(txt)
    for w in h["webhooks"]:
        if w not in WEBHOOKS:
            errores.append(f"{pag}: webhook desconocido {w} (hay que crearlo en n8n antes)")
    for t in h["tokens"]:
        if t not in TOKENS:
            errores.append(f"{pag}: token desconocido '{t}': n8n va a descartar los envios")
    tiene_form = bool(h["webhooks"]) or "<form" in txt
    if tiene_form and not legado:
        for js in ("assets/google-ads.js", "assets/meta-pixel.js"):
            if js not in h["etiquetas"]:
                errores.append(f"{pag}: tiene formulario y no carga {js} (sin conversion)")
        if "data-bxform" in txt and "assets/boxer.js" not in h["etiquetas"]:
            errores.append(f"{pag}: usa data-bxform y no carga assets/boxer.js (el formulario no envia)")
        for f in h["data-formulario"]:
            if not f:
                errores.append(f"{pag}: data-formulario vacio")

    if base_txt is not None:
        hb = huella(base_txt)
        for clave in hb:
            if hb[clave] != h[clave]:
                protegidos.append(f"{pag} · {clave}\n      antes:   {hb[clave]}\n      despues: {h[clave]}")
    else:
        avisos.append(f"{pag}: pagina NUEVA (revisar noindex/sitemap y data-formulario: {h['data-formulario']})")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base", default="origin/main")
    args = ap.parse_args()

    en_base = set(git("ls-tree", "-r", "--name-only", args.base).split())
    if not en_base:
        avisos.append(f"no pude leer {args.base}: no se comparan cambios protegidos")

    paginas = sorted(f for f in os.listdir(RAIZ) if f.endswith(".html"))
    for pag in paginas:
        base_txt = git("show", f"{args.base}:{pag}") if pag in en_base else None
        chequear_pagina(pag, base_txt)
    usos: dict[str, list[str]] = {}
    for pag in paginas:
        for f in huella(leer(pag))["data-formulario"]:
            usos.setdefault(f, []).append(pag)
    for f, pags in usos.items():
        if len(pags) > 1:
            avisos.append(f"data-formulario '{f}' repetido en {', '.join(pags)}: el informe no los va a poder separar")
    for pag in sorted(f for f in en_base if f.endswith(".html") and "/" not in f):
        if pag not in paginas:
            protegidos.append(f"{pag} · se BORRA la pagina (si tiene anuncios o links apuntando, quedan rotos)")

    # Archivos de etiquetas y atribucion
    ga, mp, bx = leer("assets/google-ads.js"), leer("assets/meta-pixel.js"), leer("assets/boxer.js")
    if f"'{GOOGLE_ADS_ID}'" not in ga:
        errores.append(f"assets/google-ads.js: el ID ya no es {GOOGLE_ADS_ID}")
    if f"'{META_PIXEL_ID}'" not in mp:
        errores.append(f"assets/meta-pixel.js: el ID ya no es {META_PIXEL_ID}")
    if "sessionStorage" not in bx:
        errores.append("assets/boxer.js: se perdio el guardado de UTM en sessionStorage")
    for js in ("assets/google-ads.js", "assets/meta-pixel.js", "assets/boxer.js"):
        if js in en_base and git("diff", "--stat", args.base, "--", js).strip():
            protegidos.append(f"{js} · el archivo cambio (etiquetas / formularios)")

    # Sitemap
    for loc in re.findall(r"<loc>https://boxergestion\.com/([^<]*)</loc>", leer("sitemap.xml")):
        archivo = (loc or "index") + ("" if loc.endswith(".html") else ".html")
        if not os.path.exists(os.path.join(RAIZ, archivo)):
            errores.append(f"sitemap.xml: lista /{loc} y no existe {archivo}")
        elif 'content="noindex' in leer(archivo):
            avisos.append(f"sitemap.xml: lista /{loc} pero la pagina es noindex")

    # Secretos en todo lo versionado + lo nuevo sin commitear
    archivos = set(git("ls-files").split()) | set(git("ls-files", "--others", "--exclude-standard").split())
    for f in sorted(archivos):
        if not re.search(r"\.(html|js|css|json|txt|xml|md|toml|py|cjs)$", f):
            continue
        txt = leer(f)
        for patron, que in SECRETOS:
            if re.search(patron, txt, re.S):
                errores.append(f"{f}: parece contener {que}. No puede ir al repo")

    print(f"Chequeo de {len(paginas)} paginas contra {args.base}\n")
    for titulo, lista in (("ERRORES (frenan el merge)", errores),
                          ("CAMBIOS PROTEGIDOS (necesitan aprobacion explicita)", protegidos),
                          ("AVISOS", avisos)):
        print(f"{titulo}: {len(lista)}")
        for x in lista:
            print(f"  - {x}")
        print()
    print("RESULTADO:", "NO SE PUEDE MERGEAR" if errores else "OK")
    sys.exit(1 if errores else 0)


if __name__ == "__main__":
    main()
