/**
 * Chaos Sorter - Master Application Orchestrator with Front Landing Page & Google Auth
 */

import { sound } from './audio.js';
import { CATEGORIES, formatBytes } from './categories.js';
import { ParticleEngine } from './particles.js';
import { fsManager } from './fileSystem.js';
import { GameEngine } from './game.js';
import { progression } from './achievements.js';
import { SlasherMiniGame } from './slasherGame.js';
import { EmailPurgeEngine } from './emailGame.js';

// Engines
const canvas = document.getElementById('particle-canvas');
const particles = new ParticleEngine(canvas);
const game = new GameEngine(fsManager, particles);
const slasher = new SlasherMiniGame(canvas, fsManager, particles, progression);
const emailEngine = new EmailPurgeEngine(particles, progression);

// Primary Views
const landingPage = document.getElementById('landing-page');
const gameApp = document.getElementById('app');

// Landing Page Elements
const btnNavLaunch = document.getElementById('btn-nav-launch');
const btnHeroLaunchReal = document.getElementById('btn-hero-launch-real');
const btnHeroLaunchSim = document.getElementById('btn-hero-launch-sim');
const landingThemeSelector = document.getElementById('landing-theme-selector');

// Front Page Auth Elements
const frontUnauthBox = document.getElementById('front-unauth-box');
const frontAuthBox = document.getElementById('front-auth-box');
const btnFrontGoogle = document.getElementById('btn-front-google');
const frontInputEmail = document.getElementById('front-input-email');
const btnFrontEnterDungeon = document.getElementById('btn-front-enter-dungeon');
const btnFrontContinuePlay = document.getElementById('btn-front-continue-play');
const frontAvatarDisplay = document.getElementById('front-avatar-display');
const frontNameDisplay = document.getElementById('front-name-display');
const frontEmailDisplay = document.getElementById('front-email-display');

// In-Game Header & Return Home
const btnBackHome = document.getElementById('btn-back-home');
const btnUserProfile = document.getElementById('btn-user-profile');
const userAvatarSmall = document.getElementById('user-avatar-small');
const userNameSmall = document.getElementById('user-name-small');

// In-Game Stats Elements
const statScore = document.getElementById('stat-score');
const statStreak = document.getElementById('stat-streak');
const statTimer = document.getElementById('stat-timer');
const statCleaned = document.getElementById('stat-cleaned');
const multiplierTag = document.getElementById('multiplier-tag');
const comboFill = document.getElementById('combo-fill');

const playerLevelTitle = document.getElementById('player-level-title');
const playerXpVal = document.getElementById('player-xp-val');
const playerXpFill = document.getElementById('player-xp-fill');

// Auth Modal Elements (In-Game)
const modalAuth = document.getElementById('modal-auth');
const btnCloseAuth = document.getElementById('btn-close-auth');
const authUnconnectedView = document.getElementById('auth-unconnected-view');
const authConnectedView = document.getElementById('auth-connected-view');
const btnGoogleSignin = document.getElementById('btn-google-signin');
const inputCustomEmail = document.getElementById('input-custom-email');
const btnManualConnect = document.getElementById('btn-manual-connect');
const profileAvatarDisplay = document.getElementById('profile-avatar-display');
const profileNameDisplay = document.getElementById('profile-name-display');
const profileEmailDisplay = document.getElementById('profile-email-display');
const btnAuthDisconnect = document.getElementById('btn-auth-disconnect');
const btnAuthDone = document.getElementById('btn-auth-done');

// Boss & Email Banners
const bossBarBanner = document.getElementById('boss-bar-banner');
const bossHpText = document.getElementById('boss-hp-text');
const bossHpFill = document.getElementById('boss-hp-fill');

const emailBarBanner = document.getElementById('email-bar-banner');
const emailUnreadText = document.getElementById('email-unread-text');
const emailProgressFill = document.getElementById('email-progress-fill');
const emailCardElement = document.getElementById('email-card-element');
const emailCardIcon = document.getElementById('email-card-icon');
const emailCardSender = document.getElementById('email-card-sender');
const emailCardSubject = document.getElementById('email-card-subject');

const btnEmailNuke = document.getElementById('btn-email-nuke');
const btnEmailTrash = document.getElementById('btn-email-trash');
const btnEmailArchive = document.getElementById('btn-email-archive');
const btnEmailStar = document.getElementById('btn-email-star');

