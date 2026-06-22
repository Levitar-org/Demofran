let initialized = false;
let touch = null;
const handlers = {};

export function addSwipeTarget(itemSelector, { key, onDelete } = {}) {
  const id = key || itemSelector;
  handlers[id] = { itemSelector, onDelete };
  if (!initialized) init();
}

export function removeSwipeTarget(key) {
  delete handlers[key];
}

function init() {
  if (initialized) return;
  initialized = true;

  document.addEventListener('touchstart', (e) => {
    const item = findItem(e.target);
    if (!item || item.dataset.swiping) return;
    if (e.target.closest('.btn, button, a, input, select, textarea, .swipe-action')) return;

    touch = { item, startX: e.touches[0].clientX, startY: e.touches[0].clientY, currentX: 0, swiping: false };
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!touch) return;
    const dx = e.touches[0].clientX - touch.startX;
    const dy = e.touches[0].clientY - touch.startY;

    if (dx > 0) return;
    if (!touch.swiping && (Math.abs(dx) < 10 || Math.abs(dy) > Math.abs(dx) * 1.5)) return;

    if (!touch.swiping) {
      touch.swiping = true;
      touch.item.dataset.swiping = 'true';
      touch.item.style.transition = 'none';
      addAction(touch.item);
    }

    e.preventDefault();
    touch.currentX = dx;
    const clamped = Math.max(dx, -120);
    touch.item.style.transform = `translateX(${clamped}px)`;

    const action = touch.item.querySelector('.swipe-action');
    if (action) action.style.transform = `translateX(${(1 - Math.min(1, -clamped / 80)) * 100}%)`;
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (!touch) return;
    const item = touch.item;
    item.dataset.swiping = '';
    item.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

    if (touch.currentX < -80) {
      item.style.transform = 'translateX(-120px)';
      const action = item.querySelector('.swipe-action');
      if (action) action.style.transform = 'translateX(0)';
    } else {
      item.style.transform = 'translateX(0)';
      const action = item.querySelector('.swipe-action');
      if (action) { action.style.transform = 'translateX(100%)'; setTimeout(() => action.remove(), 400); }
    }
    touch = null;
  }, { passive: true });

  document.addEventListener('touchcancel', () => {
    if (!touch) return;
    if (touch.item) {
      touch.item.style.transition = 'transform 0.35s ease';
      touch.item.style.transform = 'translateX(0)';
      touch.item.dataset.swiping = '';
      const action = touch.item.querySelector('.swipe-action');
      if (action) { action.style.transform = 'translateX(100%)'; setTimeout(() => action.remove(), 400); }
    }
    touch = null;
  }, { passive: true });

  document.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('.swipe-action-btn');
    if (!actionBtn) return;
    const item = findItem(actionBtn);
    if (!item) return;

    const id = item.dataset.clientId || item.dataset.taskId || item.dataset.noteId;
    const matched = Object.values(handlers).filter(h => item.closest(h.itemSelector));

    item.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    item.style.transform = 'translateX(-100%)';
    item.style.opacity = '0';

    matched.forEach(h => { if (h.onDelete) h.onDelete(id, item); });
  });
}

function findItem(target) {
  for (const h of Object.values(handlers)) {
    const item = target.closest(h.itemSelector);
    if (item) return item;
  }
  return null;
}

function addAction(item) {
  if (item.querySelector('.swipe-action')) return;
  const div = document.createElement('div');
  div.className = 'swipe-action';
  div.innerHTML = '<button class="swipe-action-btn" aria-label="Eliminar"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>';
  item.style.position = 'relative';
  item.style.overflow = 'hidden';
  item.appendChild(div);
}
