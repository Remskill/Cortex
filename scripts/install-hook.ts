import { copyFileSync, chmodSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const source = join(rootDir, 'hooks', 'pre-commit');
const gitHooksDir = join(rootDir, '..', '.git', 'hooks');
const destination = join(gitHooksDir, 'pre-commit');

// Ensure .git/hooks directory exists
if (!existsSync(gitHooksDir)) {
  mkdirSync(gitHooksDir, { recursive: true });
}

// Copy the hook file
copyFileSync(source, destination);

// Make executable (no-op on Windows, but needed for Unix)
try {
  chmodSync(destination, 0o755);
} catch {
  // chmod may fail on Windows, that's ok
}

console.log('✅ Git pre-commit hook installed!');
