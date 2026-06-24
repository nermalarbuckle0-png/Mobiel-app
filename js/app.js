'use strict';

/* ============================================================
   OPSLAG — lezen en schrijven naar localStorage
   ============================================================ */

/** Haal de lijst van opgeslagen items op (altijd een array). */
function getItems() {
  return JSON.parse(localStorage.getItem('items') || '[]');
}

/** Sla de volledige itemlijst op in localStorage. */
function saveItems(items) {
  localStorage.setItem('items', JSON.stringify(items));
}

/** Lees een getal uit localStorage, met een standaardwaarde als fallback. */
function getStoredInt(key, defaultValue = 0) {
  return parseInt(localStorage.getItem(key) || defaultValue, 10);
}

/* ============================================================
   CALORIEËN — teller bijhouden
   ============================================================ */

/**
 * Pas de calorieteller aan met een positieve of negatieve waarde.
 * De teller gaat nooit onder nul.
 */
function tellerAanpassen(diff) {
  const nieuw = Math.max(0, getStoredInt('calorie') + diff);
  localStorage.setItem('calorie', nieuw);

  const el = document.getElementById('calorie-waarde');
  if (el) el.textContent = nieuw + ' kcal';
}

/* ============================================================
   INVOER — nieuw item opslaan
   ============================================================ */

/** Sla een nieuw item op vanuit het invoerformulier. */
function slaOp() {
  const omschrijvingEl = document.getElementById('invoer-omschrijving');
  const calorieEl     = document.getElementById('invoer-calorie');
  const omschrijving  = omschrijvingEl?.value.trim() ?? '';

  if (!omschrijving) {
    alert('Vul een omschrijving in.');
    return;
  }

  // Bouw het nieuwe item op
  const item = {
    id:           Date.now(),
    datum:        new Date().toLocaleDateString('nl-NL'),
    iso:          new Date().toISOString(),
    categorie:    document.getElementById('invoer-categorie').value,
    omschrijving,
    calorie:      calorieEl?.value ?? '',
    maaltijd:     document.getElementById('invoer-maaltijd').value,
  };

  // Voeg toe aan het begin van de lijst (nieuwste bovenaan)
  const items = getItems();
  items.unshift(item);
  saveItems(items);

  // Update calorieteller als er een waarde is ingevuld
  if (item.calorie) {
    const huidig = getStoredInt('calorie');
    localStorage.setItem('calorie', huidig + parseInt(item.calorie, 10));
  }

  // Formulier leegmaken
  if (omschrijvingEl) omschrijvingEl.value = '';
  if (calorieEl)      calorieEl.value = '';

  // Toon een korte bevestiging
  toonSuccesMelding();

  // Vernieuw het overzicht als we daar al op staan
  if (window.location.pathname.endsWith('overzicht.html')) {
    laadOverzicht();
    renderChart();
  }
}

/** Toon de succesmelding 2 seconden lang. */
function toonSuccesMelding() {
  const feedback = document.getElementById('succes-melding');
  if (!feedback) return;
  feedback.textContent = '✅ Opgeslagen!';
  setTimeout(() => { feedback.textContent = ''; }, 2000);
}

/* ============================================================
   FILTERING — items filteren op tijdsperiode
   ============================================================ */

/**
 * Bepaal of een item binnen de geselecteerde periode valt.
 * @param {string} itemIso - ISO-datumstring van het item
 * @param {string} periode - 'dag', 'week' of 'maand'
 */
function withinPeriod(itemIso, periode) {
  if (!itemIso) return false;

  const itemDate = new Date(itemIso);
  const now      = new Date();

  if (periode === 'dag') {
    return itemDate.toDateString() === now.toDateString();
  }

  if (periode === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return itemDate >= start && itemDate <= now;
  }

  if (periode === 'maand') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return itemDate >= start && itemDate <= now;
  }

  return true; // geen geldige periode → alles tonen
}

/** Geeft de actief geselecteerde periode terug ('dag', 'week' of 'maand'). */
function getActievePeriode() {
  return document.querySelector('.periode-tab.actief')?.dataset.periode || 'dag';
}

/* ============================================================
   OVERZICHT — lijst renderen
   ============================================================ */

/** Emoji-iconen per categorie. */
const CATEGORIE_ICONEN = {
  voeding: '🍎',
  sport:   '🏃',
  slaap:   '😴',
  water:   '💧',
  gewicht: '⚖️',
};

/** Laad en render de itemlijst in het overzicht. */
function laadOverzicht() {
  const lijst = document.getElementById('overzicht-lijst');
  if (!lijst) return;

  const periode = getActievePeriode();
  const items   = getItems().filter(item => withinPeriod(item.iso || item.datum, periode));

  if (!items.length) {
    lijst.innerHTML = '<li class="leeg">Nog geen items — <a href="invoer.html">voeg iets toe</a>!</li>';
    return;
  }

  lijst.innerHTML = items.slice(0, 20).map(maakItemRij).join('');
}

/**
 * Genereer de HTML voor één item in de lijst.
 * @param {Object} item
 */
