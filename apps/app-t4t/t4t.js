'use strict'
const express = require('express')
// const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const multer = require('multer')

const svc = require('@es-labs/node/services')
const { memoryUpload } = require('@es-labs/node/express/upload')
const {
  TABLE_CONFIGS_FOLDER_PATH, TABLE_CONFIGS_CSV_SIZE, TABLE_CONFIGS_UPLOAD_SIZE, TABLE_CUSTOM_PATH,
  TABLE_USER_ID_KEY, TABLE_USER_ROLE_KEY, TABLE_ORG_ID_KEY
} = process.env

const {
  noAuthFunc, processJson, roleOperationMatch
} = require('./t4t-utils.js')

const base = require('./t4t-base.js')
const custom = TABLE_CUSTOM_PATH ? require(TABLE_CUSTOM_PATH) : { }
const uploadMemory =  {
  limits: { files : 1, fileSize: Number(TABLE_CONFIGS_CSV_SIZE) || 500000 }
}

const storageUpload = () => {
  return multer({
    // TBD handle errors of missing properties
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const key = file.fieldname
        const { folder } = req.table.fileConfigUi[key]?.multer // console.log('folder, file', folder, file)
        return cb(null, folder)
      },
      filename: (req, file, cb) => cb(null, file.originalname), // file.fieldname, file.originalname
    }),
    fileFilter: (req, file, cb) => {
      // TBD check on individual file size
      const key = file.fieldname
      const { options } = req.table.fileConfigUi[key]?.multer
      if (!req.fileCount) req.fileCount = { }
      if (!req.fileCount[key]) req.fileCount[key] = 0
      const maxFileLimit = options?.limits?.files || 1
      if (req.fileCount[key] >= maxFileLimit) {
        return cb(new Error(`Maximum Number Of Files Exceeded`), false)
      }
      req.fileCount[key]++ // Increment the file count for each processed file
      // TBD validate binary file type... using npm file-type?
      // https://dev.to/ayanabilothman/file-type-validation-in-multer-is-not-safe-3h8l
      // if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
      //   return cb(new Error('Invalid file type!'), false)
      // }
      cb(null, true) // Accept the file
    },
    limits: {
      // files: 3,
      fileSize: Number(TABLE_CONFIGS_UPLOAD_SIZE) || 8000000 // TBD
    }
  })
}

let roleKey = ''
let idKey = ''
let orgIdKey = ''

// __key is reserved property for identifying row in a table
// | is reserved for seperating columns that make the multiKey
const generateTable = async (req, res, next) => { // TODO get config info from a table
  try {
    const tableKey = req.params.table // 'books' // its the table name also

    // const docPath = path.resolve(__dirname, `./tables/${tableKey}.yaml`)
    const docPath = TABLE_CONFIGS_FOLDER_PATH + `${tableKey}.yaml`
    const doc = yaml.load(fs.readFileSync(docPath, 'utf8'))
    req.table = JSON.parse(JSON.stringify(doc))

    // generated items
    req.table.pk = ''
    req.table.multiKey = []
    req.table.required = []
    req.table.auto = []
    req.table.fileConfigUi = {}

    const { database, filename } = svc.get(req?.table?.conn)?.client?.config?.connection || {}
    req.table.db = database || filename || 'DB Not Found'

    // permissions settings
    req.table.view = roleOperationMatch(req.decoded[roleKey], req.table.view)
    const acStr = '/autocomplete'
    const acLen = acStr.length
    if (req.path.substring(req.path.length - acLen) === acStr) {
      console.log('auto complete here...')
      return next()
    }
    req.table.create = roleOperationMatch(req.decoded[roleKey], req.table.create)
    req.table.update = roleOperationMatch(req.decoded[roleKey], req.table.update)
    req.table.delete = roleOperationMatch(req.decoded[roleKey], req.table.delete)
    req.table.import = roleOperationMatch(req.decoded[roleKey], req.table.import)
    req.table.export = roleOperationMatch(req.decoded[roleKey], req.table.export)

    // sanitize
    req.table.deleteLimit = Number(req.table.deleteLimit) || -1

    // can return for autocomplete... req.path
    const cols = req.table.cols
    for (let key in cols) {
      const col = cols[key]
      if (col.auto) {
        if (col.auto === 'pk') {
          req.table.pk = key
        } else {
          req.table.auto.push(key)
        }
      }
      if (col.multiKey) req.table.multiKey.push(key)
      if (col.required) req.table.required.push(key)
      if (col?.ui?.tag === 'files') req.table.fileConfigUi[key] = col?.ui

      col.editor = !(col.editor && !roleOperationMatch(req.decoded[roleKey], col.editor, key))
      if (!col.editor && col.edit) col.edit = 'readonly'
      col.creator = !(col.creator && !roleOperationMatch(req.decoded[roleKey], col.creator, key))
      if (!col.creator && col.add) col.add = 'readonly'
    }
    // console.log(req.table)
    return next()
  } catch (e) {
    return res.status(500).json({ error: e.toString() })
  }
}

