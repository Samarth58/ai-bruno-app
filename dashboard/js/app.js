/**
 * Bruno AI Gym Buddy — Main Dashboard Application Controller
 * Coordinates API data fetching, interactive routing, search filters, and modals.
 */

import { api, API_CONFIG, TokenStore } from './api.js';
import { auth } from './auth.js';
import { ChartEngine } from './charts.js';
import { UI } from './components.js';

// Application State
const state = {
  activeView: 'dashboard',
  users: [],
  workouts: [],
  exercises: [],
  programs: [],
  analyticsVolume: null,
  analyticsConsistency: null,
  overview: null,
  activeSession: null,
  health: null,
  selectedUser: null,
  selectedExercise: null,
  searchQuery: '',
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  bindNavigation();
  bindSearch();
  bindModals();
  bindQuickActions();
  bindProfileAndSettings();

  // Check API health in background
  // Render initial reference state immediately
  renderInitialReferenceState();

  // Check API health in background
  checkBackendHealth();

  // If already authenticated, update header and live hydrate from API
  if (auth.isAuthenticated()) {
    updateAdminHeader();
    loadDashboardData();
  }

  // Handle Hash Routing
  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  // Listen for auth events
  window.addEventListener('bruno:auth-expired', () => {
    UI.showToast('Session expired. Please sign in again.', 'error');
    promptAdminLogin();
  });

  window.addEventListener('bruno:auth-success', (e) => {
    UI.showToast(`Welcome back, ${e.detail?.name || 'Admin'}!`, 'success');
    UI.closeModal('modal-login');
    updateAdminHeader();
    loadDashboardData();
  });
}

/**
 * Renders the reference visual state inspired by the design mockup
 */
function renderInitialReferenceState() {
  // 1. KPI Cards
  const kpiUsers = document.getElementById('kpi-users-container');
  if (kpiUsers) {
    kpiUsers.innerHTML = UI.renderKpiCard({
      id: 'kpi-users',
      title: 'Total Users',
      value: '248',
      iconType: 'users',
      trend: '12%',
      trendDirection: 'up',
      sparklineData: [100, 120, 140, 160, 200, 220, 248],
      color: '#ff7470',
    });
  }

  const kpiWorkouts = document.getElementById('kpi-workouts-container');
  if (kpiWorkouts) {
    kpiWorkouts.innerHTML = UI.renderKpiCard({
      id: 'kpi-workouts',
      title: 'Active Workouts',
      value: '156',
      iconType: 'workouts',
      trend: '18%',
      trendDirection: 'up',
      sparklineData: [80, 95, 110, 120, 135, 145, 156],
      color: '#9275f5',
    });
  }

  const kpiPrograms = document.getElementById('kpi-programs-container');
  if (kpiPrograms) {
    kpiPrograms.innerHTML = UI.renderKpiCard({
      id: 'kpi-programs',
      title: 'Programs Created',
      value: '42',
      iconType: 'programs',
      trend: '10%',
      trendDirection: 'up',
      sparklineData: [20, 24, 28, 30, 35, 38, 42],
      color: '#f5a623',
    });
  }

  const kpiStreak = document.getElementById('kpi-streak-container');
  if (kpiStreak) {
    kpiStreak.innerHTML = UI.renderKpiCard({
      id: 'kpi-streak',
      title: 'Avg. Streak',
      value: '6 days',
      iconType: 'streak',
      trend: '33%',
      trendDirection: 'up',
      sparklineData: [2, 3, 3, 4, 5, 5, 6],
      color: '#38b284',
    });
  }

  // 2. Charts
  renderWorkoutDistributionChart();
  renderUserGrowthChart([], '7d');

  // 3. Recent Users
  const recentUsersEl = document.getElementById('recent-users-container');
  if (recentUsersEl) {
    const demoUsers = [
      { id: '1', name: 'Rahul S.', email: 'rahul@example.com', role: 'Beginner' },
      { id: '2', name: 'Priya K.', email: 'priya@example.com', role: 'Intermediate' },
      { id: '3', name: 'Arjun M.', email: 'arjun@example.com', role: 'Advanced' },
      { id: '4', name: 'Sneha P.', email: 'sneha@example.com', role: 'Beginner' },
    ];
    recentUsersEl.innerHTML = demoUsers.map((u, i) => UI.renderUserBadge(u, i)).join('');
  }

  // 4. Recent Workouts
  const recentWorkoutsEl = document.getElementById('recent-workouts-container');
  if (recentWorkoutsEl) {
    const demoWorkouts = [
      { id: 'w1', routineName: 'Full Body Blast', userName: 'Priya K.', startedAt: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: 'w2', routineName: 'Upper Body Strength', userName: 'Arjun M.', startedAt: new Date(Date.now() - 4 * 3600000).toISOString() },
      { id: 'w3', routineName: 'Leg Day', userName: 'Sneha P.', startedAt: new Date(Date.now() - 6 * 3600000).toISOString() },
    ];
    recentWorkoutsEl.innerHTML = demoWorkouts.map(UI.renderWorkoutRow).join('');
  }

  // 5. Recent Activity
  const activityEl = document.getElementById('recent-activity-container');
  if (activityEl) {
    const demoActivities = [
      { type: 'user', title: 'New user registered', subtitle: 'Rahul S.', timeStr: '2h ago' },
      { type: 'workout', title: 'Workout completed', subtitle: 'Full Body Blast', timeStr: '2h ago' },
      { type: 'program', title: 'New program created', subtitle: 'Strength & Conditioning', timeStr: '4h ago' },
      { type: 'user', title: 'User updated', subtitle: 'Priya K.', timeStr: '5h ago' },
      { type: 'feedback', title: 'New feedback received', subtitle: 'Great progress!', timeStr: '6h ago' },
    ];
    activityEl.innerHTML = demoActivities.map(UI.renderActivityItem).join('');
  }
}

