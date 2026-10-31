/**
 * Chaos Sorter - Core Arcade Game State Engine
 */

import { sound } from './audio.js';
import { formatBytes } from './categories.js';

export class GameEngine {
  constructor(fsManager, particleEngine) {
    this.fs = fsManager;
    this.particles = particleEngine;

    // Game stats
    this.state = 'IDLE'; // 'IDLE' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('chaos_sorter_high_score') || '0', 10);
    this.streak = 0;
    this.maxStreak = 0;
    this.multiplier = 1;
    this.timer = 60; // 60-second speed-run arcade mode
    this.timerInterval = null;
    this.comboDecayInterval = null;
    this.comboMeter = 100; // 0 to 100%

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

  start(files) {
    if (!files || files.length === 0) {
      alert('No loose files found to organize!');
      return;
    }

    this.state = 'PLAYING';
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.multiplier = 1;
    this.sortedCount = 0;
    this.timer = Math.min(120, Math.max(45, files.length * 3)); // dynamic time based on file count
    this.comboMeter = 100;

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

    // Main countdown timer
    this.timerInterval = setInterval(() => {
      if (this.state !== 'PLAYING') return;

      this.timer--;
      if (this.timer <= 0) {
        this.timer = 0;
        this.endGame(false); // Time out
      }
      this.notifyStats();
    }, 1000);

    // Dynamic combo decay (encourages rapid-fire sorting)
    this.comboDecayInterval = setInterval(() => {
      if (this.state !== 'PLAYING') return;

      this.comboMeter = Math.max(0, this.comboMeter - 1.5);
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
    if (this.remainingFiles.length === 0) {
      this.endGame(true); // Victory! All files cleaned
      return;
    }

    this.currentFile = this.remainingFiles.shift();
    if (this.onFileAdvance) {
      this.onFileAdvance(this.currentFile, this.remainingFiles.length);
    }
    this.notifyStats();
  }

  /**
   * Action trigger when user sorts current file into category
   */
  async sortFile(chosenCategory, eventCoordinates = null) {
    if (this.state !== 'PLAYING' || !this.currentFile) return;

    const file = this.currentFile;
    const isRecommended = file.targetCategory.id === chosenCategory.id;
    
    // Background execution of real file move
    const execPromise = this.fs.executeChore(file, chosenCategory);

    // Visual & Sound Feedback
    const targetX = eventCoordinates ? eventCoordinates.x : window.innerWidth / 2;
    const targetY = eventCoordinates ? eventCoordinates.y : window.innerHeight / 2;

    if (isRecommended) {
      // Perfect match!
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;

      // Update multipliers
      if (this.streak >= 15) this.multiplier = 8;
      else if (this.streak >= 10) this.multiplier = 4;
      else if (this.streak >= 5) this.multiplier = 2;
      else this.multiplier = 1;

      // Frenzy check
      if (this.multiplier === 8 && this.streak % 5 === 0) {
        sound.playFrenzy();
      } else {
        sound.playSort();
        if (this.multiplier > 1) sound.playCombo(this.multiplier);
      }

      // Add score: (100 base + size bonus) * multiplier
      const sizeBonus = Math.min(250, Math.floor(file.size / 100000));
      const points = (100 + sizeBonus) * this.multiplier;
      this.score += points;

      // Reset combo meter
      this.comboMeter = 100;

      // Visual Juice
      this.particles.createBurst(targetX, targetY, chosenCategory.color, 35);
      this.particles.createFloatingText(targetX, targetY - 30, `+${points}`, chosenCategory.color, 24);
      if (this.multiplier > 1) {
        this.particles.createFloatingText(targetX, targetY - 60, `${this.multiplier}X COMBO!`, '#f59e0b', 16);
      }
      this.particles.triggerScreenShake(this.multiplier >= 4 ? 8 : 3);
    } else {
      // User manual override or mismatched category
      // It still executes the chore, but breaks the streak
      this.streak = 0;
      this.multiplier = 1;
      this.score += 50; // Partial points
      sound.playError();
      this.particles.createBurst(targetX, targetY, '#64748b', 15);
      this.particles.createFloatingText(targetX, targetY - 30, `+50 (Custom)`, '#94a3b8', 16);
    }

    this.sortedCount++;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('chaos_sorter_high_score', this.highScore.toString());
    }

    // Await background chore finish (or let it run async)
    await execPromise;

    // Advance to next clutter item
    this.nextFile();
  }

  endGame(isVictory = false) {
    this.stopTimers();
    this.state = isVictory ? 'VICTORY' : 'GAMEOVER';

    if (isVictory) {
      sound.playVictory();
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
        state: this.state
      });
    }
  }
}
