# Mijn Gezondheid PWA 🌿

Een Progressive Web App waarmee je dagelijks je gezondheid bijhoudt — voeding, sport, slaap, water en gewicht. Werkt ook offline en is installeerbaar op je telefoon.

Gebouwd als eindopdracht voor de module **Eenvoudige mobiele App** 

## Live demo

🔗 [Vul hier je GitHub Pages URL in]

---

## Wat doet de app?

- **Toevoegen** — log elke dag gezondheidsgegevens met datum, categorie, omschrijving en waarde
- **Overzicht** — bekijk je gegevens gefilterd op dag, week of maand
- **Grafiek** — zie in één oogopslag welke categorieën je het meest gebruikt
- **Verwijderen** — verwijder losse items via de prullenbakknop
- **Offline** — de app werkt zonder internetverbinding dankzij een service worker
- **Installeerbaar** — voeg de app toe aan je beginscherm via de installeerknop
- **Taalswitch** — schakel tussen Nederlands en Engels

---

## Projectstructuur

```
gezondheidspwa/
├── index.html        Dashboard
├── invoer.html       Nieuwe invoer toevoegen
├── overzicht.html    Overzicht met filter en grafiek
├── style.css         Mobile-first CSS
├── app.js            JavaScript (CRUD, taalswitch, PWA-logica)
├── sw.js             Service Worker
├── manifest.json     PWA manifest
├── lang/
│   ├── nl.json       Nederlandse teksten
│   └── en.json       Engelse teksten
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Lokaal opstarten

```bash
git clone https://github.com/JOUWGEBRUIKERSNAAM/gezondheidspwa.git
cd gezondheidspwa
npx serve .
```

Open daarna `http://localhost:3000` in je browser.

> Niet openen via `file://` — de service worker werkt alleen over HTTP.

---

## Technologie

| Onderdeel | Technologie |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Data opslag | LocalStorage (geen server nodig) |
| Offline | Service Worker (cache-first) |
| Installeerbaar | Web App Manifest |
| Vertalingen | JSON taalbestanden (nl/en) |
| Hosting | GitHub Pages |

---

## Vereisten checklist

| # | Eis | Status |
|---|-----|--------|
| F1 | Dagelijks gezondheidsitems toevoegen | ✅ |
| F2 | Overzicht per dag, week en maand | ✅ |
| F3 | Items verwijderen | ✅ |
| F5 | Item bevat datum, categorie, omschrijving en waarde | ✅ |
| F6 | Data opgeslagen in LocalStorage | ✅ |
| F7 | Installeerbaar via manifest.json | ✅ |
| F8 | Offline gebruik via service worker | ✅ |
| F9 | Responsive op mobiel en desktop | ✅ |
| F10 | Semantische HTML5 structuur | ✅ |
| F11 | Taalswitch Nederlands / Engels | ✅ |
