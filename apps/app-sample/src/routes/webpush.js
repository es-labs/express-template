import express from 'express';
import {
  // authUser,
  authFns,
} from '@common/node/auth/index';
import * as webpush from '@common/node/comms/webpush';

console.log('WARNING Auth bypass in webpush.js');

const authUser = (req, res, next) => {
  req.decoded = { id: 1 };
  next();
};

export default express
  .Router()
  .get('/vapid-public-key', (req, res) => res.json({ publicKey: webpush.getPubKey() }))
  .post('/sub', authUser, async (req, res) => {
    const { id } = req.decoded;
    const { subscription } = req.body; // should be a string
    await authFns.updateUser({ id }, { pnToken: subscription });
    res.json({ status: 'sub' });
  })
  .post('/unsub', authUser, async (req, res) => {
    const { id } = req.decoded;
    await authFns.updateUser({ id }, { pnToken: '' });
    res.json({ status: 'unsub' });
  })
  .post(
    '/send/:id',
    /* authUser, */ async (req, res) => {
      // sending...
      const { id } = req.params;
      const { mode, data = {} } = req.body;
      const user = await authFns.findUser({ id });
      let rv = null;

      if (user?.pnToken) {
        const options = {
          TTL: 60,
          // headers: {
          //   'Access-Control-Allow-Origin': 'http://127.0.0.1:3000',
          //   'Content-type': 'application/json'
          // },
        };
        const subscription = JSON.parse(user.pnToken);
        // console.log(id, mode, subscription, data, options)
        rv = await webpush.send(subscription, `FROM Backend: ${JSON.stringify(data)}`, options);
        res.json({ status: 'sent', mode, rv });
      } else {
        res.status(404).json({ status: 'no user or token' });
      }
    },
  );
