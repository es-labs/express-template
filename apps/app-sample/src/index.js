import '@express-template/common/config' // setup env - TBD: handle vault in production
import { server } from './app.js';
// import * as z from "zod";
// const Player = z.object({ 
//   username: z.string(),
//   xp: z.number()
// });

(async function() {
  console.info('Globals setup and config done. Starting app... ')
  // if development && hostname == localhost allow TLS - call after config load
  if (process.env.NODE_ENV === 'development') process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
  const { API_PORT, HTTPS_CERTIFICATE, NODE_ENV } = process.env
  server.listen(API_PORT, () => console.info(`Env=${NODE_ENV}, Port=${API_PORT}, https=${Boolean(HTTPS_CERTIFICATE)}`))
}())
