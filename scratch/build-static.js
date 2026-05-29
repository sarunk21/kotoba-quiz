const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const rootDir = path.join(__dirname, '..')
const apiDir = path.join(rootDir, 'app', 'api')
const tempApiDir = path.join(rootDir, 'app_api_temp')

let apiMoved = false

try {
  // 1. Move app/api to app_api_temp if it exists
  if (fs.existsSync(apiDir)) {
    console.log('[Build Static] Hiding API routes by renaming app/api to app_api_temp...')
    fs.renameSync(apiDir, tempApiDir)
    apiMoved = true
  }

  // 2. Run next build with export env flag
  console.log('[Build Static] Running static Next.js build...')
  execSync('npx next build', {
    stdio: 'inherit',
    cwd: rootDir,
    env: {
      ...process.env,
      NEXT_PUBLIC_EXPORT: 'true'
    }
  })
  console.log('[Build Static] Static export completed successfully!')
} catch (error) {
  console.error('[Build Static] Build failed:', error)
  process.exitCode = 1
} finally {
  // 3. Restore api directory
  if (apiMoved && fs.existsSync(tempApiDir)) {
    console.log('[Build Static] Restoring API routes to app/api...')
    fs.renameSync(tempApiDir, apiDir)
  }
}
