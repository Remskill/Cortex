import { z } from 'zod';
import { sql } from '../db.js';

export const statsSchema = z.object({});

export type StatsInput = z.infer<typeof statsSchema>;

export async function statsTool(_input: StatsInput) {
  console.error('[cortex_stats] Fetching database statistics...');

  try {
    // Get total chunks
    const [{ count: totalChunks }] = await sql`
      SELECT COUNT(*)::int as count FROM cortex_file_chunks
    `;

    // Get total unique files
    const [{ count: totalFiles }] = await sql`
      SELECT COUNT(DISTINCT file_path)::int as count FROM cortex_file_chunks
    `;

    // Get total tokens
    const [{ sum: totalTokens }] = await sql`
      SELECT COALESCE(SUM(token_count), 0)::int as sum FROM cortex_file_chunks
    `;

    // Get last sync time
    const lastSyncResult = await sql`
      SELECT MAX(updated_at) as last_sync FROM cortex_file_chunks
    `;
    const lastSync = lastSyncResult[0]?.last_sync;

    // Get database size (approximate)
    const [{ size: dbSize }] = await sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;

    const stats = `**Cortex Database Statistics**

**Chunks:** ${totalChunks.toLocaleString()}
**Files:** ${totalFiles.toLocaleString()}
**Tokens:** ${totalTokens.toLocaleString()}
**Database Size:** ${dbSize}
**Last Sync:** ${lastSync ? new Date(lastSync).toLocaleString() : 'Never'}

${totalChunks === 0 ? '\n⚠️ Database is empty. Run `cortex_sync` to populate it.' : ''}`;

    console.error(`[cortex_stats] Total chunks: ${totalChunks}, Total files: ${totalFiles}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: stats,
        },
      ],
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[cortex_stats] Error: ${errorMsg}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ Failed to fetch stats: ${errorMsg}`,
        },
      ],
    };
  }
}
