/**
 * AI Memory System - Type Definitions
 */

export interface Chunk {
  content: string
  index: number
  section?: string
  tokenCount: number
  hash: string
}

export interface DocumentChunk {
  id: string
  filePath: string
  fileHash: string
  fileType: string
  chunkIndex: number
  chunkHash: string
  content: string
  tokenCount: number
  embedding: number[]
  section?: string
  language?: string
  createdAt: Date
  updatedAt: Date
}

export interface RetrievalResult {
  filePath: string
  content: string
  section?: string
  similarity: number
  chunkIndex: number
  fileType: string
}

export interface EmbeddingClient {
  embed(texts: string[]): Promise<number[][]>
  health(): Promise<boolean>
}

export interface SyncResult {
  filesProcessed: number
  chunksCreated: number
  chunksUpdated: number
  chunksSkipped: number
  files: string[]
  errors: string[]
}

export type FileType = 'md' | 'ts' | 'tsx' | 'json'

export interface FileMetadata {
  path: string
  type: FileType
  hash: string
  size: number
}
