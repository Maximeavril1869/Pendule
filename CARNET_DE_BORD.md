# Carnet de bord de Pendule

À relire pour savoir où en est le projet.

## 2026-11-17 - Version 1

- Besoin : transformer l'iPad 2 (iOS 9.3.5) posé sur la cheminée en dashboard ; horloge + météo de Châtel-Guyon et Vichy, données récupérées automatiquement.
- Nom du projet : Pendule. Dépôt créé par Maxime, code développé et versé sur `main` par Claude.
- Créés : `index.html`, `style.css`, `app.js` (ES5), `README.md`, `LICENSE`, `ARCHITECTURE.md`, ce carnet.
- Vérifié : syntaxe JavaScript valide, aucune syntaxe ES6 utilisée.
- **Non vérifié** : le fonctionnement réel sur l'iPad 2. L'accès à l'API météo est bloqué depuis l'environnement de développement, donc le format des données n'a pas pu être testé en direct.

## 2026-11-18 - Diagnostic météo

- Retour de Maxime : la page affiche « Météo indisponible » sur l'iPad 2.
- Test dans Safari de l'adresse de l'API : elle répond avec des données, donc le certificat HTTPS de l'API est accepté par iOS 9. Le problème vient de la page.
- Cause exacte pas encore connue. Les messages d'erreur du bas d'écran sont désormais détaillés (statut, état de la requête, début de la réponse). Version du script passée à `app.js?v=2` pour éviter le cache de Safari.

- Après republication : la météo s'affiche correctement sur l'iPad 2. Cause de l'échec initial non identifiée (probablement une version en cache de la page ou du script sur l'iPad).

## À faire

- Ouvrir la page sur l'iPad 2 et vérifier : chargement de la page (HTTPS), affichage de la météo, lisibilité à distance.
- Ajuster tailles, mode nuit et contenu selon le retour.
- Idées possibles : autres informations sur le dashboard.

## 2026-11-18 - Échec « connexion impossible » depuis l'icône de l'écran d'accueil

- Constat : depuis l'icône, la page affiche « connexion impossible, statut 0, état 4 » (requête échouée au niveau réseau). Le comportement dans Safari était correct.
- Cause non identifiée. Hypothèses : réseau Wi-Fi de l'iPad pas encore réveillé au lancement, ou réseau différent en mode plein écran d'iOS 9.
- Changement : 3 nouveaux essais à 10 s d'intervalle après un échec, puis un essai par minute (`app.js?v=3`).
- Confirmé : en Safari la météo s'affiche, depuis l'icône (plein écran) non, même après réessais. Ce n'est donc pas un problème de réveil du Wi-Fi.
- Ajout de `diag.html` : page de test qui essaie 4 requêtes (même site, Open-Meteo x2, GitHub) et affiche le résultat, pour savoir ce que le mode plein écran d'iOS 9 bloque.

## 2026-11-18 - Météo via GitHub Actions

- Résultats de `diag.html` : en Safari, le même site et Open-Meteo répondent ; depuis l'icône (plein écran), seul le même site répond, toute requête vers un autre site échoue (statut 0 état 4). Cause non identifiée.
- Solution retenue par Maxime : GitHub récupère la météo à sa place. `.github/workflows/meteo.yml` interroge Open-Meteo à H+07 et H+37 et écrit `meteo.json` dans `main` ; la page lit ce fichier (même site). Repli sur l'appel direct à l'API si le fichier est absent ou a plus de 2 h (fonctionne dans Safari).
- Testé en simulation locale (3 scénarios). Non testé en réel : exécution du workflow, publication de `meteo.json` par GitHub Pages, affichage sur l'iPad en plein écran.
- `app.js?v=4`.
