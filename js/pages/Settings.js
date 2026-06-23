import { DB, OCCUPATIONS, TOPICS } from '../db.js';
import { Utils } from '../utils.js';
import { showToast } from '../components/Toast.js';
import { Sound } from '../sound.js';

export function SettingsPage() {
  function saveProfileData() {
    const profile = DB.getProfile();
    const name = document.getElementById('userNameInput')?.value.trim();
    if (name) profile.name = name;
    profile.occupation = document.getElementById('settingsOccupation')?.value || null;
    profile.occupationCustom = document.getElementById('settingsOtherInput')?.value.trim() || '';
    profile.topics = [...document.querySelectorAll('.topic-chip-active')].map(el => el.dataset.topic);
    DB.saveProfile(profile);
    showToast('Perfil guardado', 'success');
  }

  function renderXPBar(xpInfo) {
    return `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
        <span style="font-size:var(--text-xl);font-weight:800;color:var(--accent)">${xpInfo.percent}%</span>
        <div class="progress-bar" style="flex:1;height:10px;background:var(--surface-secondary);border-radius:8px;overflow:hidden">
          <div class="progress-fill" style="width:${xpInfo.percent}%;background:linear-gradient(90deg,var(--accent),var(--accent-hover));height:10px;border-radius:8px;transition:width 0.6s ease"></div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--text-muted)">
        <span>${xpInfo.current} / ${xpInfo.needed} XP</span>
        <span>Nivel ${xpInfo.level + 1} → ${xpInfo.needed - xpInfo.current} XP restantes</span>
      </div>
    `;
  }

  function renderStreakCalendar(streak) {
    const days = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const todayStr = Utils.today();
    let html = '<div style="display:flex;gap:3px;flex-wrap:wrap;justify-content:center">';
    days.forEach((dateStr, idx) => {
      const isToday = dateStr === todayStr;
      const activity = localStorage.getItem(`levitar_activity_${dateStr}`);
      const classes = isToday ? 'streak-today' : (activity ? 'streak-active' : 'streak-inactive');
      const checkSvg = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
      html += `<div class="${classes}" title="${Utils.formatDate(dateStr)}" style="width:22px;height:22px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;${activity ? 'background:var(--success);color:white' : 'background:var(--surface-secondary);color:var(--text-muted)'}">${activity ? checkSvg : dayLabels[(idx + (new Date(dateStr)).getDay()) % 7]}</div>`;
    });
    html += '</div>';
    return html;
  }

  function renderAchievements(achievements) {
    const ACHIEVEMENT_ICONS = {
      streak_7: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>',
      streak_30: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>',
      level_5: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      level_10: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    };

    const allAchievements = [
      { id: 'streak_7', name: 'Racha de 7 días', icon: ACHIEVEMENT_ICONS.streak_7, desc: 'Completá tareas 7 días seguidos' },
      { id: 'streak_30', name: 'Racha de 30 días', icon: ACHIEVEMENT_ICONS.streak_30, desc: 'Completá tareas 30 días seguidos' },
      { id: 'level_5', name: 'Nivel 5', icon: ACHIEVEMENT_ICONS.level_5, desc: 'Alcanzá el nivel 5' },
      { id: 'level_10', name: 'Nivel 10', icon: ACHIEVEMENT_ICONS.level_10, desc: 'Alcanzá el nivel 10' }
    ];

    const unlockedIds = new Set(achievements.map(a => a.id));

    return allAchievements.map(a => {
      const unlocked = unlockedIds.has(a.id);
      const achievement = achievements.find(x => x.id === a.id);
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;opacity:${unlocked ? 1 : 0.35};border-bottom:1px solid var(--border)">
          <span style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${a.icon}</span>
          <div style="flex:1">
            <div style="font-weight:600;font-size:var(--text-sm)">${a.name}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted)">${unlocked ? `Desbloqueado ${achievement.unlockedAt ? Utils.formatDate(achievement.unlockedAt) : ''}` : a.desc}</div>
          </div>
          <span style="font-size:var(--text-xs);color:${unlocked ? 'var(--success)' : 'var(--text-muted)'}">
            ${unlocked
              ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
              : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
            }
          </span>
        </div>
      `;
    }).join('');
  }

  return {
    render() {
      const profile = DB.getProfile();
      const xpInfo = DB.getXPToNextLevel();
      const tasks = DB.getAll('tasks');
      const doneTasks = tasks.filter(t => t.status === 'done').length;
      const achievements = profile.achievements || [];
      const streakInfo = DB.getStreakInfo();

      return `
        <div class="page-enter" style="max-width:640px">
          <div class="content-header" style="padding-top:0">
            <h1>Configuración</h1>
          </div>

          <div class="settings-section">
            <h3>Perfil</h3>
            <div class="card">
              <div class="card-body">
                <div class="form-group">
                  <label>Tu nombre</label>
                  <input type="text" id="userNameInput" class="form-input" value="${Utils.sanitize(profile.name)}" autofocus>
                </div>
                <div class="form-group">
                  <label>Ocupación</label>
                  <select id="settingsOccupation" class="form-input">
                    <option value="">Seleccioná tu ocupación</option>
                    ${OCCUPATIONS.map(o => `
                      <option value="${o.id}" ${profile.occupation === o.id ? 'selected' : ''}>${o.icon} ${o.label}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group" id="settingsOtherGroup" style="${profile.occupation === 'other' ? '' : 'display:none'}">
                  <label>Tu ocupación</label>
                  <input type="text" id="settingsOtherInput" class="form-input" placeholder="Ej: Arquitecto, Chef..." value="${Utils.sanitize(profile.occupationCustom || '')}">
                </div>
                <div class="form-group">
                  <label>Intereses</label>
                  <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
                    ${TOPICS.map(t => {
                      const selected = (profile.topics || []).includes(t.id);
                      return `
                        <label class="topic-chip ${selected ? 'topic-chip-active' : ''}" data-topic="${t.id}" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:var(--radius-full);font-size:var(--text-xs);cursor:pointer;background:${selected ? 'var(--accent-soft)' : 'var(--surface-secondary)'};border:1px solid ${selected ? 'var(--accent)' : 'var(--border)'};color:${selected ? 'var(--accent)' : 'var(--text-secondary)'};transition:all 0.15s ease;user-select:none">
                          ${t.icon} ${t.label}
                        </label>
                      `;
                    }).join('')}
                  </div>
                </div>
                <button class="btn btn-primary" id="saveProfileBtn" style="margin-top:8px">Guardar perfil</button>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>Progreso & Gamificación</h3>

            <div class="stats-grid-4col">
              <div class="card" style="text-align:center;padding:12px">
                <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em">Nivel</div>
                <div style="font-size:var(--text-2xl);font-weight:800;color:var(--accent)">${profile.level}</div>
              </div>
              <div class="card" style="text-align:center;padding:12px">
                <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em">XP</div>
                <div style="font-size:var(--text-2xl);font-weight:800;color:var(--accent)">${profile.xp}</div>
              </div>
              <div class="card" style="text-align:center;padding:12px">
                <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em">Racha <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg></div>
                <div style="font-size:var(--text-2xl);font-weight:800;color:var(--warning)">${profile.streak}</div>
              </div>
              <div class="card" style="text-align:center;padding:12px">
                <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em">Completadas</div>
                <div style="font-size:var(--text-2xl);font-weight:800;color:var(--success)">${doneTasks}</div>
              </div>
            </div>

            <div class="card" style="margin-bottom:16px">
              <div class="card-body">
                <div style="font-weight:600;font-size:var(--text-sm);margin-bottom:12px">Progreso al siguiente nivel</div>
                ${renderXPBar({ ...xpInfo, level: profile.level })}
              </div>
            </div>

            <div class="card" style="margin-bottom:16px">
              <div class="card-body">
                <div style="font-weight:600;font-size:var(--text-sm);margin-bottom:12px">Historial de actividad (28 días)</div>
                ${renderStreakCalendar(profile.streak)}
                <div style="display:flex;gap:16px;margin-top:8px;font-size:var(--text-xs);color:var(--text-muted);justify-content:center">
                  <span><span style="display:inline-block;width:10px;height:10px;background:var(--success);border-radius:2px;vertical-align:middle;margin-right:4px"></span> Activo</span>
                  <span><span style="display:inline-block;width:10px;height:10px;background:var(--surface-secondary);border-radius:2px;vertical-align:middle;margin-right:4px"></span> Inactivo</span>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <div style="font-weight:600;font-size:var(--text-sm);margin-bottom:12px">Logros (${achievements.length} desbloqueados)</div>
                ${achievements.length === 0 ? '<p style="color:var(--text-muted);font-size:var(--text-sm)">Completá tareas para desbloquear logros.</p>' : renderAchievements(achievements)}
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>Preferencias</h3>
            <div class="card">
              <div class="card-body">
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0">
                  <div>
                    <div style="font-weight:600;font-size:var(--text-sm)">Tema oscuro</div>
                    <div style="font-size:var(--text-xs);color:var(--text-muted)">Alternar entre modo claro y oscuro</div>
                  </div>
                  <button class="btn btn-sm btn-secondary" id="settingsThemeBtn" style="min-width:100px">Cambiar</button>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-top:1px solid var(--border-light)">
                  <div>
                    <div style="font-weight:600;font-size:var(--text-sm)">Sonido</div>
                    <div style="font-size:var(--text-xs);color:var(--text-muted)">Efectos de sonido al interactuar</div>
                  </div>
                  <button class="btn btn-sm btn-secondary" id="settingsSoundBtn" style="min-width:100px">${Sound.isEnabled() ? 'Activado' : 'Silenciado'}</button>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>Datos de demostración</h3>
            <div class="card">
              <div class="card-body">
                <p style="margin-bottom:12px">La aplicación incluye datos de demostración precargados para que puedas explorar todas las funcionalidades.</p>
                ${DB.count('clients') > 0 ? `
                  <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:12px">Actualmente hay <strong>${DB.count('clients')}</strong> ${DB.count('clients') === 1 ? 'cliente' : 'clientes'} en el sistema.</p>
                ` : `
                  <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:12px">No hay datos de demostración. Podés recargarlos cuando quieras.</p>
                `}
                <button class="btn btn-secondary" id="reseedBtn">
                  ${DB.count('clients') > 0 ? 'Recargar datos demo' : 'Cargar datos demo'}
                </button>
                <button class="btn btn-danger" id="clearAllBtn" style="margin-left:8px">Eliminar todos los datos</button>
                <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:12px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:2px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Recargar demo reinicia todos los datos, incluyendo tu progreso y perfil.</p>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>Acerca de</h3>
            <div class="card">
              <div class="card-body">
                <p><strong>My Workspace</strong> — Sistema Operativo Personal & Profesional</p>
                <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:4px">Versión 3.0.0</p>
                <p style="font-size:var(--text-sm);color:var(--text-muted);margin-top:12px">Metas → Proyectos → Tareas, con gamificación, misiones diarias y enfoque en acción.</p>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    afterRender() {
      document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfileData);

      document.getElementById('settingsOccupation')?.addEventListener('change', function() {
        const group = document.getElementById('settingsOtherGroup');
        if (group) group.style.display = this.value === 'other' ? '' : 'none';
      });

      document.querySelectorAll('.topic-chip').forEach(el => {
        el.addEventListener('click', () => {
          el.classList.toggle('topic-chip-active');
        });
      });

      document.getElementById('reseedBtn')?.addEventListener('click', async () => {
        Object.keys(localStorage).filter(k => k.startsWith('levitar_')).forEach(k => localStorage.removeItem(k));
        DB.init();
        const { seedDemoData } = await import('../seed.js');
        seedDemoData();
        showToast('Datos demo recargados', 'success');
        window.location.reload();
      });

      document.getElementById('clearAllBtn')?.addEventListener('click', () => {
        if (confirm('¿Estás seguro de eliminar todos los datos? Esta acción no se puede deshacer.')) {
          Object.keys(localStorage).filter(k => k.startsWith('levitar_')).forEach(k => localStorage.removeItem(k));
          DB.init();
          showToast('Todos los datos eliminados', 'success');
          window.location.reload();
        }
      });

      document.getElementById('settingsThemeBtn')?.addEventListener('click', () => {
        const stored = localStorage.getItem('levitar_theme');
        const current = stored === 'dark' || stored === 'light' ? stored : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('levitar_theme', next);
        document.documentElement.classList.toggle('dark', next === 'dark');
        const btn = document.getElementById('settingsThemeBtn');
        if (btn) btn.textContent = next === 'dark' ? 'Oscuro' : 'Claro';
      });

      const soundBtn = document.getElementById('settingsSoundBtn');
      if (soundBtn) {
        soundBtn.addEventListener('click', () => {
          const on = !Sound.isEnabled();
          Sound.toggle(on);
          soundBtn.textContent = on ? 'Activado' : 'Silenciado';
        });
      }
    }
  };
}
