'use strict'
// const path = require('path')
// path.extname('index.html')
// returns '.html'
// req.file / req.files[index]
// {
//   fieldname: 'kycfile',
//   originalname: 'todo.txt',
//   encoding: '7bit',
//   mimetype: 'text/plain',
//   destination: 'uploads/',
//   filename: 'kycfile-1582238409067',
//   path: 'uploads\\kycfile-1582238409067',
//   size: 110
// }

const multer = require('multer')

const memoryUpload = (options) => multer( Object.assign({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: 500000 }
}, options) )

// TBD

const storageUpload = ({ folder, options }) => {
  // validate binary file type... using npm file-type?
  // https://dev.to/ayanabilothman/file-type-validation-in-multer-is-not-safe-3h8l
  // const fileFilter = (req, file, cb) => {
  //   if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
  //     cb(null, true);
  //   } else {
  //     cb(new Error('Invalid file type!'), false)
  //   }
  // }
  return multer(Object.assign({
    storage: multer.diskStorage({
      // fileFilter
      destination: (req, file, cb) => cb(null, folder),
      filename: (req, file, cb) => cb(null, file.originalname) // file.fieldname, file.originalname
    }),
    limits: { files: 1, fileSize: 8000000 }
  }, options))
}

module.exports = {
  memoryUpload,
  storageUpload,
}
