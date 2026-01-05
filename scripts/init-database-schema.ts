#!/usr/bin/env tsx
/**
 * AI Memory System - Setup Script
 * Initializes database and checks services
 */

import { testConnection, sql } from '../src/db'
import { isEmbeddingServiceAvailable } from '../src/ollama-embedding-client'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  console.log('🧠 AI Memory System - Setup\n')

  // Test database
  console.log('Testing database connection...')
  const dbOk = await testConnection()
  if (!dbOk) {
    console.error('❌ Database not available. Start with: docker-compose up -d postgres')
    process.exit(1)
  }
  console.log('✓ Database connected')

  // Run schema
  console.log('\nApplying schema...')
  const schemaPath = path.join(__dirname, '../database/schema.sql')
  const schema = await fs.readFile(schemaPath, 'utf-8')
  await sql.unsafe(schema)
  console.log('✓ Schema applied')

  // Test embedding service
  console.log('\nTesting embedding service...')
  const embedOk = await isEmbeddingServiceAvailable()
  if (!embedOk) {
    console.error('❌ Embedding service not available. Start with: docker-compose up -d embeddings')
    console.log('   Make sure model is downloaded: npm run download-model')
    process.exit(1)
  }
  console.log('✓ Embedding service available')

  console.log('\n✅ Setup complete!')
  console.log('\nNext steps:')
  console.log('  1. npm run db:sync     # Sync all files to database')
  console.log('  2. Use cortex_query() via Claude Code to test semantic search')

  process.exit(0)
}

main().catch(console.error)