/**
 * Updates top header with current authenticated Admin identity
 */
function updateAdminHeader() {
  const user = auth.getCurrentUser();
  const greetingEl = document.getElementById('admin-greeting-name');
  const avatarEl = document.getElementById('admin-avatar-initial');
  const nameEl = document.getElementById('admin-menu-name');

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Admin');
  if (greetingEl) greetingEl.textContent = `Welcome back, ${displayName}!`;
  if (avatarEl) avatarEl.textContent = (displayName[0] || 'A').toUpperCase();
  if (nameEl) nameEl.textContent = displayName;
}

/**
 * Handles Tab Switching / Hash Routing
 */
function handleRoute() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  state.activeView = hash;

  // Update Nav Links
  document.querySelectorAll('.nav-link').forEach((link) => {
    const target = link.getAttribute('data-view');
    if (target === hash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Switch View Containers
  document.querySelectorAll('.view-container').forEach((view) => {
    view.classList.remove('active');
  });

  const activeContainer = document.getElementById(`view-${hash}`);
  if (activeContainer) {
    activeContainer.classList.add('active');
  } else {
    const dash = document.getElementById('view-dashboard');
    if (dash) dash.classList.add('active');
  }

  // Close mobile sidebar on navigation
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('mobile-open');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) {
    backdrop.classList.remove('visible');
    backdrop.hidden = true;
  }
  document.getElementById('mobile-nav-toggle')?.setAttribute('aria-expanded', 'false');

  // Trigger view-specific loads if necessary
  if (hash === 'users') loadUsersView();
  if (hash === 'workouts') loadWorkoutsView();
  if (hash === 'exercises') loadExercisesView();
  if (hash === 'programs') loadProgramsView();
  if (hash === 'analytics') loadAnalyticsView();
  if (hash === 'settings') loadSettingsView();
}

function bindNavigation() {
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.getAttribute('data-view');
      window.location.hash = `#${view}`;
    });
  });

  // Mobile sidebar toggle
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('mobile-open');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
      if (backdrop) {
        backdrop.classList.toggle('visible', isOpen);
        backdrop.hidden = !isOpen;
      }
    });
  }
  if (backdrop && sidebar) {
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('visible');
      backdrop.hidden = true;
      toggleBtn?.setAttribute('aria-expanded', 'false');
    });
  }

  // Global Escape: close drawer, dropdown, then any open modal
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    const drawer = document.getElementById('notification-drawer');
    if (drawer?.classList.contains('open')) {
      drawer.classList.remove('open');
      document.getElementById('notification-bell-btn')?.setAttribute('aria-expanded', 'false');
      return;
    }

    const dropdown = document.getElementById('admin-profile-dropdown');
    if (dropdown && dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
      document.getElementById('admin-profile-btn')?.setAttribute('aria-expanded', 'false');
      return;
    }

    const openModalEl = document.querySelector('.modal-overlay.open');
    if (openModalEl) {
      UI.closeModal(openModalEl.id);
    }
  });

  // Hero Banner "View Analytics →" button
  const heroBtn = document.getElementById('hero-view-analytics-btn');
  if (heroBtn) {
    heroBtn.addEventListener('click', () => {
      window.location.hash = '#analytics';
    });
  }
}

/**
 * Health check on startup
 */
async function checkBackendHealth() {
  const statusPill = document.getElementById('api-status-pill');
  try {
    const health = await api.getHealth();
    state.health = health.data;
    if (statusPill) {
      statusPill.classList.remove('is-offline');
      const label = statusPill.querySelector('.api-pill-label');
      if (label) label.textContent = 'API Connected';
      statusPill.title = `Database: ${health.data?.database || 'connected'} | Uptime: ${Math.round(health.data?.uptime || 0)}s`;
    }
  } catch {
    if (statusPill) {
      statusPill.classList.add('is-offline');
      const label = statusPill.querySelector('.api-pill-label');
      if (label) label.textContent = `API Offline (${API_CONFIG.baseUrl})`;
      statusPill.title = 'Backend is unreachable or CORS blocked. Check server port.';
    }
  }
}

