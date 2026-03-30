import preRoute from "@express-template/common/preRoute";
import postRoute from "@express-template/common/postRoute";
import apiRoutes from './routes/index.js';

const { app, express, server } = preRoute()
// TBD setup WS if any wsRoutes()
apiRoutes(app) // TBD route prefix & versioning
postRoute(app, express)

export {
  server
};
