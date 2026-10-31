/**
 * Chaos Sorter - Real File System Access Engine & Sandbox Simulator
 */

import { CATEGORIES, getRecommendedCategory } from './categories.js';

// Pre-packaged realistic clutter files for Simulator / Demo Mode
const SIMULATOR_CLUTTER = [
  { name: 'Q3_Financial_Audit_2026_FINAL_v2.pdf', size: 4520000 },
  { name: 'Screen Shot 2026-10-14 at 11.23.41 AM.png', size: 1850000 },
  { name: 'setup_discord_canary_x64.exe', size: 89400000 },
  { name: 'project_backup_dont_delete_oct.zip', size: 142000000 },
  { name: 'quick_experiment_test.py', size: 14200 },
  { name: 'receipt_uber_eats_oct_28.pdf', size: 312000 },
  { name: 'vacation_mountain_lake_4k.jpg', size: 8200000 },
  { name: 'meeting_notes_raw_scratchpad.txt', size: 4800 },
  { name: 'docker_compose_override_dev.yaml', size: 3200 },
  { name: 'archive_client_assets_2025.tar.gz', size: 230000000 },
  { name: 'zoom_standup_recording_720p.mp4', size: 94000000 },
  { name: 'index.bundle.legacy.js', size: 420000 },
  { name: 'contract_freelance_signed_scan.pdf', size: 3100000 },
  { name: 'cat_meme_reaction_gif_anim.gif', size: 4800000 },
  { name: 'system_cache_dump.tmp', size: 84000 },
  { name: 'Resume_Software_Engineer_2026.docx', size: 198000 },
  { name: 'slack_avatar_cropped.webp', size: 230000 },
  { name: 'tailwind_components_v4_draft.tsx', size: 18900 },
  { name: 'installer_node_v22.msi', size: 42000000 },
  { name: 'tax_return_w2_scanned.pdf', size: 2400000 },
  { name: 'chill_beats_lofi_mix.mp3', size: 9800000 },
  { name: 'postgres_backup_oct29.sql', size: 24000000 },
  { name: 'crash_report_2026_10_30.log', size: 12000 },
  { name: 'presentation_pitch_deck_v5.pptx', size: 14500000 },
  { name: 'podcast_episode_42_raw.wav', size: 88000000 },
  { name: 'chrome_history_export.csv', size: 1240000 },
  { name: 'figma_icons_export_bundle.zip', size: 16400000 },
  { name: 'unconfirmed_download_part.crdownload', size: 6500000 }
];

export class FileSystemManager {
  constructor() {
    this.isRealFolder = false;
    this.directoryHandle = null;
    this.subfolderHandles = {};
    this.files = []; // Active queue of files to sort
    this.auditLog = []; // Action history for safety & undo
    this.totalBytesInitial = 0;
    this.bytesCleaned = 0;
  }

  isSupported() {
    return 'showDirectoryPicker' in window;
  }

  /**
   * Connect to real local folder using File System Access API
   */
  async pickRealDirectory() {
    if (!this.isSupported()) {
      throw new Error('Your browser does not support the File System Access API. Please use Google Chrome, Microsoft Edge, or Opera.');
    }

    try {
      this.directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads'
      });

