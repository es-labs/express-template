'use strict'

// const websocket = require('@es-labs/node/services/websocket') // .open(null, null) // or set to null
// websocket.setOnClientMessage = async (data, , isBinary ws, _wss) => { }
// websocket.setOnClientCLose =  (ws) => { }

// routes to your custom application here
module.exports = (app) => {
  require('./app-sample/routes')({ app, routePrefix: '/api/app-sample'})
  // your can add more routes here ensure no clash in urlPrefix
  // require('./app-2nd/routes')({ app, urlPrefix: '/api/app-second'})
}