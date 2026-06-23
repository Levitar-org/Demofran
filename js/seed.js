import { DB } from './db.js';

export function seedDemoData() {
  const client = DB.create('clients', {
    name: 'Vice Burger',
    industry: 'Gastronomía',
    instagram: '@viceburger',
    website: '',
    description: 'Hamburguesería premium con enfoque en ingredientes locales',
    positioning: 'La mejor hamburguesa de la ciudad',
    tone: 'Joven, descontracturado',
    allowedWords: ['artesanal', 'premium', 'local'],
    bannedWords: ['barato', 'económico'],
    mainObjective: 'Aumentar presencia en redes sociales',
    services: ['Social Media', 'Contenido']
  });

  const proj1 = DB.create('projects', {
    clientId: client.id,
    workspace: 'client',
    name: 'Lanzamiento Vice Burger',
    description: 'Campaña de lanzamiento para la nueva sucursal',
    status: 'active',
    archived: false
  });

  DB.create('tasks', {
    clientId: client.id, projectId: proj1.id,
    title: 'Diseñar piezas gráficas para Instagram',
    description: 'Posts, stories y reels',
    difficulty: 'medium', status: 'todo',
    workspace: 'client'
  });

  DB.create('tasks', {
    clientId: client.id, projectId: proj1.id,
    title: 'Redactar copy para redes',
    description: 'Tono divertido y directo',
    difficulty: 'easy', status: 'todo',
    workspace: 'client'
  });

  DB.create('campaigns', {
    clientId: client.id, projectId: proj1.id,
    name: 'Lanzamiento Sucursal Centro',
    objective: 'Generar expectativa y tráfico',
    status: 'active',
    archived: false
  });

  const goal = DB.create('goals', {
    visionId: null,
    title: 'Desarrollar mi marca personal',
    description: 'Posicionarme como referente en diseño UX/UI',
    type: 'career',
    targetDate: null,
    status: 'in_progress'
  });

  const proj2 = DB.create('projects', {
    clientId: null,
    workspace: 'personal',
    goalId: goal.id,
    name: 'Branding Personal 2026',
    description: 'Identidad visual y portafolio',
    status: 'active',
    archived: false
  });

  DB.create('tasks', {
    clientId: null, projectId: proj2.id,
    title: 'Diseñar logo personal',
    description: 'Minimalista y moderno',
    difficulty: 'hard', status: 'todo',
    workspace: 'personal'
  });

  DB.create('tasks', {
    clientId: null, projectId: proj2.id,
    title: 'Crear portafolio web',
    description: 'Con proyectos destacados',
    difficulty: 'epic', status: 'todo',
    workspace: 'personal'
  });

  DB.create('tasks', {
    clientId: null, projectId: proj2.id,
    title: 'Definir paleta de colores',
    description: '',
    difficulty: 'easy', status: 'done',
    workspace: 'personal',
    completedAt: new Date().toISOString()
  });

  const proj3 = DB.create('projects', {
    clientId: null,
    workspace: 'personal',
    name: 'Curso de Marketing Digital',
    description: 'Especialización en marketing de contenidos',
    status: 'active',
    archived: false
  });

  DB.create('tasks', {
    clientId: null, projectId: proj3.id,
    title: 'Ver módulo de SEO',
    description: '',
    difficulty: 'medium', status: 'todo',
    workspace: 'personal'
  });

  DB.create('tasks', {
    clientId: null, projectId: proj3.id,
    title: 'Hacer ejercicio práctico de Google Ads',
    description: '',
    difficulty: 'hard', status: 'in_progress',
    workspace: 'personal'
  });

  DB.create('notes', {
    projectId: null, workspace: 'personal',
    title: 'Idea para contenido viral',
    content: 'Serie de Reels mostrando el behind-the-scenes de una sesión de fotos',
    tags: ['ideas'],
    pinned: false
  });

  DB.create('notes', {
    projectId: null, workspace: 'personal',
    title: 'Inspiración de diseño',
    content: 'Revisar Dribbble para referencias de diseño Mobile First',
    tags: ['design', 'inspiración'],
    pinned: false
  });

  DB.create('notes', {
    projectId: proj1.id, workspace: 'client',
    title: 'Brief Vice Burger',
    content: 'Cliente busca destacar la calidad artesanal de sus ingredientes. Público objetivo: jóvenes 18-35.',
    tags: ['brief', 'cliente'],
    pinned: true
  });

  const profile = DB.getProfile();
  profile.onboardingComplete = true;
  profile.tutorialCompleted = true;
  profile.level = 2;
  profile.xp = 450;
  DB.saveProfile(profile);
}