      this.isRealFolder = true;
      await this.scanDirectory();
      return true;
    } catch (err) {
      if (err.name === 'AbortError') {
        return false; // User cancelled picker
      }
      throw err;
    }
  }

  /**
   * Initialize in Simulator / Demo Sandbox Mode (for instant demo on any device)
   */
  initSimulator() {
    this.isRealFolder = false;
    this.directoryHandle = null;
    this.subfolderHandles = {};
    this.auditLog = [];
    this.bytesCleaned = 0;

    // Clone simulated clutter files and generate IDs
    this.files = SIMULATOR_CLUTTER.map((item, index) => {
      const rec = getRecommendedCategory(item.name);
      return {
        id: `sim_${index}_${Date.now()}`,
        name: item.name,
        size: item.size,
        targetCategory: rec,
        fileHandle: null,
        isSimulated: true
      };
    });

    this.totalBytesInitial = this.files.reduce((acc, f) => acc + f.size, 0);
    return this.files;
  }

  /**
   * Scan the real directory for loose files in root (ignoring already organized folders)
   */
  async scanDirectory() {
    if (!this.directoryHandle) return [];

    this.files = [];
    this.auditLog = [];
    this.bytesCleaned = 0;

    const ignoredFolders = Object.values(CATEGORIES).map(c => c.folder.toLowerCase());

    for await (const entry of this.directoryHandle.values()) {
      if (entry.kind === 'file') {
        try {
          const fileObj = await entry.getFile();
          const rec = getRecommendedCategory(entry.name);
          this.files.push({
            id: `real_${Math.random().toString(36).substring(2, 9)}`,
            name: entry.name,
            size: fileObj.size,
            targetCategory: rec,
            fileHandle: entry,
            isSimulated: false
          });
        } catch (e) {
          console.warn('Skipping file due to access error:', entry.name, e);
        }
      }
    }

    this.totalBytesInitial = this.files.reduce((acc, f) => acc + f.size, 0);
    return this.files;
  }

  /**
   * Execute real-world file move in background
   */
  async executeChore(fileItem, chosenCategory) {
    const auditEntry = {
      id: fileItem.id,
      name: fileItem.name,
      size: fileItem.size,
      from: 'Root Directory',
      to: chosenCategory.folder,
      timestamp: new Date().toLocaleTimeString(),
      success: false,
      fileHandle: fileItem.fileHandle,
      isSimulated: fileItem.isSimulated,
      chosenCategory
    };

    if (fileItem.isSimulated || !this.isRealFolder) {
      // Simulator execution
      auditEntry.success = true;
      this.bytesCleaned += fileItem.size;
      this.auditLog.unshift(auditEntry);
      return auditEntry;
    }

    try {
      // 1. Get or create destination folder handle
      if (!this.subfolderHandles[chosenCategory.folder]) {
        this.subfolderHandles[chosenCategory.folder] = await this.directoryHandle.getDirectoryHandle(
          chosenCategory.folder,
          { create: true }
        );
      }
      const targetDir = this.subfolderHandles[chosenCategory.folder];

      // 2. Perform Move / Copy-then-Delete
      if ('move' in fileItem.fileHandle) {
        // Modern Chromium handle.move()
        await fileItem.fileHandle.move(targetDir);
      } else {
        // Fallback: Stream copy & delete original
        const srcFile = await fileItem.fileHandle.getFile();
        const destFileHandle = await targetDir.getFileHandle(fileItem.name, { create: true });
        const writable = await destFileHandle.createWritable();
        await writable.write(srcFile);
        await writable.close();
        await this.directoryHandle.removeEntry(fileItem.name);
      }

      auditEntry.success = true;
      this.bytesCleaned += fileItem.size;
    } catch (err) {
      console.error('File execution error:', err);
      auditEntry.error = err.message;
      auditEntry.success = false;
    }

    this.auditLog.unshift(auditEntry);
    return auditEntry;
  }

  /**
   * Undo last action (Move file back to root)
   */
  async undoLast() {
    const lastOp = this.auditLog.find(op => op.success && !op.undone);
    if (!lastOp) return null;

    if (lastOp.isSimulated) {
      lastOp.undone = true;
      this.bytesCleaned = Math.max(0, this.bytesCleaned - lastOp.size);
      return lastOp;
    }

    try {
      const sourceFolder = this.subfolderHandles[lastOp.to];
      if (sourceFolder) {
        const fileHandle = await sourceFolder.getFileHandle(lastOp.name);
        if ('move' in fileHandle) {
          await fileHandle.move(this.directoryHandle);
        } else {
          const srcFile = await fileHandle.getFile();
          const rootHandle = await this.directoryHandle.getFileHandle(lastOp.name, { create: true });
          const writable = await rootHandle.createWritable();
          await writable.write(srcFile);
          await writable.close();
          await sourceFolder.removeEntry(lastOp.name);
        }
      }
      lastOp.undone = true;
      this.bytesCleaned = Math.max(0, this.bytesCleaned - lastOp.size);
      return lastOp;
    } catch (err) {
      console.error('Undo error:', err);
      return null;
    }
  }

  /**
   * Export safety audit report as JSON
   */
  exportAuditReport() {
    const report = {
      title: 'Chaos Sorter - File Organization Manifest',
      generatedAt: new Date().toISOString(),
      mode: this.isRealFolder ? 'Real Directory' : 'Simulation Sandbox',
      totalCleanedBytes: this.bytesCleaned,
      operationsCount: this.auditLog.length,
      manifest: this.auditLog.map(op => ({
        filename: op.name,
        size: op.size,
        destination: op.to,
        status: op.undone ? 'Undone' : op.success ? 'Sorted' : 'Failed',
        timestamp: op.timestamp
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chaos_sorter_manifest_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const fsManager = new FileSystemManager();
