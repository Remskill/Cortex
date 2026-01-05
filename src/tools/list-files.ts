import { z } from 'zod';
import { sql } from '../db.js';

export const listFilesSchema = z.object({
  limit: z.number().optional().default(50).describe('Maximum number of files to list (default: 50)'),
});

export type ListFilesInput = z.infer<typeof listFilesSchema>;

export async function listFilesTool(input: ListFilesInput) {
  const { limit } = input;

  console.error(`[cortex_list_files] Listing files (limit: ${limit})...`);

  try {
    const files = await sql`
      SELECT
        file_path,
        COUNT(*)::int as chunk_count,
        SUM(token_count)::int as total_tokens,
        MAX(updated_at) as last_updated
      FROM cortex_file_chunks
      GROUP BY file_path
      ORDER BY last_updated DESC
      LIMIT ${limit}
    `;

    if (files.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No files in database. Run `cortex_sync` first.',
          },
        ],
      };
    }

    const fileList = files
      .map((f, i) => {
        const fileName = f.file_path.split(/[\\/]/).pop() || f.file_path;
        // Extract relative path from workspace root
        const workspaceRoot = process.env.WORKSPACE_ROOT || '';
        const relativePath = workspaceRoot
          ? f.file_path.replace(workspaceRoot, '').replace(/^[\\/]/, '')
          : f.file_path;
        return `${i + 1}. **${fileName}**
   Path: \`${relativePath}\`
   Chunks: ${f.chunk_count}, Tokens: ${f.total_tokens.toLocaleString()}
   Updated: ${new Date(f.last_updated).toLocaleString()}`;
      })
      .join('\n\n');

    const summary = `**Embedded Files** (${files.length} of ${files.length})

${fileList}`;

    console.error(`[cortex_list_files] Found ${files.length} files`);

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
    console.error(`[cortex_list_files] Error: ${errorMsg}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ Failed to list files: ${errorMsg}`,
        },
      ],
    };
  }
}
