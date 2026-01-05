/**
 * Cortex - File Sync
 *
 * Single process, file-by-file sync with progress bar.
 *
 * Usage:
 *   npm run db:sync           # Sync all files
 *   npm run db:sync -- --force # Force re-embed all
 */

import { syncFile } from '../src/file-sync-embeddings'
import { testConnection } from '../src/db'
import { isEmbeddingServiceAvailable } from '../src/ollama-embedding-client'
import {
  loadConfig,
  loadIgnorePatterns,
  parseSize,
  collectFilesToSync,
} from '../src/constants'
import * as path from 'path'

function getWorkspaceRoot(): string {
  return process.env.WORKSPACE_ROOT || path.resolve(process.cwd(), '..')
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins < 60) {
    return `${mins}m ${secs}s`
  }
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins}m ${secs}s`
}

async function main() {
  const force = process.argv.includes('--force')

  console.log('🧠 Cortex - File Sync\n')

  // Check services
  console.log('Checking services...')
  if (!await testConnection()) {
    console.error('❌ Database not available. Run: docker-compose up -d')
    process.exit(1)
  }
  console.log('✓ Database connected')

  if (!await isEmbeddingServiceAvailable()) {
    console.error('❌ Ollama not available. Run: docker-compose up -d')
    process.exit(1)
  }
  console.log('✓ Ollama available\n')

  // Get files to sync
  const workspaceRoot = getWorkspaceRoot()
  console.log(`📁 Workspace: ${workspaceRoot}\n`)

  const config = await loadConfig(workspaceRoot)
  const maxFileSize = parseSize(config.maxFileSize)
  console.log(`⚙️  Max file size: ${config.maxFileSize}`)

  const ignorePatterns = await loadIgnorePatterns(workspaceRoot)
  console.log(`📋 Loaded ${ignorePatterns.length} ignore patterns\n`)

  console.log('🔍 Scanning files...')
  const { files, skipped } = await collectFilesToSync(workspaceRoot, ignorePatterns, maxFileSize)

  console.log(`\n📊 Found ${files.length} files to sync`)
  if (skipped.large > 0) {
    console.log(`   Skipped ${skipped.large} large files`)
  }

  if (files.length === 0) {
    console.log('\n✅ Nothing to sync')
    process.exit(0)
  }

  if (force) {
    console.log('\n⚡ Force mode: re-embedding all files')
  }

  console.log('\n🚀 Starting sync...\n')

  const startTime = Date.now()
  let processed = 0
  let skippedFiles = 0
  let errors = 0
  const failedFiles: { file: string; error: string }[] = []

  // Process file by file
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const progress = Math.round(((i + 1) / files.length) * 100)
    const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5))
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

    process.stdout.write(`\r[${bar}] ${progress}% (${i + 1}/${files.length}) ${timeStr}`)

    try {
      const result = await syncFile(file, force)

      if (result.skipped) {
        skippedFiles++
      } else {
        processed++
      }
    } catch (error) {
      errors++
      const errorMsg = error instanceof Error ? error.message : String(error)
      failedFiles.push({ file, error: errorMsg })
      // Continue to next file
    }
  }

  // Clear progress line
  process.stdout.write('\r' + ' '.repeat(60) + '\r')

  const durationSecs = (Date.now() - startTime) / 1000

  console.log('━'.repeat(50))
  console.log('\n✅  Sync Complete!\n')
  console.log(`⏱️   Duration: ${formatDuration(durationSecs)}`)
  console.log(`📄  Files synced: ${processed}`)
  if (skippedFiles > 0) {
    console.log(`⏭️   Unchanged: ${skippedFiles}`)
  }
  if (errors > 0) {
    console.log(`❌  Errors: ${errors}`)
    console.log('\n⚠️   Failed files:')
    for (const { file, error } of failedFiles) {
      console.log(`   - ${file}`)
      console.log(`     Error: ${error}`)
    }
  }
  console.log('')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
