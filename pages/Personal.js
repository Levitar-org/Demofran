import { DB } from '../db.js';
import { Utils } from '../utils.js';
import { router } from '../router.js';
import { showModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { CalendarGrid } from '../components/Calendar.js';
import { initKanbanDrag } from '../components/Kanban.js';
import { addSwipeTarget } from '../components/SwipeToDelete.js';

const SECTIONS = [
  { id: 'overview', label: 'Resumen' },
  { id: 'vision', label: 'Visión' },
  { id: 'goals', label: 'Metas' },
  { id: 'projects', label: 'Proyectos' },
  { id: 'tasks', label: 'Tareas' },
  { id: 'notes', label: 'Notas' },
  { id: 'calendar', label: 'Calendario' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'learning', label: 'Aprendizaje' },
];

export function PersonalPage(initialTab) {
  let activeSection = (initialTab && initialTab.tab) || 'overview';

  function getPersonalProjects() {
    return DB.getPersonalProjects();
  }

  function getPersonalTasks() {
    return DB.getPersonalItems('tasks');
  }

  function getPersonalNotes() {
    return DB.getPersonalItems('notes');
  }

  function getPersonalEvents() {
    return DB.getPersonalItems('events').sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  function getPersonalObjectives() {
    return DB.where('objectives', o => {
      const proj = DB.getById('projects', o.projectId);
      return proj && proj.workspace === 'personal';
    });
  }

  function renderHeader() {
    const tasks = getPersonalTasks();
    const projects = getPersonalProjects();
    const profile = DB.getProfile();
    return `
      <div class="welcome-section">
        <h1>Workspace Personal</h1>
        <p style="display:flex;gap:16px;flex-wrap:wrap">
          <span>${projects.length} proyectos</span>
          <span>${tasks.length} tareas</span>
          <span>Nivel ${profile.level}</span>
          <span>🔥 ${profile.streak} días</span>
        </p>
      </div>
    `;
  }

  function renderSections() {
    return `
      <div class="tabs detail-tabs" style="margin-top:16px;overflow-x:auto">
        ${SECTIONS.map(s => `
          <button class="tab-btn ${activeSection === s.id ? 'active' : ''}" data-section="${s.id}">${s.label}</button>
        `).join('')}
      </div>
    `;
  }

  function renderOverview() {
    const projects = getPersonalProjects();
    const tasks = getPersonalTasks();
    const notes = getPersonalNotes();
    const objectives = getPersonalObjectives();
    const events = getPersonalEvents().filter(e => Utils.isThisWeek(e.date));
    const activeProjects = projects.filter(p => p.status === 'active');
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const visions = DB.getVisions();
    const goals = DB.getGoals().filter(g => {
      const projs = projects.filter(p => p.goalId === g.id);
      return projs.length > 0 || !g.visionId;
    });

    return `
      <div class="page-enter" style="margin-top:16px">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-label">Proyectos activos</div><div class="stat-value">${activeProjects.length}</div></div>
          <div class="stat-card"><div class="stat-label">Tareas pendientes</div><div class="stat-value">${pendingTasks.length}</div></div>
          <div class="stat-card"><div class="stat-label">Notas</div><div class="stat-value">${notes.length}</div></div>
          <div class="stat-card"><div class="stat-label">Metas activas</div><div class="stat-value">${objectives.filter(o => o.status !== 'achieved').length}</div></div>
        </div>

        ${visions.length > 0 ? `
          <div class="card" style="padding:16px;margin-bottom:16px">
            <h3 style="font-size:var(--text-sm);text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:8px">Mi Visión</h3>
            ${visions.filter(v => v.status === 'active').slice(0, 1).map(v => {
              const vProg = DB.getVisionProgress(v.id);
              return `
                <div style="display:flex;align-items:center;gap:12px">
                  <span style="font-size:28px">🎯</span>
                  <div style="flex:1">
                    <strong>${Utils.sanitize(v.title)}</strong>
                    ${v.description ? `<p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:2px">${Utils.truncate(Utils.sanitize(v.description), 80)}</p>` : ''}
                    <div style="margin-top:6px">
                      <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);margin-bottom:2px">
                        <span style="color:var(--text-muted)">Progreso general</span>
                        <span style="color:var(--text-muted)">${vProg.percent}%</span>
                      </div>
                      <div class="progress-bar" style="height:6px">
                        <div class="progress-fill" style="width:${vProg.percent}%;height:6px;background:var(--accent)"></div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
          <div class="recent-activity">
            <h3>Proyectos activos</h3>
            ${activeProjects.length === 0 ? '<p style="color:var(--text-muted)">Sin proyectos activos</p>' : `
              <div style="display:flex;flex-direction:column;gap:8px">
                ${activeProjects.slice(0, 5).map(p => `
                  <div class="personal-project-item" data-id="${p.id}">
                    <span class="project-dot project-dot-${p.status}"></span>
                    <span>${Utils.sanitize(p.name)}</span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
          <div class="recent-activity">
            <h3>Eventos de la semana</h3>
            ${events.length === 0 ? '<p style="color:var(--text-muted)">Sin eventos esta semana</p>' : `
              <div class="timeline">
                ${events.slice(0, 5).map(e => `
                  <div class="timeline-item">
                    <div class="timeline-item-time">${Utils.formatDateShort(e.date)}</div>
                    <div class="timeline-item-content">${Utils.sanitize(e.title)}</div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // ─── VISIÓN SECTION ───
  function renderVision() {
    const visions = DB.getVisions();
    return `
      <div class="page-enter" style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>Mi Visión (${visions.length})</h3>
          <button class="btn btn-primary" id="addVisionBtn">+ Nueva visión</button>
        </div>
        ${visions.length === 0 ? `
          <div class="empty-state">
            <span style="font-size:48px">🎯</span>
            <h3>Sin visión definida</h3>
            <p>Definí tu visión de vida para alinear todos tus proyectos y metas.</p>
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:12px">
            ${visions.map(v => {
              const vProg = DB.getVisionProgress(v.id);
              const goals = DB.getGoals(v.id);
              return `
                <div class="card" style="padding:20px">
                  <div style="display:flex;justify-content:space-between;align-items:start">
                    <div style="flex:1">
                      <div style="display:flex;align-items:center;gap:8px">
                        <span class="objective-status objective-${v.status}"></span>
                        <strong style="font-size:var(--text-base)">${Utils.sanitize(v.title)}</strong>
                        <span class="tag tag-${v.status}">${Utils.statusLabel(v.status)}</span>
                      </div>
                      ${v.description ? `<p style="color:var(--text-secondary);margin-top:6px;font-size:var(--text-sm)">${Utils.sanitize(v.description)}</p>` : ''}
                      ${v.targetDate ? `<p style="color:var(--text-muted);font-size:var(--text-xs);margin-top:4px">Meta: ${Utils.formatDate(v.targetDate)}</p>` : ''}
                      <div style="margin-top:10px">
                        <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--text-muted);margin-bottom:4px">
                          <span>Progreso: ${vProg.done}/${vProg.total} metas</span>
                          <span>${vProg.percent}%</span>
                        </div>
                        <div class="progress-bar" style="height:8px">
                          <div class="progress-fill" style="width:${vProg.percent}%;height:8px;background:var(--accent)"></div>
                        </div>
                      </div>
                      ${goals.length > 0 ? `
                        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light)">
                          <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:6px">Metas asociadas (${goals.length})</div>
                          ${goals.slice(0, 4).map(g => {
                            const gProg = DB.getGoalProgress(g.id);
                            return `
                              <div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:var(--text-sm)">
                                <span class="objective-status objective-${g.status}"></span>
                                <span style="flex:1">${Utils.truncate(Utils.sanitize(g.title), 40)}</span>
                                <span style="font-size:var(--text-xs);color:var(--text-muted)">${gProg.percent}%</span>
                              </div>
                            `;
                          }).join('')}
                          ${goals.length > 4 ? `<div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:4px">+${goals.length - 4} más</div>` : ''}
                        </div>
                      ` : ''}
                    </div>
                    <div style="display:flex;gap:4px;flex-shrink:0">
                      <button class="btn btn-sm btn-ghost vision-status-btn" data-id="${v.id}" data-status="${v.status}">✓</button>
                      <button class="btn btn-sm btn-ghost vision-del-btn" data-id="${v.id}">✕</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
        ${visions.length > 0 ? `
          <h3 style="margin-top:24px;margin-bottom:12px">Metas Estratégicas</h3>
          ${renderGoalsSection()}
        ` : ''}
      </div>
    `;
  }

  function renderGoalsSection() {
    const goals = DB.getGoals();
    const visions = DB.getVisions();
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h4>Metas (${goals.length})</h4>
        <button class="btn btn-primary btn-sm" id="addGoalBtn">+ Nueva meta</button>
      </div>
      ${goals.length === 0 ? '<p style="color:var(--text-muted)">Sin metas estratégicas</p>' : `
        <div style="display:flex;flex-direction:column;gap:8px">
          ${goals.map(g => {
            const v = g.visionId ? DB.getById('visions', g.visionId) : null;
            const gProg = DB.getGoalProgress(g.id);
            return `
              <div class="card" style="padding:16px">
                <div style="display:flex;justify-content:space-between;align-items:start">
                  <div style="flex:1">
                    <div style="display:flex;align-items:center;gap:8px">
                      <span class="objective-status objective-${g.status}"></span>
                      <strong>${Utils.sanitize(g.title)}</strong>
                      <span class="tag tag-${g.type}">${Utils.statusLabel(g.type)}</span>
                      <span class="tag tag-${g.status}">${Utils.statusLabel(g.status)}</span>
                    </div>
                    ${g.description ? `<p style="color:var(--text-muted);font-size:var(--text-sm);margin-top:4px">${Utils.truncate(Utils.sanitize(g.description), 60)}</p>` : ''}
                    ${v ? `<p style="color:var(--text-muted);font-size:var(--text-xs);margin-top:2px">Visión: ${Utils.sanitize(v.title)}</p>` : ''}
                    ${gProg.total > 0 ? `
                      <div class="progress-bar" style="margin-top:8px;height:6px">
                        <div class="progress-fill" style="width:${gProg.percent}%;height:6px;background:${g.status === 'achieved' ? 'var(--success)' : 'var(--accent)'}"></div>
                      </div>
                      <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">
                        <span>${gProg.percent}%</span>
                        <span>${gProg.done}/${gProg.total} objetivos</span>
                      </div>
                    ` : ''}
                  </div>
                  <div style="display:flex;gap:4px;flex-shrink:0">
                    <button class="btn btn-sm btn-ghost goal-status-btn" data-id="${g.id}" data-status="${g.status}">✓</button>
                    <button class="btn btn-sm btn-ghost goal-del-btn" data-id="${g.id}">✕</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  }

  function renderProjects() {
    const projects = getPersonalProjects();
    return `
      <div class="page-enter" style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>Mis Proyectos (${projects.length})</h3>
          <button class="btn btn-primary" id="newPersonalProjectBtn">+ Nuevo proyecto</button>
        </div>
        ${projects.length === 0 ? `
          <div class="empty-state"><p style="color:var(--text-muted)">No hay proyectos personales</p></div>
        ` : `
          <div class="project-grid">
            ${projects.map(p => `
              <div class="project-card" data-project-id="${p.id}">
                <div class="project-card-header">
                  <div class="project-status project-status-${p.status}"></div>
                  <span class="tag tag-${p.status}">${Utils.statusLabel(p.status)}</span>
                </div>
                <h3 class="project-card-name">${Utils.sanitize(p.name)}</h3>
                <p class="project-card-desc">${Utils.truncate(Utils.sanitize(p.description || ''), 80)}</p>
                <div class="project-card-meta">
                  <span>Creado ${Utils.getRelativeTime(p.createdAt)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  function renderGoals() {
    const objectives = getPersonalObjectives();
    return `
      <div class="page-enter" style="margin-top:16px">
        <h3 style="margin-bottom:12px">Metas Personales (${objectives.length})</h3>
        ${objectives.length === 0 ? `
          <div class="empty-state"><p style="color:var(--text-muted)">No hay metas definidas</p></div>
        ` : `
          <div class="objectives-list">
            ${objectives.map(o => {
              const proj = DB.getById('projects', o.projectId);
              const prog = DB.getObjectiveProgress(o.id);
              return `
                <div class="card" style="padding:16px;margin-bottom:8px">
                  <div style="display:flex;justify-content:space-between;align-items:start">
                    <div style="flex:1">
                      <div style="display:flex;align-items:center;gap:8px">
                        <span class="objective-status objective-${o.status}"></span>
                        <strong>${Utils.sanitize(o.title)}</strong>
                        <span class="tag tag-${o.type}">${Utils.statusLabel(o.type)}</span>
                        ${prog.total > 0 ? `<span class="tag" style="background:var(--surface-secondary);color:var(--text-secondary)">${prog.done}/${prog.total} tareas</span>` : ''}
                      </div>
                      ${o.description ? `<p style="color:var(--text-muted);font-size:var(--text-sm);margin-top:4px">${Utils.sanitize(o.description)}</p>` : ''}
                      ${proj ? `<p style="color:var(--text-muted);font-size:var(--text-xs);margin-top:4px">Proyecto: ${Utils.sanitize(proj.name)}</p>` : ''}
                      ${prog.total > 0 ? `
                      <div class="progress-bar" style="margin-top:8px">
                        <div class="progress-fill" style="width:${prog.percent}%;background:${o.status === 'achieved' ? 'var(--success)' : 'var(--accent)'}"></div>
                      </div>
                      <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">
                        <span>${prog.percent}% completado</span>
                        <span>${prog.done} de ${prog.total} tareas</span>
                      </div>` : ''}
                    </div>
                    <div style="display:flex;gap:4px;flex-shrink:0">
                      <button class="btn btn-sm btn-ghost obj-status-btn" data-id="${o.id}" data-status="${o.status}">✓</button>
                    </div>
                  </div>
                  ${o.targetDate ? `<div style="margin-top:8px;font-size:var(--text-sm);color:var(--text-muted)">Meta: ${Utils.formatDate(o.targetDate)}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  function renderTasks() {
    const tasks = getPersonalTasks();
    const columns = ['todo', 'in_progress', 'done'];
    const colLabels = { todo: 'Por hacer', in_progress: 'En progreso', done: 'Completada' };

    return `
      <div class="page-enter" style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>Tareas Personales (${tasks.length})</h3>
          <button class="btn btn-primary" id="newPersonalTaskBtn">+ Nueva tarea</button>
        </div>
        <div class="kanban-board">
          ${columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col);
            return `
              <div class="kanban-column" data-status="${col}">
                <div class="kanban-column-header"><span>${colLabels[col]}</span><span class="kanban-count">${colTasks.length}</span></div>
                <div class="kanban-items">
                  ${colTasks.map(t => {
                    const obj = t.objectiveId ? DB.getById('objectives', t.objectiveId) : null;
                    const diff = t.difficulty || 'medium';
                    const diffXp = { easy: 10, medium: 25, hard: 50, epic: 100 }[diff];
                    return `
                    <div class="kanban-item" draggable="true" data-task-id="${t.id}">
                      <div class="kanban-item-title">${Utils.sanitize(t.title)}</div>
                      ${obj ? `<div class="kanban-item-obj"><span class="objective-dot objective-${obj.status}"></span>${Utils.truncate(Utils.sanitize(obj.title), 30)}</div>` : ''}
                      ${t.description ? `<div class="kanban-item-desc">${Utils.truncate(Utils.sanitize(t.description), 50)}</div>` : ''}
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
                        <span style="font-size:10px;color:var(--accent);font-weight:600">+${diffXp} XP</span>
                        <button class="btn btn-sm btn-ghost personal-task-del-btn" data-id="${t.id}">✕</button>
                      </div>
                    </div>
                  `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderNotes() {
    const notes = getPersonalNotes();
    return `
      <div class="page-enter" style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>Notas Personales (${notes.length})</h3>
          <button class="btn btn-primary" id="newPersonalNoteBtn">+ Nueva nota</button>
        </div>
        ${notes.length === 0 ? `
          <div class="empty-state"><p style="color:var(--text-muted)">No hay notas</p></div>
        ` : `
          <div class="notes-list">
            ${notes.map(n => `
              <div class="card note-card ${n.pinned ? 'note-pinned' : ''}" style="padding:16px;margin-bottom:8px">
                <div style="display:flex;justify-content:space-between;align-items:start">
                  <div style="flex:1">
                    <div style="display:flex;align-items:center;gap:8px">
                      ${n.pinned ? '<span>📌</span>' : ''}
                      <strong>${Utils.sanitize(n.title)}</strong>
                    </div>
                    <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-top:4px;white-space:pre-wrap">${Utils.sanitize(n.content)}</p>
                    ${n.tags && n.tags.length ? `<div style="display:flex;gap:4px;margin-top:8px">${n.tags.map(tg => `<span class="tag">${Utils.sanitize(tg)}</span>`).join('')}</div>` : ''}
                  </div>
                  <button class="btn btn-sm btn-ghost personal-note-del-btn" data-id="${n.id}">✕</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  function renderCalendar() {
    const events = getPersonalEvents();
    const tasks = getPersonalTasks();
    return `
      <div class="page-enter" style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>Calendario Personal</h3>
          <button class="btn btn-primary" id="newPersonalEventBtn">+ Nuevo evento</button>
        </div>
        <div class="calendar-layout">
          <div id="calendarContainer"></div>
        </div>
        <div style="margin-top:12px">
          <button class="btn btn-sm btn-ghost" id="showAllEventsBtn">Ver todos los eventos</button>
        </div>
      </div>
    `;
  }

  function renderIdeas() {
    const allNotes = getPersonalNotes();
    const ideas = allNotes.filter(n => n.tags && n.tags.includes && n.tags.includes('ideas'));
    return `
      <div class="page-enter" style="margin-top:16px">
        <h3 style="margin-bottom:12px">Banco de Ideas (${ideas.length})</h3>
        <button class="btn btn-primary" id="newIdeaBtn" style="margin-bottom:12px">+ Nueva idea</button>
        ${ideas.length === 0 ? `
          <div class="empty-state"><p style="color:var(--text-muted)">No hay ideas registradas</p></div>
        ` : `
          <div class="idea-grid">
            ${ideas.map(n => `
              <div class="idea-card" data-id="${n.id}">
                <div class="idea-card-title">${Utils.sanitize(n.title)}</div>
                <div class="idea-card-preview">${Utils.truncate(Utils.sanitize(n.content), 120)}</div>
                <div class="idea-card-footer">
                  <span class="idea-card-date">${Utils.formatDateShort(n.createdAt)}</span>
                  <button class="btn btn-sm btn-ghost idea-del-btn" data-id="${n.id}">✕</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  function showIdeaDetail(note) {
    showModal(Utils.sanitize(note.title), `
      <div style="white-space:pre-wrap;line-height:1.7;font-size:var(--text-base);color:var(--text-primary)">${Utils.sanitize(note.content)}</div>
      ${note.tags && note.tags.length ? `<div style="display:flex;gap:4px;margin-top:16px">${note.tags.map(t => `<span class="tag">${Utils.sanitize(t)}</span>`).join('')}</div>` : ''}
      <div style="margin-top:12px;font-size:var(--text-xs);color:var(--text-muted)">Creada ${Utils.formatDate(note.createdAt)}</div>
    `, [
      { label: 'Cerrar', class: 'btn btn-secondary', action: c => c() }
    ]);
  }

  function renderLearning() {
    const objectives = getPersonalObjectives();
    const projects = getPersonalProjects();
    const learningProjects = projects.filter(p =>
      p.name.toLowerCase().includes('curso') ||
      p.name.toLowerCase().includes('aprend') ||
      p.name.toLowerCase().includes('estudio') ||
      p.name.toLowerCase().includes('formación')
    );

    return `
      <div class="page-enter" style="margin-top:16px">
        <h3 style="margin-bottom:12px">Aprendizaje</h3>
        ${learningProjects.length === 0 ? `
          <div class="empty-state"><p style="color:var(--text-muted)">No hay proyectos de aprendizaje</p></div>
        ` : `
          <div class="card-grid">
            ${learningProjects.map(p => `
              <div class="card" style="padding:16px;cursor:pointer" data-project-id="${p.id}">
                <h4>${Utils.sanitize(p.name)}</h4>
                <p style="color:var(--text-muted);font-size:var(--text-sm);margin-top:4px">${Utils.truncate(Utils.sanitize(p.description || ''), 80)}</p>
                <span class="tag tag-${p.status}" style="margin-top:8px">${Utils.statusLabel(p.status)}</span>
              </div>
            `).join('')}
          </div>
        `}
        <div style="margin-top:16px">
          <h4 style="margin-bottom:8px">Progreso general</h4>
          ${objectives.length > 0 ? `
            <div class="objectives-list">
              ${objectives.map(o => `
                <div class="objective-item">
                  <span class="objective-status objective-${o.status}"></span>
                  <span>${Utils.sanitize(o.title)}</span>
                </div>
              `).join('')}
            </div>
          ` : '<p style="color:var(--text-muted)">Sin metas de aprendizaje</p>'}
        </div>
      </div>
    `;
  }

  // ─── MODALS ───

  function showAddVision() {
    showModal('Nueva Visión', `
      <div class="form-group"><label>Título de tu visión *</label><input type="text" id="vTitle" class="form-input" placeholder="Ej: Libertad creativa total" autofocus></div>
      <div class="form-group"><label>Descripción</label><textarea id="vDesc" class="form-input" rows="3" placeholder="¿Cómo imaginás tu vida ideal?"></textarea></div>
      <div class="form-group"><label>Fecha meta (opcional)</label><input type="date" id="vTarget" class="form-input"></div>
    `, [
      { label: 'Cancelar', class: 'btn btn-secondary', action: c => c() },
      { label: 'Crear', class: 'btn btn-primary', action: c => {
        const title = document.getElementById('vTitle').value.trim();
        if (!title) return showToast('El título es obligatorio', 'warning');
        DB.create('visions', { title, description: document.getElementById('vDesc').value.trim(), targetDate: document.getElementById('vTarget').value || null, status: 'active' });
        showToast('Visión creada', 'success'); c(); reRender();
      }}
    ]);
  }

  function showAddGoal() {
    const visions = DB.getVisions();
    showModal('Nueva Meta Estratégica', `
      <div class="form-group"><label>Título *</label><input type="text" id="gTitle" class="form-input" placeholder="Ej: Consolidar agencia de marketing" autofocus></div>
      <div class="form-group"><label>Descripción</label><textarea id="gDesc" class="form-input" rows="2"></textarea></div>
      <div class="form-group"><label>Tipo</label><select id="gType" class="form-input">
        <option value="career">Carrera</option><option value="health">Salud</option>
        <option value="finance">Finanzas</option><option value="learning">Aprendizaje</option>
        <option value="personal">Personal</option>
      </select></div>
      <div class="form-group"><label>Visión relacionada</label><select id="gVision" class="form-input">
        <option value="">Sin visión</option>
        ${visions.map(v => `<option value="${v.id}">${Utils.sanitize(v.title)}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Fecha meta</label><input type="date" id="gTarget" class="form-input"></div>
    `, [
      { label: 'Cancelar', class: 'btn btn-secondary', action: c => c() },
      { label: 'Crear', class: 'btn btn-primary', action: c => {
        const title = document.getElementById('gTitle').value.trim();
        if (!title) return showToast('El título es obligatorio', 'warning');
        DB.create('goals', {
          visionId: document.getElementById('gVision').value || null,
          title,
          description: document.getElementById('gDesc').value.trim(),
          type: document.getElementById('gType').value,
          targetDate: document.getElementById('gTarget').value || null,
          status: 'pending'
        });
        showToast('Meta creada', 'success'); c(); reRender();
      }}
    ]);
  }

  function showNewPersonalProject() {
    const goals = DB.getGoals().filter(g => g.status !== 'achieved');
    showModal('Nuevo Proyecto Personal', `
      <div class="form-group"><label>Nombre *</label><input type="text" id="ppName" class="form-input" autofocus></div>
      <div class="form-group"><label>Descripción</label><textarea id="ppDesc" class="form-input" rows="3"></textarea></div>
      <div class="form-group"><label>Meta estratégica (opcional)</label><select id="ppGoal" class="form-input">
        <option value="">Sin meta</option>
        ${goals.map(g => `<option value="${g.id}">${Utils.sanitize(g.title)}</option>`).join('')}
      </select></div>
    `, [
      { label: 'Cancelar', class: 'btn btn-secondary', action: c => c() },
      { label: 'Crear', class: 'btn btn-primary', action: c => {
        const name = document.getElementById('ppName').value.trim();
        if (!name) return showToast('El nombre es obligatorio', 'warning');
        const project = DB.create('projects', {
          clientId: null, workspace: 'personal',
          goalId: document.getElementById('ppGoal').value || null,
          name, description: document.getElementById('ppDesc').value.trim(),
          status: 'active', archived: false
        });
        DB.createHistoryEntry('create', 'project', project.id, { projectId: project.id, workspace: 'personal', name });
        showToast('Proyecto creado', 'success'); c(); reRender();
      }}
    ]);
  }

  function getPersonalObjectiveOptions() {
    const objectives = getPersonalObjectives().filter(o => o.status !== 'achieved');
    if (objectives.length === 0) return '<option value="">Sin objetivos disponibles</option>';
    return objectives.map(o => {
      const p = DB.getById('projects', o.projectId);
      return `<option value="${o.id}">${Utils.sanitize(o.title)}${p ? ' (' + Utils.sanitize(p.name) + ')' : ''}</option>`;
    }).join('');
  }

  function showNewPersonalTask() {
    showModal('Nueva Tarea Personal', `
      <div class="form-group"><label>Título *</label><input type="text" id="ptTitle" class="form-input" autofocus></div>
      <div class="form-group"><label>Descripción</label><textarea id="ptDesc" class="form-input" rows="2"></textarea></div>
      <div class="form-group"><label>Dificultad</label><select id="ptDifficulty" class="form-input">
        <option value="easy">Fácil (+10 XP)</option>
        <option value="medium" selected>Media (+25 XP)</option>
        <option value="hard">Difícil (+50 XP)</option>
        <option value="epic">Épica (+100 XP)</option>
      </select></div>
      <div class="form-group"><label>Fecha de vencimiento</label><input type="date" id="ptDueDate" class="form-input"></div>
      <div class="form-group"><label>Objetivo vinculado</label><select id="ptObjective" class="form-input"><option value="">Sin objetivo</option>${getPersonalObjectiveOptions()}</select></div>
    `, [
      { label: 'Cancelar', class: 'btn btn-secondary', action: c => c() },
      { label: 'Crear', class: 'btn btn-primary', action: c => {
        const title = document.getElementById('ptTitle').value.trim();
        if (!title) return showToast('El título es obligatorio', 'warning');
        const objectiveId = document.getElementById('ptObjective')?.value || null;
        const obj = objectiveId ? DB.getById('objectives', objectiveId) : null;
        DB.create('tasks', {
          clientId: null, projectId: obj ? obj.projectId : null, workspace: 'personal',
          title, description: document.getElementById('ptDesc').value.trim(),
          difficulty: document.getElementById('ptDifficulty').value,
          dueDate: document.getElementById('ptDueDate').value || null,
          status: 'todo', objectiveId
        });
        showToast('Tarea creada', 'success'); c(); reRender();
      }}
    ]);
  }

  function showNewPersonalNote(tags) {
    showModal('Nueva Nota Personal', `
      <div class="form-group"><label>Título</label><input type="text" id="pnTitle" class="form-input" autofocus></div>
      <div class="form-group"><label>Contenido</label><textarea id="pnContent" class="form-input" rows="4"></textarea></div>
      <div class="form-group"><label>Tags (coma separados)</label><input type="text" id="pnTags" class="form-input" value="${tags || ''}"></div>
    `, [
      { label: 'Cancelar', class: 'btn btn-secondary', action: c => c() },
      { label: 'Crear', class: 'btn btn-primary', action: c => {
        const title = document.getElementById('pnTitle').value.trim();
        if (!title) return showToast('El título es obligatorio', 'warning');
        const tagList = document.getElementById('pnTags').value.split(',').map(t => t.trim()).filter(Boolean);
        DB.create('notes', { projectId: null, workspace: 'personal', title, content: document.getElementById('pnContent').value.trim(), tags: tagList, pinned: false });
        showToast('Nota creada', 'success'); c(); reRender();
      }}
    ]);
  }

  function showNewPersonalEvent() {
    showModal('Nuevo Evento Personal', `
      <div class="form-group"><label>Título</label><input type="text" id="peTitle" class="form-input" autofocus></div>
      <div class="form-group"><label>Fecha</label><input type="date" id="peDate" class="form-input"></div>
    `, [
      { label: 'Cancelar', class: 'btn btn-secondary', action: c => c() },
      { label: 'Crear', class: 'btn btn-primary', action: c => {
        const title = document.getElementById('peTitle').value.trim();
        if (!title) return showToast('El título es obligatorio', 'warning');
        DB.create('events', { clientId: null, projectId: null, workspace: 'personal', title, date: document.getElementById('peDate').value, type: 'publication', description: '' });
        showToast('Evento creado', 'success'); c(); reRender();
      }}
    ]);
  }

  function reRender() {
    const page = render();
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = page.render();
      page.afterRender();
    }
  }

  function render() {
    return {
      render() {
        return `
          <div class="page-enter">
            ${renderHeader()}
            ${renderSections()}
            ${activeSection === 'overview' ? renderOverview() : ''}
            ${activeSection === 'vision' ? renderVision() : ''}
            ${activeSection === 'goals' ? renderGoals() : ''}
            ${activeSection === 'projects' ? renderProjects() : ''}
            ${activeSection === 'tasks' ? renderTasks() : ''}
            ${activeSection === 'notes' ? renderNotes() : ''}
            ${activeSection === 'calendar' ? renderCalendar() : ''}
            ${activeSection === 'ideas' ? renderIdeas() : ''}
            ${activeSection === 'learning' ? renderLearning() : ''}
          </div>
        `;
      },
      afterRender() {
        addSwipeTarget('.note-card', { key: 'personal-notes', onDelete: (id) => { DB.remove('notes', id); reRender(); } });
        addSwipeTarget('.kanban-item', { key: 'personal-tasks', onDelete: (id) => { DB.remove('tasks', id); reRender(); } });

        document.querySelectorAll('[data-section]').forEach(el => {
          el.addEventListener('click', () => { activeSection = el.dataset.section; reRender(); });
        });

        document.getElementById('addVisionBtn')?.addEventListener('click', showAddVision);
        document.getElementById('addGoalBtn')?.addEventListener('click', showAddGoal);
        document.getElementById('newPersonalProjectBtn')?.addEventListener('click', showNewPersonalProject);
        document.getElementById('newPersonalTaskBtn')?.addEventListener('click', showNewPersonalTask);
        document.getElementById('newPersonalNoteBtn')?.addEventListener('click', () => showNewPersonalNote(''));
        document.getElementById('newPersonalEventBtn')?.addEventListener('click', showNewPersonalEvent);
        document.getElementById('newIdeaBtn')?.addEventListener('click', () => showNewPersonalNote('ideas'));

        document.querySelectorAll('.project-card[data-project-id]').forEach(el => {
          el.addEventListener('click', () => router.navigate(`/personal/projects/${el.dataset.projectId}`));
        });
        document.querySelectorAll('.personal-project-item[data-id]').forEach(el => {
          el.addEventListener('click', () => router.navigate(`/personal/projects/${el.dataset.id}`));
        });
        document.querySelectorAll('.card[data-project-id]').forEach(el => {
          el.addEventListener('click', () => router.navigate(`/personal/projects/${el.dataset.projectId}`));
        });

        document.querySelectorAll('.personal-task-del-btn').forEach(el => {
          el.addEventListener('click', (e) => { e.stopPropagation(); DB.remove('tasks', el.dataset.id); reRender(); });
        });
        document.querySelectorAll('.personal-note-del-btn').forEach(el => {
          el.addEventListener('click', (e) => { e.stopPropagation(); DB.remove('notes', el.dataset.id); reRender(); });
        });
        document.querySelectorAll('.personal-event-del-btn').forEach(el => {
          el.addEventListener('click', (e) => { e.stopPropagation(); DB.remove('events', el.dataset.id); reRender(); });
        });

        // Vision & Goal status toggles
        document.querySelectorAll('.vision-status-btn').forEach(el => {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            const current = el.dataset.status;
            const next = current === 'active' ? 'achieved' : current === 'achieved' ? 'abandoned' : 'active';
            DB.update('visions', el.dataset.id, { status: next });
            if (next === 'achieved') DB._awardXP(5000);
            reRender();
          });
        });
        document.querySelectorAll('.vision-del-btn').forEach(el => {
          el.addEventListener('click', (e) => { e.stopPropagation(); DB.deleteVision(el.dataset.id); reRender(); });
        });

        document.querySelectorAll('.goal-status-btn').forEach(el => {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            const current = el.dataset.status;
            const prog = DB.getGoalProgress(el.dataset.id);
            if (current !== 'achieved' && prog.total > 0 && prog.percent < 100) {
              showToast('Completá todos los objetivos vinculados para lograr esta meta', 'warning');
              return;
            }
            const next = current === 'achieved' ? 'pending' : current === 'pending' ? 'in_progress' : 'achieved';
            DB.update('goals', el.dataset.id, { status: next });
            if (next === 'achieved') DB._awardXP(1000);
            reRender();
          });
        });
        document.querySelectorAll('.goal-del-btn').forEach(el => {
          el.addEventListener('click', (e) => { e.stopPropagation(); DB.deleteGoal(el.dataset.id); reRender(); });
        });

        document.querySelectorAll('.obj-status-btn').forEach(el => {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            const current = el.dataset.status;
            const prog = DB.getObjectiveProgress(el.dataset.id);
            if (current !== 'achieved' && prog.total > 0 && prog.percent < 100) {
              showToast('Completá todas las tareas vinculadas para lograr este objetivo', 'warning');
              return;
            }
            const next = current === 'achieved' ? 'pending' : current === 'pending' ? 'in_progress' : 'achieved';
            DB.update('objectives', el.dataset.id, { status: next });
            if (next === 'achieved') {
              DB._awardXP(500);
              DB.createHistoryEntry('complete', 'objective', el.dataset.id, { projectId: '', workspace: 'personal' });
            }
            reRender();
          });
        });

        initKanbanDrag({
          onStatusChange(taskId, newStatus) {
            if (newStatus === 'done') {
              DB.completeTask(taskId);
            } else {
              DB.update('tasks', taskId, { status: newStatus });
            }
          }
        });

        if (activeSection === 'calendar' && document.getElementById('calendarContainer')) {
          const events = getPersonalEvents();
          const tasks = getPersonalTasks();
          const cal = CalendarGrid({
            events,
            tasks,
            showSidebar: false,
            onNavigate: (type, id, projectId, workspace) => {
              if (type === 'event') {
                const ev = DB.getById('events', id);
                if (ev) showModal(Utils.sanitize(ev.title), `<p style="color:var(--text-secondary)">${Utils.formatDate(ev.date)}</p>`, [
                  { label: 'Cerrar', class: 'btn btn-secondary', action: c => c() }
                ]);
              } else {
                if (workspace === 'personal' || !projectId) {
                  router.navigate('/personal/tasks');
                } else {
                  const task = DB.getById('tasks', id);
                  if (task && task.projectId) {
                    const proj = DB.getById('projects', task.projectId);
                    if (proj) {
                      if (proj.clientId) {
                        router.navigate(`/clients/${proj.clientId}/projects/${task.projectId}`);
                      } else {
                        router.navigate(`/personal/projects/${task.projectId}`);
                      }
                    }
                  }
                }
              }
            }
          });
          const container = document.getElementById('calendarContainer');
          container.innerHTML = cal.render();
          cal.afterRender();
        }

        document.querySelectorAll('.idea-card').forEach(el => {
          el.addEventListener('click', (e) => {
            if (e.target.closest('.idea-del-btn')) return;
            const note = DB.getById('notes', el.dataset.id);
            if (note) showIdeaDetail(note);
          });
        });
        document.querySelectorAll('.idea-del-btn').forEach(el => {
          el.addEventListener('click', (e) => { e.stopPropagation(); DB.remove('notes', el.dataset.id); reRender(); });
        });

        document.getElementById('showAllEventsBtn')?.addEventListener('click', () => {
          const events = getPersonalEvents();
          if (events.length === 0) { showToast('No hay eventos', 'info'); return; }
          showModal('Todos los eventos', `
            <div style="display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto">
              ${events.map(e => `
                <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--surface-secondary);border-radius:var(--radius-md)">
                  <span style="font-size:var(--text-xs);color:var(--text-muted);min-width:80px">${Utils.formatDate(e.date)}</span>
                  <span style="font-size:var(--text-sm)">${Utils.sanitize(e.title)}</span>
                </div>
              `).join('')}
            </div>
          `, [
            { label: 'Cerrar', class: 'btn btn-secondary', action: c => c() }
          ]);
        });
      }
    };
  }



  return render();
}
