import { z } from 'zod';
import { sql } from '../db.js';
import { isEmbeddingServiceAvailable } from '../ollama-embedding-client.js';

export const initSchema = z.object({});

export type InitInput = z.infer<typeof initSchema>;

export async function initTool(_input: InitInput) {
  console.error('[cortex_init] Initializing Cortex...');

  try {
    // Test database connection
    await sql`SELECT 1`;
    console.error('[cortex_init] ✓ Database connected');

    // Check if tables exist
    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('cortex_file_chunks', 'cortex_metadata')
    `;

    if (tables.length < 2) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ Database not initialized. Run: \`npm run setup\` in the cortex/ directory.`,
          },
        ],
      };
    }

    console.error('[cortex_init] ✓ Database schema exists');

    // Check embedding service
    const embedAvailable = await isEmbeddingServiceAvailable();
    if (!embedAvailable) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `⚠️ Database OK, but embedding service (Ollama) is not available.

**Possible issues:**
- Ollama is still downloading the model (wait 5 minutes)
- Ollama service is not running
- Check: \`docker logs cortex-ollama\`

You can still query existing data, but cannot sync new files.`,
          },
        ],
      };
    }

    console.error('[cortex_init] ✓ Embedding service available');

    // Get current stats
    const [{ count: totalChunks }] = await sql`
      SELECT COUNT(*)::int as count FROM cortex_file_chunks
    `;

    const [{ count: totalFiles }] = await sql`
      SELECT COUNT(DISTINCT file_path)::int as count FROM cortex_file_chunks
    `;

    // Get last sync time if data exists
    let lastSync = null;
    if (totalChunks > 0) {
      const [syncMeta] = await sql`
        SELECT MAX(updated_at) as last_sync FROM cortex_file_chunks
      `;
      lastSync = syncMeta?.last_sync;
    }

    let status: string;

    if (totalChunks === 0) {
      // Interactive setup wizard for empty database
      status = `✅ Cortex is ready, but database is empty!

**System Status:**
- Database: Connected ✓
- Schema: Initialized ✓
- Embedding Service: Available ✓
- Workspace: ${process.env.WORKSPACE_ROOT || 'Not set'}

**📋 Next Steps - Choose your approach:**

**Option 1: Full Sync (Recommended for first time)**
Run this command to sync all default files:
\`\`\`bash
cd cortex
npm run init-sync:run
\`\`\`
- Syncs: CLAUDE.md, .agent/**/*.md, docs/**/*.md, src/**/*.ts
- Speed: ~5 files/second
- Time estimate: ~30 seconds per 100 files

**Option 2: Sync Specific Folders (via MCP)**
Use cortex_sync with custom patterns:
\`\`\`
cortex_sync({ patterns: ["docs/**/*.md", "src/lib/**/*.ts"] })
\`\`\`

**Option 3: Sync Specific Files**
\`\`\`
cortex_sync({ files: ["README.md", "CLAUDE.md"] })
\`\`\`

**💡 Tips:**
- For 1000+ files, use Option 1 (manual script is faster)
- For selective syncing, use Option 2 or 3
- Initial sync only needed once, updates are incremental`;
    } else {
      // Status for populated database
      const timeSinceSync = lastSync
        ? (() => {
            const now = new Date();
            const then = new Date(lastSync);
            const diffMs = now.getTime() - then.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);
            if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            return 'less than an hour ago';
          })()
        : 'unknown';

      status = `✅ Cortex is fully operational!

**System Status:**
- Database: Connected ✓
- Schema: Initialized ✓
- Embedding Service: Available ✓
- Workspace: ${process.env.WORKSPACE_ROOT || 'Not set'}

**📊 Current Data:**
- Total chunks: ${totalChunks.toLocaleString()}
- Total files: ${totalFiles.toLocaleString()}
- Last sync: ${timeSinceSync}

**🚀 Ready to use:**
- \`cortex_query("your search")\` - Semantic search
- \`cortex_sync()\` - Update changed files
- \`cortex_stats()\` - Detailed statistics
- \`cortex_list_files()\` - Show all embedded files

**💡 Tips:**
- Use cortex_query before implementing features to find existing code
- Run cortex_sync after making significant changes
- Sync is incremental - unchanged files are automatically skipped`;
    }

    console.error('[cortex_init] Cortex is ready');

    return {
      content: [
        {
          type: 'text' as const,
          text: status,
        },
      ],
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[cortex_init] Error: ${errorMsg}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ Cortex initialization check failed: ${errorMsg}

**Troubleshooting:**
1. Check Docker services: \`docker ps\`
2. Check logs: \`docker logs cortex-postgres\`
3. Run setup: \`cd cortex && npm run setup\``,
        },
      ],
    };
  }
}
