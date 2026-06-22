import { DB, OCCUPATIONS, TOPICS, PURPOSES } from '../db.js';
import { Sound } from '../sound.js';

const THEMES = [
  { id: 'light', label: 'Claro', icon: '☀️', desc: 'Fondo claro, texto oscuro' },
  { id: 'dark', label: 'Oscuro', icon: '🌙', desc: 'Fondo oscuro, texto claro' },
  { id: 'auto', label: 'Sistema', icon: '🔄', desc: 'Sigue la configuración de tu dispositivo' }
];

const TIPS = {
  designer: 'Transformá ideas en experiencias visuales inolvidables.',
  developer: 'Construí el futuro línea por línea.',
  marketer: 'Contá historias que conecten marcas con personas.',
  entrepreneur: 'Creá valor, impactá el mundo.',
  creative: 'El mundo es tu lienzo, expresate sin límites.',
  student: 'Cada día es una oportunidad para aprender algo nuevo.'
};

const TOUR_STEPS = [
  { target: '#sidebar .sidebar-logo', text: 'Este es tu panel de navegación. Accedé a Dashboard, Personal, Clientes y más.' },
  { target: '#quickCaptureFab', text: 'Usá este botón (o Ctrl+K) para crear tareas, notas o clientes al instante.' },
  { target: '.dashboard-widget', text: 'Acá ves tu progreso: nivel, XP, racha y las tareas del día. ¡Cada acción suma!' }
];

let currentStep = 0;
let state = {};

function getOccupationIcon(id) {
  const o = OCCUPATIONS.find(x => x.id === id);
  return o ? o.icon : '✨';
}

function getOccupationLabel(id) {
  const o = OCCUPATIONS.find(x => x.id === id);
  return o ? o.label : id;
}

function renderProgress() {
  const total = 6;
  return `<div class="onboarding-progress">${Array.from({ length: total }, (_, i) =>
    `<div class="onboarding-progress-dot ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}"></div>`
  ).join('')}</div>`;
}

function renderStep() {
  switch (currentStep) {
    case 0: return renderStep1();
    case 1: return renderStep2();
    case 2: return renderStep3();
    case 3: return renderStep4();
    case 4: return renderStep5();
    case 5: return renderStep6();
    default: return '';
  }
}

function renderStep1() {
  return `
    <div class="onboarding-step" style="animation:onboardingFadeIn 0.4s ease">
      <div style="font-size:48px;margin-bottom:4px">🚀</div>
      <h2>Bienvenido a Levitar OS</h2>
      <p>Tu sistema operativo personal y profesional. Empecemos conociéndote.</p>
      <div class="form-group" style="margin-top:8px">
        <label>¿Cómo te llamás?</label>
        <input type="text" id="onbName" class="form-input" placeholder="Tu nombre" value="${state.name || ''}" autofocus>
      </div>
    </div>
  `;
}

function renderStep2() {
  return `
    <div class="onboarding-step" style="animation:onboardingFadeIn 0.4s ease">
      <h2>¿A qué te dedicás?</h2>
      <p>Elegí tu ocupación principal para personalizar tu experiencia.</p>
      <div class="onboarding-grid">
        ${OCCUPATIONS.map(o => `
          <div class="onboarding-option ${state.occupation === o.id ? 'radio-selected' : ''}" data-value="${o.id}" data-type="occupation">
            ${state.occupation === o.id ? '<div class="opt-check">✓</div>' : ''}
            <span class="opt-icon">${o.icon}</span>
            <span class="opt-label">${o.label}</span>
          </div>
        `).join('')}
      </div>
      <div id="onbOtherField" style="${state.occupation === 'other' ? '' : 'display:none'};margin-top:12px">
        <div class="form-group">
          <label>¿Cuál es tu ocupación?</label>
          <input type="text" id="onbOtherInput" class="form-input" placeholder="Ej: Arquitecto, Chef, Fotógrafo..." value="${state.occupationCustom || ''}">
        </div>
      </div>
    </div>
  `;
}