/**
 * Loads and renders primary dashboard widgets
 */
async function loadDashboardData() {
  if (!auth.isAuthenticated()) return;

  // 1. Fetch Admin Users
  try {
    const usersRes = await api.getAdminUsers();
    state.users = usersRes.data || [];
    renderTotalUsersKpi(state.users);
    renderRecentUsers(state.users);
    renderUserGrowthChart(state.users, '7d');
  } catch (err) {
    console.warn('Could not load admin users:', err);
  }

  // 2. Fetch Sessions & Active Workouts
  try {
    const activeRes = await api.getActiveSession();
    state.activeSession = activeRes.data;

    const sessionsRes = await api.getSessions({ limit: 10 });
    state.workouts = sessionsRes.data || [];
    renderActiveWorkoutsKpi(state.activeSession, state.workouts);
    renderRecentWorkouts(state.workouts);
  } catch (err) {
    console.warn('Could not load sessions:', err);
  }

  // 3. Fetch Programs
  try {
    const progRes = await api.getPrograms();
    state.programs = progRes.data || [];
    renderProgramsKpi(state.programs);
  } catch (err) {
    console.warn('Could not load programs:', err);
  }

  // 4. Fetch Analytics & Streak
  try {
    const streakRes = await api.getTrainingConsistency({ weeks: 8 });
    state.analyticsConsistency = streakRes.data;
    renderStreakKpi(state.analyticsConsistency);

    const volumeRes = await api.getVolumeByMuscle();
    state.analyticsVolume = volumeRes.data;
    renderWorkoutDistributionChart(state.analyticsVolume);
  } catch (err) {
    console.warn('Could not load analytics:', err);
  }

  // 5. Render Activity Feed
  renderRecentActivityFeed();
}

/* ---------------------------------------------------------------------------
 * KPI Renderers
 * --------------------------------------------------------------------------- */

function renderTotalUsersKpi(users = []) {
  const container = document.getElementById('kpi-users-container');
  if (!container) return;

  const total = users.length;
  // Calculate 7-day registration trend
  const now = new Date();
  const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const past14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekCount = users.filter((u) => new Date(u.created_at) >= past7d).length;
  const lastWeekCount = users.filter(
    (u) => new Date(u.created_at) >= past14d && new Date(u.created_at) < past7d,
  ).length;

  let trendText = null;
  let trendDir = 'up';
  if (lastWeekCount > 0) {
    const growth = Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);
    trendText = `${Math.abs(growth)}%`;
    trendDir = growth >= 0 ? 'up' : 'down';
  } else if (thisWeekCount > 0) {
    trendText = `+${thisWeekCount} new`;
  }

  container.innerHTML = UI.renderKpiCard({
    id: 'kpi-users',
    title: 'Total Users',
    value: total.toString(),
    iconType: 'users',
    trend: trendText,
    trendDirection: trendDir,
    sparklineData: [8, 12, 10, 16, 22, 28, 35],
    color: '#ff7470',
  });
}

function renderActiveWorkoutsKpi(activeSession, workouts = []) {
  const container = document.getElementById('kpi-workouts-container');
  if (!container) return;

  const inProgressCount = workouts.filter((w) => w.status === 'in_progress').length;
  const count = (activeSession ? 1 : 0) + inProgressCount;

  container.innerHTML = UI.renderKpiCard({
    id: 'kpi-workouts',
    title: 'Active Workouts',
    value: count.toString(),
    iconType: 'workouts',
    trend: workouts.length > 0 ? `${workouts.length} total logged` : null,
    trendDirection: 'up',
    sparklineData: [5, 10, 8, 14, 18, 15, 24],
    color: '#9275f5',
  });
}

function renderProgramsKpi(programs = []) {
  const container = document.getElementById('kpi-programs-container');
  if (!container) return;

  const activeCount = programs.filter((p) => p.isActive).length;

  container.innerHTML = UI.renderKpiCard({
    id: 'kpi-programs',
    title: 'Programs Created',
    value: programs.length.toString(),
    iconType: 'programs',
    trend: activeCount > 0 ? `${activeCount} active` : null,
    trendDirection: 'up',
    sparklineData: [2, 4, 3, 7, 8, 10, 12],
    color: '#f5a623',
  });
}

function renderStreakKpi(consistency) {
  const container = document.getElementById('kpi-streak-container');
  if (!container) return;

  const streak = consistency?.currentStreakWeeks ?? 0;
  const longest = consistency?.longestStreakWeeks ?? streak;

  container.innerHTML = UI.renderKpiCard({
    id: 'kpi-streak',
    title: 'Avg. Streak',
    value: `${streak} ${streak === 1 ? 'week' : 'weeks'}`,
    iconType: 'streak',
    trend: longest > 0 ? `Best: ${longest}w` : null,
    trendDirection: 'up',
    sparklineData: [1, 2, 2, 3, 4, 4, 6],
    color: '#38b284',
  });
}

