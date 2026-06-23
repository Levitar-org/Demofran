import { DB } from '../db.js';
import { router } from '../router.js';
import { showModal } from './Modal.js';
import { showToast } from './Toast.js';
import { Utils } from '../utils.js';

const ICONS = {
  task: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  client: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  project: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
};

const TYPES = [
  { id: 'task', icon: ICONS.task, label: 'Tarea', color: '#6366f1' },
  { id: 'note', icon: ICONS.note, label: 'Nota', color: '#10b981' },
  { id: 'client', icon: ICONS.client, label: 'Cliente', color: '#3b82f6' },
  { id: 'project', icon: ICONS.project, label: 'Proyecto', color: '#8b5cf6' },
];

export function initQuickCapture() {
  const fab = document.getElementById('quickCaptureFab');
  if (!fab) return;

  fab.addEventListener('click', showQuickCapture);
  fab.title = 'Captura rápida (Ctrl+K)';

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      showQuickCapture();
    }
  });
}

export function showQuickCapture() {
  showModal('Captura Rápida', `
    <p style="color:var(--text-muted);margin-bottom:16px">¿Qué querés crear?</p>
    <div class="quick-capture-grid">
      ${TYPES.map(t => `
        <button class="quick-capture-btn" data-type="${t.id}" style="--qc-color:${t.color}">
          <span class="qc-icon">${t.icon}</span>
          <span class="qc-label">${t.label}</span>
        </button>
      `).join('')}
    </div>
  `, [
    { label: 'Cerrar', class: 'btn btn-secondary', action: close => close() }
  ]);

  // Bind type buttons after modal renders
  setTimeout(() => {
    document.querySelectorAll('.quick-capture-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        closeModal();
        setTimeout(() => showForm(type), 150);
      });
    });
  }, 50);
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('open');
}

