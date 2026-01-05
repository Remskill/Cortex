import { z } from 'zod';
import { sql } from '../db.js';

export const deleteSchema = z.object({
  files: z.array(z.string()).optional().describe('Specific files to delete (optional, deletes all if empty)'),
  confirm: z.boolean().optional().default(false).describe('Must be true to confirm deletion'),
});

export type DeleteInput = z.infer<typeof deleteSchema>;

export async function deleteTool(input: DeleteInput) {
  const { files, confirm } = input;

  if (!confirm) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `⚠️ Deletion requires confirmation.

**To delete ${files && files.length > 0 ? 'specific files' : 'ALL data'}:**

\`\`\`
cortex_delete({
  ${files && files.length > 0 ? `files: [${files.map(f => `"${f}"`).join(', ')}],` : ''}
  confirm: true
})
\`\`\`

${files && files.length > 0 ? `This will delete embeddings for ${files.length} file(s).` : `⚠️ **WARNING:** This will delete ALL chunks from the database!`}`,
        },
      ],
    };
  }

  console.error('[cortex_delete] Starting deletion...');

  try {
    if (files && files.length > 0) {
      // Delete specific files
      const workspaceRoot = process.env.WORKSPACE_ROOT || '';
      const filePaths = files.map(f => {
        // If file is relative, make it absolute
        if (workspaceRoot && !f.startsWith(workspaceRoot)) {
          return `${workspaceRoot}/${f}`.replace(/\/+/g, '/');
        }
        return f;
      });

      // Delete chunks for these files
      const result = await sql`
        DELETE FROM cortex_file_chunks
        WHERE file_path = ANY(${filePaths})
        RETURNING file_path
      `;

      const deletedFiles = [...new Set(result.map(r => r.file_path))];

      console.error(`[cortex_delete] Deleted ${result.length} chunks for ${deletedFiles.length} files`);

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Deleted embeddings for ${deletedFiles.length} file(s)

**Files removed:**
${deletedFiles.map(f => `- ${f}`).join('\n')}

**Chunks deleted:** ${result.length}

Run \`cortex_sync\` to re-embed these files if needed.`,
          },
        ],
      };
    } else {
      // Delete ALL data
      const [{ count: beforeCount }] = await sql`
        SELECT COUNT(*)::int as count FROM cortex_file_chunks
      `;

      await sql`DELETE FROM cortex_file_chunks`;

      // Reset metadata
      await sql`
        UPDATE cortex_metadata
        SET
          total_chunks = 0,
          total_files = 0,
          last_sync_at = NULL
      `;

      console.error(`[cortex_delete] Deleted all ${beforeCount} chunks`);

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ All data deleted from Cortex

**Chunks deleted:** ${beforeCount.toLocaleString()}
**Database:** Empty

Run \`cortex_sync\` to re-embed your codebase.`,
          },
        ],
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[cortex_delete] Error: ${errorMsg}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ Deletion failed: ${errorMsg}`,
        },
      ],
    };
  }
}
