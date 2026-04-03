import path from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default async function(app_path) {
  process.env.NODE_ENV = process.env.NODE_ENV || '' // development, dev, prd... (development is on local machine)
  const { NODE_ENV, VAULT } = process.env
  if (!NODE_ENV) {
    console.log('Exiting No Environment Specified')
    process.exit(1)
  }

  const packageJsonPath = path.join(app_path, 'package.json')
  const packageJsonContent = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  const { version, name } = packageJsonContent
  process.env.APP_VERSION = version
  process.env.APP_NAME = name

  if (NODE_ENV) {
    if (VAULT && VAULT !== 'unused') {
      try {
        const vaultRes = await fetch(VAULT) // a GET with query parameters (protected)
        const vaultConfig = await vaultRes.json()
        process.env = { ...process.env, ...vaultConfig }
      } catch (e) {
        console.log('vault error', e.toString(), VAULT)
      }
    }
    const sleep = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds))
    await sleep(2000)
    console.log('CONFIG DONE!')
  } else {
    console.log('NODE_ENV and APP_PATH needs to be defined')
  }
}
