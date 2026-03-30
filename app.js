import "./env-legacy.js";
import preRoute from "./common/preRoute.js";
import postRoute from "./common/postRoute.js";
import appsLoader from "./apps/apploader.js";

const { app, express, server } = preRoute()
appsLoader(app) // add your APIs here
postRoute(app, express)

export {
  server
};