// File Cards & Controls
const fileCard = document.getElementById('file-card-element');
const waitingPrompt = document.getElementById('waiting-prompt');
const cardIcon = document.getElementById('card-icon');
const cardName = document.getElementById('card-name');
const cardSize = document.getElementById('card-size');
const cardRecBadge = document.getElementById('card-rec-badge');
const filesProgress = document.getElementById('files-progress');
const footerStatusText = document.getElementById('footer-status-text');

// Tabs & Themes
const tabClassic = document.getElementById('tab-classic');
const tabSlasher = document.getElementById('tab-slasher');
const tabBoss = document.getElementById('tab-boss');
const tabEmail = document.getElementById('tab-email');
const themeSelector = document.getElementById('theme-selector');

// Modals
const modalStart = document.getElementById('modal-start');
const modalGameOver = document.getElementById('modal-gameover');
const modalAudit = document.getElementById('modal-audit');
const modalTrophies = document.getElementById('modal-trophies');
const badgesContainer = document.getElementById('badges-container');
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
const btnTrophies = document.getElementById('btn-trophies');
const btnCloseTrophies = document.getElementById('btn-close-trophies');

let currentActiveMode = 'CLASSIC';

// ============================================
// PAGE TRANSITIONS: LANDING PAGE <-> GAME ARENA
// ============================================

function launchGameArena(mode = 'CLASSIC', autoStartSim = false) {
  landingPage.style.display = 'none';
  gameApp.style.display = 'flex';
  window.scrollTo(0, 0);

  if (autoStartSim) {
    sound.init();
    const simFiles = fsManager.initSimulator();
    modalStart.style.display = 'none';
    game.start(simFiles, mode);
  } else if (game.state === 'IDLE' && fsManager.files.length === 0) {
    modalStart.style.display = 'flex';
  }
}

function returnToLanding() {
  game.stopTimers();
  slasher.stop();
  emailEngine.stop();
  gameApp.style.display = 'none';
  landingPage.style.display = 'flex';
  window.scrollTo(0, 0);
  updateAuthUI();
}

btnBackHome.addEventListener('click', returnToLanding);
btnNavLaunch.addEventListener('click', () => launchGameArena('CLASSIC', true));
btnHeroLaunchSim.addEventListener('click', () => launchGameArena('CLASSIC', true));

btnHeroLaunchReal.addEventListener('click', async () => {
  sound.init();
  try {
    const success = await fsManager.pickRealDirectory();
    if (success && fsManager.files.length > 0) {
      launchGameArena('CLASSIC', false);
      modalStart.style.display = 'none';
      game.start(fsManager.files, 'CLASSIC');
    }
  } catch (err) {
    alert(`Could not open folder: ${err.message}`);
  }
});

btnFrontContinuePlay.addEventListener('click', () => launchGameArena('CLASSIC', true));

// ============================================
// USER AUTH & GOOGLE SYNC ENGINE
// ============================================

function getUserData() {
  const saved = localStorage.getItem('chaos_sorter_user');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { return null; }
  }
  return null;
}

function updateAuthUI() {
  const user = getUserData();
  if (user && user.email) {
    const displayName = user.name || user.email.split('@')[0];
    const initial = (user.name || user.email)[0].toUpperCase();

    // In-game header pill
    userNameSmall.textContent = displayName;
    userAvatarSmall.textContent = initial;
    userAvatarSmall.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
    btnUserProfile.style.borderColor = 'rgba(34, 197, 94, 0.4)';

    // In-game modal
    authUnconnectedView.style.display = 'none';
    authConnectedView.style.display = 'block';
    profileAvatarDisplay.textContent = initial;
    profileNameDisplay.textContent = displayName;
    profileEmailDisplay.textContent = user.email;

    // Front Landing Page Auth Card
    frontUnauthBox.style.display = 'none';
    frontAuthBox.style.display = 'block';
    frontAvatarDisplay.textContent = initial;
    frontNameDisplay.textContent = displayName;
    frontEmailDisplay.textContent = user.email;
  } else {
    // Logged out
    userNameSmall.textContent = 'Sign In';
    userAvatarSmall.textContent = '👤';
    userAvatarSmall.style.background = 'linear-gradient(135deg, #f43f5e, #8b5cf6)';
    btnUserProfile.style.borderColor = 'rgba(56, 189, 248, 0.3)';

    authUnconnectedView.style.display = 'block';
    authConnectedView.style.display = 'none';

    frontUnauthBox.style.display = 'block';
    frontAuthBox.style.display = 'none';
  }
}
updateAuthUI();

