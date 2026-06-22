import { DB } from './db.js';
import { router } from './router.js';
import { Sound } from './sound.js';
import { renderSidebar, updateSidebarActive } from './components/Sidebar.js';
import { renderBottomNav, updateBottomNavActive } from './components/BottomNav.js';
import { initPullToRefresh } from './components/PullToRefresh.js';
import { DashboardPage } from './pages/Dashboard.js';
import { ClientsPage } from './pages/Clients.js';
import { ClientDetailPage } from './pages/ClientDetail.js';
import { ClientFormPage } from './pages/ClientForm.js';
import { ProjectDetailPage } from './pages/ProjectDetail.js';
import { ProjectFormPage } from './pages/ProjectForm.js';
import { PersonalPage } from './pages/Personal.js';
import { SettingsPage } from './pages/Settings.js';
import { initQuickCapture } from './components/QuickCapture.js';
import { showOnboarding } from './onboarding/OnboardingWizard.js';
import { startTutorial } from './components/Tutorial.js';

const APP_VERSION = '2.0.0';

function checkVersion() {
  const stored = localStorage.getItem('levitar_version');
  if (stored !== APP_VERSION) {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('levitar_'));
    keys.forEach(k => localStorage.removeItem(k));
    localStorage.setItem('levitar_version', APP_VERSION);
  }
}

function renderPage(page) {
  const content = document.getElementById('content');
  Sound.page();
  content.innerHTML = page.render();
  updateSidebarActive();
  updateBottomNavActive();
  if (page.afterRender) {
    page.afterRender();
  }
  const profile = DB.getProfile();
  if (!profile.tutorialCompleted && window.location.hash.replace(/^#/, '') === '/') {
    setTimeout(() => startTutorial(), 400);
  }
}

checkVersion();
DB.init();
renderSidebar();
renderBottomNav();
initPullToRefresh('.content', {
  onRefresh(done) {
    router.resolve();
    setTimeout(done, 300);
  }
});

if (DB.isOnboardingRequired()) {
  document.getElementById('sidebar')?.classList.add('onboarding-hidden');
  document.getElementById('sidebarToggle')?.classList.add('onboarding-hidden');
  document.getElementById('content')?.classList.add('onboarding-hidden');
  document.getElementById('quickCaptureFab')?.classList.add('onboarding-hidden');
  showOnboarding();
} else {
  router.register('', () => renderPage(DashboardPage()));
  router.register('clients', () => renderPage(ClientsPage()));
  router.register('clients/new', () => renderPage(ClientFormPage()));
  router.register('clients/:id', (params) => renderPage(ClientDetailPage(params)));
  router.register('clients/:id/projects/new', (params) => renderPage(ProjectFormPage(params)));
  router.register('clients/:id/projects/:pid', (params) => renderPage(ProjectDetailPage(params)));
  router.register('personal', () => renderPage(PersonalPage({ tab: 'overview' })));
  router.register('personal/tasks', () => renderPage(PersonalPage({ tab: 'tasks' })));
  router.register('personal/notes', () => renderPage(PersonalPage({ tab: 'notes' })));
  router.register('personal/calendar', () => renderPage(PersonalPage({ tab: 'calendar' })));
  router.register('personal/ideas', () => renderPage(PersonalPage({ tab: 'ideas' })));
  router.register('personal/projects/:pid', (params) => renderPage(ProjectDetailPage({ pid: params.pid })));
  router.register('settings', () => renderPage(SettingsPage()));

  initQuickCapture();
  router.init();
}
