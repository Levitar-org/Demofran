import { DB } from '../db.js';
import { Sound } from '../sound.js';
import { showLevelUpCelebration } from './LevelUpCelebration.js';

const GOAL_TYPES = [
  { id: 'career', label: 'Carrera', icon: '💼' },
  { id: 'health', label: 'Salud', icon: '💪' },
  { id: 'finance', label: 'Finanzas', icon: '💰' },
  { id: 'learning', label: 'Aprendizaje', icon: '📚' },
  { id: 'personal', label: 'Personal', icon: '🧘' },
];

let currentStep = 0;
let state = {};

function renderProgress() {
  const total = 6;
  return `<div class="onboarding-progress">${Array.from({ length: total }, (_, i) =>
    `<div class="onboarding-progress-dot ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}"></div>`
  ).join('')}</div>`;
}

function renderStep() {
  switch (currentStep) {
    case 0: return stepWelcome();
    case 1: return stepVision();
    case 2: return stepGoal();
    case 3: return stepProject();
    case 4: return stepNavigation();
    case 5: return stepCelebration();
    default: return '';
  }
}

function stepWelcome() {
  return `
    <div class="onboarding-step" style="animation:onboardingFadeIn 0.4s ease;align-items:center;text-align:center">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" style="margin-bottom:8px">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>
      <h2 style="font-size:var(--text-2xl)">¡Bienvenido a Levitar OS!</h2>
      <p>Ya configuraste tu perfil. Ahora vamos a crear tu primer proyecto juntos.</p>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:8px">Vas a crear una Visión, Metas y un Proyecto en solo 3 pasos.</p>
    </div>
  `;
}

function stepVision() {
  return `
    <div class="onboarding-step" style="animation:onboardingFadeIn 0.4s ease">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" style="margin-bottom:8px">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
      <h2>Creá tu Visión</h2>
      <p>Una visión define tu dirección a largo plazo. ¿Qué querés lograr?</p>
      <div class="form-group">
        <label>Título de tu visión *</label>
        <input type="text" id="tutVisionTitle" class="form-input" placeholder="Ej: Libertad creativa total" value="${state.visionTitle || ''}" autofocus>
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea id="tutVisionDesc" class="form-input" rows="2" placeholder="¿Cómo imaginás tu vida ideal?">${state.visionDesc || ''}</textarea>
      </div>
    </div>
  `;
}

function stepGoal() {
  return `
    <div class="onboarding-step" style="animation:onboardingFadeIn 0.4s ease">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" style="margin-bottom:8px">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      <h2>Establecé una Meta</h2>
      <p>Las metas son los hitos que te acercan a tu visión.</p>
      <div class="form-group">
        <label>Título de la meta *</label>
        <input type="text" id="tutGoalTitle" class="form-input" placeholder="Ej: Lanzar mi propio estudio creativo" value="${state.goalTitle || ''}" autofocus>
      </div>
      <div class="form-group">
        <label>Tipo</label>
        <select id="tutGoalType" class="form-input">
          ${GOAL_TYPES.map(t => `<option value="${t.id}" ${(state.goalType || 'career') === t.id ? 'selected' : ''}>${t.icon} ${t.label}</option>`).join('')}
        </select>
      </div>
    </div>
  `;
}

function stepProject() {
  return `
    <div class="onboarding-step" style="animation:onboardingFadeIn 0.4s ease">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" style="margin-bottom:8px">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <h2>Creá tu primer Proyecto</h2>
      <p>Los proyectos son donde las cosas se hacen realidad.</p>
      <div class="form-group">
        <label>Nombre del proyecto *</label>
        <input type="text" id="tutProjName" class="form-input" placeholder="Ej: Branding personal 2026" value="${state.projName || ''}" autofocus>
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea id="tutProjDesc" class="form-input" rows="2" placeholder="¿De qué se trata este proyecto?">${state.projDesc || ''}</textarea>
      </div>
    </div>
  `;
}

function stepNavigation() {
  return `
    <div class="onboarding-step" style="animation:onboardingFadeIn 0.4s ease;align-items:center;text-align:center">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" style="margin-bottom:8px">
        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
      </svg>
      <h2>Tu espacio está listo</h2>
      <p style="margin-bottom:16px">Usá la navegación inferior para moverte entre secciones:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:left;width:100%">
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--surface-secondary);border-radius:var(--radius-lg)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <div><div style="font-weight:600;font-size:var(--text-xs)">Dashboard</div><div style="font-size:10px;color:var(--text-muted)">Tu progreso general</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--surface-secondary);border-radius:var(--radius-lg)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <div><div style="font-weight:600;font-size:var(--text-xs)">Clientes</div><div style="font-size:10px;color:var(--text-muted)">Gestión de clientes</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--surface-secondary);border-radius:var(--radius-lg)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <div><div style="font-weight:600;font-size:var(--text-xs)">Personal</div><div style="font-size:10px;color:var(--text-muted)">Visión, metas, proyectos</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--surface-secondary);border-radius:var(--radius-lg)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <div><div style="font-weight:600;font-size:var(--text-xs)">Ajustes</div><div style="font-size:10px;color:var(--text-muted)">Configuración</div></div>
        </div>
      </div>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:16px">También podés usar el menú lateral en pantallas grandes.</p>
    </div>
  `;
}

