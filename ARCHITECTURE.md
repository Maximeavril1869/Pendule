# Architecture de Pendule

Application web statique, sans serveur ni outil de build, hébergée sur GitHub Pages.

```
index.html   Structure : bloc horloge, deux blocs météo (Châtel-Guyon, Vichy), ligne de statut
style.css    Mise en page plein écran, unités vmin (s'adapte portrait/paysage), mode nuit
app.js       Logique : horloge, appels météo, affichage, gestion d'erreurs
```

## Flux

```
Navigateur (iPad 2)
  ├─ majHorloge()  toutes les minutes pile -> #heure, #date, classe "nuit" sur <body>
  └─ majMeteo()    toutes les 15 min (1 min après un échec)
        ├─ XMLHttpRequest -> api.open-meteo.com (Châtel-Guyon)
        ├─ XMLHttpRequest -> api.open-meteo.com (Vichy)
        └─ afficher() -> température, emoji, vent, 3 jours de prévisions
```

## Choix imposés par iOS 9.3.5

- JavaScript ES5 uniquement : `var`, `function`, `XMLHttpRequest`.
- CSS avec préfixes `-webkit-` pour flexbox et transitions.
- Pas de service worker, donc pas de PWA hors ligne : la page a besoin du réseau pour charger et pour la météo.
- Risque connu : certificats HTTPS récents parfois refusés par iOS 9 (racines expirées). Si la page ou l'API ne charge pas, le message d'erreur du bas d'écran le signale.

## Paramètres modifiables (début de `app.js`)

- `VILLES` : nom et coordonnées GPS.
- `INTERVALLE_METEO` : fréquence de rafraîchissement.
- `NUIT_DEBUT` / `NUIT_FIN` : plage du mode nuit.
