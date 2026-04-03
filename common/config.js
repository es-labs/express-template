import { loadEnvFile } from 'node:process';
import path from 'node:path';

process.env.NODE_ENV = process.env.NODE_ENV || 'development'; // default to development if NODE_ENV is not set
const envFilePath = path.resolve(process.cwd(), '.env');

if (process.env.NODE_ENV === 'development') {
  // will throw if file doesn't exist, only use for development
  loadEnvFile(`${envFilePath}.local`); // load this first
  loadEnvFile(envFilePath);
}
