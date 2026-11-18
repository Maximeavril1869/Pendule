/* Pendule - horloge + météo Châtel-Guyon et Vichy
   Écrit en ES5 volontairement (pas de let/const, flèches, fetch, template strings)
   pour fonctionner sur Safari d'iOS 9.3.5 (iPad 2). */
(function () {
  'use strict';

  var VILLES = [
    { id: 'ville-chatel', nom: 'Chatel-Guyon', lat: 45.9197, lon: 3.0667 },
    { id: 'ville-vichy', nom: 'Vichy', lat: 46.1278, lon: 3.4260 }
  ];
  var INTERVALLE_METEO = 15 * 60 * 1000; // 15 minutes
  var NUIT_DEBUT = 22; // heure de début du mode nuit
  var NUIT_FIN = 7;    // heure de fin du mode nuit

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
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=Europe%2FParis&forecast_days=3&wind_speed_unit=kmh';
  }

  function arrondi(x) { return Math.round(x); }

  function afficher(v, data) {
    var bloc = $(v.id);
    var cur = data.current;
    var jour = data.daily;
    var desc = decrire(cur.weather_code);
    bloc.getElementsByClassName('icone')[0].textContent = desc[0];
    bloc.getElementsByClassName('temp')[0].textContent = arrondi(cur.temperature_2m) + '°';
    bloc.getElementsByClassName('detail')[0].textContent =
      desc[1] + ' · vent ' + arrondi(cur.wind_speed_10m) + ' km/h';
    var html = '';
    var i;
    for (i = 0; i < jour.time.length; i++) {
      var p = jour.time[i].split('-');
      var dj = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
      var nom = i === 0 ? 'auj.' : JOURS_COURTS[dj.getDay()];
      var dd = decrire(jour.weather_code[i]);
      var pluie = jour.precipitation_probability_max ? jour.precipitation_probability_max[i] : null;
      html += '<div class="jour"><span class="jn">' + nom + '</span>' +
        '<span class="ji">' + dd[0] + '</span> ' +
        arrondi(jour.temperature_2m_min[i]) + '° / ' + arrondi(jour.temperature_2m_max[i]) + '°' +
        (pluie !== null && pluie !== undefined ? ' · ' + pluie + '%' : '') + '</div>';
    }
    bloc.getElementsByClassName('jours')[0].innerHTML = html;
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

  function majMeteo() {
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
        } else {
          s.className = 'erreur';
          essaisRates++;
          // 3 essais rapides (10 s) puis un essai par minute
          var delai = essaisRates <= 3 ? 10000 : 60000;
          s.textContent = 'Météo indisponible : ' + erreurs.join(' ; ') +
            ' · nouvel essai dans ' + (delai / 1000) + ' s';
          setTimeout(majMeteo, delai);
          return;
        }
        setTimeout(majMeteo, INTERVALLE_METEO);
      }
    }
    for (i = 0; i < VILLES.length; i++) { chargerVille(VILLES[i], fin); }
  }

  majHorloge();
  majMeteo();
})();