function stepCelebration() {
  return `
    <div class="onboarding-step" style="animation:onboardingFadeIn 0.4s ease;align-items:center;text-align:center">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" style="margin-bottom:12px">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      <h2>Todo listo para arrancar</h2>
      <p>Creaste tu Visión, Metas y primer Proyecto.</p>
      <p style="font-size:var(--text-sm);color:var(--text-muted);margin-top:8px">Al finalizar, recibirás XP para alcanzar el Nivel 1.</p>
    </div>
  `;
}

function getState() {
  if (currentStep === 1) {
    state.visionTitle = document.getElementById('tutVisionTitle')?.value.trim() || '';
    state.visionDesc = document.getElementById('tutVisionDesc')?.value.trim() || '';
  }
  if (currentStep === 2) {
    state.goalTitle = document.getElementById('tutGoalTitle')?.value.trim() || '';
    state.goalType = document.getElementById('tutGoalType')?.value || 'career';
  }
  if (currentStep === 3) {
    state.projName = document.getElementById('tutProjName')?.value.trim() || '';
    state.projDesc = document.getElementById('tutProjDesc')?.value.trim() || '';
  }
}

function canProceed() {
  switch (currentStep) {
    case 0: return true;
    case 1: return state.visionTitle && state.visionTitle.length >= 2;
    case 2: return state.goalTitle && state.goalTitle.length >= 2;
    case 3: return state.projName && state.projName.length >= 2;
    case 4: return true;
    case 5: return true;
    default: return false;
  }
}

function clickNext() {
  getState();
  if (!canProceed()) return;
  Sound.click();

  if (currentStep === 1) {
    DB.create('visions', {
      title: state.visionTitle,
      description: state.visionDesc || '',
      targetDate: null,
      status: 'active'
    });
  }
  if (currentStep === 2) {
    const visions = DB.getVisions();
    const visionId = visions.length > 0 ? visions[visions.length - 1].id : null;
    DB.create('goals', {
      visionId,
      title: state.goalTitle,
      description: '',
      type: state.goalType,
      targetDate: null,
      status: 'pending'
    });
  }
  if (currentStep === 3) {
    DB.create('projects', {
      name: state.projName,
      description: state.projDesc || '',
      workspace: 'personal',
      status: 'active',
      clientId: null,
      createdAt: new Date().toISOString()
    });
  }

  if (currentStep < 5) {
    currentStep++;
    renderTutorial();
  } else {
    finishTutorial();
  }
}

function finishTutorial() {
  const profile = DB.getProfile();
  profile.xp += 100;
  profile.level = 1;
  profile.tutorialCompleted = true;
  DB.saveProfile(profile);
  DB.createHistoryEntry('level_up', 'user', '', { level: 1 });
  DB.createHistoryEntry('tutorial_complete', 'user', '', {});

  const container = document.getElementById('tutorialContainer');
  if (!container) return;

  const card = container.querySelector('.onboarding-card');
  if (card) {
    card.style.transition = 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
    card.style.transform = 'scale(1.08)';
    card.style.opacity = '0';
  }

  setTimeout(() => {
    container.remove();
    showLevelUpCelebration({ name: profile.name, level: 1 });
  }, 500);
}

function renderTutorial() {
  const container = document.getElementById('tutorialContainer');
  if (!container) return;

  getState();

  container.innerHTML = `
    <div class="onboarding-overlay">
      <div class="onboarding-card" style="max-width:480px">
        ${renderProgress()}
        <div class="onboarding-body" id="tutBody">${renderStep()}</div>
        <div class="onboarding-footer">
          <div></div>
          <button class="btn btn-primary" id="tutNextBtn" ${canProceed() ? '' : 'disabled'}>
            ${currentStep === 0 ? 'Comenzar' : currentStep === 4 ? 'Siguiente →' : currentStep === 5 ? 'Recibir recompensa ✨' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  `;

  bindEvents(container);

  const nextBtn = document.getElementById('tutNextBtn');
  if (nextBtn) nextBtn.addEventListener('click', clickNext);
}

function bindEvents(container) {
  const titleInput = document.getElementById('tutVisionTitle');
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      state.visionTitle = titleInput.value.trim();
      updateBtnState();
    });
  }
  const goalInput = document.getElementById('tutGoalTitle');
  if (goalInput) {
    goalInput.addEventListener('input', () => {
      state.goalTitle = goalInput.value.trim();
      updateBtnState();
    });
  }
  const projInput = document.getElementById('tutProjName');
  if (projInput) {
    projInput.addEventListener('input', () => {
      state.projName = projInput.value.trim();
      updateBtnState();
    });
  }
}

function updateBtnState() {
  const btn = document.getElementById('tutNextBtn');
  if (btn) btn.disabled = !canProceed();
}

export function startTutorial() {
  if (document.getElementById('tutorialContainer')) return;
  state = {};
  currentStep = 0;
  const container = document.createElement('div');
  container.id = 'tutorialContainer';
  document.body.appendChild(container);
  renderTutorial();
}
