import { DB, OCCUPATIONS } from '../db.js';
import { Utils } from '../utils.js';
import { router } from '../router.js';
import { CalendarGrid } from '../components/Calendar.js';

export function DashboardPage() {
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  function getData() {
    const tasks = DB.getAll('tasks');
    const projects = DB.getAll('projects');
    const events = DB.getAll('events');
    const history = DB.getAll('history');
    const visions = DB.getVisions();
    const goals = DB.getGoals();
    const profile = DB.getProfile();
    const xpInfo = DB.getXPToNextLevel();

    const activeProjects = projects.filter(p => !p.archived && p.status === 'active');
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const todayTasks = DB.getTasksDueToday();

    return {
      profile, xpInfo, activeProjects, pendingTasks, todayTasks,
      recentHistory: history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
      activeVision: visions.find(v => v.status === 'active'),
      activeGoals: goals.filter(g => g.status !== 'achieved'),
      tasks, projects, events
    };
  }

  function widget(title, icon, content, extraClass) {
    return `
      <div class="dashboard-widget ${extraClass || ''}">
        <h3 class="widget-title">${icon} ${title}</h3>
        <div class="widget-body">${content}</div>
      </div>
    `;
  }

  function empty(msg) {
    return `<p style="color:var(--text-muted);padding:8px 0;font-size:var(--text-sm)">${msg || 'Sin datos'}</p>`;
  }

  function renderLevelBar(xpInfo) {
    return `
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:var(--text-lg);font-weight:800;color:var(--accent);white-space:nowrap">Nv. ${xpInfo.level}</span>
        <div class="progress-bar" style="flex:1;height:6px;background:var(--surface-secondary);min-width:60px">
          <div class="progress-fill" style="width:${xpInfo.percent}%;background:var(--accent);height:6px;border-radius:3px"></div>
        </div>
        <span style="font-size:var(--text-xs);color:var(--text-muted);white-space:nowrap">${xpInfo.current}/${xpInfo.needed} XP</span>
      </div>
    `;
  }

  return {
    render() {
      const d = getData();
      const p = d.profile;
      const isMobile = window.innerWidth < 768;

      return `
        <div class="page-enter">
          <div class="dashboard-top-bar" style="display:flex;align-items:center;gap:16px;margin-bottom:16px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:200px">
              <div class="detail-avatar" style="width:44px;height:44px;font-size:var(--text-base);background:var(--accent-soft);color:var(--accent);flex-shrink:0">
                ${p.name.charAt(0)}
              </div>
              <div>
                <div style="font-weight:700;font-size:var(--text-base);letter-spacing:-0.02em">${getGreeting()}, ${Utils.sanitize(p.name)}</div>
                <div style="font-size:var(--text-xs);color:var(--text-muted);display:flex;gap:12px;margin-top:2px">
                  ${d.activeVision ? `<span>🎯 ${Utils.truncate(Utils.sanitize(d.activeVision.title), 30)}</span>` : ''}
                  <span>🔥 ${p.streak || 0} días</span>
                </div>
              </div>
            </div>
            <div style="flex:1;min-width:160px">
              ${renderLevelBar({ ...d.xpInfo, level: p.level })}
            </div>
          </div>

          <div class="kpi-simple" style="margin-bottom:16px">
            <div class="kpi-card">
              <div class="kpi-card-value">${d.activeProjects.length}</div>
              <div class="kpi-card-label">Proyectos activos</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-card-value">${d.pendingTasks.length}</div>
              <div class="kpi-card-label">Tareas pendientes</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-card-value">${d.todayTasks.length}</div>
              <div class="kpi-card-label">Vencen hoy</div>
            </div>
          </div>

          <div class="dashboard-grid">
            ${widget('Calendario', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', '<div id="calendarContainer"></div>', 'calendar-widget')}

            ${widget('Misiones de hoy', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>', `
              ${d.todayTasks.length > 0 ? d.todayTasks.map(t => {
                const proj = t.projectId ? DB.getById('projects', t.projectId) : null;
                const diffXp = { easy: 10, medium: 25, hard: 50, epic: 100 }[t.difficulty] || 25;
                return `
                  <div class="widget-item" style="justify-content:space-between">
                    <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
                      <span class="widget-bullet ${t.status}"></span>
                      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Utils.truncate(Utils.sanitize(t.title), 40)}</span>
                      ${proj ? `<span style="font-size:var(--text-xs);color:var(--text-muted);flex-shrink:0">· ${Utils.sanitize(proj.name)}</span>` : ''}
                    </div>
                    <span style="font-size:var(--text-xs);color:var(--accent);font-weight:600;flex-shrink:0">+${diffXp} XP</span>
                  </div>
                `;
              }).join('') : empty('Sin tareas para hoy')}
            `, 'tasks-widget')}

            ${widget('Visión y Metas', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>', `
              ${d.activeVision ? `
                <div style="margin-bottom:10px">
                  <div style="font-weight:600;font-size:var(--text-sm)">${Utils.truncate(Utils.sanitize(d.activeVision.title), 45)}</div>
                </div>
                ${d.activeGoals.slice(0, 3).map(g => {
                  const prog = DB.getGoalProgress(g.id);
                  return `
                    <div style="margin-bottom:8px">
                      <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);margin-bottom:2px">
                        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Utils.truncate(Utils.sanitize(g.title), 30)}</span>
                        <span style="color:var(--text-muted);flex-shrink:0">${prog.percent}%</span>
                      </div>
                      <div class="progress-bar" style="height:4px">
                        <div class="progress-fill" style="width:${prog.percent}%;height:4px;background:${g.status === 'achieved' ? 'var(--success)' : 'var(--accent)'};border-radius:2px"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
                ${d.activeGoals.length > 3 ? `<div style="font-size:var(--text-xs);color:var(--text-muted)">+${d.activeGoals.length - 3} metas</div>` : ''}
              ` : empty('Creá tu primera visión en el tutorial')}
            `, 'vision-widget')}

            ${widget('Proyectos activos', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>', `
              ${d.activeProjects.length > 0 ? d.activeProjects.slice(0, 5).map(p => `
                <div class="widget-item widget-clickable" data-nav="${p.clientId ? `/clients/${p.clientId}/projects/${p.id}` : `/personal/projects/${p.id}`}">
                  <span class="widget-bullet" style="background:${p.status === 'active' ? 'var(--success)' : p.status === 'paused' ? 'var(--warning)' : 'var(--text-muted)'}"></span>
                  <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Utils.sanitize(p.name)}</span>
                  <span style="font-size:var(--text-xs);color:var(--text-muted)">${p.clientId ? '👤' : '🙋'}</span>
                </div>
              `).join('') : empty('Aún no tenés proyectos')}
              ${d.activeProjects.length > 5 ? `<div style="font-size:var(--text-xs);color:var(--text-muted);padding:4px 0">+${d.activeProjects.length - 5} proyectos</div>` : ''}
            `, 'projects-widget')}

            ${widget('Actividad reciente', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', `
              ${d.recentHistory.length > 0 ? d.recentHistory.map(h => `
                <div class="widget-item">
                  <span class="widget-time">${Utils.getRelativeTime(h.createdAt)}</span>
                  <span style="font-size:var(--text-xs);color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Utils.sanitize(h.entityType)}</span>
                </div>
              `).join('') : empty('Sin actividad reciente')}
            `, 'history-widget')}
          </div>
        </div>
      `;
    },
    afterRender() {
      const container = document.getElementById('calendarContainer');
      if (container) {
        const events = DB.getAll('events');
        const tasks = DB.getAll('tasks');
        const cal = CalendarGrid({
          events,
          tasks,
          showSidebar: false,
          onNavigate: (type, id, projectId) => {
            if (type === 'event') {
              router.navigate('/personal');
            } else {
              router.navigate(projectId ? `/personal/projects/${projectId}` : '/personal/tasks');
            }
          }
        });
        container.innerHTML = cal.render();
        cal.afterRender();
      }

      document.querySelectorAll('[data-nav]').forEach(el => {
        el.addEventListener('click', () => router.navigate(el.dataset.nav));
      });
    }
  };
}
