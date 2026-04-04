import preRoute from '@common/express/preRoute';
import postRoute from '@common/express/postRoute';
import apiRoutes from './routes/index.js';

const { app, express, server } = preRoute();
// TBD setup WS if any wsRoutes()
apiRoutes({ app }); // TBD route prefix & versioning
postRoute(app, express);

export { server };
