export function showLevelUpCelebration({ name, level } = {}) {
  if (document.getElementById('levelUpCelebration')) return;

  const overlay = document.createElement('div');
  overlay.id = 'levelUpCelebration';
  overlay.className = 'celebration-overlay';

  const confettiPieces = Array.from({ length: 60 }, (_, i) => {
    const x = Math.random() * 100;
    const delay = Math.random() * 2;
    const duration = 2 + Math.random() * 3;
    const size = 6 + Math.random() * 10;
    const hue = Math.random() * 360;
    return `<div class="confetti-piece" style="left:${x}%;animation-delay:${delay}s;animation-duration:${duration}s;width:${size}px;height:${size * 0.6}px;background:hsl(${hue},80%,60%);border-radius:${Math.random() > 0.5 ? '50%' : '2px'}"></div>`;
  }).join('');

  overlay.innerHTML = `
    <div class="celebration-content">
      <div class="confetti-container">${confettiPieces}</div>
      <div class="celebration-badge">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h2 class="celebration-title">¡Nivel ${level} alcanzado!</h2>
      ${name ? `<p class="celebration-subtitle">Seguí así, ${name}.</p>` : ''}
      <p class="celebration-desc">Completaste el tutorial. Cada tarea completada te da XP para seguir subiendo.</p>
      <button class="btn btn-primary celebration-btn" id="celebrationDoneBtn">¡Comenzar!</button>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    const btn = document.getElementById('celebrationDoneBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.4s ease';
        setTimeout(() => overlay.remove(), 400);
      });
    }
  }, 50);
}
