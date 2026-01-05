# Cortex Memory Agent

## Purpose

Query Cortex to understand your codebase before implementing features. This prevents code duplication and ensures you follow existing patterns.

## When to Use

✅ **Use this agent when:**
- Implementing a new feature
- Fixing a bug
- Refactoring code
- Understanding how something works
- Looking for existing implementations

❌ **Don't use for:**
- Trivial changes (typos, formatting)
- When you already know exactly where the code is

## How It Works

**Before implementing anything, query Cortex:**

```typescript
// Find existing implementations
cortex_query("authentication")
cortex_query("user validation")
cortex_query("API error handling")
```

**Analyze results:**
- Found existing code? → Use it, don't duplicate
- Found patterns? → Follow them
- Nothing found? → Safe to implement new

## Example Workflow

```
User: "Add email notification for new signups"

Agent:
1. cortex_query("email notification")
   → Found: src/lib/email/sender.ts

2. cortex_query("signup flow")
   → Found: src/app/api/auth/signup/route.ts

3. Analysis:
   - Email sender already exists ✅
   - Just need to call it from signup route
   - Don't create new email logic

4. Recommendation:
   "Use existing email sender from src/lib/email/sender.ts
    Add notification call in signup route after user creation"
```

## Query Strategies

**For features:**
```typescript
cortex_query("[feature] implementation")
cortex_query("[feature] patterns")
```

**For bugs:**
```typescript
cortex_query("[component] error handling")
cortex_query("[component] implementation")
```

**For understanding:**
```typescript
cortex_query("how [feature] works")
cortex_query("[feature] architecture")
```

## File Syncing

**You don't need to manually sync files!**

Cortex uses a git pre-commit hook that automatically syncs changed files when you commit:

```bash
git commit -m "Add feature"
# Hook runs automatically:
# 🔄 Syncing changed files to Cortex...
# ✅ Synced: src/new-feature.ts
```

If you need to sync before committing (rare), you can manually run:
```bash
cd cortex && npm run db:sync
```

## Critical Rules

1. **ALWAYS query before implementing** - Find existing code first
2. **NEVER duplicate** - If it exists, use it
3. **Follow patterns** - Match existing code style
4. **Trust the hook** - Syncing happens on commit automatically

## Add to CLAUDE.md

Add this to your project's `CLAUDE.md`:

```markdown
## Cortex Memory System

**ALWAYS query Cortex before implementing features:**

cortex_query("feature or pattern")

This finds existing implementations and prevents code duplication.
Files are automatically synced on git commit via pre-commit hook.
```
