# Pendule

Dashboard pour un vieil iPad 2 (iOS 9.3.5) posé sur une cheminée : une grande horloge et la météo de **Châtel-Guyon** et de **Vichy**, mises à jour automatiquement.

## Ce que fait la page

- Heure et date en français, en grand, mises à jour à la minute.
- Météo actuelle (température, ciel, vent, min/max du jour) et prévisions heure par heure jusqu'à minuit (au moins 8 heures affichées, jusqu'à 18) pour les deux villes ; données de l'API gratuite [Open-Meteo](https://open-meteo.com) (sans clé), récupérées par GitHub toutes les 30 minutes environ dans `meteo.json`. La page relit ce fichier toutes les 5 minutes.
- Mode nuit automatique entre 22 h et 7 h : affichage très atténué.
- En cas de problème, un message orange en bas d'écran indique la cause et la page réessaie toute seule.

## Utilisation sur l'iPad

1. Ouvrir l'adresse GitHub Pages du projet dans Safari.
2. Bouton Partager > « Sur l'écran d'accueil » pour l'ouvrir en plein écran, sans barre Safari.
3. Réglages > Affichage et luminosité > Verrouillage auto > **Jamais**, et laisser l'iPad branché.

## Contraintes techniques

Le code est volontairement en ES5 et en CSS simple (pas de `let`/`const`, de fonctions fléchées, de `fetch`), car Safari d'iOS 9 ne gère pas les standards récents. Voir `ARCHITECTURE.md`.

Le suivi du travail est dans `CARNET_DE_BORD.md`.

## Licence

Tous droits réservés. Voir le fichier `LICENSE`.
