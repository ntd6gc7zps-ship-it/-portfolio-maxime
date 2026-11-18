# Néo : Survie

Jeu de tir en vue du dessus, accessible depuis le cinquième portail du portfolio Matrix.

## Commandes

- Flèches / ZQSD / WASD : déplacement ; Maj : course.
- Souris : visée ; clic maintenu : tir continu.
- J : tir continu avec sélection de l'ennemi actif le plus proche.
- Espace : ralenti de 2,2 secondes, puis 8 secondes de recharge.
- Échap / P : pause. Une perte de focus ou un onglet masqué met également le jeu en pause.
- Mobile : quatre directions, bouton de tir avec visée automatique et bouton de ralenti.

Cinq vagues de 6, 9, 12, 15 et 18 ennemis. Les agents Smith poursuivent Néo et tirent ; les robots Sentinelles résistent davantage et chargent. Les éliminations donnent des points, un soin apparaît toutes les sept éliminations et les transitions entre vagues rendent 18 points de vie. La fin affiche une victoire ou une défaite et permet de rejouer.

## Organisation

`engine.mjs` gère la simulation sans dépendre du DOM. `game.js` s'occupe du rendu Canvas 2D, des contrôles, de l'interface et des sons générés localement avec Web Audio. Aucun asset audio ou personnage distant, aucune dépendance JavaScript ni collecte de données.

Servir le dépôt avec un serveur statique ; les modules JavaScript nécessitent HTTP(S). Les chemins sont relatifs et compatibles avec le sous-dossier GitHub Pages.

Depuis la racine du dépôt :

```sh
node --test matrix/jeu/survie/tests/engine.test.mjs
node --check matrix/jeu/survie/game.js
```

Les tests couvrent les collisions continues des projectiles, le ralenti, les dégâts et la mort, la progression des vagues, les apparitions éloignées du joueur, les limites des tableaux, le redimensionnement et la réinitialisation. Vérifier aussi dans le navigateur les tirs, la pause/reprise, le bouton Rejouer, le format mobile et les liens entre le portfolio et le jeu.