function maakItemRij(item) {
  const icoon = CATEGORIE_ICONEN[item.categorie] || '📝';
  const meal  = item.maaltijd || '';
  const meta  = [item.datum, meal, item.calorie ? item.calorie + ' kcal' : '']
    .filter(Boolean)
    .join(' · ');

  return `
    <li class="item-rij">
      <span class="item-icoon">${icoon}</span>
      <div class="item-info">
        <span class="item-naam">${item.omschrijving}</span>
        <span class="item-meta">${meta}</span>
      </div>
      <button class="verwijder-knop" onclick="verwijderItem(${item.id})">✕</button>
    </li>`;
}

/** Verwijder een item op basis van id en vernieuw de weergave. */
function verwijderItem(id) {
  saveItems(getItems().filter(item => item.id !== id));
  laadOverzicht();
  renderChart();
}

/* ============================================================
   STAPPEN — voortgangsbalk
   ============================================================ */

/** Geeft het stappendoel op uit localStorage. */
function getGoal() {
  return getStoredInt('stappen-doel', 10000);
}

/** Update de voortgangsbalk voor stappen. */
function updateProgress() {
  const current = getStoredInt('stappen');
  const goal    = getGoal();
  const pct     = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;

  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');

  if (fill) fill.style.width = pct + '%';
  if (text) {
    text.textContent = pct >= 100
      ? 'Doel behaald!'
      : `${current} van ${goal} stappen`;
  }
}

/* ============================================================
   GRAFIEK — calorieverloop renderen
   ============================================================ */

/**
 * Bouw buckets op voor de grafiek op basis van de periode.
 * @param {string} periode - 'dag', 'week' of 'maand'
 * @param {Array}  items
 * @returns {number[]} Een array van caloriewaarden per bucket
 */
function buildChartBuckets(periode, items) {
  const now = new Date();

  if (periode === 'dag') {
    // 24 buckets, één per uur
    const buckets = Array(24).fill(0);
    items.forEach(item => {
      const date = new Date(item.iso || item.datum);
      if (date.toDateString() !== now.toDateString()) return;
      buckets[date.getHours()] += parseInt(item.calorie || 0, 10) || 0;
    });
    return buckets;
  }

  if (periode === 'week') {
    // 7 buckets, één per dag (laatste 7 dagen)
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - i));
      day.setHours(0, 0, 0, 0);
      return { date: day, value: 0 };
    });
    items.forEach(item => {
      const date = new Date(item.iso || item.datum);
      buckets.forEach(bucket => {
        const next = new Date(bucket.date);
        next.setDate(bucket.date.getDate() + 1);
        if (date >= bucket.date && date < next) {
          bucket.value += parseInt(item.calorie || 0, 10) || 0;
        }
      });
    });
    return buckets.map(b => b.value);
  }

  // Maand: één bucket per dag in de huidige maand
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const buckets = Array.from({ length: daysInMonth }, (_, i) => ({
    date:  new Date(now.getFullYear(), now.getMonth(), i + 1),
    value: 0,
  }));
  items.forEach(item => {
    const date = new Date(item.iso || item.datum);
    buckets.forEach(bucket => {
      const next = new Date(bucket.date);
      next.setDate(bucket.date.getDate() + 1);
      if (date >= bucket.date && date < next) {
        bucket.value += parseInt(item.calorie || 0, 10) || 0;
      }
    });
  });
  return buckets.map(b => b.value);
}

/** Render de SVG-lijnengrafiek voor calorieën. */
function renderChart() {
  const line = document.getElementById('chart-line');
  const fill = document.getElementById('chart-fill');
  if (!line || !fill) return;

  const periode = getActievePeriode();
  const values  = buildChartBuckets(periode, getItems());
  const max     = Math.max(...values, 1);

  const W    = 300;
  const H    = 60;
  const step = values.length > 1 ? W / (values.length - 1) : W;

  // Bereken de x,y coördinaten per datapunt
  const points = values.map((v, i) => {
    const x = Math.round(i * step);
    const y = Math.round(H - (v / max) * (H - 6));
    return `${x},${y}`;
  });

  line.setAttribute('points', points.join(' '));
  fill.setAttribute('points', `${points.join(' ')} ${W},${H} 0,${H}`);
}

/* ============================================================
   SERVICE WORKER — PWA-ondersteuning
   ============================================================ */

window.addEventListener('load', () => {
  if (!('serviceWorker' in navigator)) return;

  // Pad verschilt afhankelijk van of we in de /pages/ map zitten
  const swUrl = window.location.pathname.includes('/pages/')
    ? '../js/sw.js'
    : 'js/sw.js';

  navigator.serviceWorker.register(swUrl)
    .then(reg => console.log('Service worker geregistreerd:', reg.scope))
    .catch(err => console.warn('Service worker mislukt:', err));
});

/* ============================================================
   NAVIGATIE — links en hamburgermenu
   ============================================================ */

/**
 * Geeft het juiste pad naar een pagina terug,
 * rekening houdend met de /pages/ submap.
 */
