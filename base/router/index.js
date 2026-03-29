import express from "express";
import baseRouter from "./base.js";

const router = express.Router();

// TODO Future Enhancement... using config file
export default function(app) {
  app.use('/api',
    router.use('/', baseRouter)
  )
}
