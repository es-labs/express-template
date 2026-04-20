// import path from 'node:path';
// import { readFileSync } from 'node:fs';
// import { fileURLToPath } from 'node:url'
// import packageJson from '../package.json' with { type: 'json' };
export const name = process.env.npm_package_name;
export const version = process.env.npm_package_version;
export const dependencies = process.env.npm_package_dependencies;

// export default async function (app_path) {
//   // TODO: this to be refactored
//   const packageJsonPath = path.join(app_path, 'package.json');
//   const packageJsonContent = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
//   const { version, name } = packageJsonContent;
//   process.env.APP_VERSION = version;
//   process.env.APP_NAME = name;
// }