/* ---------------------------------------------------------------------------
 * Charts Integration
 * --------------------------------------------------------------------------- */

function renderWorkoutDistributionChart(volumeData) {
  const select = document.getElementById('distribution-range-select');
  if (select && !select.onchange) {
    select.onchange = async () => {
      try {
        const res = await api.getVolumeByMuscle();
        renderWorkoutDistributionChart(res.data);
      } catch (err) {
        console.error(err);
      }
    };
  }

  const breakdown = volumeData?.volumeByMuscle || [];
  let chartData = [];

  if (breakdown.length > 0) {
    const colorMap = {
      Chest: '#ff7470',
      Back: '#9275f5',
      Legs: '#f5a623',
      Shoulders: '#38b284',
      Arms: '#3ba4e6',
      Core: '#ff928e',
    };

    chartData = breakdown.map((item) => ({
      label: item.muscleGroup,
      value: Math.round(item.totalVolumeKg || item.totalSets || 1),
      percentage: Math.round(item.percentage || 0),
      color: colorMap[item.muscleGroup] || '#3ba4e6',
    }));
  } else {
    // Default reference distribution when lifter has no logged sets yet
    chartData = [
      { label: 'Push', value: 32, percentage: 32, color: '#ff7470' },
      { label: 'Pull', value: 26, percentage: 26, color: '#9275f5' },
      { label: 'Legs', value: 24, percentage: 24, color: '#f5a623' },
      { label: 'Full Body', value: 12, percentage: 12, color: '#38b284' },
      { label: 'Others', value: 6, percentage: 6, color: '#3ba4e6' },
    ];
  }

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  // Render Legend
  const legendEl = document.getElementById('distribution-legend');
  if (legendEl) {
    legendEl.innerHTML = chartData
      .map(
        (item) => `
        <div class="legend-row">
          <div class="legend-group">
            <span class="legend-dot" style="background-color: ${item.color}"></span>
            <span>${item.label}</span>
          </div>
          <span class="legend-val">${item.percentage}%</span>
        </div>
      `,
      )
      .join('');
  }

  ChartEngine.renderDonutChart('donutChartCanvas', chartData, {
    value: volumeData?.totalVolumeKg ? Math.round(volumeData.totalVolumeKg).toString() : '156',
    label: volumeData?.totalVolumeKg ? 'Kg Volume' : 'Workouts',
  });
}

function renderUserGrowthChart(users = [], range = '7d') {
  const select = document.getElementById('growth-range-select');
  if (select && !select.onchange) {
    select.onchange = (e) => {
      renderUserGrowthChart(state.users, e.target.value);
    };
  }

  const daysCount = range === '30d' ? 30 : 7;
  const labels = [];
  const points = [];

  const now = new Date();
  if (!users || users.length === 0) {
    // Reference demo points matching mockup
    const demoPoints = range === '30d' 
      ? [50, 60, 75, 90, 110, 130, 150, 165, 180, 200, 220, 248] 
      : [95, 120, 140, 150, 185, 210, 248];
    const countSteps = demoPoints.length;
    for (let i = countSteps - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * Math.floor(daysCount / countSteps || 1));
      labels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      points.push(demoPoints[countSteps - 1 - i]);
    }
  } else {
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(23, 59, 59, 999);

      const labelStr = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      labels.push(labelStr);

      // Cumulative users registered up to date d
      const count = users.filter((u) => new Date(u.created_at) <= d).length;
      points.push(count);
    }
  }

  ChartEngine.renderAreaChart('growthChartCanvas', points, labels);
}

/* ---------------------------------------------------------------------------
 * Lists & Feeds Integration
 * --------------------------------------------------------------------------- */

function renderRecentUsers(users = []) {
  const container = document.getElementById('recent-users-container');
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:20px 0;">
        <p>No registered users found.</p>
      </div>
    `;
    return;
  }

  // Sort descending by registration date
  const sorted = [...users].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const displayUsers = sorted.slice(0, 5);
  container.innerHTML = displayUsers.map((u, i) => UI.renderUserBadge(u, i)).join('');

  // Bind click on badge to open details (mouse + keyboard)
  container.querySelectorAll('.user-clay-badge').forEach((badge) => {
    const openDetails = () => {
      const userId = badge.getAttribute('data-user-id');
      const user = state.users.find((u) => u.id === userId);
      if (user) openUserDetailsModal(user);
    };
    badge.addEventListener('click', openDetails);
    badge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetails();
      }
    });
  });
}

function renderRecentWorkouts(workouts = []) {
  const container = document.getElementById('recent-workouts-container');
  if (!container) return;

  if (workouts.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:20px 0;">
        <p>No workout sessions logged yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = workouts.slice(0, 4).map(UI.renderWorkoutRow).join('');
}

function renderRecentActivityFeed() {
  const container = document.getElementById('recent-activity-container');
  if (!container) return;

  const activities = [];

  // 1. User registration events
  state.users.forEach((u) => {
    activities.push({
      type: 'user',
      title: 'New user registered',
      subtitle: u.name || u.email,
      date: new Date(u.created_at),
      timeStr: UI.timeAgo(u.created_at),
    });
  });

  // 2. Workout completion events
  state.workouts.forEach((w) => {
    if (w.status === 'completed') {
      activities.push({
        type: 'workout',
        title: 'Workout completed',
        subtitle: w.notes || 'Full Body Workout',
        date: new Date(w.completedAt || w.startedAt),
        timeStr: UI.timeAgo(w.completedAt || w.startedAt),
      });
    }
  });

  // 3. Program events
  state.programs.forEach((p) => {
    activities.push({
      type: 'program',
      title: 'New program created',
      subtitle: p.name,
      date: new Date(p.createdAt),
      timeStr: UI.timeAgo(p.createdAt),
    });
  });

  if (activities.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px 0;">
        <p>No live events recorded yet.</p>
      </div>
    `;
    return;
  }

  // Sort chronological descending
  activities.sort((a, b) => b.date.getTime() - a.date.getTime());

  container.innerHTML = activities
    .slice(0, 5)
    .map(UI.renderActivityItem)
    .join('');
}

