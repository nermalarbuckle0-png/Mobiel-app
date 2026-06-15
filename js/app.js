'use strict';

function getItems() {
  return JSON.parse(localStorage.getItem('items') || '[]');
}

function saveItems(items) {
  localStorage.setItem('items', JSON.stringify(items));
}

function tellerAanpassen(diff) {
  const current = parseInt(localStorage.getItem('calorie') || '0', 10);
  const next = Math.max(0, current + diff);
  localStorage.setItem('calorie', next);
  const el = document.getElementById('calorie-waarde');
  if (el) el.textContent = next + ' kcal';
}

function slaOp() {
  const omschrijvingEl = document.getElementById('invoer-omschrijving');
  const calorieEl = document.getElementById('invoer-calorie');
  const omschrijving = omschrijvingEl ? omschrijvingEl.value.trim() : '';
  if (!omschrijving) {
    alert('Vul een omschrijving in.');
    return;
  }

  const item = {
    id: Date.now(),
    datum: new Date().toLocaleDateString('nl-NL'),
    iso: new Date().toISOString(),
    categorie: document.getElementById('invoer-categorie').value,
    omschrijving: omschrijving,
    calorie: calorieEl ? calorieEl.value : '',
    maaltijd: document.getElementById('invoer-maaltijd').value,
  };

  const items = getItems();
  items.unshift(item);
  saveItems(items);

  if (item.calorie) {
    const current = parseInt(localStorage.getItem('calorie') || '0', 10);
    localStorage.setItem('calorie', current + parseInt(item.calorie, 10));
  }

  if (omschrijvingEl) omschrijvingEl.value = '';
  if (calorieEl) calorieEl.value = '';

  const feedback = document.getElementById('succes-melding');
  if (feedback) {
    feedback.textContent = '✅ Opgeslagen!';
    setTimeout(() => { feedback.textContent = ''; }, 2000);
  }

  if (window.location.pathname.endsWith('overzicht.html')) {
    laadOverzicht();
    renderChart();
  }
}

function withinPeriod(itemIso, periode) {
  if (!itemIso) return false;
  const itemDate = new Date(itemIso);
  const now = new Date();

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

  return true;
}

function laadOverzicht() {
  const lijst = document.getElementById('overzicht-lijst');
  if (!lijst) return;

  const periode = document.querySelector('.periode-tab.actief')?.dataset.periode || 'dag';
  const items = getItems().filter(item => withinPeriod(item.iso || item.datum, periode));

  if (!items.length) {
    lijst.innerHTML = '<li class="leeg">Nog geen items — <a href="invoer.html">voeg iets toe</a>!</li>';
    return;
  }

  const icons = { voeding: '🍎', sport: '🏃', slaap: '😴', water: '💧', gewicht: '⚖️' };

  lijst.innerHTML = items.slice(0, 20).map(item => {
    const meal = item.maaltijd || '';
    const meta = item.datum + ' · ' + meal + (item.calorie ? ' · ' + item.calorie + ' kcal' : '');
    return `
      <li class="item-rij">
        <span class="item-icoon">${icons[item.categorie] || '📝'}</span>
        <div class="item-info">
          <span class="item-naam">${item.omschrijving}</span>
          <span class="item-meta">${meta}</span>
        </div>
        <button class="verwijder-knop" onclick="verwijderItem(${item.id})">✕</button>
      </li>`;
  }).join('');
}

function verwijderItem(id) {
  saveItems(getItems().filter(item => item.id !== id));
  laadOverzicht();
  renderChart();
}

function getGoal() {
  return parseInt(localStorage.getItem('stappen-doel') || '10000', 10);
}

function updateProgress() {
  const current = parseInt(localStorage.getItem('stappen') || '0', 10);
  const goal = getGoal();
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;

  if (fill) fill.style.width = pct + '%';
  if (text) {
    text.textContent = pct >= 100 ? 'Doel behaald!' : `${current} van ${goal} stappen`;
  }
}

