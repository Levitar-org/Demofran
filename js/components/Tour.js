import { Sound } from '../sound.js';

const STEPS = [
  {
    target: '.sidebar-logo',
    title: '🗺️ Navegación',
    text: 'Este es tu menú principal. Desde acá accedés al Dashboard, tu espacio personal, clientes y configuración.'
  },
  {
    target: '#quickCaptureFab',
    title: '⚡ Captura rápida',
    text: 'Presioná este botón o usá Ctrl+K para crear tareas, notas, proyectos o clientes al instante, sin perder el foco.'
  },
  {
    target: '#content .dashboard-widget:first-child',
    title: '📊 Tu progreso',
    text: 'En el Dashboard ves tu nivel, XP, racha y las Misiones del día. Completá misiones y tareas para subir de nivel y desbloquear logros.'
  }
];

export function startTour() {
  if (document.querySelector('.tour-overlay')) return;
  document.addEventListener('keydown', handleTourKey);
  showStep(0);
}

function handleTourKey(e) {
  if (e.key === 'Escape') endTour();
  if (e.key === 'Enter') {
    const btn = document.querySelector('.tour-next-btn');
    if (btn) btn.click();
  }
}

function showStep(idx) {
  removeTour();

  if (idx >= STEPS.length) {
    endTour();
    return;
  }

  const step = STEPS[idx];
  const target = document.querySelector(step.target);
  if (!target) {
    showStep(idx + 1);
    return;
  }

  const rect = target.getBoundingClientRect();
  const isLast = idx === STEPS.length - 1;

  const overlay = document.createElement('div');
  overlay.className = 'tour-overlay';
  overlay.id = 'tourOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.35);animation:tourFadeIn 0.3s ease';

  const highlight = document.createElement('div');
  highlight.className = 'tour-highlight';
  highlight.style.cssText = `position:fixed;left:${rect.left - 8}px;top:${rect.top - 8}px;width:${rect.width + 16}px;height:${rect.height + 16}px;border-radius:12px;z-index:10001;pointer-events:none;box-shadow:0 0 0 4px var(--accent),0 0 0 9999px rgba(0,0,0,0.35);animation:tourPulse 1.5s ease-in-out infinite`;

  const tooltip = document.createElement('div');
  tooltip.className = 'tour-tooltip';
  const left = Math.min(Math.max(rect.left, 20), window.innerWidth - 340);
  const top = rect.bottom + 16;
  const topPos = top + 16 > window.innerHeight ? rect.top - 160 : top;
  tooltip.style.cssText = `position:fixed;left:${left}px;top:${Math.max(topPos, 16)}px;z-index:10002;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);padding:16px 20px;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,0.15);animation:tourSlideIn 0.3s ease`;

  tooltip.innerHTML = `
    <div style="font-weight:700;font-size:var(--text-sm);margin-bottom:6px">${step.title}</div>
    <div style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.5;margin-bottom:12px">${step.text}</div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:var(--text-xs);color:var(--text-muted)">${idx + 1} / ${STEPS.length}</span>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm btn-ghost tour-skip-btn" style="font-size:var(--text-xs)">Omitir</button>
        <button class="btn btn-sm btn-primary tour-next-btn" style="font-size:var(--text-xs)">${isLast ? '¡Entendido!' : 'Siguiente →'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(highlight);
  document.body.appendChild(tooltip);

  tooltip.querySelector('.tour-next-btn')?.addEventListener('click', () => {
    Sound.click();
    showStep(idx + 1);
  });

  tooltip.querySelector('.tour-skip-btn')?.addEventListener('click', endTour);
  overlay.addEventListener('click', endTour);
}

function removeTour() {
  document.querySelectorAll('.tour-overlay, .tour-highlight, .tour-tooltip').forEach(el => el.remove());
}

function endTour() {
  removeTour();
  document.removeEventListener('keydown', handleTourKey);
}
