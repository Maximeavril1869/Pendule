# Architecture de Pendule

Application web statique, sans serveur ni outil de build, hébergée sur GitHub Pages.

```
index.html                    Structure : bloc horloge, deux blocs météo (Châtel-Guyon, Vichy), ligne de statut
style.css                     Mise en page plein écran, unités vmin (s'adapte portrait/paysage), mode nuit
app.js                        Logique : horloge, lecture de la météo, affichage, gestion d'erreurs
meteo.json                    Données météo des deux villes, écrites automatiquement (ne pas modifier à la main)
.github/workflows/meteo.yml   GitHub Actions : lance scripts/meteo.py toutes les 15 min et enregistre meteo.json
scripts/meteo.py              Récupération de la météo : Open-Meteo, sinon MET Norway (secours)
diag.html                     Page de test réseau (outil de diagnostic, non utilisée au quotidien)
```

## Flux

```
Navigateur (iPad 2)
  ├─ majHorloge()  toutes les minutes pile -> #heure, #date, classe "nuit" sur <body>
  └─ majMeteo()    toutes les 5 min
        ├─ XMLHttpRequest -> meteo.json (même site) -> afficher() : température, emoji, vent, min/max du jour, prévisions heure par heure (toutes les heures suivantes, lendemain compris, jusqu'à 24, ajustées à la place disponible par lignes de 6)
        └─ repli si le fichier est absent ou a plus de 2 h : appel direct à api.open-meteo.com
           (ne fonctionne que dans Safari, voir ci-dessous)

GitHub Actions (meteo.yml), à H+03, H+18, H+33 et H+48 de chaque heure (GitHub ne garantit pas l'heure exacte)
  └─ scripts/meteo.py : Open-Meteo (2 essais), sinon MET Norway en secours, converti au même format
     -> meteo.json (champ "source" indique laquelle) -> commit sur main si changement -> GitHub Pages republie
```

## Choix imposés par iOS 9.3.5

- JavaScript ES5 uniquement : `var`, `function`, `XMLHttpRequest`.
- CSS avec préfixes `-webkit-` pour flexbox et transitions.
- Pas de service worker, donc pas de PWA hors ligne : la page a besoin du réseau pour charger et pour la météo.
- Constaté sur l'iPad 2 (test `diag.html`) : lancée depuis l'icône de l'écran d'accueil (mode plein écran), la page ne peut lire que les fichiers de son propre site ; toute requête vers un autre site échoue (statut 0, état 4). Dans Safari, l'appel direct à Open-Meteo fonctionne. D'où le fichier `meteo.json`, servi par le même site. Cause exacte non identifiée.

## Paramètres modifiables (début de `app.js`)

- `VILLES` : nom et coordonnées GPS.
- `INTERVALLE_METEO` : fréquence de l'appel direct (repli).
- `meteo.yml` : horaires de récupération (`cron`) et villes (coordonnées dans les adresses).
- `NUIT_DEBUT` / `NUIT_FIN` : plage du mode nuit.
