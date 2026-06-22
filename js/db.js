import { Utils } from './utils.js';

const DB_VERSION = '3.0.0';

const STORES = [
  'clients', 'projects',
  'campaigns', 'contents', 'tasks', 'events', 'meetings', 'prompts',
  'objectives', 'planner', 'files', 'notes', 'history',
  'visions', 'goals'
];

const PROFILE_KEY = 'levitar_profile';

const XP_REWARDS = {
  easy: 10,
  medium: 25,
  hard: 50,
  epic: 100,
  task_complete: 10,
  project_complete: 250,
  objective_complete: 500,
  goal_complete: 1000,
  vision_complete: 5000,
  streak_7: 200,
  streak_30: 1000
};

function getDefaultProfile() {
  return {
    name: 'Usuario',
    occupation: null,
    occupationCustom: '',
    topics: [],
    purpose: [],
    onboardingComplete: false,
    level: 1,
    xp: 0,
    streak: 0,
    lastActivityDate: null,
    achievements: []
  };
}

export const OCCUPATIONS = [
  { id: 'designer', label: 'Diseñador UX/UI', icon: '🎨' },
  { id: 'developer', label: 'Desarrollador', icon: '💻' },
  { id: 'marketer', label: 'Marketer / Community Manager', icon: '📊' },
  { id: 'entrepreneur', label: 'Emprendedor', icon: '🚀' },
  { id: 'creative', label: 'Creativo / Artista', icon: '✨' },
  { id: 'student', label: 'Estudiante', icon: '🎓' },
  { id: 'other', label: 'Otro', icon: '✏️' }
];

export const TOPICS = [
  { id: 'design', label: 'Diseño & Creatividad', icon: '🎨' },
  { id: 'tech', label: 'Tecnología & Desarrollo', icon: '💻' },
  { id: 'fitness', label: 'Fitness & Salud', icon: '💪' },
  { id: 'finance', label: 'Finanzas & Negocios', icon: '💰' },
  { id: 'productivity', label: 'Productividad & Organización', icon: '⚡' }
];

export const PURPOSES = [
  { id: 'organize', label: 'Organizar mi vida profesional' },
  { id: 'track_projects', label: 'Hacer seguimiento de proyectos' },
  { id: 'habits', label: 'Desarrollar hábitos y rutinas' },
  { id: 'manage_clients', label: 'Gestionar clientes y campañas' },
  { id: 'all', label: 'Todo lo anterior' }
];

function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100));
}

function xpForLevel(level) {
  return (level ** 2) * 100;
}

