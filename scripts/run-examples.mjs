import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Separate processes keep each demonstration copyable and independently runnable.
const directory = new URL('../examples/', import.meta.url);
for (const file of (await readdir(directory)).sort()) {
  if (!file.endsWith('.mjs') || file.endsWith('.test.mjs')) continue;
  console.log(`\n${file}\n${'─'.repeat(file.length)}`);
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(file, directory))], {
    stdio: 'inherit',
  });
  if (result.error || result.status !== 0) {
    if (result.error) console.error(result.error.message);
    process.exit(result.status ?? 1);
  }
}
