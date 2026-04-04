import express from 'express';
import { authUser } from '@common/node/auth/index';
import categoryController from '../controllers/category.js';

export default express
  .Router()
  .post('/categories', authUser, categoryController.create)
  .patch('/categories/:id', authUser, categoryController.update)
  .get('/categories/:id', authUser, categoryController.findOne)
  .get('/categories', authUser, categoryController.find)
  .delete('/categories/:id', authUser, categoryController.remove);
// .delete('/:id', authUser, categoryController.remove)
