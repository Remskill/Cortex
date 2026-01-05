import { z } from 'zod';
import { queryVectorDatabase, formatContextForPrompt } from '../vector-search.js';

export const querySchema = z.object({
  query: z.string().describe('What to search for in the knowledge base'),
  topK: z.number().optional().default(10).describe('Number of results to return (default: 10)'),
});

export type QueryInput = z.infer<typeof querySchema>;

export async function queryTool(input: QueryInput) {
  const { query, topK } = input;

  console.error(`[cortex_query] Searching for: "${query}" (top ${topK})`);

  const results = await queryVectorDatabase(query, topK);

  if (results.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `No relevant context found for: "${query}"\n\nThe database might be empty. Run cortex_sync first.`,
        },
      ],
    };
  }

  const formattedContext = formatContextForPrompt(results);

  console.error(`[cortex_query] Found ${results.length} results`);

  return {
    content: [
      {
        type: 'text' as const,
        text: formattedContext,
      },
    ],
  };
}
