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

## À faire

- Ouvrir la page sur l'iPad 2 et vérifier : chargement de la page (HTTPS), affichage de la météo, lisibilité à distance.
- Ajuster tailles, mode nuit et contenu selon le retour.
- Idées possibles : autres informations sur le dashboard.
