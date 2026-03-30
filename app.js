import preRoute from "./common/preRoute.js";
import postRoute from "./common/postRoute.js";
import appsLoader from "./apps/apploader.js";
import { errorHandler, notFoundHandler } from './common/middleware/error.js';

const { app, express, server } = preRoute(app, express)
appsLoader(app) // add your APIs here
postRoute(app, express)

export {
  server
};
