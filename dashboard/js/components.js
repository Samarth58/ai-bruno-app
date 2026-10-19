/**
 * Bruno AI Gym Buddy — Reusable Presentation Components
 * Claymorphic cards, activity feed items, modals, toast alerts, and skeleton loaders.
 */

import { ChartEngine } from './charts.js';

export const UI = {
  /**
   * Formats relative time (e.g. "2h ago", "Just now", "Yesterday")
   */
  timeAgo: (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  },

  /**
   * Generates a pastel background color for user avatars based on string hash
   */
  getAvatarColor: (name = '') => {
    const colors = [
      '#ff8c88', // coral
      '#9275f5', // lavender
      '#f5a623', // amber
      '#38b284', // mint
      '#3ba4e6', // sky
      '#e056fd', // violet
      '#f0932b', // orange
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  },

  /**
   * Renders a KPI Card HTML
   */
  renderKpiCard: ({ id, title, value, iconType, trend, trendDirection = 'up', sparklineData, color }) => {
    const iconSvgs = {
      users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
      workouts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"></path><path d="m21 21-1-1"></path><path d="m3 3 1 1"></path><path d="m18 22 4-4"></path><path d="m2 6 4-4"></path><path d="m3 10 7-7"></path><path d="m14 21 7-7"></path></svg>`,
      programs: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>`,
      streak: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`,
    };

    const sparkSvg = ChartEngine.createSparklineSvg(sparklineData || [10, 15, 12, 22, 18, 30, 28], color);
    const trendHtml = trend
      ? `<span class="kpi-trend ${trendDirection === 'down' ? 'negative' : ''}">
          ${trendDirection === 'up' ? '↑' : '↓'} ${trend}
         </span>`
      : '';

    return `
      <div class="clay-card kpi-card" id="${id}">
        <div class="kpi-header">
          <div class="pastel-icon-badge ${iconType}">
            ${iconSvgs[iconType] || iconSvgs.users}
          </div>
          <h3>${title}</h3>
        </div>
        <div class="kpi-body">
          <div class="kpi-metric">${value}</div>
          ${trendHtml}
        </div>
        <div class="kpi-sparkline">
          ${sparkSvg}
        </div>
      </div>
    `;
  },

  /**
   * Renders a Recent User Clay Badge
   */
  renderUserBadge: (user, index) => {
    const displayName = user.name || user.email.split('@')[0];
    const initial = (displayName[0] || 'U').toUpperCase();
    const avatarColor = UI.getAvatarColor(displayName);
    const roleLabel = user.role === 'admin' ? 'Administrator' : 'Lifter';

    return `
      <div class="user-clay-badge" data-user-id="${user.id}" title="${user.email}">
        <div class="user-clay-avatar" style="background-color: ${avatarColor};">
          ${initial}
        </div>
        <div class="user-clay-name">${displayName}</div>
        <div class="user-clay-role">${roleLabel}</div>
      </div>
    `;
  },

  /**
   * Renders a Recent Workout Row
   */
  renderWorkoutRow: (workout) => {
    const routineName = workout.routineName || workout.notes || 'Custom Workout';
    const lifterName = workout.userName || 'You';
    const timeStr = UI.timeAgo(workout.completedAt || workout.startedAt);

    return `
      <div class="workout-item-row" data-session-id="${workout.id}">
        <div class="workout-left">
          <div class="pastel-icon-badge purple" style="width: 38px; height: 38px; border-radius: 12px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6.5 6.5 11 11"></path>
              <path d="m21 21-1-1"></path>
              <path d="m3 3 1 1"></path>
            </svg>
          </div>
          <div class="workout-info">
            <h4>${routineName}</h4>
            <p>by ${lifterName}</p>
          </div>
        </div>
        <div class="workout-right">
          <span class="workout-time">${timeStr}</span>
          <div class="workout-check-icon">✓</div>
        </div>
      </div>
    `;
  },

  /**
   * Renders an Activity Feed Item
   */
  renderActivityItem: ({ type, title, subtitle, timeStr, dataId }) => {
    const badges = {
      user: { class: 'coral', icon: `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>` },
      workout: { class: 'purple', icon: `<path d="m6.5 6.5 11 11"></path><path d="m21 21-1-1"></path><path d="m3 3 1 1"></path>` },
      program: { class: 'yellow', icon: `<rect width="18" height="18" x="3" y="4" rx="2"></rect><line x1="3" x2="21" y1="10" y2="10"></line>` },
      feedback: { class: 'mint', icon: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>` },
    };

    const badge = badges[type] || badges.workout;

    return `
      <div class="activity-item" data-id="${dataId || ''}">
        <div class="activity-left">
          <div class="pastel-icon-badge ${badge.class}" style="width: 36px; height: 36px; border-radius: 12px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${badge.icon}
            </svg>
          </div>
          <div class="activity-info">
            <h4>${title}</h4>
            <p>${subtitle}</p>
          </div>
        </div>
        <div class="activity-right">
          <span>${timeStr}</span>
          <span>›</span>
        </div>
      </div>
    `;
  },

  /**
   * Toast notification display
   */
  showToast: (message, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  /**
   * Modal Open / Close Helpers
   */
  openModal: (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal: (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },
};
