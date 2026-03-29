import express from "express";
import t4t from "./t4t.js";

// export your routes here - make sure no clashes
function mockAuthUser (req, res, next) {
  console.log('WARNING Auth bypass in t4t.js')
  req.decoded = {
    id: 'testuser',
    groups: 'admin,editor,viewer', // rename to roles?
    orgId: null, // for filtering by organization
  }
  next()
}

const router = express.Router();

export default ({ app, routePrefix }) => {
  app.use(routePrefix, router.use('/', t4t({ authFunc: mockAuthUser })))
}