function renderStep3() {
  return `
    <div class="onboarding-step" style="animation:onboardingFadeIn 0.4s ease">
      <h2>¿Qué temas te interesan?</h2>
      <p>Seleccioná al menos uno. Así adaptamos los datos de ejemplo para vos.</p>
      <div class="onboarding-grid">
        ${TOPICS.map(t => {
          const selected = (state.topics || []).includes(t.id);
          return `
            <div class="onboarding-option ${selected ? 'selected' : ''}" data-value="${t.id}" data-type="topic">
              ${selected ? '<div class="opt-check">✓</div>' : ''}
              <span class="opt-icon">${t.icon}</span>
              <span class="opt-label">${t.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderStep4() {
  return `
    <div class="onboarding-step" style="animation:onboardingFadeIn 0.4s ease">
      <h2>¿Qué querés lograr con Levitar OS?</h2>
      <p>Elegí una o varias opciones para adaptar la experiencia.</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${PURPOSES.map(p => {
          const selected = (state.purpose || []).includes(p.id);
          return `
            <div class="onboarding-option ${selected ? 'selected' : ''}" style="flex-direction:row;padding:14px 18px" data-value="${p.id}" data-type="purpose">
              ${selected ? '<div class="opt-check">✓</div>' : ''}
              <span class="opt-label">${p.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderStep5() {
  const currentTheme = state.theme || 'auto';
  return `
    <div class="onboarding-step" style="animation:onboardingFadeIn 0.4s ease">
      <h2>Elegí tu experiencia visual</h2>
      <p>Podés cambiarlo después desde Configuración.</p>
      <div class="onboarding-grid">
        ${THEMES.map(t => {
          const selected = currentTheme === t.id;
          const isDark = t.id === 'dark';
          return `
            <div class="onboarding-option ${selected ? 'radio-selected' : ''}" data-value="${t.id}" data-type="theme" style="padding:0;overflow:hidden;gap:0">
              ${selected ? '<div class="opt-check" style="top:6px;right:6px">✓</div>' : ''}
              <div style="padding:20px 16px 12px;width:100%">
                <span class="opt-icon" style="font-size:36px">${t.icon}</span>
                <span class="opt-label" style="margin-top:4px">${t.label}</span>
                <span style="display:block;font-size:var(--text-xs);color:var(--text-muted);margin-top:4px">${t.desc}</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;padding:8px 12px 12px;width:100%;background:${isDark ? '#1a1a2e' : '#f5f5f5'}">
                <div style="height:12px;border-radius:3px;background:${isDark ? '#6366f1' : '#6366f1'}"></div>
                <div style="height:12px;border-radius:3px;background:${isDark ? '#374151' : '#e5e7eb'}"></div>
                <div style="height:12px;border-radius:3px;background:${isDark ? '#22c55e' : '#22c55e'}"></div>
                <div style="height:12px;border-radius:3px;background:${isDark ? '#374151' : '#e5e7eb'}"></div>
                <div style="height:12px;border-radius:3px;background:${isDark ? '#1e293b' : '#d1d5db'}"></div>
                <div style="height:12px;border-radius:3px;background:${isDark ? '#374151' : '#e5e7eb'}"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderStep6() {
  const occLabel = state.occupation === 'other' && state.occupationCustom
    ? state.occupationCustom : getOccupationLabel(state.occupation);
  const occIcon = getOccupationIcon(state.occupation);
  const topicLabels = (state.topics || []).map(t => {
    const found = TOPICS.find(x => x.id === t);
    return found ? `${found.icon} ${found.label}` : t;
  });

  return `
    <div class="onboarding-step" style="align-items:center;text-align:center;animation:onboardingFadeIn 0.4s ease">
      <div style="font-size:56px;margin-bottom:8px">🎉</div>
      <h2>¡Todo listo!</h2>
      <p style="margin-bottom:8px">Prepárate para tu primer día, ${state.name || ''}.</p>
      <div class="onboarding-summary" style="width:100%;text-align:left">
        <div class="onboarding-summary-row">
          <span class="sum-label">Nombre</span>
          <span class="sum-value">${state.name || '—'}</span>
        </div>
        <div class="onboarding-summary-row">
          <span class="sum-label">Ocupación</span>
          <span class="sum-value">${occIcon} ${occLabel}</span>
        </div>
        <div class="onboarding-summary-row">
          <span class="sum-label">Intereses</span>
          <span class="sum-value">${topicLabels.join(', ') || '—'}</span>
        </div>
        ${(state.purpose || []).length ? `
        <div class="onboarding-summary-row">
          <span class="sum-label">Enfoque</span>
          <span class="sum-value">${(state.purpose || []).map(p => { const f = PURPOSES.find(x => x.id === p); return f ? f.label : p; }).join(', ')}</span>
        </div>` : ''}
      </div>
      ${TIPS[state.occupation] ? `<p style="margin-top:16px;font-style:italic;color:var(--text-muted)">✨ ${TIPS[state.occupation]}</p>` : ''}
    </div>
  `;
}

function getState() {
  if (currentStep === 0) {
    state.name = document.getElementById('onbName')?.value.trim() || state.name || '';
  }
  if (currentStep === 1) {
    state.occupationCustom = document.getElementById('onbOtherInput')?.value.trim() || state.occupationCustom || '';
  }
  return state;
}

function canProceed() {
  switch (currentStep) {
    case 0: return state.name && state.name.trim().length >= 2;
    case 1: return !!state.occupation;
    case 2: return (state.topics || []).length >= 1;
    case 3: return true;
    case 4: return true;
    case 5: return true;
    default: return false;
  }
}

function bindEvents(container) {
  container.querySelectorAll('.onboarding-option[data-type="occupation"]').forEach(el => {
    el.addEventListener('click', () => {
      state.occupation = el.dataset.value;
      if (state.occupation === 'other') {
        const f = document.getElementById('onbOtherField');
        if (f) f.style.display = '';
        const inp = document.getElementById('onbOtherInput');
        if (inp) setTimeout(() => inp.focus(), 50);
      } else {
        const f = document.getElementById('onbOtherField');
        if (f) f.style.display = 'none';
      }
      container.querySelectorAll('.onboarding-option[data-type="occupation"]').forEach(x =>
        x.classList.remove('radio-selected')
      );
      el.classList.add('radio-selected');
      el.querySelector('.opt-check')?.remove();
      const check = document.createElement('div');
      check.className = 'opt-check';
      check.textContent = '✓';
      el.appendChild(check);
      updateNavState();
    });
  });

  container.querySelectorAll('.onboarding-option[data-type="topic"]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.value;
      state.topics = state.topics || [];
      const idx = state.topics.indexOf(id);
      if (idx > -1) state.topics.splice(idx, 1);
      else state.topics.push(id);
      container.querySelectorAll('.onboarding-option[data-type="topic"]').forEach(x => {
        const isSel = (state.topics || []).includes(x.dataset.value);
        x.classList.toggle('selected', isSel);
        let check = x.querySelector('.opt-check');
        if (isSel && !check) {
          check = document.createElement('div');
          check.className = 'opt-check';
          check.textContent = '✓';
          x.appendChild(check);
        } else if (!isSel && check) {
          check.remove();
        }
      });
      updateNavState();
    });
  });

  container.querySelectorAll('.onboarding-option[data-type="purpose"]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.value;
      state.purpose = state.purpose || [];
      if (id === 'all') {
        const allSelected = PURPOSES.every(p => state.purpose.includes(p.id));
        state.purpose = allSelected ? [] : PURPOSES.map(p => p.id);
      } else {
        const idx = state.purpose.indexOf(id);
        if (idx > -1) state.purpose.splice(idx, 1);
        else state.purpose.push(id);
        const allIdx = state.purpose.indexOf('all');
        if (allIdx > -1) state.purpose.splice(allIdx, 1);
      }
      container.querySelectorAll('.onboarding-option[data-type="purpose"]').forEach(x => {
        const isSel = (state.purpose || []).includes(x.dataset.value);
        x.classList.toggle('selected', isSel);
        let check = x.querySelector('.opt-check');
        if (isSel && !check) {
          check = document.createElement('div');
          check.className = 'opt-check';
          check.textContent = '✓';
          x.appendChild(check);
        } else if (!isSel && check) {
          check.remove();
        }
      });
      updateNavState();
    });
  });

  container.querySelectorAll('.onboarding-option[data-type="theme"]').forEach(el => {
    el.addEventListener('click', () => {
      state.theme = el.dataset.value;
      container.querySelectorAll('.onboarding-option[data-type="theme"]').forEach(x =>
        x.classList.remove('radio-selected')
      );
      el.classList.add('radio-selected');
      el.querySelector('.opt-check')?.remove();
      const check = document.createElement('div');
      check.className = 'opt-check';
      check.textContent = '✓';
      el.appendChild(check);
      updateNavState();
    });
  });

  const nameInput = document.getElementById('onbName');
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      state.name = nameInput.value.trim();
      updateNavState();
    });
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') clickNext(); });
  }

  const otherInput = document.getElementById('onbOtherInput');
  if (otherInput) {
    otherInput.addEventListener('input', () => {
      state.occupationCustom = otherInput.value.trim();
    });
  }
}

