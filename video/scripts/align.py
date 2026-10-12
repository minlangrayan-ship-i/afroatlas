#!/usr/bin/env python3
"""Alignement local voix off ↔ texte, sans modèle téléchargé.

Pourquoi : Whisper, Vosk et les modèles PyTorch ne sont pas téléchargeables depuis
l'environnement de production. On aligne donc à partir de deux informations sûres :
  1. les pauses de la voix (ffmpeg silencedetect) ;
  2. le nombre de syllabes de chaque groupe de mots du script.

Méthode : programmation dynamique qui place les fins de groupes (ponctuation) sur des
pauses réelles en gardant un débit de parole le plus régulier possible ; puis, dans chaque
groupe, les mots sont répartis selon leurs syllabes sur les seules portions parlées.
Précision typique : de l'ordre d'une syllabe, suffisante pour des sous-titres mot par mot.

Si vous remplacez la voix par la vôtre (même texte), relancez simplement ce script.
Sur une machine avec Whisper, `--whisper` peut être ajouté plus tard pour affiner.

Usage : python3 align.py voix.mp3 texte_fr.txt texte_en.txt sortie_prefixe
Produit : <prefixe>.words.json, <prefixe>.fr.srt, <prefixe>.en.srt
"""
import json
import math
import re
import subprocess
import sys

VOYELLES = "aeiouyàâäéèêëîïôöùûüœæ"


def syllabes(mot: str) -> int:
    """Estimation du nombre de syllabes d'un mot (groupes de voyelles)."""
    groupes = re.findall(f"[{VOYELLES}]+", mot.lower())
    n = len(groupes)
    # Le « e » muet final ne se prononce pas (« langue », « source »).
    if n > 1 and re.search(r"[^aeiouy]es?$", mot.lower()):
        n -= 1
    return max(1, n)


def duree(audio: str) -> float:
    sortie = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio],
        capture_output=True, text=True, check=True,
    )
    return float(sortie.stdout.strip())


def silences(audio: str, total: float):
    """Liste des pauses (début, fin) détectées par ffmpeg."""
    sortie = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", audio, "-af", "silencedetect=noise=-35dB:d=0.18",
         "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    debuts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", sortie)]
    fins = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", sortie)]
    paires = []
    # Une fin sans début correspond au silence initial (à partir de 0).
    if fins and (not debuts or fins[0] < debuts[0]):
        paires.append((0.0, fins.pop(0)))
    for i, d in enumerate(debuts):
        paires.append((d, fins[i] if i < len(fins) else total))
    return paires


def decouper(texte: str):
    """Lignes (pour les .srt) → groupes de mots séparés par la ponctuation."""
    # Ponctuation française précédée d'une espace (« Résultat : ») : rattachée au mot.
    texte = re.sub(r"\s+([:;?!])", "\u00a0\\1", texte)
    lignes = [l.strip() for l in texte.splitlines() if l.strip()]
    groupes = []
    for numero, ligne in enumerate(lignes):
        morceaux = re.split(r"(?<=[.,:;?!…])[ \t]+", ligne)
        for morceau in morceaux:
            mots = [m for m in re.split(r"[ \t]+", morceau.strip()) if m]
            if mots:
                # Fin de phrase (. ? ! … :) : une pause y est quasi certaine ; virgule : probable.
                forte = bool(re.search(r"[.?!…:]$", mots[-1]))
                groupes.append({"ligne": numero, "mots": mots, "forte": forte,
                                "syll": sum(syllabes(m) for m in mots)})
    return lignes, groupes


def parle(debut: float, fin: float, pauses):
    """Durée réellement parlée entre deux instants (pauses internes retirées)."""
    silence = sum(max(0.0, min(fin, b) - max(debut, a)) for a, b in pauses)
    return max(0.05, fin - debut - silence)