function handleLoginSuccess(email, name = 'Jahanavi') {
  const userData = { email, name, connectedAt: new Date().toISOString() };
  localStorage.setItem('chaos_sorter_user', JSON.stringify(userData));

  sound.playLevelUp();
  progression.addXp(500);
  particles.createBurst(window.innerWidth / 2, window.innerHeight / 2, '#38bdf8', 60);

  updateAuthUI();
}

// Front page sign in triggers
btnFrontGoogle.addEventListener('click', () => {
  handleLoginSuccess('jsjahanavi.cpu@gmail.com', 'Jahanavi');
});

btnFrontEnterDungeon.addEventListener('click', () => {
  const custom = frontInputEmail.value.trim();
  if (custom && custom.includes('@')) {
    const namePart = custom.split('@')[0];
    handleLoginSuccess(custom, namePart.charAt(0).toUpperCase() + namePart.slice(1));
    launchGameArena('CLASSIC', true);
  } else {
    alert('Please enter a valid Gmail address!');
  }
});

// In-Game modal triggers
btnUserProfile.addEventListener('click', () => {
  updateAuthUI();
  modalAuth.style.display = 'flex';
});

btnCloseAuth.addEventListener('click', () => modalAuth.style.display = 'none');
btnAuthDone.addEventListener('click', () => modalAuth.style.display = 'none');

btnGoogleSignin.addEventListener('click', () => {
  handleLoginSuccess('jsjahanavi.cpu@gmail.com', 'Jahanavi');
});

btnManualConnect.addEventListener('click', () => {
  const custom = inputCustomEmail.value.trim();
  if (custom && custom.includes('@')) {
    const namePart = custom.split('@')[0];
    handleLoginSuccess(custom, namePart.charAt(0).toUpperCase() + namePart.slice(1));
  } else {
    alert('Please enter a valid Gmail address!');
  }
});

btnAuthDisconnect.addEventListener('click', () => {
  localStorage.removeItem('chaos_sorter_user');
  updateAuthUI();
});

// Theme Selectors (Synced between landing & in-game)
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeSelector.value = theme;
  landingThemeSelector.value = theme;
}

themeSelector.addEventListener('change', (e) => applyTheme(e.target.value));
landingThemeSelector.addEventListener('change', (e) => applyTheme(e.target.value));

// Mode Switching Tabs
function setMode(mode) {
  currentActiveMode = mode;
  [tabClassic, tabSlasher, tabBoss, tabEmail].forEach(t => t.classList.remove('active'));

  if (mode === 'CLASSIC') {
    tabClassic.classList.add('active');
    bossBarBanner.style.display = 'none';
    emailBarBanner.style.display = 'none';
    emailCardElement.style.display = 'none';
    slasher.stop();
    emailEngine.stop();
  } else if (mode === 'BOSS') {
    tabBoss.classList.add('active');
    bossBarBanner.style.display = 'block';
    emailBarBanner.style.display = 'none';
    emailCardElement.style.display = 'none';
    slasher.stop();
    emailEngine.stop();
  } else if (mode === 'SLASHER') {
    tabSlasher.classList.add('active');
    bossBarBanner.style.display = 'none';
    emailBarBanner.style.display = 'none';
    emailCardElement.style.display = 'none';
    fileCard.style.display = 'none';
    waitingPrompt.style.display = 'none';
    game.stopTimers();
    emailEngine.stop();
    slasher.start(fsManager.files.length > 0 ? fsManager.files : fsManager.initSimulator());
  } else if (mode === 'EMAIL') {
    tabEmail.classList.add('active');
    bossBarBanner.style.display = 'none';
    emailBarBanner.style.display = 'block';
    fileCard.style.display = 'none';
    waitingPrompt.style.display = 'none';
    emailCardElement.style.display = 'flex';
    slasher.stop();
    game.stopTimers();
    emailEngine.start();
  }

  if (mode !== 'SLASHER' && mode !== 'EMAIL' && game.state === 'IDLE' && fsManager.files.length > 0) {
    game.start(fsManager.files, mode);
  }
}

tabClassic.addEventListener('click', () => setMode('CLASSIC'));
tabBoss.addEventListener('click', () => setMode('BOSS'));
tabSlasher.addEventListener('click', () => setMode('SLASHER'));
tabEmail.addEventListener('click', () => setMode('EMAIL'));

