import { z } from 'zod';
import { syncFiles } from '../file-sync-embeddings.js';
import {
  loadConfig,
  loadIgnorePatterns,
  parseSize,
  collectFilesToSync,
} from '../constants.js';
import path from 'path';

export const syncSchema = z.object({
  files: z.array(z.string()).optional().describe('Specific file paths to sync (optional). If not provided, syncs all files matching .cortexignore rules.'),
  force: z.boolean().optional().default(false).describe('Re-embed even if files are unchanged (default: false)'),
});

export type SyncInput = z.infer<typeof syncSchema>;

// Get workspace root from env or auto-detect from cwd
function getWorkspaceRoot(): string {
  if (process.env.WORKSPACE_ROOT) {
    return process.env.WORKSPACE_ROOT;
  }

  // Auto-detect: check if cwd is project root or cortex/ subdirectory
  const cwd = process.cwd();
  const cwdName = path.basename(cwd);

  // If we're inside cortex/ directory, go up one level
  if (cwdName === 'cortex') {
    return path.resolve(cwd, '..');
  }

  // Otherwise assume cwd IS the project root (MCP runs from project root)
  return cwd;
}

export async function syncTool(input: SyncInput) {
  const { files, force } = input;

  console.error('[cortex_sync] Starting sync...');

  const workspaceRoot = getWorkspaceRoot();
  console.error(`[cortex_sync] Workspace root: ${workspaceRoot}`);

  // Load configuration
  const config = await loadConfig(workspaceRoot);
  const maxFileSize = parseSize(config.maxFileSize);
  console.error(`[cortex_sync] Max file size: ${config.maxFileSize}`);

  // Load ignore patterns from .cortexignore
  const ignorePatterns = await loadIgnorePatterns(workspaceRoot);
  console.error(`[cortex_sync] Loaded ${ignorePatterns.length} ignore patterns from .cortexignore`);

  let filesToSync: string[] = [];

  if (files && files.length > 0) {
    // Priority: Sync specific files (resolve relative to workspace root)
    filesToSync = files.map(f => path.isAbsolute(f) ? f : path.join(workspaceRoot, f));
    console.error(`[cortex_sync] Syncing ${files.length} specific files`);
  } else {
    // Sync ALL files (Git-like: everything except ignores and large files)
    console.error('[cortex_sync] Syncing all files from workspace...');

    const result = await collectFilesToSync(workspaceRoot, ignorePatterns, maxFileSize);
    filesToSync = result.files;

    console.error(`[cortex_sync] Found ${filesToSync.length} files to sync`);
    if (result.skipped.large > 0) {
      console.error(`[cortex_sync] Skipped ${result.skipped.large} large files (>${config.maxFileSize})`);
    }
  }

  if (filesToSync.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No files found to sync.\n\n💡 Tip: Check .cortexignore patterns if this seems wrong.',
        },
      ],
    };
  }

  const startTime = Date.now();

  try {
    const result = await syncFiles(filesToSync, force);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    const summary = `✅ Sync completed in ${duration}s

**Files Processed:** ${result.filesProcessed}
**Chunks Created:** ${result.chunksCreated}
**Chunks Skipped:** ${result.chunksSkipped} (unchanged)

${result.filesProcessed > 0 ? '**Files:**\n' + result.files.map(f => `- ${f}`).join('\n') : ''}

💡 **Tips:**
- Edit \`.cortexignore\` to customize what gets synced
- Edit \`.cortexconfig.json\` to change max file size (default: 50MB)
- Use \`cortex_sync({ force: true })\` to re-embed all files`;

    console.error(`[cortex_sync] ${summary.replace(/\*\*/g, '')}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: summary,
        },
      ],
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[cortex_sync] Error: ${errorMsg}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ Sync failed: ${errorMsg}`,
        },
      ],
    };
  }
}
