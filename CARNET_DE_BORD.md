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
- Premier essai du workflow : bloqué par une expiration de connexion vers Open-Meteo depuis GitHub (ponctuelle : un test ultérieur depuis GitHub a répondu normalement). Ajout de délais maximum, de plus d'essais et d'un identifiant de requête.
- Workflow lancé à la main : succès, `meteo.json` écrit sur `main` (données Châtel-Guyon et Vichy), GitHub Pages republié automatiquement.
- À vérifier sur l'iPad en plein écran : que la météo s'affiche depuis l'icône. Les mises à jour automatiques à H+07 et H+37 n'ont pas encore été observées sur la durée.
- Documentation (README, ARCHITECTURE) mise à jour.

## 2026-11-18 - Prévisions heure par heure

- Demande de Maxime : voir les prévisions de la journée ; choix : une ligne par heure, en remplacement des prévisions sur 3 jours.
- Affichage : météo actuelle + min/max du jour, puis une cellule par heure (heure, icône, température, probabilité de pluie) jusqu'à minuit, au moins 8 heures (déborde sur le lendemain si besoin), 18 au plus. `forecast_days=2`, ajout de `hourly=` dans `meteo.yml` et dans l'appel direct.
- Vérifié en simulation (Chromium 1024x768 et 768x1024, 7 h et 11 h) : tout tient à l'écran. Rendu des emojis non vérifié sur iOS 9. Horloge réduite (21 -> 19 vmin) pour tenir.
- `app.js?v=5`. Ancien `meteo.json` sans données horaires : la page s'affiche sans la grille horaire jusqu'à la prochaine récupération.

## 2026-11-18 - Pluie : probabilité et quantité

- Demande de Maxime : afficher les deux. Chaque heure montre désormais la probabilité de pluie (%, en bleu) et la quantité (mm, affichée seulement si > 0). Ajout de `precipitation` aux données horaires (`meteo.yml` et appel direct).
- Pour que 3 lignes d'heures tiennent encore à l'écran : horloge réduite (19 -> 17 vmin), marges et tailles de texte resserrées. Vérifié en simulation 1024x768 et 768x1024.
- `app.js?v=6`.

## 2026-11-18 - Source de secours MET Norway

- Constat : depuis les serveurs GitHub, Open-Meteo est joignable par intermittence (2 lancements sur 4 ont expiré). Un test avait montré que MET Norway répond depuis GitHub.
- Ajout de `scripts/meteo.py` : Open-Meteo d'abord (2 essais), sinon MET Norway, converti au même format. Le champ `source` de `meteo.json` et le texte du bas d'écran indiquent la source utilisée. Le workflow lance ce script.
- Testé en local avec des données simulées au format MET Norway (conversion et bascule). Non testé avec la vraie réponse de MET Norway : à vérifier au premier lancement où Open-Meteo échoue. Avec MET Norway, le min/max du jour ne couvre que les heures restantes, et la probabilité de pluie peut être absente.
- `app.js?v=7`.

## 2026-11-18 (après-midi) - Le planning automatique ne se déclenche pas

- Constat à 13 h 54 : l'iPad réaffiche « connexion impossible, statut 0, état 4 ». Cause : `meteo.json` datait de 11 h 15 (plus de 2 h), car **aucun lancement automatique** n'a eu lieu depuis la mise en place (seuls les lancements manuels ont tourné). Le planning `7,37 * * * *` ne se déclenche pas ; le workflow est pourtant actif. Aucun créneau (13 h 07 UTC compris, vérifié jusqu'à 13 h 21) n'a démarré. Cause de GitHub non identifiée.
- Lancement manuel à 12 h 54 UTC : données remises à jour, tout refonctionne.
- Page (`app.js?v=8`) : quand les données ont plus de 2 h, elles restent affichées avec le message « Météo du JJ/MM à HH:MM : mise à jour automatique en retard » au lieu d'une erreur réseau trompeuse. Testé en simulation.
- Reste à résoudre : fiabiliser le déclenchement automatique de la récupération.