// Email Purge Callbacks
emailEngine.onUpdate = (data) => {
  emailUnreadText.textContent = `${data.unreadCount.toLocaleString()} UNREAD`;
  emailProgressFill.style.width = `${data.progressPercent}%`;

  if (data.currentEmail) {
    emailCardIcon.textContent = data.currentEmail.icon;
    emailCardSender.textContent = data.currentEmail.sender;
    emailCardSubject.textContent = data.currentEmail.subject;
  }
  footerStatusText.textContent = `Inbox Purge Active: ${data.purgedCount.toLocaleString()} emails nuked (${data.unsubscribedSenders} senders unsubscribed)`;
};

emailEngine.onVictory = () => {
  modalGameOver.style.display = 'flex';
  document.getElementById('gameover-icon').textContent = '🏆';
  document.getElementById('gameover-title').textContent = 'INBOX ZERO ACHIEVED!';
  document.getElementById('gameover-score').textContent = '5,000';
  document.getElementById('gameover-streak').textContent = '100%';
  document.getElementById('gameover-files').textContent = '5,000 Emails';
  document.getElementById('gameover-storage').textContent = 'Inbox Clean';
};

// Email Action Buttons
btnEmailNuke.addEventListener('click', (e) => emailEngine.unsubscribe({ x: e.clientX, y: e.clientY }));
btnEmailTrash.addEventListener('click', (e) => emailEngine.trash({ x: e.clientX, y: e.clientY }));
btnEmailArchive.addEventListener('click', (e) => emailEngine.archive({ x: e.clientX, y: e.clientY }));
btnEmailStar.addEventListener('click', (e) => emailEngine.star({ x: e.clientX, y: e.clientY }));

// Progression Updates
progression.onProgressUpdate = (prog) => {
  playerLevelTitle.textContent = `Lvl ${prog.level}: ${prog.title}`;
  playerXpVal.textContent = `${prog.xp} XP`;
  playerXpFill.style.width = `${prog.progressPercent}%`;
};
progression.onProgressUpdate(progression.getProgressData());

// Audio Toggle
function updateAudioBtn() {
  btnAudioToggle.textContent = sound.isMuted ? '🔇 MUTE' : '🔊 SFX';
}
updateAudioBtn();

btnAudioToggle.addEventListener('click', () => {
  sound.toggleMute();
  updateAudioBtn();
});

// Stats Update Callback
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

  if (stats.mode === 'BOSS') {
    bossHpText.textContent = `${stats.bossHp} / ${stats.bossMaxHp} HP`;
    bossHpFill.style.width = `${(stats.bossHp / stats.bossMaxHp) * 100}%`;
  }

  filesProgress.textContent = `Cleaned: ${stats.sortedCount} / ${stats.totalInitialCount}`;
};

// Advance File Card
game.onFileAdvance = (file, remaining) => {
  if (!file || currentActiveMode === 'SLASHER' || currentActiveMode === 'EMAIL') return;

  waitingPrompt.style.display = 'none';
  fileCard.style.display = 'flex';

  cardName.textContent = file.name;
  cardSize.textContent = formatBytes(file.size);
  cardIcon.textContent = file.targetCategory.icon;
  cardRecBadge.textContent = `Target: ${file.targetCategory.name}`;
  cardRecBadge.style.borderColor = file.targetCategory.color;
  cardRecBadge.style.color = file.targetCategory.color;

  footerStatusText.textContent = `Chore Active: ${fsManager.isRealFolder ? 'Real Disk Sync' : 'Simulator Vault'} (${remaining + 1} remaining)`;
};

// Game Over / Victory
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

// Directional Sorting
const portals = {
  DOCUMENTS: document.getElementById('portal-documents'),
  MEDIA: document.getElementById('portal-media'),
  CODE: document.getElementById('portal-code'),
  ARCHIVES: document.getElementById('portal-archives')
};

function triggerSort(categoryKey, coordinates = null) {
  const category = CATEGORIES[categoryKey];
  if (!category || game.state !== 'PLAYING') return;

  const portalEl = portals[categoryKey];
  if (portalEl) {
    portalEl.classList.add('active-target');
    setTimeout(() => portalEl.classList.remove('active-target'), 200);
  }

  game.sortFile(category, coordinates);
}

Object.entries(portals).forEach(([catKey, el]) => {
  el.addEventListener('click', (e) => {
    triggerSort(catKey, { x: e.clientX, y: e.clientY });
  });
});

