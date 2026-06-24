'use strict'; // strikte modus: voorkomt slordige JS-fouten

/* ============================================================
  APP.JS — Client-side logica voor de gezondheid-app
  ============================================================ */
// Dit bestand regelt alles in de browser (opslag, UI, grafiek, etc.)

/* ============================================================
  OPSLAG — localStorage functies
  ============================================================ */

function getItems() {
  return JSON.parse(localStorage.getItem('items') || '[]'); 
  // haalt items op of geeft lege array terug
}

function saveItems(items) {
  localStorage.setItem('items', JSON.stringify(items));
  // slaat items op als tekst
}

function getStoredInt(key, defaultValue = 0) {
  return parseInt(localStorage.getItem(key) || defaultValue, 10);
  // leest getal uit storage of default
}

/* ============================================================
   CALORIEËN — teller
   ============================================================ */

function tellerAanpassen(diff) {
  const nieuw = Math.max(0, getStoredInt('calorie') + diff);
  // rekent nieuwe waarde uit (niet onder 0)

  localStorage.setItem('calorie', nieuw);
  // slaat nieuwe waarde op

  const el = document.getElementById('calorie-waarde');
  // zoekt UI element

  if (el) el.textContent = nieuw + ' kcal';
  // update tekst op scherm
}

/* ============================================================
   INVOER — item opslaan
   ============================================================ */

function slaOp() {
  const omschrijvingEl = document.getElementById('invoer-omschrijving');
  const calorieEl = document.getElementById('invoer-calorie');

  const omschrijving = omschrijvingEl?.value.trim() ?? '';
  // haalt tekst op en verwijdert spaties

  if (!omschrijving) {
    alert('Vul een omschrijving in.');
    return;
    // stopt als niets ingevuld is
  }

  const item = {
    id: Date.now(), // uniek id op tijd
    datum: new Date().toLocaleDateString('nl-NL'), // leesbare datum
    iso: new Date().toISOString(), // exacte datum
    categorie: document.getElementById('invoer-categorie').value,
    omschrijving, // naam item
    calorie: calorieEl?.value ?? '', // calorie input
    maaltijd: document.getElementById('invoer-maaltijd').value,
  };

  const items = getItems();
  items.unshift(item);
  // zet nieuw item bovenaan

  saveItems(items);
  // sla lijst op

  if (item.calorie) {
    const huidig = getStoredInt('calorie');
    localStorage.setItem('calorie', huidig + parseInt(item.calorie, 10));
    // telt calorieën op
  }

  if (omschrijvingEl) omschrijvingEl.value = '';
  if (calorieEl) calorieEl.value = '';
  // reset inputvelden

  toonSuccesMelding();
  // laat melding zien

  if (window.location.pathname.endsWith('overzicht.html')) {
    laadOverzicht();
    renderChart();
    // update pagina als je op overzicht zit
  }
}

/* succesmelding tonen */
function toonSuccesMelding() {
  const feedback = document.getElementById('succes-melding');
  if (!feedback) return;

  feedback.textContent = '✅ Opgeslagen!';
  // zet tekst

  setTimeout(() => {
    feedback.textContent = '';
  }, 2000);
  // wist na 2 sec
}

/* ============================================================
   FILTER — periode check
   ============================================================ */

function withinPeriod(itemIso, periode) {
  if (!itemIso) return false; // geen datum = skip

  const itemDate = new Date(itemIso);
  const now = new Date();

  if (periode === 'dag') {
    return itemDate.toDateString() === now.toDateString();
    // zelfde dag
  }

  if (periode === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    // 7 dagen terug

    return itemDate >= start && itemDate <= now;
  }

  if (periode === 'maand') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    // eerste dag van maand

    return itemDate >= start && itemDate <= now;
  }

  return true;
  // fallback
}

function getActievePeriode() {
  return document.querySelector('.periode-tab.actief')?.dataset.periode || 'dag';
  // leest actieve tab
}

/* ============================================================
   OVERZICHT
   ============================================================ */

const CATEGORIE_ICONEN = {
  voeding: '🍎',
  sport: '🏃',
  slaap: '😴',
  water: '💧',
  gewicht: '⚖️',
};
// icoontjes per categorie

function laadOverzicht() {
  const lijst = document.getElementById('overzicht-lijst');
  if (!lijst) return;

  const periode = getActievePeriode();
  const items = getItems().filter(item =>
    withinPeriod(item.iso || item.datum, periode)
  );
  // filter op periode

  if (!items.length) {
    lijst.innerHTML = '<li class="leeg">Nog geen items</li>';
    return;
  }

  lijst.innerHTML = items.slice(0, 20).map(maakItemRij).join('');
  // toon max 20 items
}

function maakItemRij(item) {
  const icoon = CATEGORIE_ICONEN[item.categorie] || '📝';
  // kies icoon

  const meta = [item.datum, item.maaltijd, item.calorie ? item.calorie + ' kcal' : '']
    .filter(Boolean)
    .join(' · ');
  // extra info samenvoegen

  return `
    <li class="item-rij">
      <span class="item-icoon">${icoon}</span>
      <div class="item-info">
        <span class="item-naam">${item.omschrijving}</span>
        <span class="item-meta">${meta}</span>
      </div>
      <button onclick="verwijderItem(${item.id})">✕</button>
    </li>`;
  // HTML rij
}

