#!/usr/bin/env python3
"""Resserre les pauses de la voix off pour un rythme plus dynamique (rétention).

Chaque pause de plus de MAX secondes est ramenée à MAX secondes (on garde la respiration
de part et d'autre, on retire le milieu). Le fichier d'origine n'est jamais modifié.
Usage : python3 resserrer.py entree.mp3 sortie.mp3 [max_pause=0.32]
"""
import re
import subprocess
import sys

entree, sortie = sys.argv[1], sys.argv[2]
maxi = float(sys.argv[3]) if len(sys.argv) > 3 else 0.32
journal = subprocess.run(
    ["ffmpeg", "-hide_banner", "-i", entree, "-af", "silencedetect=noise=-35dB:d=0.2", "-f", "null", "-"],
    capture_output=True, text=True,
).stderr
debuts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", journal)]
fins = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", journal)]
coupes = []
for a, b in zip(debuts, fins):
    if b - a > maxi:
        garde = maxi / 2
        # Silence initial : on ne garde qu'un dixième de seconde avant la première syllabe.
        coupes.append((0.0, b - 0.1) if a == 0 else (a + garde, b - garde))
if not coupes:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", entree, "-c:a", "libmp3lame", "-q:a", "2", sortie], check=True)
else:
    condition = "+".join(f"between(t,{a:.3f},{b:.3f})" for a, b in coupes)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", entree, "-af", f"aselect='not({condition})',asetpts=N/SR/TB",
         "-c:a", "libmp3lame", "-q:a", "2", sortie],
        check=True,
    )
print(f"{entree} → {sortie} : {len(coupes)} pauses resserrées, {sum(b - a for a, b in coupes):.1f} s retirées")