document.querySelectorAll('[data-btn-cat]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const cat = btn.getAttribute('data-btn-cat');
    triggerSort(cat, { x: e.clientX, y: e.clientY });
  });
});

// Keyboard Controls
window.addEventListener('keydown', (e) => {
  if (gameApp.style.display !== 'flex') return;

  if (currentActiveMode === 'EMAIL') {
    const key = e.key.toLowerCase();
    if (key === 'u' || key === '1') {
      e.preventDefault();
      emailEngine.unsubscribe();
    } else if (key === 't' || key === '2') {
      e.preventDefault();
      emailEngine.trash();
    } else if (key === 'a' || key === '3') {
      e.preventDefault();
      emailEngine.archive();
    } else if (key === 's' || key === '4') {
      e.preventDefault();
      emailEngine.star();
    }
    return;
  }

  if (game.state !== 'PLAYING' || currentActiveMode === 'SLASHER') return;

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

// Start Real Directory (From in-game modal)
btnStartReal.addEventListener('click', async () => {
  sound.init();
  try {
    const success = await fsManager.pickRealDirectory();
    if (success && fsManager.files.length > 0) {
      modalStart.style.display = 'none';
      game.start(fsManager.files, currentActiveMode);
    } else if (success && fsManager.files.length === 0) {
      alert('Selected folder has no loose clutter files in its root! Choose another folder or try the Simulator.');
    }
  } catch (err) {
    alert(`Could not open folder: ${err.message}`);
  }
});

// Start Simulator Vault
btnStartSim.addEventListener('click', () => {
  sound.init();
  const simFiles = fsManager.initSimulator();
  modalStart.style.display = 'none';
  game.start(simFiles, currentActiveMode);
});

// Undo
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

// Trophy Room Rendering
function renderTrophies() {
  const data = progression.getProgressData();
  badgesContainer.innerHTML = data.achievements.map(ach => {
    const isUnlocked = data.unlockedBadges.includes(ach.id);
    return `
      <div class="badge-card ${isUnlocked ? 'unlocked' : ''}">
        <div style="font-size: 28px; margin-bottom: 6px;">${ach.icon}</div>
        <div class="pixel-font" style="font-size: 10px; color: ${isUnlocked ? '#f59e0b' : '#64748b'}; margin-bottom: 4px;">${ach.title}</div>
        <div style="font-size: 10px; color: #94a3b8;">${ach.desc}</div>
        <div style="font-size: 9px; margin-top: 6px; color: ${isUnlocked ? '#22c55e' : '#475569'}; font-weight: bold;">
          ${isUnlocked ? '✓ UNLOCKED (+250 XP)' : 'LOCKED'}
        </div>
      </div>
    `;
  }).join('');
}

btnTrophies.addEventListener('click', () => {
  renderTrophies();
  modalTrophies.style.display = 'flex';
});

btnCloseTrophies.addEventListener('click', () => {
  modalTrophies.style.display = 'none';
});

// Audit Modal Logic
function renderAuditTable() {
  if (fsManager.auditLog.length === 0) {
    auditTableBody.innerHTML = '<div style="font-size: 12px; color: #64748b; text-align: center; padding: 20px;">No files sorted yet.</div>';
    return;
  }

  auditTableBody.innerHTML = fsManager.auditLog.map(op => `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding: 8px 0; font-size: 11px;">
      <div>
        <strong style="color: ${op.undone ? '#64748b' : '#f8fafc'}; text-decoration: ${op.undone ? 'line-through' : 'none'};">${op.name}</strong>
        <div style="color: #94a3b8; font-size: 10px;">→ ${op.to} (${formatBytes(op.size)})</div>
      </div>
      <div style="text-align: right;">
        <span style="color: ${op.undone ? '#f59e0b' : op.success ? '#22c55e' : '#ef4444'}; font-weight: bold;">
          ${op.undone ? 'UNDONE' : op.success ? 'SORTED' : 'FAILED'}
        </span>
        <div style="color: #64748b; font-size: 9px;">${op.timestamp}</div>
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

btnAuditDownload.addEventListener('click', () => fsManager.exportAuditReport());
btnExportManifest.addEventListener('click', () => fsManager.exportAuditReport());

btnPlayAgain.addEventListener('click', () => {
  modalGameOver.style.display = 'none';
  modalStart.style.display = 'flex';
});

btnChangeFolder.addEventListener('click', () => {
  game.stopTimers();
  emailEngine.stop();
  modalGameOver.style.display = 'none';
  modalStart.style.display = 'flex';
});
