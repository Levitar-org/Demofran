const THRESHOLD = 80;
let state = null;
let initialized = false;

export function initPullToRefresh(containerSelector, { onRefresh } = {}) {
  if (initialized) return;
  initialized = true;

  const el = document.querySelector(containerSelector || '.content');
  if (!el) return;

  const indicator = document.createElement('div');
  indicator.className = 'ptr-indicator';
  indicator.innerHTML = '<div class="ptr-spinner"></div><span class="ptr-label">Soltá para actualizar</span>';
  el.prepend(indicator);

  let pulling = false;
  let startY = 0;
  let currentY = 0;

  el.addEventListener('touchstart', (e) => {
    if (window.scrollY > 0 || el.dataset.ptrRefreshing === 'true') return;
    if (e.target.closest('.btn, button, a, input, select, textarea, .swipe-action, .modal, .bottom-nav')) return;

    pulling = true;
    startY = e.touches[0].clientY;
    currentY = 0;
    indicator.classList.remove('ptr-ready', 'ptr-refreshing');
  }, { passive: true });

  el.addEventListener('touchmove', (e) => {
    if (!pulling || el.dataset.ptrRefreshing === 'true') return;

    const dy = e.touches[0].clientY - startY;
    if (dy < 0) { pulling = false; return; }

    currentY = dy;
    const damped = Math.min(dy * 0.4, 120);
    indicator.style.height = `${damped}px`;
    indicator.style.opacity = Math.min(dy / THRESHOLD, 1);

    const spinner = indicator.querySelector('.ptr-spinner');
    if (spinner) spinner.style.transform = `rotate(${dy * 2}deg)`;

    indicator.classList.toggle('ptr-ready', dy >= THRESHOLD);
  }, { passive: true });

  el.addEventListener('touchend', () => {
    if (!pulling) return;
    pulling = false;

    if (currentY >= THRESHOLD && onRefresh) {
      el.dataset.ptrRefreshing = 'true';
      indicator.classList.remove('ptr-ready');
      indicator.classList.add('ptr-refreshing');
      indicator.querySelector('.ptr-label').textContent = 'Actualizando...';

      onRefresh(() => {
        indicator.style.height = '0';
        indicator.style.opacity = '0';
        indicator.classList.remove('ptr-refreshing');
        indicator.querySelector('.ptr-label').textContent = 'Soltá para actualizar';
        delete el.dataset.ptrRefreshing;
      });
    } else {
      indicator.style.height = '0';
      indicator.style.opacity = '0';
    }

    currentY = 0;
  }, { passive: true });
}


