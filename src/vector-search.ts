/**
 * AI Memory System - Vector Retriever
 * Semantic search using pgvector
 */

import { sql } from './db'
import { embeddingClient } from './ollama-embedding-client'
import type { RetrievalResult } from './types'

export async function queryVectorDatabase(
  query: string,
  topK: number = 10,
  fileTypeFilter?: string[]
): Promise<RetrievalResult[]> {
  try {
    // Generate embedding for query
    const [queryEmbedding] = await embeddingClient.instance.embed([query])

    // Build query
    let results

    if (fileTypeFilter && fileTypeFilter.length > 0) {
      results = await sql`
        SELECT
          file_path,
          content,
          section,
          chunk_index,
          file_type,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity
        FROM cortex_file_chunks
        WHERE file_type = ANY(${fileTypeFilter})
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${topK}
      `
    } else {
      results = await sql`
        SELECT
          file_path,
          content,
          section,
          chunk_index,
          file_type,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity
        FROM cortex_file_chunks
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${topK}
      `
    }

    return results.map(row => ({
      filePath: row.file_path as string,
      content: row.content as string,
      section: row.section as string | undefined,
      similarity: Number(row.similarity),
      chunkIndex: Number(row.chunk_index),
      fileType: row.file_type as string,
    }))
  } catch (error) {
    console.error('Vector search failed:', error)
    return []
  }
}

export function formatContextForPrompt(results: RetrievalResult[]): string {
  if (results.length === 0) {
    return ''
  }

  const contextSections = results.map((result, i) => {
    const header = result.section
      ? `${result.filePath} - ${result.section}`
      : result.filePath

    return `### Context ${i + 1}: ${header} (similarity: ${(result.similarity * 100).toFixed(1)}%)

\`\`\`
${result.content}
\`\`\`
`
  }).join('\n')

  return `# Relevant Codebase Context

The following context has been retrieved from your codebase based on your query:

${contextSections}

Use this context to provide more accurate and project-specific responses.
`
}
