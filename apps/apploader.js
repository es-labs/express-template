import appSampleRoutes from './app-sample/routes/index.js';
import appT4tRoutes from './app-t4t/index.js';
import appAuthRoutes from './app-auth/index.js';

export default (app) => {
  // some sample/demo routes - you can remove if not needed
  appSampleRoutes({ app, routePrefix: '/api/app-sample'})

  // your can add more routes here ensure no clash in urlPrefix
  // appSampleRoutes({ app, routePrefix: '/api/app-second'})
}
