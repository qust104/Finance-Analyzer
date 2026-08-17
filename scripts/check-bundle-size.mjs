// Fail the build when the total JS payload exceeds the budget.
// The threshold is set once against the current size + ~20% headroom;
// it exists to catch silent bundle growth, not to micro-optimize.
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const MAX_JS_BYTES = 1.1 * 1024 * 1024

const distAssets = join(process.cwd(), 'dist', 'assets')
const jsFiles = readdirSync(distAssets).filter((file) => file.endsWith('.js'))
const total = jsFiles.reduce((sum, file) => sum + statSync(join(distAssets, file)).size, 0)

if (total > MAX_JS_BYTES) {
  console.error(`Bundle size ${total} bytes exceeds budget ${MAX_JS_BYTES} bytes`)
  process.exit(1)
}
console.log(
  `Bundle size OK: ${(total / 1024).toFixed(1)}kb / ${(MAX_JS_BYTES / 1024).toFixed(0)}kb`,
)