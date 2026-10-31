/**
 * Chaos Sorter - Master Application Orchestrator
 */

import { sound } from './audio.js';
import { CATEGORIES, formatBytes } from './categories.js';
import { ParticleEngine } from './particles.js';
import { fsManager } from './fileSystem.js';
import { GameEngine } from './game.js';

// Elements
const canvas = document.getElementById('particle-canvas');
const particles = new ParticleEngine(canvas);
const game = new GameEngine(fsManager, particles);

// DOM Elements
const statScore = document.getElementById('stat-score');
const statStreak = document.getElementById('stat-streak');
const statTimer = document.getElementById('stat-timer');
const statCleaned = document.getElementById('stat-cleaned');
const multiplierTag = document.getElementById('multiplier-tag');
const comboFill = document.getElementById('combo-fill');
const currentModeTag = document.getElementById('current-mode-tag');

const fileCard = document.getElementById('file-card-element');
const waitingPrompt = document.getElementById('waiting-prompt');
const cardIcon = document.getElementById('card-icon');
const cardName = document.getElementById('card-name');
const cardSize = document.getElementById('card-size');
const cardRecBadge = document.getElementById('card-rec-badge');
const filesProgress = document.getElementById('files-progress');
const footerStatusText = document.getElementById('footer-status-text');

// Modals
const modalStart = document.getElementById('modal-start');
const modalGameOver = document.getElementById('modal-gameover');
const modalAudit = document.getElementById('modal-audit');
const auditTableBody = document.getElementById('audit-table-body');

// Buttons
const btnStartReal = document.getElementById('btn-start-real');
const btnStartSim = document.getElementById('btn-start-sim');
const btnAudioToggle = document.getElementById('btn-audio-toggle');
const btnOpenAudit = document.getElementById('btn-open-audit');
const btnCloseAudit = document.getElementById('btn-close-audit');
const btnAuditDownload = document.getElementById('btn-audit-download');
const btnUndoLast = document.getElementById('btn-undo-last');
const btnChangeFolder = document.getElementById('btn-change-folder');
const btnPlayAgain = document.getElementById('btn-play-again');
const btnExportManifest = document.getElementById('btn-export-manifest');

// Portals
const portals = {
  DOCUMENTS: document.getElementById('portal-documents'),
  MEDIA: document.getElementById('portal-media'),
  CODE: document.getElementById('portal-code'),
  ARCHIVES: document.getElementById('portal-archives')
};

// Initialize Audio Button State
function updateAudioBtn() {
  btnAudioToggle.textContent = sound.isMuted ? '🔇 SFX OFF' : '🔊 SFX ON';
}
updateAudioBtn();

btnAudioToggle.addEventListener('click', () => {
  sound.toggleMute();
  updateAudioBtn();
});

// Update UI on Stats Change
game.onStatsUpdate = (stats) => {
  statScore.textContent = stats.score.toLocaleString();
  statStreak.textContent = stats.streak;
  statTimer.textContent = `${stats.timer}s`;
  statCleaned.textContent = stats.formattedBytesCleaned;
  comboFill.style.width = `${stats.comboMeter}%`;

  if (stats.multiplier > 1) {
    multiplierTag.style.display = 'inline-block';
    multiplierTag.textContent = `${stats.multiplier}X`;
  } else {
    multiplierTag.style.display = 'none';
  }

  filesProgress.textContent = `Cleaned: ${stats.sortedCount} / ${stats.totalInitialCount}`;
};

// Display New Clutter Card
game.onFileAdvance = (file, remaining) => {
  if (!file) return;

  waitingPrompt.style.display = 'none';
  fileCard.style.display = 'flex';

  cardName.textContent = file.name;
  cardSize.textContent = formatBytes(file.size);
  cardIcon.textContent = file.targetCategory.icon;
  cardRecBadge.textContent = `Target: ${file.targetCategory.name}`;
  cardRecBadge.style.borderColor = file.targetCategory.color;
  cardRecBadge.style.color = file.targetCategory.color;

  footerStatusText.textContent = `Chore Active: ${fsManager.isRealFolder ? 'Real Hard Drive Sync' : 'Simulator Mode'} (${remaining + 1} remaining)`;
};

// Handle Game State Transitions
game.onStateChange = (state) => {
  if (state === 'VICTORY' || state === 'GAMEOVER') {
    fileCard.style.display = 'none';
    modalGameOver.style.display = 'flex';

    const isVictory = state === 'VICTORY';
    document.getElementById('gameover-icon').textContent = isVictory ? '🏆' : '⏰';
    document.getElementById('gameover-title').textContent = isVictory ? 'CHORE COMPLETED!' : 'TIME RUN OUT!';
    document.getElementById('gameover-score').textContent = game.score.toLocaleString();
    document.getElementById('gameover-streak').textContent = `${game.maxStreak}x`;
    document.getElementById('gameover-files').textContent = game.sortedCount;
    document.getElementById('gameover-storage').textContent = formatBytes(fsManager.bytesCleaned);
  }
};

// Action Trigger
function triggerSort(categoryKey, coordinates = null) {
  const category = CATEGORIES[categoryKey];
  if (!category || game.state !== 'PLAYING') return;

  // Visual pulse on portal
  const portalEl = portals[categoryKey];
  if (portalEl) {
    portalEl.classList.add('active-target');
    setTimeout(() => portalEl.classList.remove('active-target'), 200);
  }

  game.sortFile(category, coordinates);
}