function renderChart() {
  const line = document.getElementById('chart-line');
  const fill = document.getElementById('chart-fill');
  if (!line || !fill) return;

  const periode = document.querySelector('.periode-tab.actief')?.dataset.periode || 'dag';
  const now = new Date();
  const items = getItems();
  let buckets = [];

  if (periode === 'dag') {
    buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, value: 0 }));
    items.forEach(item => {
      const date = new Date(item.iso || item.datum);
      if (date.toDateString() !== now.toDateString()) return;
      const hour = date.getHours();
      buckets[hour].value += parseInt(item.calorie || 0, 10) || 0;
    });
  } else if (periode === 'week') {
    buckets = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - index));
      day.setHours(0, 0, 0, 0);
      return { date: day, value: 0 };
    });
    items.forEach(item => {
      const date = new Date(item.iso || item.datum);
      buckets.forEach(bucket => {
        const nextDay = new Date(bucket.date);
        nextDay.setDate(bucket.date.getDate() + 1);
        if (date >= bucket.date && date < nextDay) bucket.value += parseInt(item.calorie || 0, 10) || 0;
      });
    });
  } else {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    buckets = Array.from({ length: daysInMonth }, (_, index) => ({ date: new Date(now.getFullYear(), now.getMonth(), index + 1), value: 0 }));
    items.forEach(item => {
      const date = new Date(item.iso || item.datum);
      buckets.forEach(bucket => {
        const nextDay = new Date(bucket.date);
        nextDay.setDate(bucket.date.getDate() + 1);
        if (date >= bucket.date && date < nextDay) bucket.value += parseInt(item.calorie || 0, 10) || 0;
      });
    });
  }

  const values = buckets.map(bucket => bucket.value);
  const max = Math.max(...values, 1);
  const width = 300;
  const height = 60;
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values.map((value, index) => {
    const x = Math.round(index * step);
    const y = Math.round(height - (value / max) * (height - 6));
    return `${x},${y}`;
  });

  line.setAttribute('points', points.join(' '));
  fill.setAttribute('points', `${points.join(' ')} ${width},60 0,60`);
}

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    const swUrl = window.location.pathname.includes('/pages/') ? '../js/sw.js' : 'js/sw.js';
    // Root scope bepalen: bijvoorbeeld /Mobiel-app/ voor zowel /Mobiel-app/ als /Mobiel-app/pages/
    const pathname = window.location.pathname;
    let rootScope = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    if (pathname.includes('/pages/')) {
      rootScope = pathname.substring(0, pathname.indexOf('/pages/') + 1);
    }
    
    navigator.serviceWorker.register(swUrl, { scope: rootScope })
      .then(registration => console.log('Service worker registered:', registration.scope))
      .catch(error => console.warn('Service worker failed:', error));
  }
});


function pageLink(name) {
  const inPages = window.location.pathname.includes('/pages/');
  if (name === 'home') {
    return inPages ? '../index.html' : 'index.html';
  }
  return inPages ? `${name}.html` : `pages/${name}.html`;
}

function setupDrawer() {
  if (document.querySelector('.drawer')) return;
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
  drawer.addEventListener('click', e => {
    if (e.target === drawer || e.target.classList.contains('drawer-close')) drawer.classList.remove('open');
  });
  document.querySelectorAll('.menu-knop').forEach(btn => btn.addEventListener('click', () => drawer.classList.add('open')));
}

function setupGoalButtons() {
  const goalChange = document.getElementById('goal-change');
  const goalInputWrap = document.getElementById('goal-input-wrap');
  const goalInput = document.getElementById('goal-input');
  const goalSave = document.getElementById('goal-save');
  const goalCancel = document.getElementById('goal-cancel');

  if (goalChange) {
    goalChange.addEventListener('click', () => {
      if (!goalInputWrap) return;
      goalInputWrap.style.display = goalInputWrap.style.display === 'flex' ? 'none' : 'flex';
      if (goalInput) goalInput.value = localStorage.getItem('stappen-doel') || '10000';
    });
  }

  if (goalSave) {
    goalSave.addEventListener('click', () => {
      if (goalInput) localStorage.setItem('stappen-doel', Math.max(0, parseInt(goalInput.value, 10) || 0));
      if (goalInputWrap) goalInputWrap.style.display = 'none';
      updateProgress();
    });
  }

  if (goalCancel) {
    goalCancel.addEventListener('click', () => {
      if (goalInputWrap) goalInputWrap.style.display = 'none';
    });
  }
}

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

function setupStepControls() {
  const stappenEl = document.getElementById('stappen-waarde');
  const stapPlus = document.getElementById('stappen-plus');
  const stapMinus = document.getElementById('stappen-minus');
  const stappenToggle = document.getElementById('stappen-toggle');

  if (stappenEl) {
    const current = parseInt(localStorage.getItem('stappen') || '0', 10);
    stappenEl.textContent = current + ' stappen';
  }

  if (stappenToggle) {
    stappenToggle.checked = localStorage.getItem('stappen-enabled') === 'true';
    stappenToggle.addEventListener('change', () => {
      localStorage.setItem('stappen-enabled', stappenToggle.checked);
    });
  }

  function changeSteps(delta) {
    const current = Math.max(0, parseInt(localStorage.getItem('stappen') || '0', 10) + delta);
    localStorage.setItem('stappen', current);
    if (stappenEl) stappenEl.textContent = current + ' stappen';
    updateProgress();
  }

  if (stapPlus) stapPlus.addEventListener('click', () => changeSteps(100));
  if (stapMinus) stapMinus.addEventListener('click', () => changeSteps(-100));
}

function setupToggleButtons() {
  document.querySelectorAll('[data-doel]').forEach(input => {
    const key = 'doel-' + input.dataset.doel;
    input.checked = localStorage.getItem(key) === 'true';
    input.addEventListener('change', () => {
      localStorage.setItem(key, input.checked);
    });
  });
}


function initPage() {
  const calorieElement = document.getElementById('calorie-waarde');
  if (calorieElement) {
    const current = parseInt(localStorage.getItem('calorie') || '0', 10);
    calorieElement.textContent = current + ' kcal';
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
