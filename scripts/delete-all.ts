#!/usr/bin/env tsx
/**
 * AI Memory System - Delete All Embeddings
 * Clears all data from the vector database
 *
 * Usage:
 *   npm run delete-all              # Shows preview, requires confirmation
 *   npm run delete-all -- --confirm # Actually deletes (DANGEROUS!)
 */

import { sql, testConnection } from '../src/db'
import * as readline from 'readline/promises'

async function main() {
  const confirmedViaFlag = process.argv.includes('--confirm')

  console.log('🧠 Cortex - Delete All Embeddings\n')

  // Test database
  console.log('Checking database connection...')
  const dbOk = await testConnection()
  if (!dbOk) {
    console.error('❌ Database not available. Start with: docker-compose up -d')
    process.exit(1)
  }
  console.log('✓ Database connected\n')

  // Get current stats
  const [stats] = await sql`
    SELECT
      COUNT(*)::int as total_chunks,
      COUNT(DISTINCT file_path)::int as total_files
    FROM cortex_file_chunks
  `

  console.log('📊 Current Database Status:')
  console.log(`   Files: ${stats.total_files.toLocaleString()}`)
  console.log(`   Chunks: ${stats.total_chunks.toLocaleString()}\n`)

  if (stats.total_chunks === 0) {
    console.log('✨ Database is already empty!')
    process.exit(0)
  }

  // Show preview of files that will be deleted
  const files = await sql`
    SELECT DISTINCT file_path
    FROM cortex_file_chunks
    ORDER BY file_path
    LIMIT 10
  `

  console.log('📄 Sample files that will be deleted:')
  files.forEach(f => console.log(`   - ${f.file_path}`))
  if (stats.total_files > 10) {
    console.log(`   ... and ${stats.total_files - 10} more files\n`)
  } else {
    console.log('')
  }

  console.log('⚠️  WARNING: This will DELETE ALL embeddings from Cortex!')
  console.log('   This action cannot be undone.')
  console.log('   You will need to run "npm run init-sync" to re-embed.\n')

  let confirmed = confirmedViaFlag

  if (!confirmed) {
    // Interactive confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const answer = await rl.question('Type "DELETE" to confirm deletion: ')
    rl.close()

    confirmed = answer.trim() === 'DELETE'
  }

  if (!confirmed) {
    console.log('\n❌ Deletion cancelled.')
    console.log('\nTo delete without prompts, use:')
    console.log('   npm run delete-all -- --confirm\n')
    process.exit(0)
  }

  console.log('\n🗑️  Deleting all embeddings...')

  const startTime = Date.now()

  try {
    // Delete all chunks
    await sql`DELETE FROM cortex_file_chunks`

    // Reset metadata
    await sql`
      UPDATE cortex_metadata
      SET
        total_chunks = 0,
        total_files = 0,
        last_sync_at = NULL
    `

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log(`\n✅ Deletion complete in ${duration}s\n`)
    console.log(`📦 Deleted: ${stats.total_chunks.toLocaleString()} chunks from ${stats.total_files.toLocaleString()} files`)
    console.log('🗄️  Database: Empty\n')
    console.log('Next steps:')
    console.log('  1. Run "npm run init-sync" to re-embed your codebase')
    console.log('  2. Or manually sync specific files via MCP\n')

    process.exit(0)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Deletion failed: ${message}`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
