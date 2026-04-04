import path from 'node:path';
import { readFileSync } from 'node:fs';
// import { fileURLToPath } from 'node:url'
// const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default async function (app_path) {
  // TODO: this to be refactored
  const packageJsonPath = path.join(app_path, 'package.json');
  const packageJsonContent = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const { version, name } = packageJsonContent;
  process.env.APP_VERSION = version;
  process.env.APP_NAME = name;
}