const routes = (options) => {
  const authUser = options?.authFunc || noAuthFunc
  roleKey = TABLE_USER_ROLE_KEY
  idKey = TABLE_USER_ID_KEY
  orgIdKey = TABLE_ORG_ID_KEY

  return express.Router()
  .get('/healthcheck', (req, res) => res.send('t4t ok - 0.0.1'))
  .get('/config/:table', authUser, generateTable, async (req, res) => {
    if (!req.table.view) throw 'Forbidden - Table Info'
    res.json(req.table) // return the table info...
  })
  .post('/autocomplete/:table', authUser, generateTable, async (req, res) => {
    let rows = {}
    const { table } = req

    let { key, text, search, parentTableColName, parentTableColVal, limit = 20 } = req.body
    // TBD use key to parentTable Col

    const query = svc.get(table.conn)(table.name).where(key, 'like', `%${search}%`).orWhere(text, 'like', `%${search}%`)
    if (parentTableColName && parentTableColVal !== undefined) query.andWhere(parentTableColName, parentTableColVal) // AND filter - OK
    rows = await query.clone().limit(limit) // TODO orderBy
    rows = rows.map(row => {
      const textKeys = text?.split(',')
      const texts = []
      for (const tk of textKeys) {
        if (table.cols[tk]) {
          texts.push({
            type: 'string', // table.cols[tk].type || 'string', // should be using dependent table...
            value: row[tk]
          })
        }
      }
      return {
        key: row[key],
        text: texts.length ? texts : [{ type: 'string', value: 'ERROR' }], // text ? row[text] : row[key]
        // text: text ? row[text] : row[key],
      }
    })
    res.json(rows)
  })
  .get('/find/:table', authUser, generateTable, async (req, res) => { // page is 1 based
    return custom[req?.table?.name]?.find ? custom[req.table.name].find(req, res) : base.find(req, res)
  })
  .get('/find-one/:table', authUser, generateTable, async (req, res) => {
    return custom[req?.table?.name]?.findOne ? custom[req.table.name].findOne(req, res) : base.findOne(req, res)
  })
  .patch('/update/:table{/:id}',
    authUser,
    generateTable,
    storageUpload().any(), // TBD what about multiple files? also need to find the column involved...
    processJson,
    async (req, res) => {
    return custom[req?.table?.name]?.update ? custom[req.table.name].update(req, res) : base.update(req, res)
  })
  .post('/create/:table',
    authUser,
    generateTable,
    storageUpload().any(),
    processJson, async (req, res) => {
    return custom[req?.table?.name]?.create ? custom[req.table.name].create(req, res) : base.create(req, res)
  })
  .post('/remove/:table', authUser, generateTable, async (req, res) => {
    return custom[req?.table?.name]?.remove ? custom[req.table.name].remove(req, res) : base.remove(req, res)
  })
  .post('/upload/:table', authUser, generateTable, memoryUpload(uploadMemory).single('csv-file'), async (req, res) =>
    custom[req?.table?.name]?.upload ? custom[req?.table?.name]?.upload(req, res) : base.upload(req, res)
  )

  // delete file
  // export async function deleteFile(filePath) {
  //   fs.unlink(filePath, e => {
  //     if (e) console.log(e)
  //     else console.log(filePath +' deleted!')
  //   })  
  // }
}

module.exports = routes
