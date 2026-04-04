import path from 'node:path';
import fs from 'node:fs';
import { loadEnvFile } from 'node:process';

process.env.NODE_ENV = process.env.NODE_ENV || 'development'; // default to development if NODE_ENV is not set
const envFilePath = path.resolve(process.cwd(), '.env');

// merge json configs into process.env
// Caveats:
// - JSON cannot be nested, only flat key-value pairs,
// - Coerces all values to string
// - should store only non-sensitive configs
// const config = JSON.parse(fs.readFileSync(`${envFilePath}.json`));
// Object.assign(process.env, config);

if (process.env.NODE_ENV === 'development') {
  // will throw if file doesn't exist, only use for development
  loadEnvFile(`${envFilePath}.local`); // load this first
  loadEnvFile(envFilePath);
}
