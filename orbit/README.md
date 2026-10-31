# ORBIT — site prototype Netlify

## Déploiement
Décompresser ORBIT-Netlify.zip, puis déposer le dossier `orbit-netlify` sur https://app.netlify.com/drop (ou importer ce dossier comme site Netlify). Les fichiers `index.html`, `styles.css`, `app.js`, `netlify.toml`, et `assets/` doivent rester ensemble.

## Parcours utilisateur
Explorer un film → Fiche → Séances → Cinéma / horaire → Choisir ses places et tarifs → Ajouter pop-corn, boisson ou menu → Récapitulatif → Générer un billet de démonstration → Télécharger son récapitulatif.

Menu de navigation : Explorer, Séances, Avis, Favoris, Mes billets, Snacks. Le site garde les favoris et les billets démo dans le navigateur via localStorage.

## Animations
Planète qui tourne au clic, ciel étoilé scintillant, étoiles filantes qui apparaissent/disparaissent, nébuleuses en mouvement, curseur à traînée lumineuse sur ordinateur, micro-interactions des cartes et boutons. Les animations sont réduites automatiquement si la personne a activé `prefers-reduced-motion`.

## Données et limites
Ceci est un **prototype UX/UI**, pas une billetterie : films et horaires de démonstration, cinémas inventés, places et stocks simulés, aucun système de paiement ou de réservation. Le QR illustratif est décoratif et non scannable. Ne saisissez aucune donnée bancaire. Les films et noms de produits servent uniquement à illustrer le concept. Les fonds visuels proviennent du moodboard fourni dans le PDF de branding ORBIT.
