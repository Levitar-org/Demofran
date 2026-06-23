import { DB } from '../db.js';
import { Utils } from '../utils.js';
import { router } from '../router.js';
import { showModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { CalendarGrid } from '../components/Calendar.js';
import { initKanbanDrag } from '../components/Kanban.js';
import { addSwipeTarget } from '../components/SwipeToDelete.js';
import { DailyMissions } from '../components/DailyMissions.js';

const SECTIONS = [
  { id: 'overview', label: 'Resumen' },
  { id: 'projects', label: 'Proyectos' },
  { id: 'tasks', label: 'Tareas' },
  { id: 'notes', label: 'Notas' },
  { id: 'calendar', label: 'Calendario' },
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
    const events = getPersonalEvents().filter(e => Utils.isThisWeek(e.date));
    const activeProjects = projects.filter(p => p.status === 'active');
    const pendingTasks = tasks.filter(t => t.status !== 'done');

    return `
      <div class="page-enter" style="margin-top:16px">
        <div id="dailyMissionsContainer"></div>
        <div class="stat-grid" style="margin-top:16px">
          <div class="stat-card"><div class="stat-label">Proyectos activos</div><div class="stat-value">${activeProjects.length}</div></div>
          <div class="stat-card"><div class="stat-label">Tareas pendientes</div><div class="stat-value">${pendingTasks.length}</div></div>
          <div class="stat-card"><div class="stat-label">Notas</div><div class="stat-value">${notes.length}</div></div>
          <div class="stat-card"><div class="stat-label">Nivel</div><div class="stat-value">${DB.getProfile().level}</div></div>
        </div>

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

  // ─── MODALS ───

  function showNewPersonalProject() {
    if (getPersonalProjects().length >= 2) {
      return showToast('Máximo 2 proyectos personales en la versión demo', 'warning');
    }
    const goals = DB.getGoals().filter(g => g.status !== 'achieved');
    showModal('Nuevo Proyecto Personal', `
      <div class="form-group"><label>Nombre *</label><input type="text" id="ppName" class="form-input" autofocus></div>
      <div class="form-group"><label>Descripción</label><textarea id="ppDesc" class="form-input" rows="3"></textarea></div>
      <div class="form-group"><label>Meta (opcional)</label><select id="ppGoal" class="form-input">
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
    const objectives = DB.where('objectives', o => {
      const proj = DB.getById('projects', o.projectId);
      return proj && proj.workspace === 'personal' && o.status !== 'achieved';
    });
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
            ${activeSection === 'projects' ? renderProjects() : ''}
            ${activeSection === 'tasks' ? renderTasks() : ''}
            ${activeSection === 'notes' ? renderNotes() : ''}
            ${activeSection === 'calendar' ? renderCalendar() : ''}
          </div>
        `;
      },
      afterRender() {
        addSwipeTarget('.note-card', { key: 'personal-notes', onDelete: (id) => { DB.remove('notes', id); reRender(); } });
        addSwipeTarget('.kanban-item', { key: 'personal-tasks', onDelete: (id) => { DB.remove('tasks', id); reRender(); } });

        document.querySelectorAll('[data-section]').forEach(el => {
          el.addEventListener('click', () => { activeSection = el.dataset.section; reRender(); });
        });

        document.getElementById('newPersonalProjectBtn')?.addEventListener('click', showNewPersonalProject);
        document.getElementById('newPersonalTaskBtn')?.addEventListener('click', showNewPersonalTask);
        document.getElementById('newPersonalNoteBtn')?.addEventListener('click', () => showNewPersonalNote(''));
        document.getElementById('newPersonalEventBtn')?.addEventListener('click', showNewPersonalEvent);

        document.querySelectorAll('.project-card[data-project-id]').forEach(el => {
          el.addEventListener('click', () => router.navigate(`/personal/projects/${el.dataset.projectId}`));
        });
        document.querySelectorAll('.personal-project-item[data-id]').forEach(el => {
          el.addEventListener('click', () => router.navigate(`/personal/projects/${el.dataset.id}`));
        });

        document.querySelectorAll('.personal-task-del-btn').forEach(el => {
          el.addEventListener('click', (e) => { e.stopPropagation(); DB.remove('tasks', el.dataset.id); reRender(); });
        });
        document.querySelectorAll('.personal-note-del-btn').forEach(el => {
          el.addEventListener('click', (e) => { e.stopPropagation(); DB.remove('notes', el.dataset.id); reRender(); });
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

        const missionsContainer = document.getElementById('dailyMissionsContainer');
        if (missionsContainer) {
          const missions = DailyMissions();
          missionsContainer.innerHTML = missions.render();
          missions.afterRender();
        }

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
                router.navigate('/personal/tasks');
              }
            }
          });
          const container = document.getElementById('calendarContainer');
          container.innerHTML = cal.render();
          cal.afterRender();
        }

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
