# Gezond Leven Tracker

Deze app is een mobiele PWA voor gezondheidstracking met offline-functionaliteit, LocalStorage CRUD en een overzichtspagina met grafiek.

## Belangrijkste functionaliteit
- Dashboard met calorieënteller en dagdoelen
- Invoerpagina om items toe te voegen met categorie, omschrijving, calorieën en maaltijd
- Overzichtspagina met filter op dag/week/maand
- Stappenmeter met doel, progress-balk en +/− knoppen
- Responsive UI met hamburger drawer-menu
- PWA met `manifest.json`, service worker en offline caching
- Mobile-first wireframe prototypes in `pages/wireframes`

## Lokaal draaien
1. Open een terminal in de projectmap
2. Installeer dependencies (optioneel, alleen nodig voor de Express-server)

```powershell
npm install
```

3. Start de server:

```powershell
npm start
```

4. Open in je browser:

- http://localhost:3000
- http://localhost:3000/pages/wireframes/index.html

## Testpunten
- `index.html` werkt op mobiele en desktop resoluties
- `invoer.html` voegt items toe en slaat ze op in LocalStorage
- `overzicht.html` toont items, filtert per periode en visualiseert data
- De app werkt offline via service worker
- De PWA is installeerbaar met een manifest en icon

## Wireframes
Wireframepagina's:
- `pages/wireframes/index.html`
- `pages/wireframes/invoer.html`
- `pages/wireframes/overzicht.html`
