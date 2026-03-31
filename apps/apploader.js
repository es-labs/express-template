import appSampleRoutes from './app-sample/routes/index.js';
import appT4tRoutes from './app-t4t/index.js';
import appAuthRoutes from './app-auth/index.js';

export default (app) => {
  // your can add more routes here ensure no clash in urlPrefix
  // appSampleRoutes({ app, routePrefix: '/api/app-second'})

  // some sample/demo routes - you can remove if not needed
  appSampleRoutes({ app, routePrefix: '/api/app-sample'})

  // table for table experimental app
  appT4tRoutes({ app, routePrefix: '/api/t4t'}) // TODO: need to fix t4t-fe.js to make URL configurable
}
