/**
 * File Sync - Simple, single-process file syncing
 *
 * Process:
 * 1. Read file
 * 2. Chunk it
 * 3. Get embeddings from Ollama
 * 4. Insert to database
 * 5. Next file
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { sql } from './db'
import { chunkDocument, hashFile } from './document-chunker'
import type { SyncResult, FileType } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '../..')

const EMBEDDING_HOST = process.env.OLLAMA_URL || 'http://localhost:11434'
const EMBEDDING_MODEL = process.env.EMBEDDINGS_MODEL || 'nomic-embed-text'

/**
 * Get embedding from Ollama for a single text
 */
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${EMBEDDING_HOST}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
  })

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`)
  }

  const data = await response.json()
  return data.embedding
}

/**
 * Sync a single file to the database
 */
export async function syncFile(filePath: string, force: boolean = false): Promise<{ chunks: number; skipped: boolean }> {
  const fullPath = path.resolve(PROJECT_ROOT, filePath)
  const fileType = getFileType(filePath)

  // Read file
  const content = await fs.readFile(fullPath, 'utf-8')
  const fileHash = hashFile(content)

  // Check if unchanged
  const existing = await sql`
    SELECT file_hash FROM cortex_file_chunks
    WHERE file_path = ${filePath}
    LIMIT 1
  `

  if (!force && existing.length > 0 && existing[0].file_hash === fileHash) {
    return { chunks: 0, skipped: true }
  }

  // Delete old chunks
  await sql`DELETE FROM cortex_file_chunks WHERE file_path = ${filePath}`

  // Chunk the file
  const chunks = await chunkDocument(filePath, content, fileType)
  let created = 0

  // Process each chunk
  for (const chunk of chunks) {
    if (chunk.content.length > 4000) continue // Skip oversized

    const embedding = await getEmbedding(chunk.content)
    const vectorStr = '[' + embedding.join(',') + ']'

    await sql`
      INSERT INTO cortex_file_chunks (
        file_path, file_hash, file_type, chunk_index, chunk_hash,
        content, token_count, embedding, section, language
      ) VALUES (
        ${filePath}, ${fileHash}, ${fileType}, ${chunk.index}, ${chunk.hash},
        ${chunk.content}, ${chunk.tokenCount}, ${vectorStr}::vector,
        ${chunk.section || null}, ${getLanguage(fileType)}
      )
    `
    created++
  }

  return { chunks: created, skipped: false }
}

/**
 * Sync multiple files (called from sync.ts)
 */
export async function syncFiles(filePaths: string[], force: boolean = false): Promise<SyncResult> {
  const result: SyncResult = {
    filesProcessed: 0,
    chunksCreated: 0,
    chunksUpdated: 0,
    chunksSkipped: 0,
    files: [],
    errors: [],
  }

  for (const filePath of filePaths) {
    try {
      const fileResult = await syncFile(filePath, force)

      if (fileResult.skipped) {
        result.chunksSkipped++
      } else {
        result.filesProcessed++
        result.chunksCreated += fileResult.chunks
        result.files.push(filePath)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      result.errors.push(`${filePath}: ${message}`)
    }
  }

  return result
}

function getFileType(filePath: string): FileType {
  const ext = path.extname(filePath).slice(1)
  if (ext === 'md') return 'md'
  if (ext === 'ts') return 'ts'
  if (ext === 'tsx') return 'tsx'
  if (ext === 'json') return 'json'
  return 'md'
}

function getLanguage(fileType: FileType): string | null {
  if (fileType === 'ts' || fileType === 'tsx') return 'typescript'
  if (fileType === 'json') return 'json'
  return null
}
