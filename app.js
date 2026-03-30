import init from "./common/init.js";
import preRoute from "./common/preRoute.js";
import postRoute from "./common/postRoute.js";
import appsLoader from "./apps/apploader.js";
import { errorHandler, notFoundHandler } from './common/middleware/error.js';

const { app, express, server } = init() // setup services and graceful exit
preRoute(app, express)
appsLoader(app) // add your APIs here
postRoute(app, express)
// app.use(":wildcard", (req, res) => res.status(404).json({ Error: '404 Not Found...' }))
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
// 'Bad Request': 400, 'Unauthorized': 401, 'Forbidden': 403, 'Not Found': 404, 'Conflict': 409, 'Unprocessable Entity': 422, 'Internal Server Error': 500,

// 404 — must come after all valid routes
app.use(notFoundHandler);
app.use(errorHandler);

export {
  server
};