function showForm(type) {
  const forms = {
    task: {
      title: 'Nueva Tarea',
      html: `
        <div class="form-group">
          <label>Título *</label>
          <input type="text" id="qcTaskTitle" class="form-input" placeholder="¿Qué hay que hacer?" autofocus>
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <textarea id="qcTaskDesc" class="form-input" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label>¿Para un proyecto?</label>
          <select id="qcTaskProject" class="form-input">
            <option value="">Solo tarea personal</option>
            ${getProjectOptions()}
          </select>
        </div>
        <div class="form-group" id="qcObjGroup" style="display:none">
          <label>Objetivo vinculado</label>
          <select id="qcTaskObjective" class="form-input"><option value="">Sin objetivo</option></select>
        </div>
      `,
      afterRender: () => {
        const projSelect = document.getElementById('qcTaskProject');
        const objGroup = document.getElementById('qcObjGroup');
        const objSelect = document.getElementById('qcTaskObjective');
        if (projSelect && objGroup && objSelect) {
          projSelect.addEventListener('change', () => {
            const pid = projSelect.value;
            if (!pid) { objGroup.style.display = 'none'; return; }
            const objectives = DB.where('objectives', o => o.projectId === pid && o.status !== 'achieved');
            if (objectives.length === 0) { objGroup.style.display = 'none'; return; }
            objGroup.style.display = 'block';
            objSelect.innerHTML = '<option value="">Sin objetivo</option>' + objectives.map(o => `<option value="${o.id}">${Utils.sanitize(o.title)}</option>`).join('');
          });
        }
      },
      action: () => {
        const title = document.getElementById('qcTaskTitle')?.value.trim();
        if (!title) return showToast('El título es obligatorio', 'warning');
        const projectId = document.getElementById('qcTaskProject')?.value || null;
        const objectiveId = document.getElementById('qcTaskObjective')?.value || null;
        const project = projectId ? DB.getById('projects', projectId) : null;
        DB.create('tasks', {
          clientId: project?.clientId || null,
          projectId,
          objectiveId,
          workspace: project?.workspace || 'personal',
          title,
          description: document.getElementById('qcTaskDesc')?.value.trim() || '',
          status: 'todo'
        });
        showToast('Tarea creada', 'success');
        router.resolve();
      }
    },
    note: {
      title: 'Nueva Nota',
      html: `
        <div class="form-group">
          <label>Título *</label>
          <input type="text" id="qcNoteTitle" class="form-input" placeholder="Título de la nota" autofocus>
        </div>
        <div class="form-group">
          <label>Contenido</label>
          <textarea id="qcNoteContent" class="form-input" rows="4" placeholder="Escribí tu nota..."></textarea>
        </div>
      `,
      action: () => {
        const title = document.getElementById('qcNoteTitle')?.value.trim();
        if (!title) return showToast('El título es obligatorio', 'warning');
        DB.create('notes', {
          projectId: null,
          workspace: 'personal',
          title,
          content: document.getElementById('qcNoteContent')?.value.trim() || '',
          tags: [],
          pinned: false
        });
        showToast('Nota creada', 'success');
        router.resolve();
      }
    },
    client: {
      title: 'Nuevo Cliente',
      html: `
        <div class="form-group">
          <label>Nombre del cliente *</label>
          <input type="text" id="qcClientName" class="form-input" placeholder="Ej: Mi Cliente SRL" autofocus>
        </div>
        <div class="form-group">
          <label>Industria</label>
          <input type="text" id="qcClientIndustry" class="form-input" placeholder="Ej: Tecnología">
        </div>
        <div class="form-group">
          <label>Instagram</label>
          <input type="text" id="qcClientIg" class="form-input" placeholder="@cliente">
        </div>
      `,
      action: () => {
        const name = document.getElementById('qcClientName')?.value.trim();
        if (!name) return showToast('El nombre es obligatorio', 'warning');
        if (DB.count('clients') >= 1) return showToast('Solo podés tener 1 cliente en la versión demo', 'warning');
        const client = DB.create('clients', {
          archived: false,
          name,
          industry: document.getElementById('qcClientIndustry')?.value.trim() || '',
          instagram: document.getElementById('qcClientIg')?.value.trim() || '',
          website: '',
          description: '',
          positioning: '',
          tone: '',
          allowedWords: [],
          bannedWords: [],
          mainObjective: '',
          services: []
        });
        showToast('Cliente creado', 'success');
        router.navigate(`/clients/${client.id}`);
      }
    },
    project: {
      title: 'Nuevo Proyecto',
      html: `
        <div class="form-group">
          <label>Nombre del proyecto *</label>
          <input type="text" id="qcProjName" class="form-input" placeholder="Ej: Campaña de verano" autofocus>
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <textarea id="qcProjDesc" class="form-input" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label>Cliente (opcional)</label>
          <select id="qcProjClient" class="form-input">
            <option value="">Proyecto personal</option>
            ${getClientOptions()}
          </select>
        </div>
      `,
      action: () => {
        const name = document.getElementById('qcProjName')?.value.trim();
        if (!name) return showToast('El nombre es obligatorio', 'warning');
        const clientId = document.getElementById('qcProjClient')?.value || null;
        if (!clientId && DB.getPersonalProjects().length >= 2) return showToast('Máximo 2 proyectos personales en la versión demo', 'warning');
        const project = DB.create('projects', {
          clientId,
          workspace: clientId ? 'client' : 'personal',
          name,
          description: document.getElementById('qcProjDesc')?.value.trim() || '',
          status: 'active',
          archived: false
        });
        showToast('Proyecto creado', 'success');
        const route = clientId ? `/clients/${clientId}/projects/${project.id}` : `/personal/projects/${project.id}`;
        router.navigate(route);
      }
    },
  };

  const form = forms[type];
  if (!form) return;

  showModal(form.title, form.html, [
    { label: 'Cancelar', class: 'btn btn-secondary', action: close => close() },
    { label: 'Crear', class: 'btn btn-primary', action: close => {
      form.action();
      close();
    }}
  ]);

  setTimeout(() => {
    if (form.afterRender) form.afterRender();
  }, 100);
}

function getClientOptions() {
  const clients = DB.getActive('clients');
  return clients.map(c => `<option value="${c.id}">${Utils.sanitize(c.name)}</option>`).join('');
}

function getProjectOptions() {
  const projects = DB.getActiveProjects();
  return projects.map(p => `<option value="${p.id}">${Utils.sanitize(p.name)}</option>`).join('');
}
