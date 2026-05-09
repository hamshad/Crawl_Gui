import { app, BrowserWindow } from 'electron'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import http from 'http'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BACKEND_PORT = 5001
const HEALTH_CHECK_RETRIES = 60
const HEALTH_CHECK_INTERVAL = 1000

let pythonProcess = null
let mainWindow = null

function getBackendCommand() {
  const isDev = !app.isPackaged

  if (isDev) {
    const venvPython = path.join(__dirname, '..', '.venv', 'bin', 'python')
    return {
      cmd: venvPython,
      args: [path.join(__dirname, '..', 'backend.py'), String(BACKEND_PORT)],
      env: {
        ...process.env,
        PLAYWRIGHT_BROWSERS_PATH: path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright'),
      },
    }
  }

  const exeName = process.platform === 'win32' ? 'backend-server.exe' : 'backend-server'
  const exePath = path.join(process.resourcesPath, 'python-bin', exeName)
  const browsersPath = path.join(process.resourcesPath, 'playwright-browsers')

  return {
    cmd: exePath,
    args: [String(BACKEND_PORT)],
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: browsersPath,
    },
  }
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const { cmd, args, env } = getBackendCommand()

    pythonProcess = spawn(cmd, args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    pythonProcess.stdout.on('data', (data) => {
      console.log(`[backend] ${data.toString().trim()}`)
    })

    pythonProcess.stderr.on('data', (data) => {
      console.log(`[backend] ${data.toString().trim()}`)
    })

    pythonProcess.on('error', (err) => {
      console.error('[backend] Failed to start:', err)
      reject(err)
    })

    pythonProcess.on('exit', (code) => {
      console.log(`[backend] exited with code ${code}`)
      pythonProcess = null
    })

    resolve()
  })
}

function waitForBackend(retries = HEALTH_CHECK_RETRIES) {
  return new Promise((resolve, reject) => {
    function check(remaining) {
      if (remaining <= 0) {
        reject(new Error('Backend did not start in time'))
        return
      }

      const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/health`, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            if (json.status === 'ok') {
              resolve()
            } else {
              setTimeout(() => check(remaining - 1), HEALTH_CHECK_INTERVAL)
            }
          } catch {
            setTimeout(() => check(remaining - 1), HEALTH_CHECK_INTERVAL)
          }
        })
      })

      req.on('error', () => {
        setTimeout(() => check(remaining - 1), HEALTH_CHECK_INTERVAL)
      })

      req.end()
    }

    check(retries)
  })
}

function stopBackend() {
  if (pythonProcess) {
    pythonProcess.kill('SIGTERM')
    setTimeout(() => {
      if (pythonProcess) {
        pythonProcess.kill('SIGKILL')
      }
    }, 3000)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    try {
      await startBackend()
      console.log('[backend] Process started, waiting for health...')
      await waitForBackend()
      console.log('[backend] Ready')
    } catch (err) {
      console.error('[backend] Failed:', err.message)
    }

    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('before-quit', () => {
    stopBackend()
  })

  app.on('will-quit', () => {
    stopBackend()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
