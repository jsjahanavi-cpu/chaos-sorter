/**
 * Chaos Sorter - "Clutter Slasher" Fruit-Ninja Arcade Mini-Game
 */

import { sound } from './audio.js';
import { formatBytes } from './categories.js';

export class SlasherMiniGame {
  constructor(canvas, fsManager, particles, progression) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fs = fsManager;
    this.particles = particles;
    this.progression = progression;

    this.active = false;
    this.flyingItems = [];
    this.slicedCount = 0;
    this.lives = 3;
    this.score = 0;
    this.animId = null;
    this.spawnTimer = null;
    this.isMouseDown = false;
    this.lastMousePos = null;

    this.setupListeners();
  }

  setupListeners() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.checkSlice(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      this.lastMousePos = null;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.active || !this.isMouseDown) return;
      this.checkSlice(e.clientX, e.clientY);
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    });

    // Touch support for mobile/tablets
    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.active) return;
      const touch = e.touches[0];
      if (touch) {
        this.checkSlice(touch.clientX, touch.clientY);
      }
    });
  }

  start(files) {
    this.active = true;
    this.flyingItems = [];
    this.slicedCount = 0;
    this.lives = 3;
    this.score = 0;
    this.availableFiles = [...files];

    this.spawnLoop();
    this.renderLoop();
  }

  stop() {
    this.active = false;
    clearTimeout(this.spawnTimer);
    cancelAnimationFrame(this.animId);
    this.flyingItems = [];
  }

  spawnLoop() {
    if (!this.active) return;

    if (this.availableFiles.length > 0) {
      const file = this.availableFiles.shift();
      const x = Math.random() * (this.canvas.width - 200) + 100;
      const vx = (Math.random() - 0.5) * 4;
      const vy = -(Math.random() * 5 + 13); // upward impulse

      this.flyingItems.push({
        file,
        x,
        y: this.canvas.height + 40,
        vx,
        vy,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 0.1,
        radius: 40,
        sliced: false,
        half1: null,
        half2: null
      });
    }

    const nextSpawnDelay = Math.random() * 800 + 800;
    this.spawnTimer = setTimeout(() => this.spawnLoop(), nextSpawnDelay);
  }

  checkSlice(x, y) {
    if (!this.active) return;

    for (let i = 0; i < this.flyingItems.length; i++) {
      const item = this.flyingItems[i];
      if (item.sliced) continue;

      const dist = Math.hypot(item.x - x, item.y - y);
      if (dist < item.radius + 15) {
        this.sliceItem(item, x, y);
      }
    }
  }

  sliceItem(item, hitX, hitY) {
    item.sliced = true;
    this.slicedCount++;
    this.score += 150;

    sound.playSlice();
    this.particles.createBurst(hitX, hitY, item.file.targetCategory.color, 40);
    this.particles.createFloatingText(hitX, hitY - 20, `SLICED! +150`, item.file.targetCategory.color, 20);

    // Execute real background chore
    this.fs.executeChore(item.file, item.file.targetCategory);
    this.progression.addXp(30);

    if (this.slicedCount >= 10) {
      this.progression.unlock('ninja_master');
    }

    // Split into 2 physical halves flying apart
    item.half1 = { x: item.x - 10, y: item.y, vx: item.vx - 3, vy: item.vy - 2, rot: 0 };
    item.half2 = { x: item.x + 10, y: item.y, vx: item.vx + 3, vy: item.vy - 1, rot: 0 };
  }

  renderLoop() {
    if (!this.active) return;

    // Physics update
    for (let i = this.flyingItems.length - 1; i >= 0; i--) {
      const item = this.flyingItems[i];
      item.x += item.vx;
      item.y += item.vy;
      item.vy += 0.35; // Gravity
      item.rotation += item.vRot;

      if (item.sliced && item.half1 && item.half2) {
        item.half1.x += item.half1.vx;
        item.half1.y += item.half1.vy;
        item.half1.vy += 0.4;
        item.half2.x += item.half2.vx;
        item.half2.y += item.half2.vy;
        item.half2.vy += 0.4;
      }

      // Check if dropped off bottom screen without slice
      if (item.y > this.canvas.height + 80 && !item.sliced) {
        this.flyingItems.splice(i, 1);
        this.lives--;
        sound.playError();
        this.particles.triggerScreenShake(5);

        if (this.lives <= 0) {
          this.endGame();
          return;
        }
      } else if (item.y > this.canvas.height + 150) {
        this.flyingItems.splice(i, 1);
      }
    }

    // Draw HUD & Items on top of canvas
    this.drawHUD();
    this.drawItems();

    this.animId = requestAnimationFrame(() => this.renderLoop());
  }

  drawHUD() {
    this.ctx.save();
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.font = "bold 14px 'Press Start 2P', monospace";
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = 8;
    this.ctx.fillText(`⚔️ SLASHER MODE`, 30, 40);
    this.ctx.fillText(`SCORE: ${this.score}`, 30, 70);
    this.ctx.fillText(`LIVES: ${'❤️ '.repeat(Math.max(0, this.lives))}`, 30, 100);
    this.ctx.restore();
  }

  drawItems() {
    for (const item of this.flyingItems) {
      this.ctx.save();
      this.ctx.translate(item.x, item.y);
      this.ctx.rotate(item.rotation);

      if (!item.sliced) {
        // Glowing file bubble
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        this.ctx.strokeStyle = item.file.targetCategory.color;
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = item.file.targetCategory.color;
        this.ctx.shadowBlur = 15;
        this.ctx.fill();
        this.ctx.stroke();

        // Icon
        this.ctx.font = '28px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(item.file.targetCategory.icon, 0, 0);

        // Name tag
        this.ctx.font = '10px Inter, sans-serif';
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillText(item.file.name.slice(0, 16), 0, item.radius + 16);
      } else if (item.half1 && item.half2) {
        // Halves
        this.ctx.font = '20px sans-serif';
        this.ctx.fillText('⚡', item.half1.vx * 3, item.half1.vy * 3);
        this.ctx.fillText('⚡', item.half2.vx * 3, item.half2.vy * 3);
      }

      this.ctx.restore();
    }
  }

  endGame() {
    this.stop();
    sound.playVictory();
    alert(`⚔️ SLASHER MODE OVER!\nYou sliced ${this.slicedCount} clutter files and earned ${this.score} pts!`);
    const defaultModeBtn = document.getElementById('tab-classic');
    if (defaultModeBtn) defaultModeBtn.click();
  }
}
