import fs from 'node:fs';
import path from 'node:path';
import { loadEnvFile } from 'node:process';

// 1. TODO create namespace for glbalThis
// 2. Load optional structured, non-sensitive config into globalThis.__config.
// 3. Keep secrets and scalar values in process.env.

// Merge json configs into process.env - Object.assign(process.env, config);
// Caveats: JSON cannot be nested, only flat key-value pairs, Coerces all values to string
process.env.NODE_ENV = process.env.NODE_ENV || 'development'; // default to development if NODE_ENV is not set
const envFilePath = path.resolve(process.cwd(), '.env');

if (process.env.NODE_ENV === 'development') {
  // will throw if file doesn't exist, only use for development
  loadEnvFile(`${envFilePath}.local`); // load this first
  loadEnvFile(envFilePath);
}

const normalizeJsonc = source => {
  let result = '';
  let inString = false;
  let isEscaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inString) {
      result += char;
      if (isEscaped) isEscaped = false;
      else if (char === '\\') isEscaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      result += char;
      continue;
    }

    if (char === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      if (index < source.length) result += '\n';
      continue;
    }

    result += char;
  }

  return result;
};

const parseJsoncObject = (raw, filePath) => {
  const normalized = normalizeJsonc(raw).trim();
  if (!normalized) return {};

  const config = JSON.parse(normalized);
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError(`JSON config must be a top-level object: ${filePath}`);
  }
  return config;
};

const loadJsonConfigFile = filePath => {
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return {};

  return parseJsoncObject(raw, filePath);
};

// Load and Parse the JSON, let error throw
// To improve with deep freeze and validation if needed
const __config = Object.freeze(loadJsonConfigFile(`${envFilePath}.json`));

globalThis.__config = __config;

export { __config };
