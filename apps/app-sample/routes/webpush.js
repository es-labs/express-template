'use strict'
import express from "express";
import { 
  // authUser,
  authFns
} from "@es-labs/node/auth";
import * as fcm from "@es-labs/node/comms/fcm";
import * as webpush from "@es-labs/node/comms/webpush";

console.log('WARNING Auth bypass in webpush.js')

const authUser = (req, res, next) => {
  req.decoded = { id: 1 }
  next()
}

export default express.Router()
  .get('/vapid-public-key', (req, res) => res.json({ publicKey: webpush.getPubKey() }))
  .post('/sub', authUser, async (req, res) => {
    const { id } = req.decoded
    const { subscription } = req.body // should be a string
    await authFns.updateUser({ id }, { pnToken: subscription })
    res.json({ status: 'sub'})
  })
  .post('/unsub', authUser, async (req, res) => {
    const { id } = req.decoded
    await authFns.updateUser({ id }, { pnToken: '' })
    res.json({ status: 'unsub'})
  })
  .post('/send/:id', /* authUser, */ async (req, res) => {
    // sending...
    try {
      const { id } = req.params
      const { mode, data = {} } = req.body
      const user = await authFns.findUser({ id })
      let rv = null

      // console.log('FCM TEST', user.pnToken, data.title, data.body)
      if (user && user.pnToken) {
        if (mode === 'FCM') {
          rv = await fcm.send(user.pnToken, data.title || '', data.body || '')
        } else if (mode === 'Webpush') { // Use Webpush
          const options = {
            TTL: 60,
            // headers: {
            //   'Access-Control-Allow-Origin': 'http://127.0.0.1:3000',
            //   'Content-type': 'application/json'
            // },
          } 
          const subscription = JSON.parse(user.pnToken)
          // console.log(id, mode, subscription, data, options)
          rv = await webpush.send(subscription, 'FROM Backend: ' + data, options)
        }
        res.json({ status: 'sent', mode, rv })
      } else {
        res.status(404).json({ status: 'no user or token'})
      }
    } catch (e) {
      console.log(e) // need more info
      res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Send Error: contact admin' : e })
    }
  })
