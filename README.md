# 🧠 Cortex

### Never Explain Your Codebase Twice.

[![MIT License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Remskill/Cortex?style=for-the-badge&logo=github&color=yellow)](https://github.com/Remskill/Cortex)
[![Buy Me a Coffee](https://img.shields.io/badge/Support-Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/denys_medvediev)

![100% Local](https://img.shields.io/badge/🔒_100%25_Local-171717?style=flat-square)
![100% Free](https://img.shields.io/badge/💰_100%25_Free-171717?style=flat-square)
![Zero API Costs](https://img.shields.io/badge/🚀_Zero_API_Costs-171717?style=flat-square)

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js_18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-8B5CF6?style=flat-square)](https://modelcontextprotocol.io/)

[🎯 What is Cortex](#-what-is-cortex) · [👥 Who Needs It](#-who-needs-cortex) · [⚡ How It Works](#-how-it-works) · [🚀 Quick Start](#-quick-start) · [📖 Docs](#️-mcp-tools-reference) · [❓ FAQ](#-faq)

---

## 🎯 What is Cortex?

Cortex is a **semantic memory layer** for AI coding assistants. It indexes your codebase into a vector database, so AI can find relevant code by meaning — not just keywords.

<table>
<tr>
<td width="50%">

### ❌ Without Cortex

```
You: "Add payment processing"

Claude Code:
  → Reads CLAUDE.md (if exists)
  → Reads README.md
  → Maybe searches some files
  → Picks random agents (unpredictable)
  → Misses your PaymentService
  → Creates duplicate from scratch
```

</td>
<td width="50%">

### ✅ With Cortex

```
You: "Add payment processing"

Claude Code:
  → Reads CLAUDE.md (finds Cortex instructions)
  → Loads Cortex memory agent
  → Queries MCP: "payment processing"
  → Gets: PaymentService, StripeClient, docs
  → Extends YOUR existing code
```

</td>
</tr>
</table>

---

## 👥 Who Needs Cortex?

| You should use Cortex if... | Why it helps |
|----------------------------|--------------|
| 🏢 Your codebase has **20+ files** | AI can't hold everything in context |
| 🔄 You've had AI **rewrite existing code** | Cortex finds it first |
| 📚 You have **docs AI keeps ignoring** | Semantic search surfaces them |
| 🤝 Your team has **established patterns** | AI learns and follows them |
| 💸 You want **free, local, private** | No cloud, no API costs |

---

## ⚡ How It Works

```mermaid
flowchart TB
    subgraph INPUT["📁 Your Codebase"]
        A1[src/services/payment.ts]
        A2[src/utils/logger.ts]
        A3[docs/API.md]
        A4[README.md]
    end

    subgraph CORTEX["🧠 Cortex Processing"]
        B1[📄 Chunk Files]
        B2[🔢 Generate Embeddings]
        B3[(🗄️ Vector Database)]
    end

    subgraph QUERY["🤖 AI Assistant"]
        C1["User: Add email notifications"]
        C2[🔍 cortex_query]
        C3[📋 Results]
        C4[✅ Writes Code]
    end

    A1 & A2 & A3 & A4 --> B1
    B1 --> B2
    B2 --> B3

    C1 --> C2
    C2 -->|"search: notification"| B3
    B3 -->|"Found: NotificationService, EmailClient, logging patterns"| C3
    C3 --> C4
```

| Step | What Happens |
|:----:|--------------|
| **1️⃣ Index** | Cortex chunks your code into ~1024 char pieces and creates semantic embeddings |
| **2️⃣ Query** | AI asks natural language questions: "how do we handle notifications?" |
| **3️⃣ Build** | AI receives relevant files and patterns, writes consistent code |

---

## 🚀 Quick Start

### Step 1 · Add Cortex

```bash
cd your-project
git submodule add https://github.com/Remskill/Cortex.git cortex
cd cortex && cp .env.example .env && npm install
```

### Step 2 · Configure Ignore Patterns

> ⚠️ **Do this BEFORE syncing!** Skips junk to be added to your memory.

```bash
cp docs/.cortexignore.default ../.cortexignore
```

### Step 3 · Start Services

```bash
docker-compose up -d
```

> ⏱️ First run downloads the embedding model (~274MB, 2-5 min)

### Step 4 · Initialize

```bash
npm run setup
```

### Step 5 · Configure MCP

Create `.mcp.json` in your **project root**:

```json
{
  "mcpServers": {
    "cortex": {
      "command": "npx",
      "args": ["tsx", "cortex/src/server.ts"],
      "env": {
        "DATABASE_URL": "postgres://cortex:cortex-dev-pass-123@localhost:5433/cortex",
        "OLLAMA_URL": "http://localhost:11434"
      }
    }
  }
}
```

### Step 6 · Restart Claude Code

Run `/exit` and reopen. Verify with `/mcp` → should see `cortex: connected`

![MCP Connected](docs/img/mpc.png)

### Step 7 · Install Git Hook

> 🔴 **Required** — keeps AI memory in sync with your code

```bash
npm run hook:install
```

### Step 8 · Create Cortex Memory Agent (Recommended)

> 💡 **Why?** Agents ensure Claude Code automatically queries Cortex before implementing features.

**Option A: Using Claude Code CLI** (recommended)
```bash
/agents
# → Select "Create new agent"
# → Follow prompts to create an agent for searching codebase patterns
# → Name it something like "cortex-memory-agent"
```

**Option B: Copy example agent**
```bash
# Copy the pre-built agent definition
cp cortex/docs/cortex-memory-agent.md .claude/agents/cortex-memory-agent.md
```

See [`docs/cortex-memory-agent.md`](docs/cortex-memory-agent.md) for a complete agent example.

### Step 9 · Add to CLAUDE.md

Tell Claude cli to always use your Cortex agent:

```markdown
## Cortex Memory
**ALWAYS use the cortex-memory-agent before implementing ANY feature.**
This agent will query Cortex to find existing patterns and prevent code duplication.

Manual query example:
cortex_query("what you're building")
```

### ✅ Done!

```typescript
cortex_query("how we handle API errors")
cortex_query("existing notification system")
cortex_query("database connection patterns")
```

---

## 🔄 Git Auto-Sync

After installing the hook, Cortex syncs automatically on every commit:

```bash
git commit -m "Add new feature"
# 🔄 Syncing changed files...
# ✅ src/feature.ts (12 chunks)
# ✅ docs/FEATURE.md (5 chunks)
```

| Benefit | Description |
|---------|-------------|
| 🤖 **Zero effort** | Happens automatically |
| ⚡ **Incremental** | Only changed files |
| 🎯 **Always fresh** | AI never sees stale code |

---

## 🛠️ MCP Tools Reference

| Tool | Purpose |
|------|---------|
| `cortex_query` | Search by meaning |
| `cortex_sync` | Manual file sync |
| `cortex_stats` | Database stats |
| `cortex_init` | Health check |
| `cortex_list_files` | List indexed files |
| `cortex_delete` | Remove from index |

### Query Examples

```typescript
// Find existing implementations
cortex_query("payment processing")
cortex_query("user session management")

// Find patterns
cortex_query("how we handle errors in API routes")
cortex_query("state management approach")

// Find documentation
cortex_query("deployment process")
cortex_query("environment configuration")
```

> 💡 **Tip**: Be specific. `"how we validate user input in forms"` beats `"validation"`.

---

## 📁 Configuration

### .cortexignore

Controls what gets indexed. Copy the default:

```bash
cp cortex/docs/.cortexignore.default .cortexignore
```

**Auto-excluded**: `node_modules`, `dist`, `build`, `.git`, binary files

### .cortexconfig.json (Optional)

```json
{
  "maxFileSize": 52428800
}
```

> 52428800 = 50MB. Also accepts `"50MB"` string format.

---

## 💻 System Requirements

| Component | Minimum |
|-----------|---------|
| Docker | Docker Desktop or Engine |
| RAM | 4GB (8GB recommended) |
| Disk | ~2GB for models |
| Node.js | v18+ |

---

## 🔧 Troubleshooting

<details>
<summary><strong>Services won't start</strong></summary>

```bash
docker ps                    # Is Docker running?
docker-compose logs          # Check errors
docker-compose down && docker-compose up -d
```
</details>

<details>
<summary><strong>No results from queries</strong></summary>

```typescript
cortex_stats()      // Check if data exists
cortex_list_files() // List what's indexed
```

If empty, run `npm run db:sync`
</details>

<details>
<summary><strong>Emergency reset</strong></summary>

```bash
docker-compose down -v   # Delete all data
docker-compose up -d     # Fresh start
npm run setup            # Reinitialize
```
</details>

---

## ❓ FAQ

<details>
<summary><strong>Is it really free?</strong></summary>

Yes. MIT licensed, no API costs, no subscriptions. Embeddings run locally via Ollama.
</details>

<details>
<summary><strong>Does my code leave my machine?</strong></summary>

No. Everything runs in local Docker containers. Your code never leaves localhost.
</details>

<details>
<summary><strong>What languages work?</strong></summary>

All of them. Cortex indexes text content — TypeScript, Python, Go, Rust, Java, C++, Markdown, everything.
</details>

<details>
<summary><strong>How is this different from grep?</strong></summary>

Grep finds exact text matches. Cortex finds **meaning**:

- Search `"user authentication"` → finds login handlers, JWT code, session management
- Even if none of those files contain the words "user authentication"
</details>

---

## 🤝 Contributing

All contributions welcome:

- 🐛 Bug reports
- 💡 Feature ideas & suggestions
- 📝 Documentation improvements
- 🔧 Code contributions

**Have an idea?** Open a [GitHub Issue](https://github.com/Remskill/Cortex/issues) — we discuss everything!

Fork → Branch → PR → We'll review and merge together.

---

## 🔍 Similar Projects

If Cortex isn't the right fit, check out **[Zep](https://www.getzep.com/)** — they solve a similar problem (agent context/memory) with a different approach. We discovered them after building Cortex and found the ideas surprisingly similar. Worth exploring if you need alternatives!

---

## 💖 Support

<a href="https://buymeacoffee.com/denys_medvediev">
  <img src="https://img.shields.io/badge/☕-Buy%20Me%20a%20Coffee-yellow.svg?style=for-the-badge" alt="Buy Me a Coffee">
</a>

---

## 🔗 Links

[GitHub](https://github.com/Remskill/Cortex) · [Issues](https://github.com/Remskill/Cortex/issues) · [LinkedIn](https://www.linkedin.com/in/denysmedvediev/)

---

<div align="center">

**Made with ❤️ by [Denys Medvediev](https://buymeacoffee.com/denys_medvediev)**

⭐ **Star this repo if it helps you!** ⭐

</div>
