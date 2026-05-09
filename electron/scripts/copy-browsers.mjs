import { execSync } from 'child_process'
import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { homedir, platform } from 'os'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'playwright-browsers')

function getPlaywrightCacheDir() {
  const p = platform()
  if (p === 'darwin') return join(homedir(), 'Library', 'Caches', 'ms-playwright')
  if (p === 'win32') return join(process.env.USERPROFILE || 'C:\\Users\\default', 'AppData', 'Local', 'ms-playwright')
  return join(homedir(), '.cache', 'ms-playwright')
}

function getRelevantBrowsers(cacheDir) {
  if (!existsSync(cacheDir)) return []
  return readdirSync(cacheDir).filter((name) => name.startsWith('chromium') || name === 'ffmpeg')
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const s = join(src, entry)
    const d = join(dest, entry)
    if (statSync(s).isDirectory()) {
      copyDir(s, d)
    } else {
      copyFileSync(s, d)
    }
  }
}

const cacheDir = getPlaywrightCacheDir()
console.log(`Playwright cache: ${cacheDir}`)

const browsers = getRelevantBrowsers(cacheDir)
if (browsers.length === 0) {
  console.log('No browsers found. Installing chromium...')
  execSync('python -m playwright install chromium', { stdio: 'inherit' })
  const installed = getRelevantBrowsers(cacheDir)
  browsers.push(...installed)
}

console.log(`Copying browsers: ${browsers.join(', ')}`)

mkdirSync(OUT_DIR, { recursive: true })
for (const name of browsers) {
  const src = join(cacheDir, name)
  const dest = join(OUT_DIR, name)
  console.log(`  ${src} -> ${dest}`)
  copyDir(src, dest)
}

console.log('Done.')
