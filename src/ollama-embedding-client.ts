/**
 * AI Memory System - Embedding Client
 * Communicates with Ollama server running nomic-embed-text
 */

import type { EmbeddingClient } from './types'

export const EMBEDDING_DIMENSIONS = parseInt(process.env.EMBEDDINGS_DIMENSIONS || '768', 10)
export const MAX_CHUNK_TOKENS = 512
export const CHUNK_OVERLAP = 50

let _client: EmbeddingClient | null = null

function getEmbeddingClient(): EmbeddingClient {
  if (_client) return _client

  const host = process.env.OLLAMA_URL || 'http://localhost:11434'
  const model = process.env.EMBEDDINGS_MODEL || 'nomic-embed-text'

  _client = {
    async embed(texts: string[]): Promise<number[][]> {
      if (texts.length === 0) {
        return []
      }

      try {
        // Ollama processes one text at a time, so we batch manually
        const embeddings: number[][] = []

        for (const text of texts) {
          const response = await fetch(`${host}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              prompt: text,
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Embedding API error: ${response.status} - ${errorText}`)
          }

          const data = await response.json()

          if (!Array.isArray(data.embedding)) {
            throw new Error(`Invalid embedding response: expected array, got ${typeof data.embedding}`)
          }

          embeddings.push(data.embedding)
        }

        if (embeddings.length !== texts.length) {
          throw new Error(`Embedding count mismatch: expected ${texts.length}, got ${embeddings.length}`)
        }

        return embeddings
      } catch (error) {
        console.error('Failed to generate embeddings:', error)
        throw error
      }
    },

    async health(): Promise<boolean> {
      try {
        const response = await fetch(`${host}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        })
        return response.ok
      } catch {
        return false
      }
    },
  }

  return _client
}

export const embeddingClient = {
  get instance() {
    return getEmbeddingClient()
  },
}

export async function isEmbeddingServiceAvailable(): Promise<boolean> {
  try {
    return await embeddingClient.instance.health()
  } catch {
    return false
  }
}
