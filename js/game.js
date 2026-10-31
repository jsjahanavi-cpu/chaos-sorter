/**
 * Chaos Sorter - Core Arcade Game State Engine with Boss Rush & XP Integration
 */

import { sound } from './audio.js';
import { formatBytes } from './categories.js';
import { progression } from './achievements.js';

export class GameEngine {
  constructor(fsManager, particleEngine) {
    this.fs = fsManager;
    this.particles = particleEngine;

    // Game stats
    this.state = 'IDLE'; // 'IDLE' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'
    this.mode = 'CLASSIC'; // 'CLASSIC' | 'BOSS' | 'SLASHER'
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('chaos_sorter_high_score') || '0', 10);
    this.streak = 0;
    this.maxStreak = 0;
    this.multiplier = 1;
    this.timer = 60;
    this.timerInterval = null;
    this.comboDecayInterval = null;
    this.comboMeter = 100;

    // Boss Battle stats
    this.bossMaxHp = 1000;
    this.bossHp = 1000;

    // Current active file & queue
    this.currentFile = null;
    this.remainingFiles = [];
    this.sortedCount = 0;
    this.totalInitialCount = 0;

    // Callbacks
    this.onStateChange = null;
    this.onFileAdvance = null;
    this.onStatsUpdate = null;
  }

  start(files, mode = 'CLASSIC') {
    if (!files || files.length === 0) {
      alert('No loose files found to organize!');
      return;
    }

    this.mode = mode;
    this.state = 'PLAYING';
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.multiplier = 1;
    this.sortedCount = 0;
    this.timer = mode === 'BOSS' ? 45 : Math.min(120, Math.max(45, files.length * 4));
    this.comboMeter = 100;

    this.bossMaxHp = Math.max(500, files.length * 100);
    this.bossHp = this.bossMaxHp;

    this.remainingFiles = [...files];
    this.totalInitialCount = files.length;

    this.startTimers();
    this.nextFile();

    if (this.onStateChange) this.onStateChange(this.state);
    this.notifyStats();
  }

  startTimers() {
    clearInterval(this.timerInterval);
    clearInterval(this.comboDecayInterval);

    this.timerInterval = setInterval(() => {
      if (this.state !== 'PLAYING') return;

      this.timer--;
      if (this.timer <= 0) {
        this.timer = 0;
        this.endGame(false);
      }
      this.notifyStats();
    }, 1000);

    this.comboDecayInterval = setInterval(() => {
      if (this.state !== 'PLAYING') return;

      this.comboMeter = Math.max(0, this.comboMeter - 1.2);
      if (this.comboMeter === 0 && this.multiplier > 1) {
        this.multiplier = 1;
        this.streak = 0;
      }
      this.notifyStats();
    }, 100);
  }

  stopTimers() {
    clearInterval(this.timerInterval);
    clearInterval(this.comboDecayInterval);
  }

  nextFile() {
    if (this.remainingFiles.length === 0 || (this.mode === 'BOSS' && this.bossHp <= 0)) {
      this.endGame(true);
      return;
    }

    this.currentFile = this.remainingFiles.shift();
    if (this.onFileAdvance) {
      this.onFileAdvance(this.currentFile, this.remainingFiles.length);
    }
    this.notifyStats();
  }

  async sortFile(chosenCategory, eventCoordinates = null) {
    if (this.state !== 'PLAYING' || !this.currentFile) return;

    const file = this.currentFile;
    const isRecommended = file.targetCategory.id === chosenCategory.id;
    const execPromise = this.fs.executeChore(file, chosenCategory);

    const targetX = eventCoordinates ? eventCoordinates.x : window.innerWidth / 2;
    const targetY = eventCoordinates ? eventCoordinates.y : window.innerHeight / 2;

    if (isRecommended) {
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;

      // Multipliers
      if (this.streak >= 15) {
        this.multiplier = 8;
        progression.unlock('combo_frenzy');
        progression.unlock('perfectionist');
      } else if (this.streak >= 10) {
        this.multiplier = 4;
      } else if (this.streak >= 5) {
        this.multiplier = 2;
      } else {
        this.multiplier = 1;
      }

      if (this.multiplier === 8) {
        sound.playCombo(8);
      } else {
        sound.playSort();
        if (this.multiplier > 1) sound.playCombo(this.multiplier);
      }

      const sizeBonus = Math.min(250, Math.floor(file.size / 100000));
      const points = (100 + sizeBonus) * this.multiplier;
      this.score += points;

      // XP Progression
      progression.addXp(15 * this.multiplier);

      // Boss Damage
      if (this.mode === 'BOSS') {
        const damage = 120 * this.multiplier;
        this.bossHp = Math.max(0, this.bossHp - damage);
        sound.playBossHit();
        this.particles.createFloatingText(window.innerWidth / 2, 180, `-${damage} HP!`, '#ef4444', 26);
        this.particles.triggerScreenShake(8);

        if (this.bossHp <= 0) {
          progression.unlock('boss_slayer');
        }
      }

      this.comboMeter = 100;

      // Visuals
      this.particles.createBurst(targetX, targetY, chosenCategory.color, 35);
      this.particles.createFloatingText(targetX, targetY - 30, `+${points}`, chosenCategory.color, 24);
      if (this.multiplier > 1) {
        this.particles.createFloatingText(targetX, targetY - 60, `${this.multiplier}X COMBO!`, '#f59e0b', 16);
      }
      this.particles.triggerScreenShake(this.multiplier >= 4 ? 8 : 3);
    } else {
      this.streak = 0;
      this.multiplier = 1;
      this.score += 50;
      progression.addXp(5);
      sound.playError();
      this.particles.createBurst(targetX, targetY, '#64748b', 15);
      this.particles.createFloatingText(targetX, targetY - 30, `+50`, '#94a3b8', 16);
    }

    this.sortedCount++;

    // Achievement checks
    if (this.sortedCount >= 5) progression.unlock('first_sort');
    if (this.fs.bytesCleaned >= 100 * 1024 * 1024) progression.unlock('storage_titan');

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('chaos_sorter_high_score', this.highScore.toString());
    }

    await execPromise;
    this.nextFile();
  }

  endGame(isVictory = false) {
    this.stopTimers();
    this.state = isVictory ? 'VICTORY' : 'GAMEOVER';

    if (isVictory) {
      sound.playVictory();
      progression.addXp(200);
      this.particles.createBurst(window.innerWidth / 2, window.innerHeight / 2, '#38bdf8', 100);
      this.particles.createBurst(window.innerWidth / 3, window.innerHeight / 2, '#f43f5e', 80);
      this.particles.createBurst((window.innerWidth * 2) / 3, window.innerHeight / 2, '#a855f7', 80);
    } else {
      sound.playError();
    }

    if (this.onStateChange) this.onStateChange(this.state);
    this.notifyStats();
  }

  notifyStats() {
    if (this.onStatsUpdate) {
      this.onStatsUpdate({
        score: this.score,
        highScore: this.highScore,
        streak: this.streak,
        maxStreak: this.maxStreak,
        multiplier: this.multiplier,
        timer: this.timer,
        comboMeter: this.comboMeter,
        sortedCount: this.sortedCount,
        totalInitialCount: this.totalInitialCount,
        remainingCount: this.remainingFiles.length + (this.currentFile ? 1 : 0),
        bytesCleaned: this.fs.bytesCleaned,
        formattedBytesCleaned: formatBytes(this.fs.bytesCleaned),
        bossHp: this.bossHp,
        bossMaxHp: this.bossMaxHp,
        mode: this.mode,
        state: this.state
      });
    }
  }
}
