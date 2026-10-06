# Contributions automatiques par email

Le formulaire public transmet désormais les contributions à **minlangrayan@gmail.com**, adresse centralisée dans `src/data/site.ts`. Le transport est FormSubmit, service externe adapté à GitHub Pages, annoncé gratuit dans sa documentation. Aucun compte payant, clé SMTP ou secret n’est ajouté au frontend.

## Activation et vérification

Le premier essai technique du 6 octobre 2026 a obtenu la réponse « activation nécessaire » ; FormSubmit a envoyé un lien **Activate Form** au propriétaire. Celui-ci doit confirmer ce lien pour autoriser le destinataire. Le propriétaire a confirmé la réception puis l’activation pendant la configuration.

Le formulaire transmet les champs complets en multipart et la véritable photographie sélectionnée en pièce jointe : JPEG, PNG ou WebP, au maximum 5 Mo. Le destinataire et l’objet sont fixés par la configuration, sans CC ni destinataire contrôlé par un visiteur. Une référence permet de reconnaître une éventuelle reprise du même envoi ; elle ne constitue pas une garantie d’idempotence du prestataire.

Le consentement précise la transmission par FormSubmit. Les droits de réutilisation sont requis pour les photos. Les formats, signatures de fichier et dimensions décodées sont contrôlés avant l’envoi. Un nom, une URL de source et un pays inconnus ne sont jamais ajoutés automatiquement au catalogue.

## Accusés et publication

Un HTTP 200 ne suffit pas : `success` doit être vrai. Une activation requise, un échec réseau, un refus ou une réponse invalide conservent les champs et la photo à l’écran. Aucune reprise réseau automatique ne risque de doubler silencieusement les messages. Un acquittement FormSubmit confirme l’acceptation par le service, **pas la livraison dans la boîte Gmail**. Aucun webhook de livraison signé n’est disponible dans ce parcours.

Les propositions reçues sont examinées dans la boîte du propriétaire. Leur réception ne publie rien sur le site. La publication d’une proposition retenue nécessite toujours une modification revue du catalogue ou la future modération Supabase. Le transport email ne remplit pas automatiquement les tables Supabase et n’active pas l’administration.

FormSubmit indique conserver les propositions textuelles pendant 30 jours dans son archive ; les fichiers ne sont pas conservés dans cette archive. Le propriétaire conserve les emails et pièces jointes nécessaires à l’examen. Ne pas présenter cette archive temporaire comme la base durable du catalogue.

La CSP autorise exclusivement `https://formsubmit.co` comme nouvelle destination réseau. Aucun script tiers FormSubmit ni reCAPTCHA n’est intégré aux pages ; le formulaire AJAX reste soumis aux limites et contrôles du prestataire. Les contrôles locaux ne remplacent pas ceux du prestataire et peuvent être contournés par un appel direct à son endpoint public.

Documentation : [configuration et activation](https://formsubmit.co/), [photos, AJAX et conservation](https://formsubmit.co/documentation), [confidentialité](https://formsubmit.co/privacy.pdf). Les conditions du prestataire peuvent évoluer.
