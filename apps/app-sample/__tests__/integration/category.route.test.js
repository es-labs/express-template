// TBD import config
import express from 'express';
// import { describe, it, before, after, beforeEach } from "node:test";
// import assert from "node:assert";
// import request from "supertest";
// import newCategory from "../mock-data/new-category.json";
// import path from "path";

const app = express();
// let services
// let createdCategoryId
const authObj = {};
// let endpointUrl

/*
// beforeAll
before(async () => {
  require('@es-labs/jslib/express/init')() // TODELETE require(path.join(process.cwd(), 'common', 'init'))()
  require('@es-labs/jslib/express/preRoute')(app, express) // TODELETE require(path.join(process.cwd(), 'common', 'preRoute'))(app, express)
  process.env.WS_PORT = '' // disable websocket for now

  require(path.join(process.cwd(), 'apps', 'apploader'))(app)
  require(path.join(process.cwd(), 'router'))(app)

  services = require('@es-labs/jslib/services')
  authService = require('@es-labs/jslib/auth')
  // await services.start()
  // authService.setup(services.get("keyv"), services.get("knex1"));
  // const tokens = await authService.createToken({ id: 100, groups: 'TestGroup' })
  // authObj = {
  //   Authorization: `Bearer ${tokens.access_token}`,
  //   refresh_token: tokens.refresh_token
  // }
  endpointUrl = `/api/app-sample/categories/categories`
})
// afterAll
after(async () => {
  // await services.stop()
})

/*
describe.only('Testing Categories Endpoint URL', () => {
  it('Always Pass', async () => expect(1).toBe(1))

  it.only('GET categories', async () => {
    console.log('>>>>>>>>>>>>>>', endpointUrl)
    const response = await request(app)
      // .get('/api/app-sample/categories/categories')
      // .get('/api/app-sample/healthcheck')
      // .get('/api/healthcheck')
      .get(endpointUrl)
      .set(authObj)
    expect(response.statusCode).toBe(200)
    // expect(Array.isArray(response.body.results)).toBeTruthy()
    // expect(response.body.results).toBeDefined()
    // expect(response.body.total).toBeDefined()
    // firstTodo = response.body[0]
  })

  it('GET ' + endpointUrl, async () => {
    const response = await request(app)
      .get(endpointUrl)
      .set(authObj)
    expect(response.statusCode).toBe(200)
    // expect(Array.isArray(response.body.results)).toBeTruthy()
    // expect(response.body.results).toBeDefined()
    // expect(response.body.total).toBeDefined()
    // firstTodo = response.body[0]
  })
  // TODO 500 error for get
  it('POST ' + endpointUrl, async () => {
    const response = await request(app)
      .post(endpointUrl)
      .set(authObj)
      .send(newCategory)
    expect(response.statusCode).toBe(201)
    // expect(response.body.name).toBe(newCategory.name)
    createdCategoryId = response.body.id
  })
  // TODO 500 error for post

  it('GET by Id ' + endpointUrl + ':id', async () => { // 200
    const response = await request(app)
      .get(endpointUrl + '/' + createdCategoryId) // createdCategoryId
      .set(authObj)
    expect(response.statusCode).toBe(200)
    // expect(response.body.name).toBe(newCategory.name)
  })
  it('GET by Id ' + endpointUrl + ':id', async () => { // 404
    const response = await request(app)
      .get(endpointUrl + '/0')
      .set(authObj)
    expect(response.statusCode).toBe(404)
  })
  // TODO 500 error for get/:id

  it('PATCH by Id ' + endpointUrl + ':id', async () => {
    const response = await request(app)
      .patch(endpointUrl + '/' + 1) // createdCategoryId
      .set(authObj)
      .send({ name: 'aa' })
      // .field('filex','')
      // .field('docx',JSON.stringify({ name: 'author1' }))
    expect(response.statusCode).toBe(200)
    // expect(response.body.name).toBe('author1')
  })
  it('PATCH by Id ' + endpointUrl + ':id', async () => {
    const response = await request(app)
      .patch(endpointUrl + '/0')
      .set(authObj)
      .send({ name: 'bb' })
      // .field('filex','')
      // .field('docx',JSON.stringify({ name: 'author1' }))
    expect(response.statusCode).toBe(404)
  })
  // TODO 500 error for patch/:id

  it('DELETE by Id ' + endpointUrl + ':id', async () => { // 200
    const response = await request(app)
      .delete(endpointUrl + '/' + createdCategoryId)
      .set(authObj)
      .send()
    expect(response.statusCode).toBe(200)
  })
  it('DELETE by Id ' + endpointUrl + ':id', async () => { // 404
    const response = await request(app)
      .delete(endpointUrl + '/0')
      .set(authObj)
      .send()
    expect(response.statusCode).toBe(404)
  })
  // TODO 500 error for delete
})

describe.only('Integration Test', () => {
  it.only('should pass', () => {
    assert.strictEqual(true, true)
  })
})
*/
