import preRoute from "@es-labs/node/express/preRoute";
import postRoute from "@es-labs/node/express/postRoute";
import init from "../../common/init.js";
import { errorHandler, notFoundHandler } from '../../common/middleware/error.js';
import appRoutes from './routes/index.js';

const { app, express, server } = init() // setup services and graceful exit
preRoute(app, express)
// appsLoader(app) // add your APIs here
appRoutes({ app, routePrefix: '/api/app-sample'})
postRoute(app, express)
// app.use(":wildcard", (req, res) => res.status(404).json({ Error: '404 Not Found...' }))
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
// 'Bad Request': 400, 'Unauthorized': 401, 'Forbidden': 403, 'Not Found': 404, 'Conflict': 409, 'Unprocessable Entity': 422, 'Internal Server Error': 500,
app.use(notFoundHandler); // 404 — must come after all valid routes
app.use(errorHandler);

export {
  server
};
