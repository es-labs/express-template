'use strict'
const url = require('url')
const http = require('http')
const https = require('https')
const express = require('express')
const app = express()

// using CJS in ESM sibling-module.js is a CommonJS module
// import { createRequire } from 'module'
// const require = createRequire(import.meta.url)
// const siblingModule = require('./sibling-module')

require('@es-labs/node/express/init')()
const sleep = require('@es-labs/node/utils/sleep')

// setup graceful exit
const handleExitSignal = async (signal) => await cleanup(`Signal ${signal}`, 0) // NOSONAR
const handleExitException = async (err, origin) => await cleanup(`Uncaught Exception. error: ${err?.stack || err} origin: ${origin}`, 1) // NOSONAR
const handleExitRejection = async (reason, promise) => await cleanup(`Unhandled Rejection. reason: ${reason?.stack || reason}`, 1) // NOSONAR
process.on('SIGINT', handleExitSignal)
process.on('SIGTERM', handleExitSignal)
process.on('SIGQUIT', handleExitSignal)
process.on('uncaughtException', handleExitException)
process.on('unhandledRejection', handleExitRejection)

const { HTTPS_PRIVATE_KEY, HTTPS_CERTIFICATE } = process.env
const https_opts = {}
if (HTTPS_CERTIFICATE) {
  https_opts.key = HTTPS_PRIVATE_KEY
  https_opts.cert = HTTPS_CERTIFICATE
  // UNUSED AT THE MOMENT
  // passphrase = (fs.readFileSync('passphrase.txt')).toString()
  // pfx = fs.readFileSync('8ab20f7b-51b9-4c09-a2e0-1918bb9fb37f.pfx')
  // ca = fs.readFileSync('ca.cert')
}
const server = HTTPS_CERTIFICATE ? https.createServer(https_opts, app) : http.createServer(app)

// USERLAND - Add APM tool

require('@es-labs/node/express/preRoute')(app, express)

const services = require('@es-labs/node/services')
const authService = require('@es-labs/node/auth')

// CLEANUP
const cleanup = async (message, exitCode = 0, coreDump = false, timeOutMs = 1000) => {
  console.log(message)
  console.log(`
  node win - cannot see messages
  node bash - can see messages
  `)
  if (server) {
    server.close(async () => {
      try {
        await services.stop()
        // or should process.exit be placed here?
      } catch (e) {
        console.error(e)
      }
    })
  }
  console.log('cleaning up and awaiting exit...')
  await sleep(timeOutMs) // from here on... does not get called on uncaught exception crash
  console.log('exiting') // require('fs').writeSync(process.stderr.fd, `bbbbbbbbbbbb`)
  return coreDump ? process.abort : process.exit(exitCode)
  // setTimeout(() => console.log('exiting'), timeOutMs).unref()
}

// SERVICES
services.start()
try {
  authService.setup(services.get('keyv'), services.get('knex1')) // setup authorization
} catch (e) {
  console.log(e)
}

// ROUTES

  // 1. asyncWrapper
  // https://strongloop.com/strongblog/async-error-handling-expressjs-es7-promises-generators/#usinges7asyncawait
  // https://gist.github.com/Hiswe/fe83c97d1c7c8eee9557939d1b9bc086
  // Caveats:
  // 1. You must have all your asynchronous code return promises (except emitters). Raw callbacks simply don’t have the facilities for this to work.
  // 2. Event emitters (like streams) can still cause uncaught exceptions. So make sure you are handling the error event properly e.g. stream.on('error', next).pipe(res)

  // DOs:
  // DO use throw, and try/catch when needed
  // DO use custom error classes like BadRequestError as it makes sorting errors out easier

  // const asyncWrapper = fn => (...args) => fn(...args).catch(args[2])
  // module.exports = asyncWrapper
  // USAGE:
  // const wrap = require('./<path-to>/asyncWrapper')
  // app.get('/', wrap(async (req, res) => { ... }))
  // replaced by - express-async-errors, will be native in express 5
  // global.asyncWrapper = fn => (...args) => fn(...args).catch(args[2]) //  proceed to error handler
  // https://github.com/express-promise-router/express-promise-router
  // https://github.com/davidbanham/express-async-errors
  // https://stackoverflow.com/questions/44327291/express-js-wrap-every-middleware-route-in-decorator
  // https://github.com/expressjs/express/issues/4256
  // https://github.com/expressjs/express/issues/3748

// https://stackoverflow.com/questions/44327291/express-js-wrap-every-middleware-route-in-decorator - TO CHECK AND REMOVE for express 5

try {
  console.log('Start App Routes Load')
  require('./apps/apploader')(app) // add your APIs here
  console.log('Start Common Routes Load')
  require('./router')(app); // common routes
  console.log('Start Fallback Routes Load')
  app.use('/api/:wildcard', (req, res) => res.status(404).json({ error: 'Not Found' }))
  console.log('Routes Load Completed')
} catch (e) {
  console.log('Route loading exception', e, e.toString())
}
// END ROUTES

// OpenAPI
const { OPENAPI_OPTIONS } = process.env
// TBD when lib is ready for ExpressJS 5
const openApiOptions = null // JSON.parse(OPENAPI_OPTIONS || null)
if (openApiOptions) {
  openApiOptions.baseDir = __dirname
  const expressJSDocSwagger = require('express-jsdoc-swagger')
  expressJSDocSwagger(app)(openApiOptions)
}

// websockets
server.on('upgrade', (request, socket, head) => {
  console.log('upgrade event')
  const pathname = url.parse(request.url).pathname // if (pathname === '/some-match') { }
})

require('@es-labs/node/express/postRoute')(app, express)
app.use(":wildcard", (req, res) => res.status(404).json({ Error: '404 Not Found...' }))
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
// 'Bad Request': 400, 'Unauthorized': 401, 'Forbidden': 403, 'Not Found': 404, 'Conflict': 409, 'Unprocessable Entity': 422, 'Internal Server Error': 500,
app.use((error, req, res, next) => {
  // error middleware - 200s should not reach here
  // console.log('typeof error', error instanceof Error)
  console.log('error middleware', error)
  let message = 'Unknown Error'
  if (error.message) {
    // console.log('Error Object', error.name, error.name, error.stack)
    message = (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') ? error.stack : error.message
  } else if (typeof error === 'string') {
    message = error
  } else if (error?.toString) {
    message = error.toString()
  }
  return !res.headersSent ? res.status(500).json({ message }) : next()
})


module.exports = { server }
