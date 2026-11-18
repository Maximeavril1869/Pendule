/* Pendule - horloge + météo Châtel-Guyon et Vichy
   Écrit en ES5 volontairement (pas de let/const, flèches, fetch, template strings)
   pour fonctionner sur Safari d'iOS 9.3.5 (iPad 2). */
(function () {
  'use strict';

  var VILLES = [
    { id: 'ville-chatel', cle: 'chatel', nom: 'Chatel-Guyon', lat: 45.9197, lon: 3.0667 },
    { id: 'ville-vichy', cle: 'vichy', nom: 'Vichy', lat: 46.1278, lon: 3.4260 }
  ];
  var INTERVALLE_METEO = 15 * 60 * 1000; // 15 minutes
  var NUIT_DEBUT = 22; // heure de début du mode nuit
  var NUIT_FIN = 7;    // heure de fin du mode nuit

  var MAX_HEURES = 24;  // nombre maximum d'heures prévues affichées
  var COLONNES = 6;     // cellules par ligne (voir .h dans style.css : 16,66 %)
  var cellules = {};    // HTML des cellules horaires de chaque ville
  var essaisRates = 0;
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var JOURS_COURTS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
    'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function $(id) { return document.getElementById(id); }

  /* ---------- Horloge ---------- */
  function majHorloge() {
    var d = new Date();
    var h = d.getHours();
    $('heure').textContent = pad(h) + ':' + pad(d.getMinutes());
    $('date').textContent = JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear();
    var nuit = (h >= NUIT_DEBUT || h < NUIT_FIN);
    document.body.className = nuit ? 'nuit' : '';
    setTimeout(majHorloge, 1000 * (60 - d.getSeconds()) + 50); // prochaine minute pile
  }

  /* ---------- Météo ---------- */
  // Codes WMO (Open-Meteo) -> emoji + libellé
  function decrire(code) {
    if (code === 0) return ['☀️', 'Ciel dégagé'];
    if (code === 1) return ['🌤', 'Plutôt dégagé'];
    if (code === 2) return ['⛅', 'Partiellement nuageux'];
    if (code === 3) return ['☁️', 'Couvert'];
    if (code === 45 || code === 48) return ['🌫', 'Brouillard'];
    if (code >= 51 && code <= 57) return ['🌦', 'Bruine'];
    if (code >= 61 && code <= 67) return ['🌧', 'Pluie'];
    if (code >= 71 && code <= 77) return ['❄️', 'Neige'];
    if (code >= 80 && code <= 82) return ['🌦', 'Averses'];
    if (code === 85 || code === 86) return ['🌨', 'Averses de neige'];
    if (code >= 95) return ['⛈', 'Orage'];
    return ['', ''];
  }

  function url(v) {
    return 'https://api.open-meteo.com/v1/forecast?latitude=' + v.lat + '&longitude=' + v.lon +
      '&current=temperature_2m,weather_code,wind_speed_10m' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
      '&hourly=temperature_2m,weather_code,precipitation_probability,precipitation' +
      '&timezone=Europe%2FParis&forecast_days=2&wind_speed_unit=kmh';
  }

  function arrondi(x) { return Math.round(x); }

  // Prévisions heure par heure : toutes les heures suivantes (y compris le lendemain), jusqu'à 24.
  // Le nombre affiché est ensuite ajusté à la place disponible (ajusterHeures), par lignes entières.
  function heureReelle() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours());
  }

  function heuresAVenir(hourly, heureCourante) {
    var res = [], i;
    // données anciennes : on part de l'heure réelle de l'iPad, pas de celle du relevé
    if (heureReelle() > heureCourante.substring(0, 13)) { heureCourante = heureReelle(); }
    for (i = 0; i < hourly.time.length; i++) {
      if (hourly.time[i].substring(0, 13) > heureCourante.substring(0, 13)) { res.push(i); }
    }
    return res.slice(0, MAX_HEURES);
  }

  // Remplit chaque ville avec le plus grand nombre de lignes d'heures qui tient à l'écran (au moins 1 ligne)
  function ajusterHeures() {
    var app = $('app'), max = 0, n, j, c;
    for (j = 0; j < VILLES.length; j++) {
      c = cellules[VILLES[j].id];
      if (c && c.length > max) { max = c.length; }
    }
    if (!max) { return; }
    n = Math.ceil(max / COLONNES) * COLONNES;
    while (true) {
      for (j = 0; j < VILLES.length; j++) {
        c = cellules[VILLES[j].id] || [];
        if (VILLES[j].bloc) { VILLES[j].bloc.innerHTML = c.slice(0, n).join(''); }
      }
      if (app.scrollHeight <= app.clientHeight + 1 || n <= COLONNES) { break; }
      n -= COLONNES;
    }
  }

  function afficher(v, data) {
    var bloc = $(v.id);
    var cur = data.current;
    var jour = data.daily;
    var desc = decrire(cur.weather_code);
    bloc.getElementsByClassName('icone')[0].textContent = desc[0];
    bloc.getElementsByClassName('temp')[0].textContent = arrondi(cur.temperature_2m) + '°';
    bloc.getElementsByClassName('detail')[0].textContent =
      desc[1] + ' · vent ' + arrondi(cur.wind_speed_10m) + ' km/h' +
      ' · ' + arrondi(jour.temperature_2m_min[0]) + '° / ' + arrondi(jour.temperature_2m_max[0]) + '°';
    var cells = [];
    if (data.hourly) {
      var idx = heuresAVenir(data.hourly, cur.time), k, i, dh, pluie, mm, hh, classe;
      for (k = 0; k < idx.length; k++) {
        i = idx[k];
        dh = decrire(data.hourly.weather_code[i]);
        pluie = data.hourly.precipitation_probability ? data.hourly.precipitation_probability[i] : null;
        mm = data.hourly.precipitation ? data.hourly.precipitation[i] : 0;
        // heures du lendemain : date différente de celle des données actuelles
        classe = data.hourly.time[i].substring(0, 10) !== heureReelle().substring(0, 10) ? 'h demain' : 'h';
        cells.push('<div class="' + classe + '"><div class="hh">' + data.hourly.time[i].substring(11, 13) + 'h</div>' +
          '<div class="hi">' + dh[0] + '</div>' +
          '<div class="ht">' + arrondi(data.hourly.temperature_2m[i]) + '°</div>' +
          '<div class="hp">' + (pluie ? pluie + '%' : '&nbsp;') + '</div>' +
          '<div class="hm">' + (mm > 0 ? String(Math.round(mm * 10) / 10).replace('.', ',') + ' mm' : '&nbsp;') + '</div></div>');
      }
    }
    cellules[v.id] = cells;
    v.bloc = bloc.getElementsByClassName('heures')[0];
    ajusterHeures();
  }

  function chargerVille(v, fin) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url(v), true);
    xhr.timeout = 20000;
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          afficher(v, JSON.parse(xhr.responseText));
          fin(null);
        } catch (e) {
          fin('données illisibles (' + v.nom + ') : ' + (e && e.message ? e.message : e) +
            ' | réponse : ' + String(xhr.responseText).substring(0, 120));
        }
      } else {
        fin('erreur HTTP ' + xhr.status + ' (' + v.nom + ') : ' + String(xhr.responseText).substring(0, 120));
      }
    };
    xhr.onerror = function () {
      fin('connexion impossible (' + v.nom + '), statut ' + xhr.status + ', état ' + xhr.readyState);
    };
    xhr.ontimeout = function () { fin('délai dépassé (' + v.nom + ')'); };
    xhr.send();
  }

  function majMeteoDirecte(garderStatut) {
    var restant = VILLES.length;
    var erreurs = [];
    var i;
    function fin(err) {
      if (err) { erreurs.push(err); }
      restant--;
      if (restant === 0) {
        var s = $('statut');
        var d = new Date();
        if (erreurs.length === 0) {
          essaisRates = 0;
          s.className = '';
          s.textContent = 'Météo mise à jour à ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) +
            ' · données Open-Meteo';
        } else if (garderStatut) {
          // données anciennes déjà affichées : on garde leur message, nouvel essai dans 5 min
          setTimeout(majMeteo, 5 * 60 * 1000);
          return;
        } else {
          s.className = 'erreur';
          essaisRates++;
          // 3 essais rapides (10 s) puis un essai par minute
          var delai = essaisRates <= 3 ? 10000 : 60000;
          s.textContent = 'Météo indisponible : ' + erreurs.join(' ; ') +
            ' · nouvel essai dans ' + (delai / 1000) + ' s';
          setTimeout(function () { majMeteoDirecte(false); }, delai);
          return;
        }
        setTimeout(majMeteo, INTERVALLE_METEO);
      }
    }
    for (i = 0; i < VILLES.length; i++) { chargerVille(VILLES[i], fin); }
  }

  // Lecture de meteo.json (écrit régulièrement par GitHub Actions, même site que la page :
  // c'est le seul accès réseau qui fonctionne en mode plein écran sur iOS 9).
  function heureDonnees(t) { return t.substring(11, 16); }

  function ageEnMinutes(t) {
    // t = "2026-11-18T10:45" (heure de Paris, comme l'iPad)
    var d = new Date(parseInt(t.substring(0, 4), 10), parseInt(t.substring(5, 7), 10) - 1,
      parseInt(t.substring(8, 10), 10), parseInt(t.substring(11, 13), 10), parseInt(t.substring(14, 16), 10));
    return (new Date().getTime() - d.getTime()) / 60000;
  }

  function majMeteo() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'meteo.json?t=' + new Date().getTime(), true);
    xhr.timeout = 20000;
    function repli() { majMeteoDirecte(); }
    xhr.onload = function () {
      var data, i, t, age, s;
      if (xhr.status !== 200) { repli(); return; }
      try {
        data = JSON.parse(xhr.responseText);
        for (i = 0; i < VILLES.length; i++) { afficher(VILLES[i], data[VILLES[i].cle]); }
        t = data.chatel.current.time;
        age = ageEnMinutes(t);
      } catch (e) { repli(); return; }
      s = $('statut');
      if (age > 120) {
        s.className = 'erreur';
        s.textContent = 'Météo du ' + t.substring(8, 10) + '/' + t.substring(5, 7) + ' à ' + heureDonnees(t) +
          ' : mise à jour automatique en retard';
        majMeteoDirecte(true); // tente l'appel direct (fonctionne dans Safari, pas en plein écran)
        return;
      }
      essaisRates = 0;
      s.className = '';
      s.textContent = 'Météo de ' + heureDonnees(t) + ' · données ' + (data.source || 'Open-Meteo');
      setTimeout(majMeteo, 5 * 60 * 1000);
    };
    xhr.onerror = repli;
    xhr.ontimeout = repli;
    xhr.send();
  }

  window.addEventListener('resize', ajusterHeures, false);
  majHorloge();
  majMeteo();
})();
