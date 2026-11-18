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
