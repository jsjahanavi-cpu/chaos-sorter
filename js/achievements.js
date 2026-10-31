/**
 * Chaos Sorter - Gamified Achievements & XP Progression System
 */

import { sound } from './audio.js';

export class ProgressionManager {
  constructor() {
    this.xp = parseInt(localStorage.getItem('chaos_sorter_xp') || '0', 10);
    this.unlockedBadges = JSON.parse(localStorage.getItem('chaos_sorter_badges') || '[]');

    this.levels = [
      { level: 1, title: 'Folder Novice', minXp: 0 },
      { level: 2, title: 'Disk Janitor', minXp: 500 },
      { level: 3, title: 'Clutter Knight', minXp: 1500 },
      { level: 4, title: 'Byte Slayer', minXp: 3000 },
      { level: 5, title: 'Master of Order', minXp: 5000 }
    ];

    this.achievements = [
      { id: 'first_sort', icon: '🧹', title: 'First Clean', desc: 'Sort your first 5 files', threshold: 5 },
      { id: 'combo_frenzy', icon: '⚡', title: 'Frenzy Master', desc: 'Reach an 8X combo multiplier' },
      { id: 'storage_titan', icon: '💾', title: 'Storage Titan', desc: 'Clean over 100 MB of clutter' },
      { id: 'ninja_master', icon: '⚔️', title: 'Clutter Ninja', desc: 'Slice 10 files in Slasher mode' },
      { id: 'boss_slayer', icon: '🐉', title: 'Dragon Slayer', desc: 'Defeat the 5GB Bloat Boss' },
      { id: 'perfectionist', icon: '🎯', title: 'Flawless Flow', desc: 'Maintain a 15-file streak without error' }
    ];

    this.onProgressUpdate = null;
  }

  getCurrentLevel() {
    let current = this.levels[0];
    for (const lvl of this.levels) {
      if (this.xp >= lvl.minXp) current = lvl;
    }
    return current;
  }

  getNextLevel() {
    const current = this.getCurrentLevel();
    const nextIndex = this.levels.findIndex(l => l.level === current.level) + 1;
    return this.levels[nextIndex] || null;
  }

  addXp(amount) {
    const oldLevel = this.getCurrentLevel();
    this.xp += amount;
    localStorage.setItem('chaos_sorter_xp', this.xp.toString());

    const newLevel = this.getCurrentLevel();
    if (newLevel.level > oldLevel.level) {
      sound.playLevelUp();
      this.showToast(`🎉 LEVEL UP! You are now a ${newLevel.title}!`, '#38bdf8');
    }

    if (this.onProgressUpdate) this.onProgressUpdate(this.getProgressData());
  }

  unlock(achievementId) {
    if (this.unlockedBadges.includes(achievementId)) return;

    const ach = this.achievements.find(a => a.id === achievementId);
    if (!ach) return;

    this.unlockedBadges.push(achievementId);
    localStorage.setItem('chaos_sorter_badges', JSON.stringify(this.unlockedBadges));

    sound.playLevelUp();
    this.showToast(`🏆 UNLOCKED: ${ach.title} (${ach.desc})`, '#f59e0b');
    this.addXp(250); // XP bonus for badge unlock

    if (this.onProgressUpdate) this.onProgressUpdate(this.getProgressData());
  }

  showToast(message, color = '#38bdf8') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 70px;
      right: 24px;
      background: rgba(15, 23, 42, 0.95);
      border: 2px solid ${color};
      color: #f8fafc;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 0 25px ${color}66;
      z-index: 1000;
      animation: toastIn 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  getProgressData() {
    const currentLevel = this.getCurrentLevel();
    const nextLevel = this.getNextLevel();
    const currentLvlXp = currentLevel.minXp;
    const nextLvlXp = nextLevel ? nextLevel.minXp : currentLvlXp + 2000;
    const progressPercent = Math.min(100, Math.floor(((this.xp - currentLvlXp) / (nextLvlXp - currentLvlXp)) * 100));

    return {
      xp: this.xp,
      level: currentLevel.level,
      title: currentLevel.title,
      nextLevelTitle: nextLevel ? nextLevel.title : 'MAX',
      progressPercent,
      unlockedBadges: this.unlockedBadges,
      achievements: this.achievements
    };
  }
}

export const progression = new ProgressionManager();
