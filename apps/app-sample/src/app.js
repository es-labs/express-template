import preRoute from '@common/node/preRoute';
import postRoute from '@common/node/postRoute';
import apiRoutes from './routes/index.js';

const { app, express, server } = preRoute();
// TBD setup WS if any wsRoutes()
apiRoutes({ app }); // TBD route prefix & versioning
postRoute(app, express);

export { server };
