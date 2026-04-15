import postRoute from '@common/node/express/postRoute';
import preRoute from '@common/node/express/preRoute';
import apiRoutes from './routes/index.js';

logger.info(`Starting...`);
const { app, express, server } = preRoute();
// TODO setup WS if any wsRoutes()
apiRoutes({ app }); // TODO route prefix & versioning
postRoute(app, express);

export { server };
