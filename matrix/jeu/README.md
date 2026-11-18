# La Matrice — Portfolio jouable

Version autonome du portfolio de Maxime Hamer, en Canvas 2D et JavaScript natif.

## Utilisation

Ouvrir `matrix/jeu/` depuis un serveur statique. Les chemins relatifs fonctionnent également sous le préfixe GitHub Pages `/-portfolio-maxime/`.

- Flèches, ZQSD ou WASD : déplacer Néo ; Maj : courir.
- Clic sur le sol : marcher vers ce point.
- Entrer dans un cercle ou appuyer sur E à proximité : ouvrir le projet.
- Clic sur une enseigne ou menu « Les projets » : accès direct.
- Boutons directionnels sur mobile ; carte plus compacte sous 600 px.
- Échap annule la transition ; les dialogues et la perte de focus suspendent les déplacements.

## Fichiers

- `index.html` : interface et liens accessibles vers les cinq destinations.
- `game.css` : décor des enseignes et interface responsive.
- `game.js` : monde, Néo, caméra, déplacements et navigation.
- `return.js` : adapte uniquement les liens de retour des projets ouverts avec `?from=matrix-game`. Les visites ordinaires conservent leurs liens existants.

La position et les portails visités sont conservés dans `sessionStorage`, avec une position de retour hors du cercle pour éviter une réouverture immédiate. Le jeu fonctionne aussi lorsque ce stockage est indisponible. Aucun suivi distant, aucune dépendance JavaScript ni asset 3D.

L'option de mouvement réduit du navigateur désactive les animations décoratives par défaut ; le bouton « Fond animé » permet de les contrôler. Les liens HTML restent accessibles sans jouer.

## Vérification avant publication

Vérifier les déplacements, l'entrée sur un cercle, les cinq liens directs, les retours depuis les projets (y compris après navigation interne dans Orbit), la mise en page à 390 px et le menu des projets. Valider la syntaxe avec `node --check game.js` et `node --check return.js`.

## Néo : Survie

Le cinquième portail ouvre `survie/` : cinq vagues de Smith et de Sentinelles, tirs continus, vie, soins, ralenti et commandes tactiles. Le retour à la Matrice utilise le lien `../`. Les tests de la simulation se lancent avec `node --test matrix/jeu/survie/tests/engine.test.mjs` depuis la racine du dépôt.
