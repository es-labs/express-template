import express from 'express';
import t4t from './t4t.js';

// export your routes here - make sure no clashes
function mockAuthUser(req, res, next) {
  logger.info('WARNING Auth bypass in t4t.js');
  req.user = {
    sub: 'testuser',
    roles: 'admin,editor,viewer', // rename to roles?
    tenant: null, // for filtering by organization
  };
  next();
}

const router = express.Router();

export default ({ app, routePrefix }) => {
  app.use(routePrefix, router.use('/', t4t({ authFunc: mockAuthUser })));
};
