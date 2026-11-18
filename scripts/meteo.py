#!/usr/bin/env python3
"""Récupère la météo de Châtel-Guyon et Vichy et écrit meteo.json.

Source principale : Open-Meteo. Si elle ne répond pas (les serveurs GitHub y accèdent de
façon intermittente), source de secours : MET Norway, convertie au même format.
Le fichier produit a la forme de la réponse Open-Meteo (current / daily / hourly), plus
un champ "source" au premier niveau.
"""
import json
import sys
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

VILLES = {
    "chatel": (45.9197, 3.0667),
    "vichy": (46.1278, 3.4260),
}
UA = "Pendule/1.0 github.com/Maximeavril1869/Pendule"
PARIS = ZoneInfo("Europe/Paris")


def telecharger(url, tentatives, delai):
    derniere = None
    for i in range(tentatives):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=delai) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            derniere = e
            print("  essai %d échoué : %s" % (i + 1, e), file=sys.stderr)
            time.sleep(3)
    raise RuntimeError(derniere)


# ---------- Source principale : Open-Meteo ----------
def open_meteo(lat, lon):
    url = (
        "https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s"
        "&current=temperature_2m,weather_code,wind_speed_10m"
        "&daily=weather_code,temperature_2m_max,temperature_2m_min"
        "&hourly=temperature_2m,weather_code,precipitation_probability,precipitation"
        "&timezone=Europe%%2FParis&forecast_days=2&wind_speed_unit=kmh" % (lat, lon)
    )
    return telecharger(url, 2, 12)


# ---------- Source de secours : MET Norway ----------
def code_wmo(symbole):
    """Convertit un symbole MET Norway (ex. 'lightrainshowers_day') en code météo WMO approché."""
    s = symbole.split("_")[0]
    if "thunder" in s:
        return 95
    if "snow" in s:
        return 85 if "showers" in s else 73
    if "sleet" in s:
        return 83 if "showers" in s else 67
    if "rain" in s:
        forte = s.startswith("heavy")
        legere = s.startswith("light")
        if "showers" in s:
            return 82 if forte else (80 if legere else 81)
        return 65 if forte else (61 if legere else 63)
    return {"clearsky": 0, "fair": 1, "partlycloudy": 2, "cloudy": 3, "fog": 45}.get(s, 3)


def met_norway(lat, lon):
    url = "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=%.4f&lon=%.4f" % (lat, lon)
    brut = telecharger(url, 2, 15)
    maintenant = datetime.now(PARIS).replace(minute=0, second=0, microsecond=0)
    fin = (maintenant + timedelta(days=1)).replace(hour=23)
    lignes = []
    for e in brut["properties"]["timeseries"]:
        t = datetime.fromisoformat(e["time"].replace("Z", "+00:00")).astimezone(PARIS)
        if t < maintenant or t > fin:
            continue
        d = e["data"]
        det = d["instant"]["details"]
        h1 = d.get("next_1_hours")
        h6 = d.get("next_6_hours")
        if not h1:
            continue  # au-delà de l'échéance horaire : on s'arrête
        symbole = h1["summary"]["symbol_code"]
        pluie = h1["details"].get("precipitation_amount", 0)
        proba = (h1["details"].get("probability_of_precipitation")
                 if "probability_of_precipitation" in h1["details"]
                 else (h6["details"].get("probability_of_precipitation") if h6 else None))
        lignes.append({
            "t": t, "temp": det["air_temperature"], "vent": det.get("wind_speed", 0) * 3.6,
            "code": code_wmo(symbole), "pluie": pluie, "proba": proba,
        })
    if not lignes:
        raise RuntimeError("MET Norway : aucune donnée horaire")
    cur = lignes[0]
    jours = []
    for delta in (0, 1):
        jour = (maintenant + timedelta(days=delta)).date()
        temps = [l["temp"] for l in lignes if l["t"].date() == jour]
        codes = [l["code"] for l in lignes if l["t"].date() == jour]
        if not temps:
            raise RuntimeError("MET Norway : jour %s sans données" % jour)
        jours.append((jour.isoformat(), max(temps), min(temps), max(codes)))
    return {
        "current": {
            "time": cur["t"].strftime("%Y-%m-%dT%H:00"),
            "temperature_2m": cur["temp"], "weather_code": cur["code"], "wind_speed_10m": cur["vent"],
        },
        "daily": {
            "time": [j[0] for j in jours],
            "weather_code": [j[3] for j in jours],
            "temperature_2m_max": [j[1] for j in jours],
            "temperature_2m_min": [j[2] for j in jours],
        },
        "hourly": {
            "time": [l["t"].strftime("%Y-%m-%dT%H:00") for l in lignes],
            "temperature_2m": [l["temp"] for l in lignes],
            "weather_code": [l["code"] for l in lignes],
            "precipitation_probability": [l["proba"] for l in lignes],
            "precipitation": [l["pluie"] for l in lignes],
        },
    }


def main():
    sortie = {}
    sources = set()
    for nom, (lat, lon) in VILLES.items():
        try:
            sortie[nom] = open_meteo(lat, lon)
            sources.add("Open-Meteo")
            print("%s : Open-Meteo OK" % nom)
        except Exception as e:  # noqa: BLE001
            print("%s : Open-Meteo indisponible (%s), bascule sur MET Norway" % (nom, e), file=sys.stderr)
            sortie[nom] = met_norway(lat, lon)
            sources.add("MET Norway")
            print("%s : MET Norway OK" % nom)
    sortie["source"] = " + ".join(sorted(sources))
    with open("meteo.json", "w", encoding="utf-8") as f:
        json.dump(sortie, f, ensure_ascii=False)
    print("meteo.json écrit (%s)" % sortie["source"])


if __name__ == "__main__":
    main()
