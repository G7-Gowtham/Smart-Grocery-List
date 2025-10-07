// Unified script for multi-page Smart Grocery App
(() => {
  const GROCERIES_KEY = 'groceries';
  const CUSTOM_KEY = 'customRecipes';
  const DARK_KEY = 'darkMode';

  let groceries = JSON.parse(localStorage.getItem(GROCERIES_KEY) || '[]');
  let customRecipes = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');

  // Elements
  const darkToggle = document.querySelectorAll('#dark-toggle');
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('main-nav');
  const page = document.body.getAttribute('data-page');

  // Apply stored dark mode
  if (localStorage.getItem(DARK_KEY) === 'true') document.body.classList.add('dark');
  document.querySelectorAll('#dark-toggle').forEach(btn => {
    btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem(DARK_KEY, document.body.classList.contains('dark'));
      document.querySelectorAll('#dark-toggle').forEach(b => b.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙');
    });
  });

  // Hamburger toggle
  if (hamburger && mainNav) {
    hamburger.addEventListener('click', () => {
      mainNav.classList.toggle('open');
      // animate hamburger
      hamburger.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(90deg)' }], { duration: 180, fill: 'forwards' });
    });
    // close nav when clicking outside on small screens
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        if (!mainNav.contains(e.target) && !hamburger.contains(e.target)) {
          mainNav.classList.remove('open');
        }
      }
    });
  }

  // Highlight active nav link
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  // common utils
  function save() {
    localStorage.setItem(GROCERIES_KEY, JSON.stringify(groceries));
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customRecipes));
  }
  function daysLeft(dateStr) {
    const now = new Date();
    const expiry = new Date(dateStr + 'T23:59:59');
    return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  }
  function escapeHtml(s) { return s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

  // PAGE: add-item
  if (page === 'add-item') {
    const form = document.getElementById('grocery-form');
    form && form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('item').value.trim();
      const expiry = document.getElementById('expiry').value;
      if (!name || !expiry) return;
      groceries.push({ name, expiry });
      save();
      form.reset();
      alert(`Added ${name}`);
    });
  }

  // PAGE: your-items
  function renderItems() {
    const list = document.getElementById('grocery-list');
    const search = document.getElementById('search');
    if (!list) return;
    const term = search ? search.value.trim().toLowerCase() : '';
    list.innerHTML = '';
    groceries.map((g, idx) => ({ ...g, idx }))
      .filter(g => g.name.toLowerCase().includes(term))
      .forEach(g => {
        const days = daysLeft(g.expiry);
        const div = document.createElement('div');
        div.className = 'item ' + (days < 0 ? 'expired' : (days <= 3 ? 'soon' : 'normal'));
        div.innerHTML = `<div><strong>${escapeHtml(g.name)}</strong> <small>(${g.expiry})</small></div>`;
        const right = document.createElement('div');
        const del = document.createElement('button');
        del.className = 'delete-btn';
        del.innerText = '🗑️';
        del.title = 'Remove';
        del.addEventListener('click', () => { groceries.splice(g.idx, 1); save(); renderItems(); });
        right.appendChild(del);
        div.appendChild(right);
        list.appendChild(div);
      });
  }

  if (page === 'your-items') {
    const search = document.getElementById('search');
    const clearBtn = document.getElementById('clear-expired');
    renderItems();
    search && search.addEventListener('input', renderItems);
    clearBtn && clearBtn.addEventListener('click', () => {
      const before = groceries.length;
      groceries = groceries.filter(g => daysLeft(g.expiry) >= 0);
      save(); renderItems(); alert(`Removed ${before - groceries.length} expired items`);
    });
  }

  // PAGE: recipes
  function suggestRecipe() {
    const box = document.getElementById('recipe-box');
    if (!box) return;
    const items = groceries.map(i => i.name.toLowerCase());
    const predefined = [
      { name: 'French Toast', items: ['egg', 'bread'] },
      { name: 'Veg Fried Rice', items: ['rice', 'vegetable', 'vegetables'] },
      { name: 'Tomato Pasta', items: ['pasta', 'tomato'] },
      { name: 'Banana Smoothie', items: ['milk', 'banana'] },
      { name: 'Grilled Chicken', items: ['chicken', 'spice', 'spices'] },
      { name: 'Avocado Toast', items: ['avocado', 'bread'] }
    ];
    const all = [...predefined, ...customRecipes];
    let suggestion = 'No matching recipe found. Add more items.';
    for (let r of all) {
      if (r.items.every(ing => items.some(it => it.includes(ing)))) {
        suggestion = `<strong>${escapeHtml(r.name)}</strong><br/>Ingredients: ${r.items.map(i => escapeHtml(i)).join(', ')}`;
        break;
      }
    }
    box.innerHTML = suggestion;
  }
  if (page === 'recipe-suggestion') suggestRecipe();

  // PAGE: custom-recipes
  function renderCustom() {
    const el = document.getElementById('custom-recipe-list');
    if (!el) return;
    if (customRecipes.length === 0) { el.innerHTML = 'No custom recipes yet.'; return; }
    el.innerHTML = '';
    customRecipes.forEach((r, idx) => {
      const div = document.createElement('div');
      div.className = 'item normal';
      div.innerHTML = `<div><strong>${escapeHtml(r.name)}</strong><div class="muted">${r.items.join(', ')}</div></div>`;
      const del = document.createElement('button');
      del.className = 'delete-btn'; del.innerText = '🗑️';
      del.addEventListener('click', () => { customRecipes.splice(idx, 1); save(); renderCustom(); suggestRecipe(); });
      div.appendChild(del);
      el.appendChild(div);
    });
  }
  if (page === 'custom-recipes') {
    const form = document.getElementById('recipe-form');
    form && form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('recipe-name').value.trim();
      const raw = document.getElementById('recipe-ingredients').value.trim();
      if (!name || !raw) return;
      const items = raw.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
      customRecipes.push({ name, items });
      save(); form.reset(); renderCustom(); alert(`Added ${name}`);
    });
    renderCustom();
  }

  // Keep recipe suggestions updated when groceries change (same page actions)
  window.addEventListener('storage', (e) => {
    if (e.key === GROCERIES_KEY) groceries = JSON.parse(e.newValue || '[]');
    if (e.key === CUSTOM_KEY) customRecipes = JSON.parse(e.newValue || '[]');
    renderItems(); renderCustom(); suggestRecipe();
  });

})();