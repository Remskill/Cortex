/**
 * Cortex Configuration & Utilities
 *
 * Git-like sync approach:
 * - Sync EVERYTHING in workspace root
 * - EXCEPT patterns in .cortexignore
 * - EXCEPT files larger than maxFileSize
 *
 * No whitelists. No folder restrictions. No extension filters.
 * Simple, predictable, works for any language/framework.
 */

import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Configuration file name
 */
export const CONFIG_FILE = '.cortexconfig.json';

/**
 * Ignore file name
 */
export const IGNORE_FILE = '.cortexignore';

/**
 * Cortex configuration
 */
export interface CortexConfig {
  maxFileSize: number | string; // bytes (52428800) or string ("50MB")
}

/**
 * Default configuration (50MB in bytes)
 */
export const DEFAULT_CONFIG: CortexConfig = {
  maxFileSize: 52428800, // 50MB
};

/**
 * Parse size to bytes
 *
 * @param size - Size in bytes (number) or string (e.g., "50MB", "1GB", "500KB")
 * @returns Size in bytes
 */
export function parseSize(size: number | string): number {
  // If already a number, return as-is
  if (typeof size === 'number') {
    return size;
  }

  const match = size.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)?$/i);
  if (!match) {
    throw new Error(`Invalid size format: ${size}. Expected format: "50MB", "1GB", "500KB", or number in bytes`);
  }

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();

  const multipliers: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
  };

  return value * multipliers[unit];
}

/**
 * Format bytes to human-readable size
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "50.5MB")
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}

/**
 * Load configuration from .cortexconfig.json
 * If file doesn't exist, returns defaults
 *
 * @param workspaceRoot - Absolute path to workspace root
 * @returns Configuration object
 */
export async function loadConfig(workspaceRoot: string): Promise<CortexConfig> {
  const path = await import('path');
  const fs = await import('fs/promises');

  const configFile = path.join(workspaceRoot, CONFIG_FILE);

  try {
    const content = await fs.readFile(configFile, 'utf-8');
    const config = JSON.parse(content);
    return { ...DEFAULT_CONFIG, ...config };
  } catch {
    // File doesn't exist or invalid JSON, use defaults
    return DEFAULT_CONFIG;
  }
}

/**
 * Parse .cortexignore file
 *
 * Format (same as .gitignore):
 * - One pattern per line
 * - Lines starting with # are comments
 * - Empty lines are ignored
 * - Supports negation with ! prefix
 *
 * @param content - File content
 * @returns Array of ignore patterns
 */
export function parseIgnoreFile(content: string): string[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('!'));
}

/**
 * Load ignore patterns from .cortexignore
 * Auto-creates from .cortexignore.default if missing
 *
 * @param workspaceRoot - Absolute path to workspace root
 * @returns Array of ignore patterns
 */
export async function loadIgnorePatterns(workspaceRoot: string): Promise<string[]> {
  const path = await import('path');
  const fs = await import('fs/promises');

  const ignoreFile = path.join(workspaceRoot, IGNORE_FILE);
  const defaultFile = path.join(__dirname, '../docs/.cortexignore.default');

  // If doesn't exist, copy from default
  try {
    await fs.access(ignoreFile);
  } catch {
    console.log('📋 Creating .cortexignore with default patterns...');
    try {
      await fs.copyFile(defaultFile, ignoreFile);
      console.log('✅ Created .cortexignore in workspace root');
    } catch (error) {
      console.error('❌ Failed to create .cortexignore:', error);
      console.error('   Make sure cortex/docs/.cortexignore.default exists');
      // Return empty patterns if we can't create the file
      return [];
    }
  }

  const content = await fs.readFile(ignoreFile, 'utf-8');
  return parseIgnoreFile(content);
}

/**
 * Collect ALL files from workspace
 *
 * Git-like behavior:
 * - Syncs EVERYTHING recursively
 * - EXCEPT patterns in ignorePatterns (.cortexignore)
 * - EXCEPT files larger than maxFileSize
 *
 * No folder whitelists. No extension whitelists.
 *
 * @param workspaceRoot - Absolute path to workspace root
 * @param ignorePatterns - Glob patterns to ignore (from .cortexignore)
 * @param maxFileSize - Maximum file size in bytes
 * @returns Object with files to sync and skip counts
 */
export async function collectFilesToSync(
  workspaceRoot: string,
  ignorePatterns: string[],
  maxFileSize: number
): Promise<{ files: string[]; skipped: { large: number } }> {
  const { glob } = await import('glob');
  const path = await import('path');
  const fs = await import('fs/promises');

  console.log('🔍 Scanning workspace for files...');

  // Get ALL files (recursive, exclude ignores)
  const allFiles = await glob('**/*', {
    cwd: workspaceRoot,
    absolute: true,
    nodir: true,
    ignore: ignorePatterns,
    dot: false, // Skip hidden files by default (.git, .env auto-excluded via .cortexignore)
  });

  console.log(`📊 Found ${allFiles.length} files after applying .cortexignore patterns`);

  const validFiles: string[] = [];
  let skippedLarge = 0;

  for (const file of allFiles) {
    try {
      const stats = await fs.stat(file);

      // Skip files larger than maxFileSize
      if (stats.size > maxFileSize) {
        const relativePath = path.relative(workspaceRoot, file);
        console.warn(`⚠️  Skipping large file: ${relativePath} (${formatSize(stats.size)})`);
        skippedLarge++;
        continue;
      }

      validFiles.push(file);
    } catch (error) {
      // File might have been deleted or inaccessible, skip
      console.warn(`⚠️  Skipping inaccessible file: ${file}`);
      continue;
    }
  }

  return {
    files: validFiles,
    skipped: {
      large: skippedLarge,
    },
  };
}
