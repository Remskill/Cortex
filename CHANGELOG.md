# Cortex Changelog

All notable changes to Cortex will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2025-12-30

### 🔄 Git Pre-Commit Hook & Auto-Sync

**Major Feature: Automatic sync on every git commit!**

### Added

- **Git Pre-Commit Hook** - Changed files automatically sync to vector database on commit
  - New script: `cortex/scripts/git-sync.ts` (162 lines)
  - Git hook: `.git/hooks/pre-commit` (24 lines)
  - Syncs only staged files (filters via `.cortexignore`)
  - Hash-based change detection (skips unchanged files)
  - Blocks commit if sync fails (prevents outdated embeddings)
  - Shows real-time progress during commit

- **Git-Like Sync System** - Simplified configuration inspired by `.gitignore`
  - `.cortexignore` file (auto-created from defaults on first sync)
  - `.cortexconfig.json` (optional advanced settings)
  - Sync EVERYTHING except ignore patterns (like Git)
  - No whitelists, no folder validation prompts
  - Predictable behavior (familiar to Git users)


**Optional: Customize `.cortexignore`**
```gitignore
# Add your patterns (like editing .gitignore)
**/experiments/**
**/scratch/**
```

### Benefits

| Before (Manual) | After (Auto-Sync) |
|-----------------|-------------------|
| Forget to sync new code | Automatically synced on commit ✅ |
| Outdated search results | Always up-to-date ✅ |
| Manual `cortex_sync()` calls | Happens automatically ✅ |
| Risk of missing files | Git tracks everything ✅ |
| Folder validation prompts | No prompts, just `.cortexignore` ✅ |
| Complex configuration | One file (`.cortexignore`) ✅ |

### Technical Details

**Files Modified:** 3
- `cortex/src/constants.ts`
- `cortex/scripts/bulk-sync.ts`
- `cortex/src/tools/sync.ts`

**Files Created:** 9
- `cortex/scripts/git-sync.ts`
- `.git/hooks/pre-commit`
- `cortex/docs/.cortexignore.default`
- `cortex/docs/.cortexconfig.example.json`
- 4 documentation files

**Lines Changed:** ~800 (added/modified/removed)
**Code Reduction:** -200 lines (complexity removed)

---

## [1.0.0] - 2025-12-29

### 🎉 Initial Release

**Cortex** is a free and open-source AI memory system for preventing code duplication and ensuring pattern consistency. It provides semantic search over your codebase via Model Context Protocol (MCP) integration with Claude Code CLI.

### Features

**MCP Integration**
- 6 MCP tools for Claude Code CLI integration
- Interactive setup wizard with database state detection
- Semantic search over codebase
- File embedding with folder pattern support
- Database statistics
- Clean up embeddings with confirmation

**Vector Database**
- PostgreSQL 16 with pgvector extension
- HNSW index for O(log n) vector similarity search
- Cosine similarity search (<100ms query time)
- Single initialization migration (schema.sql)

**Embedding Service**
- Ollama integration (100% local, no API costs)
- nomic-embed-text model (768 dimensions)
- Auto-downloads model on first startup
- No manual model management required

**Smart Document Chunking**
- Markdown: Chunks by headings (preserves context)
- TypeScript/Code: Plain text chunking with overlap
- Max chunk: ~256 tokens (1024 chars)
- Overlap: ~25 tokens (100 chars)
- SHA-256 deduplication (skips unchanged files)

**Memory Optimization**
- Isolated connections per file (prevents leaks)
- Sequential processing (stable memory usage)
- Forced garbage collection between files
- ~200MB memory usage (vs 2GB+ without optimization)

**Docker Orchestration**
- Simple 2-service setup (PostgreSQL + Ollama)
- Automatic health checks
- Persistent volumes for data
- MCP server runs locally via tsx (no Docker needed)

### Technical Specifications

| Component | Details |
|-----------|---------|
| **Embedding Model** | nomic-embed-text (768 dimensions) |
| **Database** | PostgreSQL 16 + pgvector |
| **Vector Index** | HNSW (m=16, ef_construction=64) |
| **MCP Transport** | STDIO (standard input/output) |
| **MCP SDK** | @modelcontextprotocol/sdk 1.9.0 |
| **Node.js** | 20+ |
| **TypeScript** | 5.7.3 |
| **ORM** | postgres (not pg) |

### Performance

| Metric | Value |
|--------|-------|
| **Query Speed** | <100ms (HNSW index) |
| **Embedding Speed** | ~5 files/second |
| **Initial Sync** | ~30s per 100 files |
| **Memory Usage** | ~200-300MB stable |
| **Database Size** | ~50MB per 1000 chunks |

---

## Future Plans

Community contributions welcome! Here are some ideas:

### Performance & Scalability
- Automatic file watching and sync
- Streaming sync for large codebases
- Parallel embedding generation
- Query result caching

### Features
- Multiple project support
- Custom embedding models (beyond nomic-embed-text)
- Support for more file types (Java, Ruby, PHP, etc.)
- Configurable chunking strategies
- Advanced filtering options

### Developer Experience
- CLI tool for sync/query outside MCP
- Web UI for browsing embeddings
- Better error messages
- Progress indicators for long operations
- Automatic backup/restore

---

## Version Numbering

Cortex uses [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backwards-compatible)
- **PATCH** version for backwards-compatible bug fixes

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute to Cortex.

**Support the project:** [☕ Buy Me a Coffee](https://buymeacoffee.com/denys_medvediev)
