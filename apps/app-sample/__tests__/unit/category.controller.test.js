import '@common/node/config'; // setup env vars
import assert from 'node:assert';
// TODO testing websockets using native node testing
import { after, before, beforeEach, describe, it } from 'node:test';
// import newCategory from '../mock-data/new-category.json';
import * as Services from '@common/node/services';
import httpMocks from 'node-mocks-http';
import CategoryController from '../../src/controllers/category.js';

let services;
// let createdCategoryId;
let categoryController;
let req, res, next;

beforeEach(() => {
  req = httpMocks.createRequest();
  res = httpMocks.createResponse();
  next = null; // jest.fn()
});

// beforeAll
before(async () => {
  services = Services;
  await services.start();
  categoryController = CategoryController;
});
// afterAll
after(async () => {
  await services.stop();
});

/*
describe('categoryController.create', () => {
  beforeEach(() => {
    req.body = newCategory
  })
  it('should have categoryController.create()', () => {
    expect(typeof categoryController.create).toBe('function')
  })
  it('should return 201 response code and created data JSON in body', async () => {
    await categoryController.create(req, res)
    expect(res.statusCode).toBe(201)
    expect(res._isEndCalled()).toBeTruthy()
    createdCategoryId = res._getJSONData().id
  })
  // it('should return JSON body in response', async () => {
  //   TodoModel.create.mockReturnValue(newTodo)
  //   await TodoController.createTodo(req, res)
  //   expect(res._getJSONData()).toStrictEqual(newTodo)
  // })
  // it('should handle JSON body error', async () => {
  //   const errorMessage = 'create todo error'
  //   const rejectedPromise = Promise.reject(errorMessage)
  //   TodoModel.create.mockReturnValue(rejectedPromise)
  //   await TodoController.createTodo(req, res)
  //   expect(next).toBeCalledWith(errorMessage)
  // })
})

describe('categoryController.findOne', () => {
  it('Always Pass', async () => expect(1).toBe(1))

  it('should have categoryController.findOne()', () => { // function exists
    expect(typeof categoryController.findOne).toBe('function')
  })
  // cannot test Model
  it('should return status 200 and JSON body', async () => { // 200
    req.params.id = createdCategoryId
    await categoryController.findOne(req, res)
    expect(res.statusCode).toBe(200)
    // expect(res._isEndCalled()).toBeTruthy()
    // expect(typeof res._getJSONData()).toBe('object')
  })
  it('should return 404 if id does not exist', async () => { // 404
    req.params.id = 0
    await categoryController.findOne(req, res)
    // expect(res._isEndCalled()).toBeTruthy()
    expect(res.statusCode).toBe(404)
  })
  // 500 error not able to cover?
})

describe('categoryController.update', () => {
  it('should have categoryController.update()', () => {
    expect(typeof categoryController.update).toBe('function')
  })
  it('should return a response with json data and http code 200', async () => {
    req.params.id = createdCategoryId
    req.body = { name: 'CatA' }
    await categoryController.update(req, res)
    expect(res.statusCode).toBe(200)
    // expect(res._isEndCalled()).toBeTruthy()
    // expect(res._getJSONData().name).toBe('abc')
  })
  it('should return 404 if id does not exist', async () => {
    req.params.id = 0
    req.body = { name: 'CatB' }
    await categoryController.update(req, res)
    expect(res.statusCode).toBe(404)
    // expect(res._isEndCalled()).toBeTruthy()
  })
  // 500 error not able to cover?
})

describe('categoryController.remove', () => {
  it('should have a categoryController.remove function', () => {
    expect(typeof categoryController.remove).toBe('function')
  })
  it('should return status 200', async () => {
    req.params.id = createdCategoryId
    await categoryController.remove(req, res)
    expect(res.statusCode).toBe(200)
    // expect(res._isEndCalled()).toBeTruthy()
  })
  it('should return 404 if id does not exist', async () => { // 404
    req.params.id = 0
    await categoryController.remove(req, res)
    expect(res.statusCode).toBe(404)
    // expect(res._isEndCalled()).toBeTruthy()
  })
  // 500 error not able to cover?
})
*/

describe.only('categoryController.find', () => {
  it.only('should have a get function', () => {
    // expect(typeof categoryController.find).toBe('function')
    assert.strictEqual(typeof categoryController.find, 'function');
  });
  it.only('should return status 200 and authors', async () => {
    await categoryController.find(req, res);
    assert.strictEqual(res.statusCode, 200);
    // expect(res.statusCode).toBe(200)
    // expect(res._isEndCalled()).toBeTruthy()
    // expect(res._getJSONData().total).toBeDefined
    // console.log(res._getJSONData())
  });
  // 500 error not able to cover?
});

describe.only('Category Unit Test', () => {
  it.only('should pass', () => {
    assert.strictEqual(true, true);
  });
});