def aligner(audio: str, texte: str):
    total = duree(audio)
    pauses = silences(audio, total)
    lignes, groupes = decouper(texte)
    debut_voix = pauses[0][1] if pauses and pauses[0][0] == 0.0 else 0.0
    fin_voix = pauses[-1][0] if pauses and pauses[-1][1] >= total - 0.01 else total
    # Pauses candidates comme frontières : strictement entre le début et la fin de la voix.
    internes = [p for p in pauses if debut_voix < p[0] < fin_voix]
    bornes = [(debut_voix, debut_voix)] + internes + [(fin_voix, fin_voix)]
    debit = sum(g["syll"] for g in groupes) / parle(debut_voix, fin_voix, pauses)

    n, m = len(groupes), len(bornes)
    cumul = [0]
    for g in groupes:
        cumul.append(cumul[-1] + g["syll"])
    inf = float("inf")
    # cout[j][k] : meilleurs groupes 0..j-1 terminés sur la borne k.
    cout = [[inf] * m for _ in range(n + 1)]
    avant = [[None] * m for _ in range(n + 1)]
    cout[0][0] = 0.0
    for j in range(1, n + 1):
        for k in range(1, m):
            for i in range(j):
                for l in range(k):
                    if cout[i][l] == inf:
                        continue
                    syll = cumul[j] - cumul[i]
                    debut, fin = bornes[l][1], bornes[k][0]
                    t = parle(debut, fin, pauses)
                    ecart = math.log((syll / t) / debit)
                    # Une ponctuation à l'intérieur du bloc devrait plutôt tomber sur une pause.
                    oublis = sum(2.0 if g["forte"] else 0.6 for g in groupes[i:j - 1])
                    # Une longue pause au milieu du bloc devrait plutôt être une frontière.
                    pauses_internes = sum(b - a for a, b in pauses if debut < a and b < fin)
                    c = cout[i][l] + syll * ecart * ecart + oublis + 4.0 * pauses_internes
                    if c < cout[j][k]:
                        cout[j][k] = c
                        avant[j][k] = (i, l)
    # Retour arrière depuis la dernière borne (fin de la voix).
    blocs, j, k = [], n, m - 1
    while j > 0:
        i, l = avant[j][k]
        blocs.append((i, j, bornes[l][1], bornes[k][0]))
        j, k = i, l
    blocs.reverse()

    mots = []
    for i, j, debut, fin in blocs:
        # Portions parlées du bloc, puis répartition des syllabes sur ces portions.
        portions, curseur = [], debut
        for a, b in pauses:
            if b <= debut or a >= fin:
                continue
            if a > curseur:
                portions.append((curseur, a))
            curseur = max(curseur, b)
        if curseur < fin:
            portions.append((curseur, fin))
        longueur = sum(b - a for a, b in portions)

        def instant(fraction):
            reste = fraction * longueur
            for a, b in portions:
                if reste <= b - a:
                    return a + reste
                reste -= b - a
            return fin

        syll_bloc = cumul[j] - cumul[i]
        position = 0
        for g in groupes[i:j]:
            for mot in g["mots"]:
                s = syllabes(mot)
                mots.append({
                    "mot": mot, "ligne": g["ligne"],
                    "debut": round(instant(position / syll_bloc), 3),
                    "fin": round(instant((position + s) / syll_bloc), 3),
                })
                position += s
    return total, lignes, mots


def horodatage(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def srt(lignes_texte, mots, chemin):
    """Une réplique par ligne du script ; l'anglais reprend les temps du français."""
    blocs = []
    for numero, texte in enumerate(lignes_texte):
        des_mots = [m for m in mots if m["ligne"] == numero]
        if des_mots:
            blocs.append(f"{len(blocs) + 1}\n{horodatage(des_mots[0]['debut'])} --> "
                         f"{horodatage(des_mots[-1]['fin'])}\n{texte}\n")
    with open(chemin, "w", encoding="utf-8") as f:
        f.write("\n".join(blocs))


def main():
    audio, texte_fr, texte_en, prefixe = sys.argv[1:5]
    with open(texte_fr, encoding="utf-8") as f:
        total, lignes, mots = aligner(audio, f.read())
    with open(texte_en, encoding="utf-8") as f:
        lignes_en = [l.strip() for l in f.read().splitlines() if l.strip()]
    if len(lignes_en) != len(lignes):
        sys.exit(f"{texte_en} doit avoir {len(lignes)} lignes, comme le texte français.")
    with open(prefixe + ".words.json", "w", encoding="utf-8") as f:
        json.dump({"duree": round(total, 3), "mots": mots}, f, ensure_ascii=False, indent=1)
    srt(lignes, mots, prefixe + ".fr.srt")
    srt(lignes_en, mots, prefixe + ".en.srt")
    print(f"{prefixe}: {len(mots)} mots alignés sur {total:.1f} s")


if __name__ == "__main__":
    main()
