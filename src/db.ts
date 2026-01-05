/**
 * PostgreSQL Database Connection Management
 *
 * This module manages database connections to PostgreSQL + pgvector.
 * Uses lightweight `postgres` package (not `pg`) for better performance.
 *
 * Connection Strategy:
 * ------------------
 * 1. Global connection (`sql`) - Used for:
 *    - Reading data (queries, stats)
 *    - Health checks
 *    - Long-running operations
 *    - Shared across entire application
 *
 * 2. Isolated connections (`createConnection()`) - Used for:
 *    - File syncing (write operations)
 *    - Bulk operations that need isolation
 *    - Closed immediately after use to prevent memory leaks
 *    - Each file sync gets its own connection
 *
 * Why max: 1 connection?
 * ---------------------
 * - Reduces memory usage (~50MB per connection)
 * - MCP server is single-threaded (STDIO transport)
 * - Connection pooling not needed for sequential operations
 * - For concurrent operations, we create isolated connections
 *
 * Memory Optimization:
 * -------------------
 * - Global connection stays open (reused across requests)
 * - Isolated connections are closed after each operation
 * - Garbage collection triggered between operations
 * - Prevents memory leaks during bulk syncing
 *
 * @see ../indexer.ts for isolated connection usage example
 */

import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://cortex:cortex-dev-pass-123@localhost:5433/cortex'

/**
 * Global PostgreSQL connection
 * Used for all read operations and long-running processes
 * Single connection (max: 1) to minimize memory usage
 */
export const sql = postgres(DATABASE_URL, {
  max: 1, // Single connection to reduce memory
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Disable prepared statements to prevent memory accumulation
})

/**
 * Create isolated PostgreSQL connection
 * Used for write operations that need isolation (e.g., file syncing)
 * Should be closed immediately after use with closeIsolatedConnection()
 *
 * @returns New isolated connection that MUST be closed after use
 */
export function createConnection() {
  return postgres(DATABASE_URL, {
    max: 1, // Single connection per operation
    idle_timeout: 5, // Close quickly when idle
    connect_timeout: 10,
  })
}

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Close connection (for cleanup)
export async function closeConnection(): Promise<void> {
  await sql.end()
}

// Close a specific connection and release resources
export async function closeIsolatedConnection(connection: ReturnType<typeof postgres>): Promise<void> {
  try {
    await connection.end({ timeout: 2 })
  } catch (error) {
    // Ignore errors during cleanup
  }
}