/* ---------------------------------------------------------------------------
 * Sub-Views Implementations (#users, #workouts, #exercises, #programs, etc.)
 * --------------------------------------------------------------------------- */

async function loadUsersView() {
  const tbody = document.getElementById('users-table-tbody');
  if (!tbody) return;

  try {
    const res = await api.getAdminUsers();
    state.users = res.data || [];
    renderUsersTable(state.users);
  } catch (err) {
    UI.showToast(err.message || 'Failed to load users table', 'error');
  }
}

function renderUsersTable(users = []) {
  const tbody = document.getElementById('users-table-tbody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">No users match the criteria.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users
    .map((u) => {
      const initial = ((u.name || u.email)[0] || 'U').toUpperCase();
      const avatarColor = UI.getAvatarColor(u.name || u.email);
      const regDate = new Date(u.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return `
      <tr>
        <td>
          <div class="table-user-cell">
            <div class="table-user-avatar" style="background-color:${avatarColor};" aria-hidden="true">
              ${initial}
            </div>
            <div>
              <div class="table-user-name">${u.name || 'Unnamed Lifter'}</div>
              <div class="table-user-email">${u.email}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="role-badge ${u.role}">${u.role}</span>
        </td>
        <td>${regDate}</td>
        <td>
          <span class="status-dot">Active</span>
        </td>
        <td>
          <div class="table-actions">
            <button class="table-btn btn-inspect-user" data-user-id="${u.id}">Details</button>
            <button class="table-btn danger btn-revoke-user" data-user-id="${u.id}">Revoke</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');

  // Bind actions
  tbody.querySelectorAll('.btn-inspect-user').forEach((btn) => {
    btn.addEventListener('click', () => {
      const uid = btn.getAttribute('data-user-id');
      const targetUser = state.users.find((u) => u.id === uid);
      if (targetUser) openUserDetailsModal(targetUser);
    });
  });

  tbody.querySelectorAll('.btn-revoke-user').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const uid = btn.getAttribute('data-user-id');
      if (confirm('Revoke all active sessions for this user?')) {
        try {
          await api.revokeUserSessions(uid);
          UI.showToast('User sessions revoked successfully', 'success');
        } catch (err) {
          UI.showToast(err.message || 'Failed to revoke sessions', 'error');
        }
      }
    });
  });
}

async function loadExercisesView() {
  const container = document.getElementById('exercises-grid-container');
  if (!container) return;

  container.innerHTML = '<div class="empty-state">Loading exercise catalogue...</div>';

  try {
    const res = await api.getExercises({ limit: 50 });
    state.exercises = res.data || [];

    if (state.exercises.length === 0) {
      container.innerHTML = '<div class="empty-state">No exercises found in catalogue.</div>';
      return;
    }

    container.innerHTML = state.exercises
      .map(
        (ex) => `
        <div class="clay-card-sm exercise-card" role="button" tabindex="0" data-exercise-id="${ex.id}" aria-label="View details for ${ex.name}">
          <div class="exercise-card-top">
            <div class="pastel-icon-badge purple" style="width:36px; height:36px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m6.5 6.5 11 11"></path><path d="m21 21-1-1"></path>
              </svg>
            </div>
            <span class="role-badge user">${ex.movementPattern || 'Strength'}</span>
          </div>
          <div>
            <h4>${ex.name}</h4>
            <p class="exercise-target">Target: <strong>${ex.primaryMuscleGroup}</strong></p>
          </div>
          <div class="exercise-meta">
            Equipment: ${ex.requiredEquipment}
          </div>
        </div>
      `,
      )
      .join('');

    container.querySelectorAll('[data-exercise-id]').forEach((card) => {
      const openDetails = () => {
        const eid = card.getAttribute('data-exercise-id');
        const exercise = state.exercises.find((e) => e.id === eid);
        if (exercise) openExerciseModal(exercise);
      };
      card.addEventListener('click', openDetails);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetails();
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>${err.message || 'Failed to load exercises'}</p></div>`;
  }
}

async function loadWorkoutsView() {
  const container = document.getElementById('workouts-list-container');
  if (!container) return;

  try {
    const res = await api.getSessions({ limit: 20 });
    state.workouts = res.data || [];

    if (state.workouts.length === 0) {
      container.innerHTML = '<div class="empty-state">No workouts logged yet.</div>';
      return;
    }

    container.innerHTML = state.workouts
      .map(
        (w) => `
        <div class="clay-card-sm session-row">
          <div class="session-row-left">
            <div class="pastel-icon-badge ${w.status === 'completed' ? 'mint' : 'purple'}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m6.5 6.5 11 11"></path><path d="m21 21-1-1"></path>
              </svg>
            </div>
            <div>
              <h4>${w.notes || 'Workout Session'}</h4>
              <p class="session-meta">
                Status: <strong>${w.status}</strong>
                ${w.perceivedRpe ? `&bull; RPE: ${w.perceivedRpe}/10` : ''}
              </p>
            </div>
          </div>
          <div class="session-row-right">
            <div class="session-date">
              ${new Date(w.startedAt).toLocaleDateString()}
            </div>
            <div class="session-ago">${UI.timeAgo(w.startedAt)}</div>
          </div>
        </div>
      `,
      )
      .join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
}

async function loadProgramsView() {
  const container = document.getElementById('programs-grid-container');
  if (!container) return;

  try {
    const res = await api.getPrograms();
    state.programs = res.data || [];

    if (state.programs.length === 0) {
      container.innerHTML = '<div class="empty-state">No workout programs created yet.</div>';
      return;
    }

    container.innerHTML = state.programs
      .map(
        (p) => `
        <div class="clay-card-sm program-card">
          <div class="program-card-top">
            <span class="role-badge ${p.isActive ? 'admin' : 'user'}">
              ${p.isActive ? 'Active Program' : 'Inactive'}
            </span>
            <span class="program-split">
              ${(p.splitType || '').replace(/_/g, ' ')}
            </span>
          </div>
          <h3>${p.name}</h3>
          <p class="program-meta">
            Duration: <strong>${p.durationWeeks} weeks</strong> &bull; ${p.trainingDaysPerWeek} days/week
          </p>
          <div class="program-card-footer">
            ${
              !p.isActive
                ? `<button class="clay-pill-btn clay-pill-btn-white btn-activate-prog" data-id="${p.id}" style="padding:6px 14px; font-size:0.8rem;">Set Active</button>`
                : ''
            }
            <button class="table-btn danger btn-delete-prog" data-id="${p.id}" style="padding:6px 14px;">Delete</button>
          </div>
        </div>
      `,
      )
      .join('');

    container.querySelectorAll('.btn-activate-prog').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const pid = btn.getAttribute('data-id');
        try {
          await api.activateProgram(pid);
          UI.showToast('Program activated!', 'success');
          loadProgramsView();
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });
    });

    container.querySelectorAll('.btn-delete-prog').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const pid = btn.getAttribute('data-id');
        if (confirm('Delete this workout program?')) {
          try {
            await api.deleteProgram(pid);
            UI.showToast('Program deleted', 'success');
            loadProgramsView();
          } catch (err) {
            UI.showToast(err.message, 'error');
          }
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
}

async function loadAnalyticsView() {
  try {
    const consistency = await api.getTrainingConsistency({ weeks: 12 });
    state.analyticsConsistency = consistency.data;

    const volume = await api.getVolumeByMuscle();
    state.analyticsVolume = volume.data;

    renderWorkoutDistributionChart(state.analyticsVolume);

    // Consistency Breakdown
    const container = document.getElementById('consistency-breakdown-container');
    if (container && state.analyticsConsistency?.weeklyBreakdown) {
      container.innerHTML = state.analyticsConsistency.weeklyBreakdown
        .map(
          (w) => `
          <div class="consistency-row">
            <span class="week-label">Week ${new Date(w.weekStart).toLocaleDateString()}</span>
            <span class="week-count ${w.metGoal ? 'met' : ''}">
              ${w.workoutCount} workouts${w.metGoal ? ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
            </span>
          </div>
        `,
        )
        .join('');
    }
  } catch (err) {
    console.error('Analytics view error:', err);
  }
}

function loadSettingsView() {
  const inputUrl = document.getElementById('settings-api-url');
  if (inputUrl) {
    inputUrl.value = API_CONFIG.baseUrl;
  }
}

/* ---------------------------------------------------------------------------
 * Search Filter Implementation
 * --------------------------------------------------------------------------- */

function bindSearch() {
  const searchInput = document.getElementById('dashboard-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    applySearchFilter(state.searchQuery);
  });
}

function applySearchFilter(query) {
  if (state.activeView === 'users') {
    const filtered = state.users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(query)) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query),
    );
    renderUsersTable(filtered);
  } else if (state.activeView === 'exercises') {
    const filtered = state.exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.primaryMuscleGroup.toLowerCase().includes(query) ||
        e.requiredEquipment.toLowerCase().includes(query),
    );
    const container = document.getElementById('exercises-grid-container');
    if (container) {
      if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">No matching exercises found.</div>';
      } else {
        container.querySelectorAll('[data-exercise-id]').forEach((card) => {
          const eid = card.getAttribute('data-exercise-id');
          const match = filtered.some((f) => f.id === eid);
          card.style.display = match ? 'flex' : 'none';
        });
      }
    }
  } else if (state.activeView === 'dashboard') {
    // Filter recent users on dashboard
    const userBadges = document.querySelectorAll('.user-clay-badge');
    userBadges.forEach((badge) => {
      const text = badge.innerText.toLowerCase();
      badge.style.display = text.includes(query) ? 'flex' : 'none';
    });
  }
}

