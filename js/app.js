'use strict';

// ── Lees en schrijf items uit localStorage ──
function getItems() {
  return JSON.parse(localStorage.getItem('items') || '[]');
}

function saveItems(items) {
  localStorage.setItem('items', JSON.stringify(items));
}

// ── Calorieën teller: +50 of -50 per klik ──
function tellerAanpassen(verschil) {
  const huidig = parseInt(localStorage.getItem('calorie') || '0');
  const nieuw  = Math.max(0, huidig + verschil);
  localStorage.setItem('calorie', nieuw);
  document.getElementById('calorie-waarde').textContent = nieuw + ' kcal';
}

// ── Item opslaan vanuit invoer.html ──
function slaOp() {
  const omschrijving = document.getElementById('invoer-omschrijving').value.trim();
  if (!omschrijving) { alert('Vul een omschrijving in.'); return; }

  const item = {
    id:           Date.now(),
    datum:        new Date().toLocaleDateString('nl-NL'),
    categorie:    document.getElementById('invoer-categorie').value,
    omschrijving: omschrijving,
    calorie:      document.getElementById('invoer-calorie').value,
    maaltijd:     document.getElementById('invoer-maaltijd').value,
  };

  const items = getItems();
  items.unshift(item);
  saveItems(items);

  // Calorieën optellen bij teller
  if (item.calorie) {
    const huidig = parseInt(localStorage.getItem('calorie') || '0');
    localStorage.setItem('calorie', huidig + parseInt(item.calorie));
  }

  // Formulier leegmaken en bevestiging tonen
  document.getElementById('invoer-omschrijving').value = '';
  document.getElementById('invoer-calorie').value = '';
  document.getElementById('succes-melding').textContent = '✅ Opgeslagen!';
  setTimeout(() => { document.getElementById('succes-melding').textContent = ''; }, 2000);
}

// ── Items tonen in overzicht.html ──
function laadOverzicht() {
  const lijst = document.getElementById('overzicht-lijst');
  if (!lijst) return;

  const items = getItems();
  const icoon = { voeding:'🍎', sport:'🏃', slaap:'😴', water:'💧', gewicht:'⚖️' };

  lijst.innerHTML = items.length === 0
    ? '<li class="leeg">Nog geen items — <a href="invoer.html">voeg iets toe</a>!</li>'
    : items.slice(0, 10).map(item => `
        <li class="item-rij">
          <span class="item-icoon">${icoon[item.categorie] || '📝'}</span>
          <div class="item-info">
            <span class="item-naam">${item.omschrijving}</span>
            <span class="item-meta">${item.datum} · ${item.maaltijd}${item.calorie ? ' · ' + item.calorie + ' kcal' : ''}</span>
          </div>
          <button class="verwijder-knop" onclick="verwijderItem(${item.id})">✕</button>
        </li>
      `).join('');
}

function verwijderItem(id) {
  saveItems(getItems().filter(i => i.id !== id));
  laadOverzicht();
}

// ── Start: laad alles wat op deze pagina nodig is ──
document.addEventListener('DOMContentLoaded', () => {

  // Calorieën teller (index.html)
  const tellerEl = document.getElementById('calorie-waarde');
  if (tellerEl) tellerEl.textContent = (localStorage.getItem('calorie') || '0') + ' kcal';

  // Doelen toggles (index.html)
  document.querySelectorAll('[data-doel]').forEach(input => {
    const naam = input.dataset.doel;
    input.checked = localStorage.getItem('doel-' + naam) === 'true';
    input.addEventListener('change', () => {
      localStorage.setItem('doel-' + naam, input.checked);
    });
  });

  // Overzicht lijst
  laadOverzicht();
});