function verwijderItem(id) {
  saveItems(getItems().filter(item => item.id !== id));
  // verwijder item

  laadOverzicht();
  renderChart();
  // refresh UI
}

/* ============================================================
   STAPPEN
   ============================================================ */

function getGoal() {
  return getStoredInt('stappen-doel', 10000);
  // standaard 10k stappen
}

function updateProgress() {
  const current = getStoredInt('stappen');
  const goal = getGoal();

  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  // percentage berekenen

  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');

  if (fill) fill.style.width = pct + '%';
  // balk vullen

  if (text) {
    text.textContent = pct >= 100
      ? 'Doel behaald!'
      : `${current} van ${goal} stappen`;
  }
  // tekst aanpassen
}

/* ============================================================
   GRAFIEK
   ============================================================ */

function buildChartBuckets(periode, items) {
  const now = new Date();

  if (periode === 'dag') {
    const buckets = Array(24).fill(0);
    // 24 uur

    items.forEach(item => {
      const date = new Date(item.iso || item.datum);
      if (date.toDateString() !== now.toDateString()) return;
      buckets[date.getHours()] += parseInt(item.calorie || 0, 10) || 0;
    });

    return buckets;
  }

  if (periode === 'week') {
    const buckets = Array.from({ length: 7 }, () => 0);
    // 7 dagen

    items.forEach(item => {
      const date = new Date(item.iso || item.datum);

      buckets.forEach((_, i) => {
        const start = new Date(now);
        start.setDate(now.getDate() - (6 - i));
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 1);

        if (date >= start && date < end) {
          buckets[i] += parseInt(item.calorie || 0, 10) || 0;
        }
      });
    });

    return buckets;
  }

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const buckets = Array.from({ length: daysInMonth }, () => 0);
  // dagen in maand

  items.forEach(item => {
    const date = new Date(item.iso || item.datum);
    buckets.forEach((_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth(), i + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      if (date >= start && date < end) {
        buckets[i] += parseInt(item.calorie || 0, 10) || 0;
      }
    });
  });

  return buckets;
}

/* grafiek tekenen */
function renderChart() {
  const line = document.getElementById('chart-line');
  const fill = document.getElementById('chart-fill');
  if (!line || !fill) return;

  const periode = getActievePeriode();
  const values = buildChartBuckets(periode, getItems());
  const max = Math.max(...values, 1);

  const W = 300;
  const H = 60;
  const step = values.length > 1 ? W / (values.length - 1) : W;

  const points = values.map((v, i) => {
    const x = i * step;
    const y = H - (v / max) * (H - 6);
    return `${x},${y}`;
  });

  line.setAttribute('points', points.join(' '));
  fill.setAttribute('points', `${points.join(' ')} ${W},${H} 0,${H}`);
}

/* ============================================================
   SERVICE WORKER
   ============================================================ */

window.addEventListener('load', () => {
  if (!('serviceWorker' in navigator)) return;

  const base = window.location.origin + '/';
  const swUrl = new URL('js/sw.js', base).href;
  // locatie van service worker

  navigator.serviceWorker.register(swUrl)
    .then(() => console.log('SW ok'))
    .catch(() => console.warn('SW fout'));
});

/* ============================================================
   NAVIGATIE + UI SETUP
   ============================================================ */

function pageLink(name) {
  const inPages = window.location.pathname.includes('/pages/');
  return inPages ? `${name}.html` : `pages/${name}.html`;
  // juiste pad bepalen
}

function setupDrawer() {
  if (document.querySelector('.drawer')) return;

  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  // maak menu

  drawer.innerHTML = `
    <div class="drawer-panel">
      <button class="drawer-close">✕</button>
      <nav>
        <a href="${pageLink('home')}">Home</a>
        <a href="${pageLink('invoer')}">Invoer</a>
        <a href="${pageLink('overzicht')}">Overzicht</a>
      </nav>
    </div>`;

  document.body.appendChild(drawer);

  drawer.addEventListener('click', e => {
    if (e.target === drawer || e.target.classList.contains('drawer-close')) {
      drawer.classList.remove('open');
    }
  });
  // sluit menu

  document.querySelectorAll('.menu-knop').forEach(btn =>
    btn.addEventListener('click', () => drawer.classList.add('open'))
  );
}

/* ============================================================
   INIT
   ============================================================ */

function initPage() {
  const calorieElement = document.getElementById('calorie-waarde');
  if (calorieElement) {
    calorieElement.textContent = getStoredInt('calorie') + ' kcal';
  }
  // init calorie UI

  setupDrawer();
  setupStepControls?.();
  setupGoalButtons?.();
  setupToggleButtons?.();
  setupPeriodTabs?.();
  updateProgress();
  renderChart();
  laadOverzicht();
  // start app
}

document.addEventListener('DOMContentLoaded', initPage);