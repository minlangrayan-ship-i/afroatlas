import { readFile, writeFile } from 'node:fs/promises';
import { countries, europeanContexts } from '../src/data/countries.ts';
const c = JSON.parse(await readFile('src/data/published/catalogue.json', 'utf8'));
const geo = JSON.parse(await readFile('src/data/published/geography.json', 'utf8'));
const selection = JSON.parse(
  await readFile('scripts/import/coverage-photo-selection.json', 'utf8'),
);
const image = (p) => c.images.find((i) => i.id === p.imageId);
const supplements = c.products.filter((p) => image(p).role !== 'primary');
const main = c.products.length - supplements.length;
const visible = c.products.filter(
  (p) => image(p).role === 'primary' || image(p).verificationStatus === 'visually_checked',
).length;
const rows = ['MAR', 'CMR', 'SEN', 'MLI', 'CIV', 'TCD', 'ZWE'].map((iso) => {
  const names = c.names.filter((n) => n.countryIds.includes(iso));
  const contexts = c.contexts.filter((ctx) => ctx.countryId === iso);
  const biological = contexts.filter((ctx) =>
    ['presence', 'cultivation', 'botanical-origin'].includes(ctx.relationType),
  );
  return `| ${countries.find((c) => c.ISO3 === iso).nameFr} | ${new Set([...names.map((n) => n.productId), ...contexts.map((ctx) => ctx.productId)]).size} | ${names.length} | ${contexts.length - biological.length} | ${biological.length} |`;
});
await writeFile(
  'docs/DATA_QUALITY.md',
  `# Qualité et couverture réelle

Instantané du 6 octobre 2026. Compteurs calculés à partir du catalogue publié.

- ${c.products.length} fiches, ${c.names.length} assertions de noms sourcées et ${c.contexts.length} contextes. La plante, une partie alimentaire et un plat restent des identités distinctes.
- ${countries.length} pays africains, ${europeanContexts.length} contextes européens, ${geo.regions.length} subdivisions documentaires. Tchad et Zimbabwe ajoutés ; Niger et Nigeria restent distincts. Les neuf régions maliennes représentent l’instantané historique de 2021.
- ${visible}/${c.products.length} fiches illustrées : ${main} photographies principales et ${supplements.length} compléments explicitement légendés. Une photographie botanique sur une fiche de plante ne représente pas un produit transformé.
- ${selection.length} nouvelles associations photo/fiche (${new Set(selection.map((s) => s.title)).size} fichiers Commons distincts). Aucune image générée. WebP 400/960, sans recadrage du fichier conservé, crédits, licences et originaux référencés.
- ${supplements.length} formes commerciales restent à photographier : les compléments ne sont pas utilisés comme preuves dans la carte destinée au vendeur ni dans les métadonnées d’image principale pour le référencement.
- Toutes les anciennes fiches, assertions, relations, sources et photographies sont conservées ; seules les références d’illustration et les notes de contrôle nécessaires sont mises à jour.

## Couverture géographique

| Pays | Fiches avec preuve géographique | Noms contextualisés | Autres contextes | Présence / culture botanique |
| --- | ---: | ---: | ---: | ---: |
${rows.join('\n')}

Une présence botanique ne prouve ni un nom local ni un usage culinaire. Une langue ne suffit pas à attribuer un produit à un pays. Les contextes sont classés séparément sur les pages pays. La collecte régionale des cinq pays prioritaires reste partielle.

## Formes commerciales encore à photographier

${supplements.map((p) => `- ${p.labelFr} : ${image(p).depictedPart}.`).join('\n')}

## Deux nouvelles plantes

Aloe vera : feuille coupée photographiée, libellés FR/EN/AR documentés dans Wikidata, identité Kew, culture domestique signalée uniquement pour les répondants de Kitagata (Sheema, Ouganda), enquête d’août 2012 publiée en 2014.

Séné africain : Senna italica, noms bambara Balibali / M’bali mbali / mba bali. La variante abrégée « Mbali » fournie par le propriétaire retrouve la fiche sans être présentée comme un nom distinct attesté. L’herbier INRMPT relie mba bali à Senna italica au Mali (Tableau II de la thèse KONE 2025). Aucune région malienne plus précise n’est attribuée. Kew confirme Mali, Cameroun, Ouganda, Zimbabwe et Tchad. La Zambie reste non confirmée : son absence des sources consultées ne démontre pas l’absence de la plante.

Le séné est illustré par une photo botanique de Senna italica subsp. arachoides en Afrique du Sud, explicitement identifiée ; pas par des folioles séchées prétendument achetées au Mali. Aucun conseil de consommation, dosage ou bénéfice médical n’est donné.

## Preuves, langues et licences

FR/EN/AR et RTL conservés ; appellations locales originales. Les descriptions documentaires restent en français et nécessitent une traduction humaine. Chaque nouveau nom possède une preuve et une source. Aucune validation culturelle humaine n’est simulée.

Commons : licences photo individuelles CC BY, CC BY-SA ou domaine public. Wikidata : CC0. Kew Backbone : CC BY 3.0, avec conditions distinctes pour les autres contenus. Pharmacopée africaine, thèse malienne et étude ougandaise : consultation et faits cités ; pas de PDF, texte intégral ou photo redistribué sans licence vérifiée.

## Accès restant à configurer

La réception durable des contributions nécessite encore la configuration Supabase choisie par le propriétaire. Aucun envoi réel n’est revendiqué sans accès. Les protections serveur et le plan de migration de l’hébergement restent décrits dans les documents existants. Cet enrichissement ne modifie ni l’hébergement, ni l’authentification, ni les vidéos FR/EN/AR.

Voir [bilan photographique détaillé](PHOTO_PLANT_COUNTRY_REPORT.md), [sources](SOURCES.md), [lacunes](CONTENT_BACKLOG.md), [configuration Supabase](SUPABASE_SETUP.md).
`,
);
await writeFile(
  'docs/PHOTO_PLANT_COUNTRY_REPORT.md',
  `# Images, Aloe vera, séné africain et nouveaux pays — 6 octobre 2026

Demande : illustrer toutes les fiches, ajouter les deux plantes, le Tchad et les pays concernés. Résultat : ${visible}/${c.products.length} fiches illustrées, ${main} photos principales et ${supplements.length} photos complémentaires signalées. Les fichiers et références antérieurs sont conservés. Les compléments d’identité ne remplacent pas une photo de la forme achetée.

## Journal des choix contrôlés

| Fiche | Rôle | Forme visible / périmètre | Source, crédit, licence |
| --- | --- | --- | --- |
${selection
  .map((s) => {
    const p = c.products.find((p) => p.slug === s.slug),
      i = image(p);
    return `| ${p.labelFr} | ${s.role === 'primary' ? 'Principale' : 'Complémentaire'} | ${s.part} | [${i.creator.replace(/\|/g, ' / ')}](${i.sourcePageUrl}) · ${i.licenseId} |`;
  })
  .join('\n')}

## Provenance des plantes

- [Kew — Senna italica](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:518341-1) : espèce acceptée et distribution. Cinq contextes de présence créés : MLI, CMR, UGA, ZWE, TCD. Pas de contexte inventé pour ZMB.
- [African Pharmacopoeia](https://asric.africa/sites/default/files/2024-01/African%20Pharmacopoeia.pdf), p. 385 : noms principaux et bambara ; contexte de folioles séchées médicinales. Les photos du PDF ne sont pas reproduites.
- [Thèse KONE, USTTB 2025](https://www.bibliosante.ml/bitstream/handle/123456789/14966/25P13.pdf?isAllowed=y&sequence=1), Tableau II, p. 5 imprimée, page 29 du PDF : Senna italica, herbier 159, mba bali.
- [Kew — Aloe vera](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:530017-1) : identité botanique. Ne pas confondre la distribution d’un genre Aloe avec celle de l’espèce Aloe vera.
- [Adams et al., 2014, Kitagata](https://www.gssrr.org/JournalOfBasicAndApplied/article/view/1892) : culture domestique dans l’échantillon local ougandais ; aucune efficacité médicale déduite.
- Wikidata : Q80079, révision 2550694446 ; Q7450834, révision 2535288001, CC0.

## Lacunes précises

Les ${supplements.length} fiches complémentaires ont besoin d’une photographie vérifiée de leur forme commerciale pour devenir des fiches photographiques principales. Kpem : le complément montre l’ingrédient frais, pas le plat. Rondelle : le complément montre l’arbre, pas les graines. Aucun cliché commercial à droits inconnus ni image artificielle n’a été utilisé pour combler ces lacunes.

Zambie : aucune preuve suffisante retenue pour Senna italica. Un signalement local, un spécimen ou une source botanique vérifiable permettrait de compléter la présence ; une liste de pays fournie oralement ne suffit pas.

## Vérification

Le test photo-plants vérifie le décodage de toutes les photographies principales et complémentaires, leurs dimensions, licences, crédits et formes. Les tests de recherche contrôlent Mbali, les appellations bambara limitées au Mali et la non-attribution de la Zambie. Le test navigateur contrôle les fiches en mobile, RTL, zoom, crédits et lien vers le Tchad. Le parcours pays existant couvre aussi Zimbabwe, carte et formulaire. Consulter le bilan de livraison pour les résultats de la compilation et de la publication.
`,
);
console.log(
  JSON.stringify({
    products: c.products.length,
    visible,
    main,
    complementary: supplements.length,
    countries: countries.length,
    names: c.names.length,
    contexts: c.contexts.length,
  }),
);
