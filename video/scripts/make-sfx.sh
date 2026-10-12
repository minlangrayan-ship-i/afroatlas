#!/usr/bin/env bash
# Effets sonores synthétisés avec ffmpeg : aucun son tiers, donc libres de droits.
set -euo pipefail
cd "$(dirname "$0")/../public/sfx"
# Souffle de transition : bruit rose filtré, montée puis extinction.
ffmpeg -v error -y -f lavfi -i "anoisesrc=color=pink:duration=0.55:amplitude=0.6" \
  -af "highpass=f=400,lowpass=f=6000,afade=t=in:d=0.25,afade=t=out:st=0.28:d=0.27,volume=0.5" whoosh.wav
# « Tick » d'apparition d'un mot : sinusoïde aiguë très courte.
ffmpeg -v error -y -f lavfi -i "sine=frequency=1650:duration=0.08" \
  -af "afade=t=out:st=0.005:d=0.075,volume=0.35" tick.wav
# Impact grave : basse à 52 Hz qui s'éteint, avec une attaque de bruit brun.
ffmpeg -v error -y -f lavfi -i "sine=frequency=52:duration=1.2" -f lavfi -i "anoisesrc=color=brown:duration=0.2:amplitude=0.8" \
  -filter_complex "[0]afade=t=out:st=0.05:d=1.15,volume=1.4[a];[1]lowpass=f=900,afade=t=out:d=0.2[b];[a][b]amix=inputs=2:normalize=0,volume=0.8" impact.wav
ls -la
