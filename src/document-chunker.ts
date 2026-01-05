/**
 * Smart Document Chunking
 *
 * Splits documents into chunks optimized for semantic search and embeddings.
 * Different strategies for different file types to preserve context and meaning.
 *
 * Chunking Algorithms:
 * -------------------
 * 1. Markdown (.md files):
 *    - Splits by headings (#, ##, ###)
 *    - Preserves section context (heading names stored in metadata)
 *    - Keeps related content together
 *    - Example: Each markdown section becomes one or more chunks
 *
 * 2. TypeScript/Code (.ts, .tsx files):
 *    - Plain text chunking (AST parsing planned for future)
 *    - Fixed-size chunks with overlap
 *    - Useful for finding functions, classes, patterns
 *    - Future: Parse AST and chunk by function/class boundaries
 *
 * 3. Other files (JSON, config, etc.):
 *    - Plain text chunking
 *    - Fixed-size chunks with overlap
 *
 * Chunk Size Strategy:
 * -------------------
 * - Max chunk: 1024 characters (~256 tokens)
 * - Overlap: 100 characters (~25 tokens)
 * - Why overlap? Prevents context loss at chunk boundaries
 *
 * Token Estimation:
 * ----------------
 * - 1 token ≈ 4 characters (conservative estimate)
 * - Works well for English and most programming languages
 * - Actual token count may vary (measured during embedding)
 *
 * Deduplication:
 * -------------
 * - Each chunk gets SHA-256 hash
 * - Unchanged chunks are skipped during re-syncing
 * - Saves embedding API calls and database writes
 *
 * @see ../indexer.ts for how chunks are embedded and stored
 */

import crypto from 'crypto'
import type { Chunk, FileType } from './types'

/**
 * Maximum chunk size in characters (~256 tokens)
 * Conservative estimate: 1 token ≈ 4 characters
 * This ensures embeddings stay within model limits (512 tokens for nomic-embed-text)
 */
const MAX_CHUNK_SIZE = 256 * 4 // ~256 tokens (4 chars per token estimate)

/**
 * Overlap between chunks in characters (~25 tokens)
 * Prevents losing context at chunk boundaries
 * Example: If chunk ends mid-sentence, next chunk includes that context
 */
const OVERLAP_SIZE = 25 * 4    // ~25 tokens overlap

export async function chunkDocument(
  filePath: string,
  content: string,
  fileType: FileType
): Promise<Chunk[]> {
  if (fileType === 'md') {
    return chunkMarkdown(content)
  } else if (fileType === 'ts' || fileType === 'tsx') {
    return chunkTypeScript(content)
  } else {
    return chunkPlainText(content)
  }
}

function chunkMarkdown(content: string): Chunk[] {
  const chunks: Chunk[] = []
  const sections = content.split(/^(#{1,6}\s+.+)$/gm)

  let currentSection = ''
  let currentContent = ''
  let chunkIndex = 0

  for (const part of sections) {
    if (part.match(/^#{1,6}\s+/)) {
      currentSection = part.replace(/^#+\s+/, '').trim()
    } else {
      currentContent += part

      if (currentContent.length > MAX_CHUNK_SIZE) {
        chunks.push(createChunk(currentContent.trim(), chunkIndex++, currentSection))
        currentContent = currentContent.slice(-OVERLAP_SIZE)
      }
    }
  }

  if (currentContent.trim()) {
    chunks.push(createChunk(currentContent.trim(), chunkIndex, currentSection))
  }

  return chunks
}

function chunkTypeScript(content: string): Chunk[] {
  // Simple chunking for TypeScript - can be enhanced with AST parsing
  return chunkPlainText(content)
}

function chunkPlainText(content: string): Chunk[] {
  const chunks: Chunk[] = []
  let start = 0
  let chunkIndex = 0

  while (start < content.length) {
    const end = Math.min(start + MAX_CHUNK_SIZE, content.length)
    const chunk = content.slice(start, end)

    chunks.push(createChunk(chunk, chunkIndex++))

    // Move forward, but ensure we always make progress
    const nextStart = end - OVERLAP_SIZE
    if (nextStart <= start) {
      break // Reached end of content
    }
    start = nextStart
  }

  return chunks
}

function createChunk(content: string, index: number, section?: string): Chunk {
  return {
    content,
    index,
    section,
    tokenCount: Math.floor(content.length / 4),
    hash: crypto.createHash('sha256').update(content).digest('hex'),
  }
}

export function hashFile(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}
