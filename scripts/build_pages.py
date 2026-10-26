#!/usr/bin/env python3
"""Build the minimal static artifact deployed by GitHub Pages."""

from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "_site"
STANDALONE = ROOT / "play.html"


if not STANDALONE.is_file():
    raise SystemExit("play.html is missing. Run npm run standalone first.")

if OUTPUT.exists():
    shutil.rmtree(OUTPUT)

OUTPUT.mkdir(parents=True)
shutil.copy2(STANDALONE, OUTPUT / "index.html")

(OUTPUT / ".nojekyll").touch()
print(f"Wrote anonymous GitHub Pages artifact to {OUTPUT}")