function updateNavState() {
  const nextBtn = document.getElementById('onbNextBtn');
  if (nextBtn) nextBtn.disabled = !canProceed();
}

function clickNext() {
  getState();
  if (!canProceed()) return;
  Sound.click();
  if (currentStep < 5) {
    currentStep++;
    renderWizard();
  } else {
    finishOnboarding();
  }
}

function clickBack() {
  getState();
  Sound.click();
  if (currentStep > 0) {
    currentStep--;
    renderWizard();
  }
}

function finishOnboarding() {
  const profile = DB.getProfile();
  profile.name = state.name || profile.name;
  profile.occupation = state.occupation;
  profile.occupationCustom = state.occupationCustom || '';
  profile.topics = state.topics || [];
  profile.purpose = state.purpose || [];
  profile.onboardingComplete = true;
  profile.level = 0;
  profile.xp = 0;
  profile.tutorialCompleted = false;
  DB.saveProfile(profile);

  if (state.theme) {
    const theme = state.theme === 'auto' ? null : state.theme;
    localStorage.setItem('levitar_theme', theme || '');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  const container = document.getElementById('onboardingContainer');
  if (!container) return;

  const card = container.querySelector('.onboarding-card');
  if (card) {
    card.style.transition = 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
    card.style.transform = 'scale(1.08)';
    card.style.opacity = '0';
  } else {
    container.style.transition = 'opacity 0.4s ease';
    container.style.opacity = '0';
  }

  setTimeout(() => {
    container.remove();
    document.getElementById('sidebar')?.classList.remove('onboarding-hidden');
    document.getElementById('sidebarToggle')?.classList.remove('onboarding-hidden');
    document.getElementById('content')?.classList.remove('onboarding-hidden');
    document.getElementById('quickCaptureFab')?.classList.remove('onboarding-hidden');
    window.location.reload();
  }, 500);
}

function renderWizard() {
  const container = document.getElementById('onboardingContainer');
  if (!container) return;

  getState();

  container.innerHTML = `
    <div class="onboarding-overlay">
      <div class="onboarding-card">
        ${renderProgress()}
        <div class="onboarding-body" id="onbBody">
          ${renderStep()}
        </div>
        <div class="onboarding-footer">
          <button class="btn btn-secondary" id="onbBackBtn" style="${currentStep === 0 ? 'visibility:hidden' : ''}">← Atrás</button>
          <button class="btn btn-primary" id="onbNextBtn" ${canProceed() ? '' : 'disabled'}>
            ${currentStep < 5 ? 'Continuar →' : '✨ Comenzar'}
          </button>
        </div>
      </div>
    </div>
  `;

  bindEvents(container);

  document.getElementById('onbNextBtn')?.addEventListener('click', clickNext);
  document.getElementById('onbBackBtn')?.addEventListener('click', clickBack);

  document.addEventListener('keydown', handleKeydown);
}

function handleKeydown(e) {
  if (e.key === 'Enter') {
    const nextBtn = document.getElementById('onbNextBtn');
    if (nextBtn && !nextBtn.disabled) clickNext();
  }
  if (e.key === 'Escape' && currentStep > 0) {
    clickBack();
  }
}

export function showOnboarding() {
  state = {};
  currentStep = 0;
  const container = document.getElementById('onboardingContainer');
  if (!container) return;
  container.style.display = '';
  renderWizard();
}