function pageLink(name) {
  const inPages = window.location.pathname.includes('/pages/');
  if (name === 'home') return inPages ? '../index.html' : 'index.html';
  return inPages ? `${name}.html` : `pages/${name}.html`;
}

/** Maak het uitschuifmenu (drawer) aan en koppel de sluitknop. */
function setupDrawer() {
  if (document.querySelector('.drawer')) return; // Voorkom duplicaten

  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.innerHTML = `
    <div class="drawer-panel">
      <button class="drawer-close" aria-label="Close">✕</button>
      <nav>
        <a href="${pageLink('home')}">Home</a>
        <a href="${pageLink('invoer')}">Invoeren</a>
        <a href="${pageLink('overzicht')}">Overzicht</a>
      </nav>
    </div>`;
  document.body.appendChild(drawer);

  // Sluit drawer bij klik op de achtergrond of sluitknop
  drawer.addEventListener('click', e => {
    if (e.target === drawer || e.target.classList.contains('drawer-close')) {
      drawer.classList.remove('open');
    }
  });

  // Open drawer via alle hamburgerknopppen op de pagina
  document.querySelectorAll('.menu-knop').forEach(btn =>
    btn.addEventListener('click', () => drawer.classList.add('open'))
  );
}

/* ============================================================
   SETUP — interactieve elementen koppelen
   ============================================================ */

/** Koppel de knoppen voor het aanpassen van het stappendoel. */
function setupGoalButtons() {
  const goalChange    = document.getElementById('goal-change');
  const goalInputWrap = document.getElementById('goal-input-wrap');
  const goalInput     = document.getElementById('goal-input');
  const goalSave      = document.getElementById('goal-save');
  const goalCancel    = document.getElementById('goal-cancel');

  goalChange?.addEventListener('click', () => {
    if (!goalInputWrap) return;
    const isOpen = goalInputWrap.style.display === 'flex';
    goalInputWrap.style.display = isOpen ? 'none' : 'flex';
    if (goalInput) goalInput.value = localStorage.getItem('stappen-doel') || '10000';
  });

  goalSave?.addEventListener('click', () => {
    if (goalInput) {
      localStorage.setItem('stappen-doel', Math.max(0, parseInt(goalInput.value, 10) || 0));
    }
    if (goalInputWrap) goalInputWrap.style.display = 'none';
    updateProgress();
  });

  goalCancel?.addEventListener('click', () => {
    if (goalInputWrap) goalInputWrap.style.display = 'none';
  });
}

/** Koppel de tabknoppen voor periodefiltering. */
function setupPeriodTabs() {
  document.querySelectorAll('.periode-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.periode-tab').forEach(el => el.classList.remove('actief'));
      btn.classList.add('actief');
      laadOverzicht();
      renderChart();
    });
  });
}

/** Koppel de plus/min-knoppen voor het bijhouden van stappen. */
function setupStepControls() {
  const stappenEl     = document.getElementById('stappen-waarde');
  const stapPlus      = document.getElementById('stappen-plus');
  const stapMinus     = document.getElementById('stappen-minus');
  const stappenToggle = document.getElementById('stappen-toggle');

  // Toon het huidig aantal stappen
  if (stappenEl) {
    stappenEl.textContent = getStoredInt('stappen') + ' stappen';
  }

  // Sla de aan/uit-status van de stappenteller op
  if (stappenToggle) {
    stappenToggle.checked = localStorage.getItem('stappen-enabled') === 'true';
    stappenToggle.addEventListener('change', () => {
      localStorage.setItem('stappen-enabled', stappenToggle.checked);
    });
  }

  /** Pas het stappenaantal aan en update de UI. */
  function changeSteps(delta) {
    const nieuw = Math.max(0, getStoredInt('stappen') + delta);
    localStorage.setItem('stappen', nieuw);
    if (stappenEl) stappenEl.textContent = nieuw + ' stappen';
    updateProgress();
  }

  stapPlus?.addEventListener('click',  () => changeSteps(100));
  stapMinus?.addEventListener('click', () => changeSteps(-100));
}

/** Koppel toggle-knoppen die hun staat opslaan in localStorage. */
function setupToggleButtons() {
  document.querySelectorAll('[data-doel]').forEach(input => {
    const key = 'doel-' + input.dataset.doel;
    input.checked = localStorage.getItem(key) === 'true';
    input.addEventListener('change', () => {
      localStorage.setItem(key, input.checked);
    });
  });
}

/* ============================================================
   INITIALISATIE — pagina opstarten
   ============================================================ */

/** Initialiseer alle componenten zodra de DOM geladen is. */
function initPage() {
  // Toon opgeslagen caloriewaarde
  const calorieElement = document.getElementById('calorie-waarde');
  if (calorieElement) {
    calorieElement.textContent = getStoredInt('calorie') + ' kcal';
  }

  setupDrawer();
  setupStepControls();
  setupGoalButtons();
  setupToggleButtons();
  setupPeriodTabs();
  updateProgress();
  renderChart();
  laadOverzicht();
}

document.addEventListener('DOMContentLoaded', initPage);