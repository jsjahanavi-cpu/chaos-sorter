/**
 * Chaos Sorter - Category Mapping & Rules Engine
 */

export const CATEGORIES = {
  DOCUMENTS: {
    id: 'DOCUMENTS',
    name: 'Documents',
    folder: 'Organized_Documents',
    color: '#38bdf8', // Neon Sky Blue
    accent: 'border-sky-500/50 bg-sky-950/40 text-sky-300',
    icon: '📄',
    key: '1',
    arrow: 'ArrowLeft',
    label: '[1] or [←] Left',
    extensions: [
      'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages',
      'xls', 'xlsx', 'csv', 'tsv', 'numbers',
      'ppt', 'pptx', 'key', 'odp',
      'md', 'epub', 'mobi', 'tex'
    ]
  },
  MEDIA: {
    id: 'MEDIA',
    name: 'Media & Images',
    folder: 'Organized_Media',
    color: '#f43f5e', // Neon Rose / Red
    accent: 'border-rose-500/50 bg-rose-950/40 text-rose-300',
    icon: '🎬',
    key: '2',
    arrow: 'ArrowUp',
    label: '[2] or [↑] Up',
    extensions: [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic', 'tiff',
      'mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'm4v',
      'mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'
    ]
  },
  CODE: {
    id: 'CODE',
    name: 'Code & Dev',
    folder: 'Organized_Code',
    color: '#a855f7', // Neon Purple
    accent: 'border-purple-500/50 bg-purple-950/40 text-purple-300',
    icon: '⚡',
    key: '3',
    arrow: 'ArrowRight',
    label: '[3] or [→] Right',
    extensions: [
      'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml',
      'py', 'pyc', 'java', 'c', 'cpp', 'h', 'cs', 'go', 'rs', 'php', 'rb', 'swift',
      'sh', 'bash', 'zsh', 'bat', 'ps1', 'sql', 'graphql', 'wasm'
    ]
  },
  ARCHIVES: {
    id: 'ARCHIVES',
    name: 'Archives & Installers',
    folder: 'Organized_Archives',
    color: '#eab308', // Neon Amber / Gold
    accent: 'border-amber-500/50 bg-amber-950/40 text-amber-300',
    icon: '📦',
    key: '4',
    arrow: 'ArrowDown',
    label: '[4] or [↓] Down',
    extensions: [
      'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso',
      'dmg', 'pkg', 'exe', 'msi', 'apk', 'deb', 'rpm'
    ]
  },
  TRASH: {
    id: 'TRASH',
    name: 'Junk / Review Bin',
    folder: '_Review_Bin',
    color: '#64748b', // Slate Gray
    accent: 'border-slate-500/50 bg-slate-950/40 text-slate-300',
    icon: '🗑️',
    key: 'Space',
    arrow: 'Space',
    label: '[Space] Purge',
    extensions: [
      'tmp', 'temp', 'log', 'crdownload', 'part', 'dmp', 'cache',
      'ds_store', 'thumbs.db', 'bak', 'old'
    ]
  }
};

/**
 * Identify the recommended category for a file based on its name and extension
 */
export function getRecommendedCategory(filename) {
  if (!filename || typeof filename !== 'string') return CATEGORIES.DOCUMENTS;
  
  const cleanName = filename.toLowerCase().trim();
  
  // Specific system junk detection
  if (cleanName === '.ds_store' || cleanName === 'thumbs.db' || cleanName.endsWith('.tmp')) {
    return CATEGORIES.TRASH;
  }
  
  const ext = cleanName.split('.').pop();
  if (!ext || ext === cleanName) {
    return CATEGORIES.DOCUMENTS;
  }

  for (const catKey of Object.keys(CATEGORIES)) {
    const category = CATEGORIES[catKey];
    if (category.extensions.includes(ext)) {
      return category;
    }
  }

  // Fallback default
  return CATEGORIES.DOCUMENTS;
}

/**
 * Format bytes to readable human strings (e.g. 4.2 MB)
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
