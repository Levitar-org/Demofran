import { router } from '../router.js';
import { showQuickCapture } from './QuickCapture.js';

const tabs = [
  { id: 'dashboard', href: '/', icon: 'dashboard', label: 'Dashboard' },
  { id: 'clients', href: '/clients', icon: 'clients', label: 'Clientes' },
  { id: 'quick', href: null, icon: 'plus', label: '', isQuick: true },
  { id: 'personal', href: '/personal', icon: 'personal', label: 'Personal' },
  { id: 'settings', href: '/settings', icon: 'settings', label: 'Ajustes' },
];

const Icons = {
  dashboard: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  clients: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  personal: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  settings: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  plus: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
};

function isActive(href) {
  if (!href) return false;
  const hash = window.location.hash.replace(/^#/, '') || '/';
  if (href === '/') return hash === '/' || hash === '';
  if (href === '/personal') return hash.startsWith('/personal');
  return hash.startsWith(href);
}

export function renderBottomNav() {
  const container = document.getElementById('bottomNav');
  if (!container) return;

  container.innerHTML = tabs.map(t => `
    <button class="bottom-nav-item${t.isQuick ? ' bottom-nav-quick' : ''}${isActive(t.href) ? ' active' : ''}"
            data-nav="${t.href || ''}" ${t.isQuick ? 'data-quick="true"' : ''}
            aria-label="${t.isQuick ? 'Captura rápida' : t.label}">
      ${t.isQuick
        ? `<span class="bottom-nav-quick-bg">${Icons[t.icon]}</span>`
        : `${Icons[t.icon]}<span class="bottom-nav-label">${t.label}</span>`}
    </button>
  `).join('');

  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const href = el.dataset.nav;
      if (href) router.navigate(href);
    });
  });

  container.querySelectorAll('[data-quick]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showQuickCapture();
    });
  });
}

export function updateBottomNavActive() {
  document.querySelectorAll('.bottom-nav-item').forEach(el => {
    const href = el.dataset.nav;
    if (href) {
      el.classList.toggle('active', isActive(href));
    }
  });
}
