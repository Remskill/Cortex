#!/usr/bin/env node

/**
 * Cortex MCP Server (STDIO Transport)
 *
 * This is the main entry point for Cortex MCP integration with Claude Code.
 * It uses STDIO transport (standard input/output) to communicate with Claude Code CLI.
 *
 * How it works:
 * 1. Claude Code launches this server via .mcp.json configuration
 * 2. Server registers 6 MCP tools: init, query, sync, stats, list-files, delete
 * 3. Claude Code sends tool requests via standard input
 * 4. Server processes requests and returns results via standard output
 *
 * Configuration (.mcp.json in project root):
 * {
 *   "mcpServers": {
 *     "cortex": {
 *       "command": "npx tsx cortex/src/server.ts",
 *       "env": {
 *         "DATABASE_URL": "postgres://...",
 *         "OLLAMA_URL": "http://localhost:11434",
 *         "WORKSPACE_ROOT": "/path/to/project"
 *       }
 *     }
 *   }
 * }
 *
 * Architecture:
 * - STDIO transport (not HTTP/SSE - that's for containerized deployments)
 * - Connects to PostgreSQL + pgvector for vector storage
 * - Connects to Ollama for text embeddings
 * - Provides semantic search over entire codebase
 *
 * @see https://modelcontextprotocol.io for MCP specification
 * @see README.md for full documentation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  queryTool,
  querySchema,
  syncTool,
  syncSchema,
  statsTool,
  statsSchema,
  listFilesTool,
  listFilesSchema,
  initTool,
  initSchema,
  deleteTool,
  deleteSchema,
} from './tools/index.js';

const server = new Server(
  {
    name: 'cortex',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'cortex_query',
        description:
          'Semantic search for relevant context in the knowledge base. Use this BEFORE implementing features to find existing code, patterns, and guidelines.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'What to search for (e.g., "Stripe Connect implementation", "error handling patterns")',
            },
            topK: {
              type: 'number',
              description: 'Number of results to return (default: 10)',
              default: 10,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'cortex_sync',
        description:
          'Sync files to the vector database. Syncs all documentation and source files by default, or specific files if provided.',
        inputSchema: {
          type: 'object',
          properties: {
            files: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific files to sync (optional, syncs all if empty)',
            },
            force: {
              type: 'boolean',
              description: 'Re-embed even if files are unchanged (default: false)',
              default: false,
            },
          },
        },
      },
      {
        name: 'cortex_stats',
        description: 'Show database statistics (total chunks, files, size, last sync time)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'cortex_list_files',
        description: 'List all embedded files with chunk counts and update times',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of files to list (default: 50)',
              default: 50,
            },
          },
        },
      },
      {
        name: 'cortex_init',
        description: 'Check Cortex initialization status and service health. Use this to verify everything is working.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'cortex_delete',
        description: 'Delete embeddings from database. Can delete specific files or all data. Requires confirmation.',
        inputSchema: {
          type: 'object',
          properties: {
            files: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific files to delete (optional, deletes all if empty)',
            },
            confirm: {
              type: 'boolean',
              description: 'Must be true to confirm deletion (default: false)',
              default: false,
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'cortex_query': {
        const input = querySchema.parse(args);
        return await queryTool(input);
      }

      case 'cortex_sync': {
        const input = syncSchema.parse(args);
        return await syncTool(input);
      }

      case 'cortex_stats': {
        const input = statsSchema.parse(args);
        return await statsTool(input);
      }

      case 'cortex_list_files': {
        const input = listFilesSchema.parse(args);
        return await listFilesTool(input);
      }

      case 'cortex_init': {
        const input = initSchema.parse(args);
        return await initTool(input);
      }

      case 'cortex_delete': {
        const input = deleteSchema.parse(args);
        return await deleteTool(input);
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[cortex] Error in ${name}:`, errorMsg);

    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ Error: ${errorMsg}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[cortex] MCP server started');
}

main().catch((error) => {
  console.error('[cortex] Fatal error:', error);
  process.exit(1);
});
