import { loadEnvFile } from 'node:process';
import path from 'node:path';

// Determine the environment and construct the file path
const envFileName = `.env.${process.env.NODE_ENV || 'development'}`;
const envFilePath = path.resolve(process.cwd(), envFileName);

try {
  loadEnvFile(envFilePath);
  console.log(`Loaded environment file: ${envFileName}`);
} catch (error) {
  // Handle the case where the file might not exist (e.g. in production when using system env vars)
  console.log(`Could not load ${envFileName}. Ensure NODE_ENV is set correctly or the file exists.`);
}
