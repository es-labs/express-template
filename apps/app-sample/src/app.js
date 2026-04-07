import preRoute from '@common/node/express/preRoute';
import postRoute from '@common/node/express/postRoute';
import apiRoutes from './routes/index.js';

const { app, express, server } = preRoute();
// TODO setup WS if any wsRoutes()
apiRoutes({ app }); // TODO route prefix & versioning
postRoute(app, express);

export { server };
