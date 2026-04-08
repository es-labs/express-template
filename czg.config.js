import { readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

function listDirs(parent) {
  try {
    return readdirSync(join(root, parent))
      .filter((name) => statSync(join(root, parent, name)).isDirectory())
      .map((name) => `${parent}/${name}`)
  } catch {
    return []
  }
}

const workspaceScopes = [
  ...listDirs('apps'),
  ...listDirs('common'),
  ...listDirs('webs'),
  'docs',
  'ci',
  'repo',
]

/** @type {import('czg').UserConfig} */
export default {
  prompt: {
    scopes: ['NA', ...workspaceScopes],
  },
}
