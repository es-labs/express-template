import appSampleRoutes from './app-sample/routes/index.js';
import appT4tRoutes from './app-t4t/index.js';
import appAuthRoutes from './app-auth/index.js';

'use strict'

export default (app) => {
  // your can add more routes here ensure no clash in urlPrefix
  // appSampleRoutes({ app, urlPrefix: '/api/app-second'})

  // some sample/demo routes - you can remove if not needed
  appSampleRoutes({ app, routePrefix: '/api/app-sample'})

  // table for table experimental app
  appT4tRoutes({ app, routePrefix: '/api/t4t'}) // TODO: need to fix t4t-fe.js to make URL configurable

  // authentication stuff Below - you can remove if not needed (be aware of routing if you are customizing your auth)
  // routes used are: /api/auth (own auth rollout), /api/oauth, /api/oidc, /api/saml
  appAuthRoutes({ app, routePrefix: '/api'})
}
