import path from "path";
import dotenv from "dotenv";

const { NODE_ENV } = process.env
console.log('CWD', process.cwd())
// dotenv.config({ path: path.join(process.cwd(), 'apps', `.env.${NODE_ENV}`), override: true } )
dotenv.config({ path: path.join(process.cwd(), `.env.${NODE_ENV}`), override: true } )
