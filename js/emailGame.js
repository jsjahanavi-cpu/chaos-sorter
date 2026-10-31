/**
 * Chaos Sorter - "Inbox Purge" 5,000 Unread Emails Cleaner Engine
 * 100% Safe Client-Side Simulation: Zero tokens, Zero passwords, 100% Privacy.
 */

import { sound } from './audio.js';

const EMAIL_SENDERS = [
  { sender: 'WeeklyDeals MegaStore', category: 'PROMOTIONS', subject: '🔥 85% OFF FLASH SALE - Ends in 2 Hours!', batchSize: 240, icon: '🏷️' },
  { sender: 'LinkedIn Notifications', category: 'SOCIAL', subject: '👀 14 people viewed your profile this week', batchSize: 180, icon: '👥' },
  { sender: 'TechRadar Daily Digest', category: 'NEWSLETTER', subject: '⚡ AI Chip Revolution: What you need to know', batchSize: 150, icon: '📰' },
  { sender: 'Uber Trip Receipts', category: 'RECEIPTS', subject: 'Your Friday late-night ride receipt ($18.50)', batchSize: 30, icon: '🧾' },
  { sender: 'Spam Lottery International', category: 'PHISHING', subject: '🏆 URGENT: You won $1,000,000 claim now', batchSize: 320, icon: '⚠️' },
  { sender: 'Substack Weekly Reads', category: 'NEWSLETTER', subject: 'Sunday Morning Coffee & Deep Code Insights', batchSize: 120, icon: '☕' },
  { sender: 'Netflix What to Watch', category: 'PROMOTIONS', subject: 'Top 10 Movies trending in your area tonight', batchSize: 90, icon: '🍿' },
  { sender: 'GitHub Bot Alerts', category: 'DEV', subject: 'Bump axios from 0.21.1 to 1.7.2 in /repo', batchSize: 45, icon: '🤖' },
  { sender: 'CryptoMoon Alerts', category: 'PHISHING', subject: 'Free token airdrop snapshot ending soon', batchSize: 280, icon: '💎' }
];

export class EmailPurgeEngine {
  constructor(particles, progression) {
    this.particles = particles;
    this.progression = progression;

    this.active = false;
    this.initialUnread = 5000;
    this.unreadCount = 5000;
    this.purgedCount = 0;
    this.unsubscribedSenders = 0;
    this.currentEmail = null;

    // Callbacks
    this.onUpdate = null;
    this.onVictory = null;
  }

  start() {
    this.active = true;
    this.unreadCount = 5000;
    this.purgedCount = 0;
    this.unsubscribedSenders = 0;
    this.nextEmail();
    this.notify();
  }

  stop() {
    this.active = false;
  }

  nextEmail() {
    if (this.unreadCount <= 0) {
      this.unreadCount = 0;
      this.active = false;
      this.progression.unlock('inbox_zero');
      sound.playVictory();
      if (this.onVictory) this.onVictory();
      return;
    }

    const template = EMAIL_SENDERS[Math.floor(Math.random() * EMAIL_SENDERS.length)];
    this.currentEmail = {
      ...template,
      id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      receivedAt: 'Just now'
    };

    this.notify();
  }

  // Action: Unsubscribe & Nuke all emails from this sender
  unsubscribe(eventCoordinates = null) {
    if (!this.active || !this.currentEmail) return;

    const nuked = Math.min(this.unreadCount, this.currentEmail.batchSize);
    this.unreadCount -= nuked;
    this.purgedCount += nuked;
    this.unsubscribedSenders++;

    sound.playCombo(4);
    this.progression.addXp(60);

    const x = eventCoordinates ? eventCoordinates.x : window.innerWidth / 2;
    const y = eventCoordinates ? eventCoordinates.y : window.innerHeight / 2;

    this.particles.createBurst(x, y, '#ef4444', 45);
    this.particles.createFloatingText(x, y - 40, `UNSUBSCRIBED! -${nuked} EMAILS`, '#ef4444', 20);
    this.particles.triggerScreenShake(7);

    this.nextEmail();
  }

  // Action: Quick trash
  trash(eventCoordinates = null) {
    if (!this.active || !this.currentEmail) return;

    const count = Math.min(this.unreadCount, 60);
    this.unreadCount -= count;
    this.purgedCount += count;

    sound.playSort();
    this.progression.addXp(20);

    const x = eventCoordinates ? eventCoordinates.x : window.innerWidth / 2;
    const y = eventCoordinates ? eventCoordinates.y : window.innerHeight / 2;

    this.particles.createBurst(x, y, '#f59e0b', 25);
    this.particles.createFloatingText(x, y - 30, `TRASHED -${count}`, '#f59e0b', 18);

    this.nextEmail();
  }

  // Action: Archive
  archive(eventCoordinates = null) {
    if (!this.active || !this.currentEmail) return;

    const count = Math.min(this.unreadCount, 30);
    this.unreadCount -= count;
    this.purgedCount += count;

    sound.playSort();
    this.progression.addXp(15);

    const x = eventCoordinates ? eventCoordinates.x : window.innerWidth / 2;
    const y = eventCoordinates ? eventCoordinates.y : window.innerHeight / 2;

    this.particles.createBurst(x, y, '#38bdf8', 20);
    this.particles.createFloatingText(x, y - 30, `ARCHIVED -${count}`, '#38bdf8', 18);

    this.nextEmail();
  }

  // Action: Star & Keep
  star(eventCoordinates = null) {
    if (!this.active || !this.currentEmail) return;

    const count = Math.min(this.unreadCount, 10);
    this.unreadCount -= count;

    sound.playCombo(2);
    this.progression.addXp(25);

    const x = eventCoordinates ? eventCoordinates.x : window.innerWidth / 2;
    const y = eventCoordinates ? eventCoordinates.y : window.innerHeight / 2;

    this.particles.createBurst(x, y, '#eab308', 25);
    this.particles.createFloatingText(x, y - 30, `★ STARRED & KEPT`, '#eab308', 18);

    this.nextEmail();
  }

  notify() {
    if (this.onUpdate) {
      this.onUpdate({
        unreadCount: this.unreadCount,
        purgedCount: this.purgedCount,
        unsubscribedSenders: this.unsubscribedSenders,
        currentEmail: this.currentEmail,
        progressPercent: Math.min(100, Math.floor(((this.initialUnread - this.unreadCount) / this.initialUnread) * 100))
      });
    }
  }
}