/* ---------------------------------------------------------------------------
 * Modals & Actions
 * --------------------------------------------------------------------------- */

function bindModals() {
  // Modal Close buttons
  document.querySelectorAll('.modal-close-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) UI.closeModal(modal.id);
    });
  });

  // Close modal when clicking overlay background
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        UI.closeModal(overlay.id);
      }
    });
  });

  // Login Form Submit
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error-msg');
      if (errorEl) errorEl.textContent = '';

      try {
        await auth.login(email, pass);
      } catch (err) {
        if (errorEl) errorEl.textContent = err.message || 'Login failed';
      }
    });
  }

  // Quick fill admin email button
  const btnFillCreds = document.getElementById('btn-fill-admin-creds');
  if (btnFillCreds) {
    btnFillCreds.addEventListener('click', () => {
      const emailInput = document.getElementById('login-email');
      const passInput = document.getElementById('login-password');
      if (emailInput) emailInput.value = 'samarthahg2004@gmail.com';
      if (passInput) passInput.focus();
    });
  }

  // Add User Form Submit
  const addUserForm = document.getElementById('form-add-user');
  if (addUserForm) {
    addUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('new-user-email').value;
      const password = document.getElementById('new-user-password').value;
      const name = document.getElementById('new-user-name').value;

      try {
        await api.registerUser(email, password, name);
        UI.showToast('User registered successfully!', 'success');
        UI.closeModal('modal-add-user');
        addUserForm.reset();
        loadDashboardData();
        if (state.activeView === 'users') loadUsersView();
      } catch (err) {
        UI.showToast(err.message || 'Registration failed', 'error');
      }
    });
  }

  // Quick action buttons
  const btnAddUser = document.getElementById('action-add-user');
  if (btnAddUser) {
    btnAddUser.addEventListener('click', (e) => {
      e.preventDefault();
      UI.openModal('modal-add-user');
    });
  }

  const btnCreateWorkout = document.getElementById('action-create-workout');
  if (btnCreateWorkout) {
    btnCreateWorkout.addEventListener('click', (e) => {
      e.preventDefault();
      UI.openModal('modal-start-workout');
    });
  }

  const btnAddProgram = document.getElementById('action-add-program');
  if (btnAddProgram) {
    btnAddProgram.addEventListener('click', (e) => {
      e.preventDefault();
      UI.openModal('modal-create-program');
    });
  }

  const btnViewReports = document.getElementById('action-view-reports');
  if (btnViewReports) {
    btnViewReports.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = '#analytics';
    });
  }

  // Start Workout Form Submit
  const startWorkoutForm = document.getElementById('form-start-workout');
  if (startWorkoutForm) {
    startWorkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const notes = document.getElementById('workout-notes-input').value;
      try {
        await api.startSession({ notes });
        UI.showToast('Workout session started!', 'success');
        UI.closeModal('modal-start-workout');
        startWorkoutForm.reset();
        loadDashboardData();
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    });
  }

  // Create Program Form Submit
  const createProgramForm = document.getElementById('form-create-program');
  if (createProgramForm) {
    createProgramForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('prog-name-input').value;
      const splitType = document.getElementById('prog-split-select').value;
      const durationWeeks = parseInt(document.getElementById('prog-duration-input').value, 10) || 4;
      const days = parseInt(document.getElementById('prog-days-input').value, 10) || 4;

      try {
        await api.createProgram({
          name,
          splitType,
          durationWeeks,
          trainingDaysPerWeek: days,
          targetSessionDurationMinutes: 45,
          isActive: true,
        });
        UI.showToast('Custom program created!', 'success');
        UI.closeModal('modal-create-program');
        createProgramForm.reset();
        loadDashboardData();
        if (state.activeView === 'programs') loadProgramsView();
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    });
  }

  // Notification Drawer
  const notifBtn = document.getElementById('notification-bell-btn');
  const notifDrawer = document.getElementById('notification-drawer');
  const notifClose = document.getElementById('notification-drawer-close');

  if (notifBtn && notifDrawer) {
    notifBtn.addEventListener('click', () => {
      const isOpen = notifDrawer.classList.toggle('open');
      notifBtn.setAttribute('aria-expanded', String(isOpen));
    });
  }
  if (notifClose && notifDrawer) {
    notifClose.addEventListener('click', () => {
      notifDrawer.classList.remove('open');
      notifBtn?.setAttribute('aria-expanded', 'false');
      notifBtn?.focus();
    });
  }
}

