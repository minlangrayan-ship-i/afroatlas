# Nom de domaine, Search Console et Bing

Le code est prêt pour un domaine propre : il suffit de renseigner une variable. Les étapes ci-dessous demandent l’accès au registraire, aux réglages GitHub et au compte Google du propriétaire ; elles ne peuvent pas être faites depuis le dépôt.

## Pourquoi un domaine propre

- Google accorde plus de confiance à un domaine dédié qu’à un sous-dossier de `github.io`.
- `robots.txt` est lu **à la racine du domaine** : avec `minlangrayan-ship-i.github.io/afroatlas/`, le fichier du site n’est pas à la racine. Avec un domaine propre, le `robots.txt` généré par le build est à la bonne place.
- L’adresse est plus facile à retenir, à dire dans une vidéo et à imprimer sur les étiquettes des épiceries.
- La propriété « Domaine » de Search Console (vérification DNS) couvre toutes les versions : `https`, `www`, `/en/`, `/ar/`.

## 1. Acheter le domaine (≈ 10 à 15 €/an)

Suggestions à vérifier chez un registraire : `afroatlas.org`, `afroatlas.africa`, `afroatlas.info`, `afro-atlas.com`. Registraires possibles : Cloudflare Registrar (prix coûtant), OVHcloud, Gandi, Namecheap. Activer le renouvellement automatique.

## 2. Relier le domaine à GitHub Pages

1. GitHub → profil → **Settings → Pages → Add a domain** : vérifier le domaine (enregistrement TXT fourni par GitHub). Cela empêche qu’un tiers ne le réutilise.
2. Chez le registraire, zone DNS du domaine racine :
   - quatre enregistrements `A` : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` ;
   - quatre enregistrements `AAAA` : `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` ;
   - `www` en `CNAME` vers `minlangrayan-ship-i.github.io`.
3. Dépôt → **Settings → Pages → Custom domain** : saisir `afroatlas.org` (exemple), enregistrer, puis cocher **Enforce HTTPS** quand le certificat est prêt.
4. Dépôt → **Settings → Secrets and variables → Actions → Variables** : créer `SITE_URL` = `https://afroatlas.org/` (avec la barre finale).
5. Relancer le workflow **Verify and publish AfroAtlas**. Le build utilise alors le chemin racine : canonical, hreflang, sitemap, `robots.txt` et QR codes du kit épiceries pointent vers le nouveau domaine.

GitHub redirige les anciennes adresses `minlangrayan-ship-i.github.io/afroatlas/…` vers le domaine personnalisé : les liens déjà partagés et les QR codes déjà imprimés continuent de fonctionner. Le vérifier après publication sur deux ou trois anciennes URL.

Si l’hébergement passe un jour sur Cloudflare Pages (voir `PRIVATE_HOSTING.md`), utiliser la même variable `SITE_URL`.

## 3. Google Search Console

1. <https://search.google.com/search-console> → **Ajouter une propriété** → **Domaine** → saisir `afroatlas.org`.
2. Copier l’enregistrement TXT proposé dans la zone DNS, attendre quelques minutes, cliquer **Valider**.
   Sans domaine propre, utiliser une propriété **Préfixe d’URL** et la balise HTML : renseigner sa valeur dans la variable GitHub `PUBLIC_GOOGLE_SITE_VERIFICATION`, relancer le déploiement, puis valider.
3. **Sitemaps** → soumettre `https://afroatlas.org/sitemap-index.xml`. Il liste chaque page en français, anglais et arabe avec ses alternatives `hreflang`.
4. **Inspection de l’URL** → demander l’indexation de l’accueil, de `/en/`, `/ar/`, de `/produits/gombo/` et de `/en/produits/gombo/`.
5. Après deux à quatre semaines : **Performances** (requêtes, impressions, clics, pays) et **Pages** (indexées ou non, avec la raison). Le rapport **International targeting / hreflang** signale les erreurs éventuelles.

Requêtes à surveiller : noms de produits avec « en anglais », « en wolof », « en arabe » ; « okra in Yoruba », « bitter leaf in French », « بامية » ; noms locaux (ndolé, eru, njansang, soumbala).

## 4. Bing Webmaster Tools

<https://www.bing.com/webmasters> → **Importer depuis Google Search Console**. Bing alimente aussi DuckDuckGo, Ecosia, Yahoo et plusieurs moteurs de réponses par IA. Soumettre le même sitemap.

## 5. Cloudflare Web Analytics

Dans **Web Analytics**, ajouter le nouveau nom d’hôte ou vérifier que le jeton installé couvre le domaine. Garder l’option d’exclusion des visiteurs de l’UE désactivée pour voir les visites françaises et belges.

## Ce que le code fait déjà

- Pages `/en/` et `/ar/` réelles, avec `hreflang` `fr` / `en` / `ar` / `x-default` et sitemap multilingue.
- Titres et descriptions qui citent les vrais noms (« Gombo (okra) : … », « Okra (Gombo): names across languages… »).
- Données structurées `WebSite`, `BreadcrumbList`, `DefinedTerm` avec `alternateName` par fiche.
- `robots.txt` généré depuis `SITE_URL`.
