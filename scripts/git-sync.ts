#!/usr/bin/env tsx

/**
 * Git Pre-Commit Hook - Sync changed files to Cortex
 *
 * This script:
 * 1. Gets staged files from git
 * 2. Filters out files matching .cortexignore patterns
 * 3. Syncs them to Cortex vector database using existing syncFiles()
 * 4. Exits with code 0 (success) or 1 (failure) to allow/block commit
 */

import * as path from 'path'
import { execSync } from 'child_process'
import * as fs from 'fs/promises'
import { syncFiles } from '../src/file-sync-embeddings.js'
import { loadIgnorePatterns } from '../src/constants.js'
import { testConnection } from '../src/db.js'
import { isEmbeddingServiceAvailable } from '../src/ollama-embedding-client.js'
import { minimatch } from 'minimatch'

async function main() {
  console.log('🧠 Cortex - Git Pre-Commit Hook\n')

  try {
    // Get workspace root (parent of cortex folder)
    const workspaceRoot = path.resolve(process.cwd(), '..')
    console.log(`📁 Workspace: ${workspaceRoot}\n`)

    // Quick health check (don't block on slow services)
    const dbOk = await testConnection()
    if (!dbOk) {
      console.warn('⚠️  Database not available - skipping sync')
      console.log('   Run: cd cortex && docker-compose up -d')
      console.log('   Proceeding with commit...\n')
      process.exit(0) // Don't block commit
    }

    const embedOk = await isEmbeddingServiceAvailable()
    if (!embedOk) {
      console.warn('⚠️  Embedding service not available - skipping sync')
      console.log('   Run: cd cortex && docker-compose up -d')
      console.log('   Proceeding with commit...\n')
      process.exit(0) // Don't block commit
    }

    // Get staged files from git
    const stagedFilesOutput = execSync('git diff --cached --name-only', {
      cwd: workspaceRoot,
      encoding: 'utf-8',
    }).trim()

    if (!stagedFilesOutput) {
      console.log('ℹ️  No staged files to sync')
      process.exit(0)
    }

    const stagedFiles = stagedFilesOutput.split('\n').filter(Boolean)
    console.log(`📊 Found ${stagedFiles.length} staged files\n`)

    // Load .cortexignore patterns
    const ignorePatterns = await loadIgnorePatterns(workspaceRoot)
    console.log(`📋 Loaded ${ignorePatterns.length} ignore patterns from .cortexignore\n`)

    // Filter out ignored files and deleted files
    const filesToSync: string[] = []

    for (const file of stagedFiles) {
      const relativePath = file

      // Check if file matches any ignore pattern
      let ignored = false
      for (const pattern of ignorePatterns) {
        if (minimatch(relativePath, pattern, { dot: true })) {
          console.log(`⏭️  Skipping (ignored by pattern "${pattern}"): ${relativePath}`)
          ignored = true
          break
        }
      }

      if (ignored) continue

      // Check if file exists (might be deleted in this commit)
      const absolutePath = path.join(workspaceRoot, relativePath)
      try {
        await fs.access(absolutePath)
        filesToSync.push(relativePath)
      } catch {
        console.log(`⏭️  Skipping (deleted): ${relativePath}`)
      }
    }

    if (filesToSync.length === 0) {
      console.log('\nℹ️  All staged files are ignored or deleted - nothing to sync')
      process.exit(0)
    }

    console.log(`\n🚀 Syncing ${filesToSync.length} files to Cortex...\n`)

    // Use the existing syncFiles function from file-sync-embeddings.ts
    const result = await syncFiles(filesToSync, false)

    console.log(`\n📊 Summary:`)
    console.log(`   Files processed: ${result.filesProcessed}`)
    console.log(`   Chunks created: ${result.chunksCreated}`)
    console.log(`   Chunks skipped: ${result.chunksSkipped}`)
    console.log(`   Errors: ${result.errors.length}`)

    if (result.errors.length > 0) {
      console.error('\n⚠️  Sync completed with errors:')
      result.errors.forEach(err => console.error(`   - ${err}`))
      console.log('\n⚠️  Proceeding with commit anyway (errors are non-fatal)\n')
      process.exit(0) // Don't block commit on sync errors
    }

    console.log('\n✅ Pre-commit sync complete. Proceeding with commit...\n')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Fatal error during sync:', error)
    console.log('⚠️  Proceeding with commit anyway (sync failure is non-fatal)\n')
    process.exit(0) // Don't block commit on fatal errors
  }
}

main()