function promptAdminLogin() {
  UI.openModal('modal-login');
}

function openUserDetailsModal(user) {
  state.selectedUser = user;
  const modal = document.getElementById('modal-user-details');
  if (!modal) return;

  document.getElementById('user-detail-name').textContent = user.name || 'Unnamed';
  document.getElementById('user-detail-email').textContent = user.email;
  document.getElementById('user-detail-id').textContent = user.id;
  document.getElementById('user-detail-role').textContent = user.role;
  document.getElementById('user-detail-created').textContent = new Date(
    user.created_at,
  ).toLocaleString();

  const roleSelect = document.getElementById('user-detail-role-select');
  if (roleSelect) roleSelect.value = user.role;

  // Bind role update
  const btnSaveRole = document.getElementById('btn-save-user-role');
  if (btnSaveRole) {
    btnSaveRole.onclick = async () => {
      const newRole = roleSelect.value;
      try {
        await api.updateUserRole(user.id, newRole);
        UI.showToast('User role updated successfully', 'success');
        user.role = newRole;
        document.getElementById('user-detail-role').textContent = newRole;
        loadDashboardData();
        if (state.activeView === 'users') loadUsersView();
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    };
  }

  // Bind revoke sessions
  const btnRevoke = document.getElementById('btn-revoke-user-sessions');
  if (btnRevoke) {
    btnRevoke.onclick = async () => {
      try {
        await api.revokeUserSessions(user.id);
        UI.showToast('All sessions revoked for user', 'success');
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    };
  }

  // Bind soft delete
  const btnDelete = document.getElementById('btn-delete-user');
  if (btnDelete) {
    btnDelete.onclick = async () => {
      if (confirm(`Are you sure you want to delete user ${user.email}?`)) {
        try {
          await api.deleteUser(user.id);
          UI.showToast('User soft-deleted', 'success');
          UI.closeModal('modal-user-details');
          loadDashboardData();
          if (state.activeView === 'users') loadUsersView();
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      }
    };
  }

  UI.openModal('modal-user-details');
}

function openExerciseModal(exercise) {
  state.selectedExercise = exercise;
  document.getElementById('exercise-modal-title').textContent = exercise.name;
  document.getElementById('exercise-modal-muscle').textContent = exercise.primaryMuscleGroup;
  document.getElementById('exercise-modal-pattern').textContent = exercise.movementPattern;
  document.getElementById('exercise-modal-equip').textContent = exercise.requiredEquipment;
  document.getElementById('exercise-modal-instructions').textContent =
    exercise.instructions || 'No detailed instructions provided.';

  UI.openModal('modal-exercise-details');
}

function bindProfileAndSettings() {
  const profileMenuBtn = document.getElementById('admin-profile-btn');
  const profileDropdown = document.getElementById('admin-profile-dropdown');

  if (profileMenuBtn && profileDropdown) {
    const toggleDropdown = (e) => {
      e.stopPropagation();
      const isOpen = profileDropdown.style.display === 'block';
      profileDropdown.style.display = isOpen ? 'none' : 'block';
      profileMenuBtn.setAttribute('aria-expanded', String(!isOpen));
    };

    profileMenuBtn.addEventListener('click', toggleDropdown);
    profileMenuBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        toggleDropdown(e);
      }
    });

    document.addEventListener('click', (e) => {
      if (!profileMenuBtn.contains(e.target)) {
        profileDropdown.style.display = 'none';
        profileMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const btnLogout = document.getElementById('btn-admin-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      await auth.logout();
      UI.showToast('Signed out of admin dashboard', 'info');
      promptAdminLogin();
    });
  }

  const btnSaveSettings = document.getElementById('btn-save-settings');
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      const inputUrl = document.getElementById('settings-api-url');
      if (inputUrl && inputUrl.value) {
        API_CONFIG.baseUrl = inputUrl.value;
        UI.showToast('API URL saved!', 'success');
        checkBackendHealth();
        loadDashboardData();
      }
    });
  }
}

function bindQuickActions() {
  const viewAllUsersLink = document.getElementById('view-all-users-link');
  if (viewAllUsersLink) {
    viewAllUsersLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = '#users';
    });
  }

  const viewAllWorkoutsLink = document.getElementById('view-all-workouts-link');
  if (viewAllWorkoutsLink) {
    viewAllWorkoutsLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = '#workouts';
    });
  }
}
