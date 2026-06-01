# Grof Ontwerp — Mijn Gezondheid PWA

**Module:** Eenvoudige mobiele App
**Student:** [Naam invullen]
**Datum:** mei 2026

---

## 1. Wat bouw ik?

Een Progressive Web App waarmee gebruikers dagelijks hun gezondheid kunnen bijhouden. De gebruiker kan gegevens invoeren over voeding, sport, slaap, water en gewicht. Alles wordt opgeslagen in de browser via LocalStorage — er is geen server nodig. De app werkt ook offline en is installeerbaar op een telefoon.

---

## 2. Sitemap

```
Mijn Gezondheid PWA
│
├── index.html        → Dashboard (startpagina)
│   ├── Begroeting
│   ├── 3 statistieken: vandaag / deze week / actieve dagen
│   └── Laatste 5 ingevoerde items
│
├── invoer.html       → Nieuw item toevoegen
│   └── Formulier met datum, categorie, omschrijving, waarde en eenheid
│
└── overzicht.html    → Volledig overzicht
    ├── Filter op dag / week / maand
    ├── Balkgrafiek per categorie
    └── Lijst met alle items + verwijderknop
```

Navigatie: vaste balk onderaan op mobiel, zijbalk op desktop.

---

## 3. Paginastructuur

### Dashboard (index.html)

De startpagina toont een begroeting en drie statistieken: hoeveel items vandaag zijn ingevoerd, hoeveel deze week en hoeveel unieke dagen de gebruiker actief is geweest. Daaronder staan de vijf meest recent toegevoegde items.

| Element | Wat het doet |
|---|---|
| `<header>` | Logo en taalknop (NL/EN) |
| `<nav>` | Navigatielinks naar de drie pagina's |
| Stats-blok | Drie tegels met getallen uit LocalStorage |
| Recente items | Laatste 5 items, dynamisch geladen via app.js |
| `<footer>` | Naam van de app |

### Invoerpagina (invoer.html)

Hier voert de gebruiker een nieuw gezondheidsitem in. Het formulier heeft vijf velden:

| Veld | Type | Verplicht |
|---|---|---|
| Datum | `date` | Ja — standaard vandaag |
| Categorie | `select` | Ja — keuze uit 6 opties |
| Omschrijving | `text` | Ja — max. 80 tekens |
| Waarde | `number` | Ja — bijv. 350 of 45 |
| Eenheid | `select` | Nee — kcal, ml, min, kg, etc. |

Bij ontbrekende velden verschijnt een foutmelding. Na opslaan krijgt de gebruiker een bevestiging.

### Overzichtspagina (overzicht.html)

De gebruiker kan hier zijn gegevens filteren op dag, week of maand. Er wordt een balkgrafiek getoond per categorie en een lijst van alle items. Elk item heeft een verwijderknop.

---

## 4. Datamodel

Alle data wordt opgeslagen als JSON in de browser:

```
localStorage['gezondheid_items']  →  lijst van items
localStorage['taal_voorkeur']     →  'nl' of 'en'
```

### Item-object

Elk gezondheidsitem ziet er zo uit:

```json
{
  "id": "1716384000000",
  "datum": "2025-05-22",
  "categorie": "sport",
  "omschrijving": "Hardlopen",
  "waarde": 45,
  "eenheid": "min",
  "aangemaaktOp": "2025-05-22T10:00:00.000Z"
}
```

| Veld | Type | Uitleg |
|---|---|---|
| id | string | Timestamp als unieke ID |
| datum | string | ISO-datum (YYYY-MM-DD) |
| categorie | string | voeding / sport / slaap / water / gewicht / overig |
| omschrijving | string | Wat de gebruiker heeft ingevuld |
| waarde | number | Het getal, bijv. 350 of 45 |
| eenheid | string | kcal, ml, min, kg, etc. |
| aangemaaktOp | string | Exacte aanmaaktijd (optioneel) |

---

## 5. Bestandsstructuur

```
gezondheidspwa/
├── index.html        Dashboard
├── invoer.html       Invoerpagina
├── overzicht.html    Overzichtspagina
├── style.css         CSS (mobile-first, Flexbox en Grid)
├── app.js            JavaScript: opslag, taalswitch, logica
├── sw.js             Service Worker voor offline gebruik
├── manifest.json     PWA-manifest voor installatie
├── lang/
│   ├── nl.json       Alle teksten in het Nederlands
│   └── en.json       Alle teksten in het Engels
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

Alles werkt client-side. Er is geen backend of database nodig.

---

## 6. PWA-techniek

| Vereiste | Hoe ik het heb opgelost |
|---|---|
| Installeerbaar | manifest.json met naam, iconen en themakleur |
| Offline | sw.js met cache-first strategie: bestanden worden gecacht bij eerste bezoek |
| Responsive | CSS mobile-first, media queries vanaf 768px voor desktop-layout |
| Data bewaren | localStorage met JSON.stringify en JSON.parse |

---

## 7. Functionele eisen

| Eis | Omschrijving | Status |
|---|---|---|
| F1 | Dagelijks items toevoegen | ✅ |
| F2 | Overzicht per dag, week en maand | ✅ |
| F3 | Items verwijderen | ✅ |
| F5 | Item heeft datum, categorie, omschrijving en waarde | ✅ |
| F6 | Data opgeslagen in LocalStorage | ✅ |
| F7 | Installeerbaar via manifest.json | ✅ |
| F8 | Offline werking via service worker | ✅ |
| F9 | Responsive op mobiel en desktop | ✅ |
| F10 | Semantische HTML5-elementen | ✅ |
| F11 | Taalswitch Nederlands / Engels | ✅ |
