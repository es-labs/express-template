'use strict'

const fs = require('fs')
const express = require('express')
const { authUser } = require('@es-labs/node/auth')

const { APP_NAME, APP_VERSION, API_PORT, HTTPS_CERTIFICATE } = process.env

module.exports = express.Router({caseSensitive: true})
  /**
   * GET /api/healthcheck
   * @summary Healthcheck endpoint
   * @tags base
   * @return {object} 200 - success response - application/json
   */
  .get('/healthcheck', (req, res) => res.json({ message: 'OK', app: APP_NAME, environment: process.env.NODE_ENV, version: APP_VERSION, port: API_PORT, https: Boolean(HTTPS_CERTIFICATE) }) ) // health check
  .post('/healthcheck', (req, res) => res.json({ message: 'POST OK' }) ) // POST health check

  /**
   * GET /api/health-auth
   * @summary Healthcheck auth endpoint
   * @tags base
   * @security BasicAuth
   * @return {object} 200 - success response - application/json
   */
  .get('/health-auth', authUser, (req, res) => { res.json({ message: 'OK' }) }) // health check auth
 