// Click on Portals
Object.entries(portals).forEach(([catKey, el]) => {
  el.addEventListener('click', (e) => {
    triggerSort(catKey, { x: e.clientX, y: e.clientY });
  });
});

// Click Quick Action Buttons on Card
document.querySelectorAll('[data-btn-cat]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const cat = btn.getAttribute('data-btn-cat');
    triggerSort(cat, { x: e.clientX, y: e.clientY });
  });
});

// Keyboard Controls (1-4, Arrow Keys, Space)
window.addEventListener('keydown', (e) => {
  if (game.state !== 'PLAYING') return;

  const key = e.key;

  if (key === '1' || key === 'ArrowLeft') {
    e.preventDefault();
    triggerSort('DOCUMENTS');
  } else if (key === '2' || key === 'ArrowUp') {
    e.preventDefault();
    triggerSort('MEDIA');
  } else if (key === '3' || key === 'ArrowRight') {
    e.preventDefault();
    triggerSort('CODE');
  } else if (key === '4' || key === 'ArrowDown') {
    e.preventDefault();
    triggerSort('ARCHIVES');
  } else if (key === ' ' || key === 'Spacebar') {
    e.preventDefault();
    triggerSort('TRASH');
  }
});

// Drag and Drop Logic for Center Card
let isDragging = false;
let startX = 0;
let startY = 0;

fileCard.addEventListener('mousedown', (e) => {
  if (e.target.tagName === 'BUTTON') return;
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  fileCard.style.transition = 'none';
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  fileCard.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.05}deg)`;
});

window.addEventListener('mouseup', (e) => {
  if (!isDragging) return;
  isDragging = false;
  fileCard.style.transition = 'transform 0.2s ease-out';

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  const threshold = 120;

  if (dx < -threshold) {
    triggerSort('DOCUMENTS', { x: e.clientX, y: e.clientY });
  } else if (dx > threshold) {
    triggerSort('CODE', { x: e.clientX, y: e.clientY });
  } else if (dy < -threshold) {
    triggerSort('MEDIA', { x: e.clientX, y: e.clientY });
  } else if (dy > threshold) {
    triggerSort('ARCHIVES', { x: e.clientX, y: e.clientY });
  }

  fileCard.style.transform = 'translate(0px, 0px) rotate(0deg)';
});

// Start Real Directory
btnStartReal.addEventListener('click', async () => {
  sound.init();
  try {
    const success = await fsManager.pickRealDirectory();
    if (success && fsManager.files.length > 0) {
      modalStart.style.display = 'none';
      currentModeTag.textContent = 'REAL FOLDER (LIVE)';
      currentModeTag.style.color = '#22c55e';
      game.start(fsManager.files);
    } else if (success && fsManager.files.length === 0) {
      alert('Selected folder has no loose clutter files in its root! Choose another folder or try the Simulator.');
    }
  } catch (err) {
    alert(`Could not open folder: ${err.message}`);
  }
});

// Start Simulator Vault (Instant 1-Click)
btnStartSim.addEventListener('click', () => {
  sound.init();
  const simFiles = fsManager.initSimulator();
  modalStart.style.display = 'none';
  currentModeTag.textContent = 'SIMULATOR VAULT';
  currentModeTag.style.color = '#38bdf8';
  game.start(simFiles);
});

// Undo Last Button
btnUndoLast.addEventListener('click', async () => {
  const undoneOp = await fsManager.undoLast();
  if (undoneOp) {
    sound.playSort();
    particles.createFloatingText(window.innerWidth / 2, window.innerHeight - 80, `Undone: ${undoneOp.name}`, '#f59e0b', 16);
    game.notifyStats();
    renderAuditTable();
  } else {
    alert('No more operations to undo!');
  }
});

// Audit Modal Logic
function renderAuditTable() {
  if (fsManager.auditLog.length === 0) {
    auditTableBody.innerHTML = '<div style="font-size: 12px; color: #64748b; text-align: center; padding: 24px;">No files sorted yet.</div>';
    return;
  }

  auditTableBody.innerHTML = fsManager.auditLog.map(op => `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding: 8px 0; font-size: 12px;">
      <div>
        <strong style="color: ${op.undone ? '#64748b' : '#f8fafc'}; text-decoration: ${op.undone ? 'line-through' : 'none'};">${op.name}</strong>
        <div style="color: #94a3b8; font-size: 11px;">→ ${op.to} (${formatBytes(op.size)})</div>
      </div>
      <div style="text-align: right;">
        <span style="color: ${op.undone ? '#f59e0b' : op.success ? '#22c55e' : '#ef4444'}; font-weight: bold;">
          ${op.undone ? 'UNDONE' : op.success ? 'SORTED' : 'FAILED'}
        </span>
        <div style="color: #64748b; font-size: 10px;">${op.timestamp}</div>
      </div>
    </div>
  `).join('');
}

btnOpenAudit.addEventListener('click', () => {
  renderAuditTable();
  modalAudit.style.display = 'flex';
});

btnCloseAudit.addEventListener('click', () => {
  modalAudit.style.display = 'none';
});

btnAuditDownload.addEventListener('click', () => {
  fsManager.exportAuditReport();
});

btnExportManifest.addEventListener('click', () => {
  fsManager.exportAuditReport();
});

btnPlayAgain.addEventListener('click', () => {
  modalGameOver.style.display = 'none';
  modalStart.style.display = 'flex';
});

btnChangeFolder.addEventListener('click', () => {
  game.stopTimers();
  modalGameOver.style.display = 'none';
  modalStart.style.display = 'flex';
});
