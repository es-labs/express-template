import './env.js';
import config from '@es-labs/node/config';
import { server } from './app.js';

(async function() {
  console.log('NODE_ENV', process.env.NODE_ENV)
  
  await config(new URL('.', import.meta.url).pathname, process.cwd())
  console.info('Globals setup and config done. Starting app... ')

  // if development && hostname == localhost allow TLS - call after config load
  if (process.env.NODE_ENV === 'development') process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

  const { API_PORT, HTTPS_CERTIFICATE } = process.env
  server.listen(API_PORT, () => console.info(`[(${process.env.NODE_ENV}) ${process.env.APP_VERSION}] listening on port ${API_PORT}, https=${Boolean(HTTPS_CERTIFICATE)}`))
}())