export const DB = {
  _ready: false,

  init() {
    this._migrateIfNeeded();
    STORES.forEach(store => {
      if (!localStorage.getItem(`levitar_${store}`)) {
        localStorage.setItem(`levitar_${store}`, JSON.stringify([]));
      }
    });
    this._ready = true;
  },

  _migrateIfNeeded() {
    const storedVersion = localStorage.getItem('levitar_db_version');
    if (storedVersion === DB_VERSION) return;

    if (!storedVersion || storedVersion < '3.0.0') {
      this._migrateToV3();
    }

    localStorage.setItem('levitar_db_version', DB_VERSION);
  },

  _migrateToV3() {
    const profile = this.getProfile();
    if (profile.level === undefined) {
      profile.level = 1;
      profile.xp = 0;
      profile.streak = 0;
      profile.lastActivityDate = null;
      profile.achievements = profile.achievements || [];
      this.saveProfile(profile);
    }

    const tasks = this._getStore('tasks');
    let changed = false;
    tasks.forEach(t => {
      if (t.difficulty === undefined) {
        t.difficulty = 'medium';
        changed = true;
      }
    });
    if (changed) this._setStore('tasks', tasks);

    const objectives = this._getStore('objectives');
    let objChanged = false;
    objectives.forEach(o => {
      if (o.goalId === undefined) {
        o.goalId = null;
        objChanged = true;
      }
    });
    if (objChanged) this._setStore('objectives', objectives);

    const projects = this._getStore('projects');
    let projChanged = false;
    projects.forEach(p => {
      if (p.goalId === undefined) {
        p.goalId = null;
        projChanged = true;
      }
    });
    if (projChanged) this._setStore('projects', projects);
  },

  _getStore(store) {
    try {
      return JSON.parse(localStorage.getItem(`levitar_${store}`)) || [];
    } catch {
      return [];
    }
  },

  _setStore(store, data) {
    localStorage.setItem(`levitar_${store}`, JSON.stringify(data));
  },

  _notify(store, action) {
    const event = new CustomEvent('levitar:change', {
      detail: { store, action }
    });
    document.dispatchEvent(event);
  },

  // ─── CRUD ───

  create(store, data) {
    const list = this._getStore(store);
    const now = new Date().toISOString();
    const item = {
      ...data,
      id: Utils.generateId(),
      createdAt: now,
      updatedAt: now
    };
    list.push(item);
    this._setStore(store, list);
    this._notify(store, 'create');
    return item;
  },

  getAll(store) {
    return this._getStore(store);
  },

  getById(store, id) {
    return this._getStore(store).find(item => item.id === id) || null;
  },

  where(store, predicate) {
    return this._getStore(store).filter(predicate);
  },

  update(store, id, data) {
    const list = this._getStore(store);
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    this._setStore(store, list);
    this._notify(store, 'update');
    return list[idx];
  },

  remove(store, id) {
    const list = this._getStore(store);
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    this._setStore(store, list);
    this._notify(store, 'delete');
    return true;
  },

  removeWhere(store, predicate) {
    const list = this._getStore(store);
    const remaining = list.filter(item => !predicate(item));
    this._setStore(store, remaining);
    this._notify(store, 'delete');
    return remaining;
  },

  count(store) {
    return this._getStore(store).length;
  },

  // ─── SEARCH ───

  search(store, query, fields = ['name', 'title']) {
    const list = this._getStore(store);
    const q = query.toLowerCase();
    return list.filter(item =>
      fields.some(f => item[f] && item[f].toLowerCase().includes(q))
    );
  },

  // ─── ARCHIVE ───

  archive(store, id) {
    return this.update(store, id, { archived: true });
  },

  restore(store, id) {
    return this.update(store, id, { archived: false });
  },

  getActive(store) {
    return this._getStore(store).filter(item => !item.archived);
  },

  getArchived(store) {
    return this._getStore(store).filter(item => item.archived);
  },

  // ─── PROJECT HELPERS ───

  getActiveProjects() {
    return this._getStore('projects').filter(p => !p.archived && p.status !== 'completed');
  },

  getClientProjects(clientId) {
    return this._getStore('projects').filter(p => p.clientId === clientId && !p.archived);
  },

  getPersonalProjects() {
    return this._getStore('projects').filter(p => p.workspace === 'personal' && !p.archived);
  },

  getProjectContents(projectId) {
    const related = {};
    ['campaigns', 'contents', 'tasks', 'events', 'meetings', 'prompts',
     'objectives', 'planner', 'files', 'notes', 'history'].forEach(store => {
      related[store] = this.where(store, item => item.projectId === projectId);
    });
    return related;
  },

  deleteProject(projectId) {
    ['campaigns', 'contents', 'tasks', 'events', 'meetings', 'prompts',
     'objectives', 'planner', 'files', 'notes', 'history'].forEach(store => {
      this.removeWhere(store, item => item.projectId === projectId);
    });
    return this.remove('projects', projectId);
  },

  deleteClient(clientId) {
    const projects = this.where('projects', p => p.clientId === clientId);
    projects.forEach(p => this.deleteProject(p.id));
    return this.remove('clients', clientId);
  },

  // ─── HISTORY ───

  createHistoryEntry(action, entityType, entityId, metadata = {}) {
    return this.create('history', {
      projectId: metadata.projectId || null,
      workspace: metadata.workspace || 'client',
      action,
      entityType,
      entityId,
      metadata
    });
  },

  // ─── PERSONAL ITEMS ───

  getPersonalItems(store) {
    return this._getStore(store).filter(item => item.workspace === 'personal');
  },

  // ─── VISION HIERARCHY ───

  getVisions() {
    return this._getStore('visions');
  },

  createVision(data) {
    return this.create('visions', {
      ...data,
      status: data.status || 'active'
    });
  },

  getVisionProgress(visionId) {
    const goals = this.where('goals', g => g.visionId === visionId);
    if (goals.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = goals.filter(g => g.status === 'achieved').length;
    return { done, total: goals.length, percent: Math.round((done / goals.length) * 100) };
  },

  deleteVision(visionId) {
    const goals = this.where('goals', g => g.visionId === visionId);
    goals.forEach(g => this.deleteGoal(g.id));
    return this.remove('visions', visionId);
  },

  // ─── GOAL HIERARCHY ───

  getGoals(visionId) {
    if (visionId) return this.where('goals', g => g.visionId === visionId);
    return this._getStore('goals');
  },

  getGoalsByStatus(status) {
    return this.where('goals', g => g.status === status);
  },

  createGoal(data) {
    return this.create('goals', {
      ...data,
      status: data.status || 'pending'
    });
  },

  getGoalProgress(goalId) {
    const objectives = this.where('objectives', o => o.goalId === goalId);
    if (objectives.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = objectives.filter(o => o.status === 'achieved').length;
    return { done, total: objectives.length, percent: Math.round((done / objectives.length) * 100) };
  },

  deleteGoal(goalId) {
    const objectives = this.where('objectives', o => o.goalId === goalId);
    objectives.forEach(o => {
      this.removeWhere('tasks', t => t.objectiveId === o.id);
    });
    this.removeWhere('objectives', o => o.goalId === goalId);
    this.removeWhere('projects', p => p.goalId === goalId);
    return this.remove('goals', goalId);
  },

  getActiveGoals() {
    return this.where('goals', g => g.status === 'in_progress' || g.status === 'pending');
  },

  // ─── OBJECTIVE HELPERS ───

  getTasksByObjective(objectiveId) {
    return this._getStore('tasks').filter(t => t.objectiveId === objectiveId);
  },

  getObjectiveProgress(objectiveId) {
    const tasks = this.getTasksByObjective(objectiveId);
    if (tasks.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = tasks.filter(t => t.status === 'done').length;
    return { done, total: tasks.length, percent: Math.round((done / tasks.length) * 100) };
  },

  // ─── TASK COMPLETION ───

  completeTask(taskId) {
    const task = this.getById('tasks', taskId);
    if (!task) return null;

    const updated = this.update('tasks', taskId, {
      status: 'done',
      completedAt: new Date().toISOString()
    });

    const difficulty = task.difficulty || 'medium';
    this._awardXP(XP_REWARDS[difficulty] || XP_REWARDS.medium);
    this._updateStreak();

    if (task.objectiveId) {
      const prog = this.getObjectiveProgress(task.objectiveId);
      if (prog.total > 0 && prog.percent === 100) {
        const obj = this.getById('objectives', task.objectiveId);
        if (obj) {
          this.update('objectives', task.objectiveId, { status: 'achieved' });
          this._awardXP(XP_REWARDS.objective_complete);
          this.createHistoryEntry('complete', 'objective', task.objectiveId, {
            projectId: task.projectId, workspace: task.workspace || 'client',
            name: obj.title
          });
          if (obj.goalId) {
            const gProg = this.getGoalProgress(obj.goalId);
            if (gProg.total > 0 && gProg.percent === 100) {
              this.update('goals', obj.goalId, { status: 'achieved' });
              this._awardXP(XP_REWARDS.goal_complete);
              const goal = this.getById('goals', obj.goalId);
              this.createHistoryEntry('complete', 'goal', obj.goalId, {
                name: goal ? goal.title : ''
              });
              if (goal && goal.visionId) {
                const vProg = this.getVisionProgress(goal.visionId);
                if (vProg.total > 0 && vProg.percent === 100) {
                  this.update('visions', goal.visionId, { status: 'achieved' });
                  this._awardXP(XP_REWARDS.vision_complete);
                }
              }
            }
          }
        }
      } else if (prog.total > 0) {
        this.update('objectives', task.objectiveId, { status: 'in_progress' });
      }
    }

    return updated;
  },

  uncompleteTask(taskId) {
    return this.update('tasks', taskId, { status: 'todo', completedAt: null });
  },

  // ─── GAMIFICATION ───

  getProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return getDefaultProfile();
      const parsed = JSON.parse(raw);
      return { ...getDefaultProfile(), ...parsed };
    } catch {
      return getDefaultProfile();
    }
  },

  saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },

  _awardXP(amount) {
    const profile = this.getProfile();
    profile.xp += amount;
    const newLevel = calculateLevel(profile.xp);
    if (newLevel > profile.level) {
      profile.level = newLevel;
      this.createHistoryEntry('level_up', 'user', '', { level: newLevel });
    }
    this.saveProfile(profile);
    return profile;
  },

  _updateStreak() {
    const profile = this.getProfile();
    const today = new Date().toISOString().split('T')[0];

    if (profile.lastActivityDate === today) return profile;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (profile.lastActivityDate === yesterdayStr) {
      profile.streak += 1;
    } else if (profile.lastActivityDate !== today) {
      profile.streak = 1;
    }

    if (profile.streak === 7) {
      this._awardXP(XP_REWARDS.streak_7);
      this._addAchievement('streak_7', 'Racha de 7 días');
    }
    if (profile.streak === 30) {
      this._awardXP(XP_REWARDS.streak_30);
      this._addAchievement('streak_30', 'Racha de 30 días');
    }

    profile.lastActivityDate = today;
    this.saveProfile(profile);
    return profile;
  },

  _addAchievement(id, name) {
    const profile = this.getProfile();
    if (!profile.achievements.some(a => a.id === id)) {
      profile.achievements.push({ id, name, unlockedAt: new Date().toISOString() });
      this.saveProfile(profile);
      this.createHistoryEntry('achievement', 'achievement', id, { name });
    }
  },

  getXPToNextLevel() {
    const profile = this.getProfile();
    const level = profile.level || 0;
    const currentLevelXp = (level ** 2) * 100;
    const nextLevelXp = ((level + 1) ** 2) * 100;
    return {
      current: profile.xp - currentLevelXp,
      needed: nextLevelXp - currentLevelXp,
      total: nextLevelXp - currentLevelXp,
      percent: Math.round(((profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
    };
  },

  getStreakInfo() {
    const profile = this.getProfile();
    return {
      streak: profile.streak,
      level: profile.level,
      xp: profile.xp,
      achievements: profile.achievements
    };
  },

  calculateTaskDifficultyFromTitle(title) {
    const t = title.toLowerCase();
    if (t.includes('fácil') || t.includes('rapido') || t.includes('rápido') || t.includes('simple')) return 'easy';
    if (t.includes('difícil') || t.includes('dificil') || t.includes('complejo') || t.includes('compleja')) return 'hard';
    if (t.includes('épico') || t.includes('epico') || t.includes('grande') || t.includes('masivo')) return 'epic';
    return 'medium';
  },

  // ─── TASK QUERIES ───

  getTasksDueToday() {
    const today = new Date().toISOString().split('T')[0];
    return this._getStore('tasks').filter(t => t.dueDate && t.dueDate === today && t.status !== 'done');
  },

  getTasksOverdue() {
    const today = new Date().toISOString().split('T')[0];
    return this._getStore('tasks').filter(t => t.dueDate && t.dueDate < today && t.status !== 'done');
  },

  getTasksUpcoming(days = 7) {
    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + days);
    const todayStr = today.toISOString().split('T')[0];
    const futureStr = future.toISOString().split('T')[0];
    return this._getStore('tasks').filter(t =>
      t.dueDate && t.dueDate >= todayStr && t.dueDate <= futureStr && t.status !== 'done'
    );
  },

  // ─── READY ───

  isOnboardingRequired() {
    const profile = this.getProfile();
    const hasData = this.count('clients') > 0 || this.count('tasks') > 0;
    if (hasData) return false;
    return !profile.onboardingComplete || profile.name === 'Usuario';
  },

  isReady() {
    return this._ready;
  }
};
