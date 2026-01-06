# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cortex** is a free, open-source AI memory system that provides semantic search over codebases via Model Context Protocol (MCP). It uses local PostgreSQL + pgvector for vector storage and Ollama for embeddings.

## Development Commands

```bash
# Setup & Database
npm run setup          # Create schema + sync all files (full setup)
npm run db:setup       # Create database schema only
npm run db:sync        # Re-sync all files to database
npm run db:wipe        # Delete all embeddings (destructive)

# Docker
npm run docker:up      # Start PostgreSQL + Ollama containers
npm run docker:down    # Stop containers (keeps data)
npm run docker:logs    # View container logs
docker-compose down -v # Stop and remove volumes (destructive!)

# Development
npm run mcp:server     # Start MCP server manually (Claude Code auto-starts via .mcp.json)
npm run hook:install   # Install git pre-commit hook for auto-sync
npx tsc --noEmit       # Type check without emitting
```

## Core Architecture

### Module System
- **ESM**: Uses ES modules (`"type": "module"` in package.json)
- **Imports**: `.js` extensions optional - tsx resolves both (codebase is inconsistent, some use `.js`)
- **Runtime**: Uses `tsx` for TypeScript execution without compilation

### MCP Server (src/server.ts)
- **Transport**: STDIO (NOT HTTP/SSE) - receives stdin, returns stdout
- **Tools**: 6 MCP tools: `cortex_init`, `cortex_query`, `cortex_sync`, `cortex_stats`, `cortex_list_files`, `cortex_delete`
- **Entry point**: Launched by Claude Code via `.mcp.json` configuration

### Database Layer (src/db.ts)
- **Package**: Uses `postgres` (NOT `pg`) for better performance
- **Connection**: Single global `sql` connection for all operations (max: 1)
- **Memory**: Single connection reduces memory (~50MB/connection saved)
- **Isolated connections**: `createConnection()`/`closeIsolatedConnection()` available but currently unused

### Embedding Pipeline
```
File → Chunking → Embedding → PostgreSQL/pgvector
```
1. **Chunking** (src/document-chunker.ts): 1024-char chunks, 100-char overlap
   - Markdown: Split by headings (#, ##, ###)
   - Code: Plain text chunks
2. **Embedding** (src/ollama-embedding-client.ts): Vectors via local Ollama
3. **Storage**: pgvector HNSW index, cosine similarity (`<=>` operator)

### File Syncing (src/file-sync-embeddings.ts)
- **Hash-based**: SHA-256 detects unchanged files (skip re-embedding)
- **Sequential**: Processes files one at a time using global connection
- **Auto-sync**: Git pre-commit hook syncs changed files (scripts/git-sync.ts)
- **Memory**: `db:sync` runs with `--max-old-space-size=4096` for large codebases

## Key Implementation Patterns

### Hash-Based Change Detection
```typescript
const fileHash = createHash('sha256').update(content).digest('hex');
const existing = await sql`SELECT file_hash FROM cortex_file_chunks WHERE file_path = ${path}`;
if (existing[0]?.file_hash === fileHash) return { skipped: true };
```

### Vector Search
```typescript
const results = await sql`
  SELECT file_path, content, section,
         embedding <=> ${queryVector}::vector as distance
  FROM cortex_file_chunks
  ORDER BY embedding <=> ${queryVector}::vector
  LIMIT ${topK}
`;
```

### File Collection
```typescript
import { collectFilesToSync, loadIgnorePatterns, loadConfig, parseSize } from './constants.js';

const ignorePatterns = await loadIgnorePatterns(workspaceRoot);
const config = await loadConfig(workspaceRoot);
const { files, skipped } = await collectFilesToSync(workspaceRoot, ignorePatterns, parseSize(config.maxFileSize));
```

## Configuration

### Environment Variables (.env)
```bash
DATABASE_URL=postgres://cortex:cortex-dev-pass-123@localhost:5433/cortex  # Required
CORTEX_POSTGRES_PASSWORD=cortex-dev-pass-123  # Used by docker-compose
OLLAMA_URL=http://localhost:11434             # Optional (default shown)
EMBEDDINGS_MODEL=nomic-embed-text             # Optional (default shown)
EMBEDDINGS_DIMENSIONS=768                     # Optional, must match model
```

### .cortexignore
Git-like ignore patterns. Auto-created from `docs/.cortexignore.default` if missing.

**Critical**: Binary files MUST use `**/*.ext` pattern (not `*.ext`) to match subdirectories.

### .cortexconfig.json (optional)
```json
{ "maxFileSize": "50MB" }
```

## Database Schema

### cortex_file_chunks (primary table)
| Column | Purpose |
|--------|---------|
| `embedding vector(768)` | HNSW indexed for O(log n) search |
| `file_hash` | SHA-256 of file (skip unchanged) |
| `chunk_hash` | SHA-256 of chunk (granular dedup) |
| `file_path` | Relative path from workspace root |
| `content` | Chunk text (~1024 chars) |
| `section` | Context (heading/function name) |

Unique constraint on `(file_path, chunk_index)` prevents duplicates.

## Docker Services

| Service | Port | Notes |
|---------|------|-------|
| cortex-postgres | 5433 | PostgreSQL 16 + pgvector, credentials: cortex/cortex-dev-pass-123 |
| cortex-ollama | 11434 | First run downloads model (~274MB, 2-5 min) |

## Common Pitfalls

1. **Binary file errors**: Use `**/*.ext` in .cortexignore (not `*.ext`)
2. **Re-embedding unchanged files**: Always check `file_hash` before processing
3. **MCP transport**: STDIO only (not HTTP)
4. **Oversized chunks**: Skip >4000 chars to prevent embedding failures
5. **Ollama not ready**: First run takes 2-5 min to download model
