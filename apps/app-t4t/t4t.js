'use strict'
const express = require('express')
// const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const csvParse = require('csv-parse')
const { Parser } = require('@json2csv/plainjs')
const multer = require('multer')

const svc = require('@es-labs/node/services')
const { memoryUpload } = require('@es-labs/node/express/upload')
const {
  TABLE_CONFIGS_FOLDER_PATH, TABLE_CONFIGS_CSV_SIZE, TABLE_CONFIGS_UPLOAD_SIZE, TABLE_CUSTOM_PATH,
  TABLE_USER_ID_KEY, TABLE_USER_ROLE_KEY, TABLE_ORG_ID_KEY
} = process.env

const {
  noAuthFunc, isInvalidInput, processJson, roleOperationMatch, mapRelation, formUniqueKey, kvDb2Col, setAuditData
} = require('./t4t-utils.js')
const { table } = require('console')

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
    const hasVirtual = tableKey.includes('_virtual'); // check this _virtual postfix for table that has mirroring 'view' for self relation

    const tableName = hasVirtual ? tableKey.replace(/_virtual$/, '') : tableKey;
    console.log("tableName",tableName);

    // const docPath = path.resolve(__dirname, `./tables/${tableKey}.yaml`)
    const docPath = TABLE_CONFIGS_FOLDER_PATH + `${tableName}.yaml`
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
  .post('/autocomplete/:table', authUser, generateTable, async (req, res) => {
    let rows = {}
    const { table } = req

    let { key, text, search, parentTableColName, parentTableColVal, limit = 20 } = req.body
    // TBD use key to parentTable Col

    const query = svc.get(table.conn)(table.name).where(key, 'like', `%${search}%`).orWhere(text, 'like', `%${search}%`)
    if (parentTableColName && parentTableColVal !== undefined) query.andWhere(parentTableColName, parentTableColVal) // AND filter - OK
    rows = await query.clone().limit(limit) // TODO orderBy
    rows = rows.map(row => ({
      key: row[key],
      text: text ? row[text] : row[key]
    }))
    res.json(rows)
  })
  .get('/config/:table', authUser, generateTable, async (req, res) => {
    if (!req.table.view) throw 'Forbidden - Table Info'
    res.json(req.table) // return the table info...
  })
  .get('/find/:table', authUser, generateTable, async (req, res) => { // page is 1 based
    if (!req.table.view) throw new Error('Forbidden - List All')
    const { table } = req
    let { page = 1, limit = 25, filters = null, sorter = null, csv = '' } = req.query
    page = parseInt(page) // 1-based
    limit = parseInt(limit)
    // console.log('t4t filters and sort', filters, sorter, table.name, page, limit)
    filters = JSON.parse(filters ? filters : null) // ignore where col === null, sort it 'or' first then 'and' // [ { col, op, val, andOr } ]
    sorter = JSON.parse(sorter ? sorter : '[]') // [ { column, order: 'asc' } ] / [] order = asc, desc
    if (req.table?.defaultSort && sorter.length === 0 && req.table.defaultSort.length > 0) {
      sorter = req.table.defaultSort
    }
    if (page < 1) page = 1
    let rv = { results: [], total: 0 }
    let rows
    let query = null

    let columns = [`${table.name}.*`]
    if (table.select) columns = table.select.split(',') // custom columns... TODO need to add table name?

    query = svc.get(table.conn)(table.name)
    query = query.where({})

    // TODO handle filters for joins...
    let prevFilter = {}
    const joinCols = {}
    if (filters && filters.length) for (let filter of filters) {
      const key = filter.col
      const op = filter.op
      const value = op === 'like' ? `%${filter.val}%` : filter.val
      let _key = `${table.name}.${key}`
      if (prevFilter.andOr || prevFilter.andOr === 'and') query = query.andWhere(_key, op, value)
      else query = query.orWhere(_key, op, value)
      prevFilter = filter
    }
    if (limit === 0 || csv) {
      rows = await query.clone().orderBy(sorter)
      rv.total = rows.length
    } else {
      let total = await query.clone().count()
      rv.total = Object.values(total[0])[0]
      const maxPage = Math.ceil(rv.total / limit)
      if (page > maxPage) page = maxPage

      for (let key in table.cols) {
        const rel = mapRelation(key, table.cols[key])
        if (rel) { // if has relation and is key-value
          const { table2, table2Id, table2Text, table1Id } = rel
          query = query.leftOuterJoin(table2, table.name + '.' + table1Id, '=', table2 + '.' + table2Id) // handles joins...
          const joinCol = table1Id + '_' + table2Text
          joinCols[table1Id] = joinCol
          columns = [...columns, table2 + '.' + table2Text + ' as ' + joinCols[table1Id]] // add a join column
        }
      }
      rows = await query.clone().column(...columns).orderBy(sorter).limit(limit).offset((page > 0 ? page - 1 : 0) * limit)
      rows = rows.map((row) => kvDb2Col(row, joinCols, table.cols))
    }
    if (csv) {
      const parser = new Parser({})
      const csvRows = parser.parse(rows)
      return res.json({ csv: csvRows })
    } else {
      rv.results = rows.map(row => { // make column for UI to identify each row
        if (table.pk) {
          row.__key = row[table.pk]
        } else {
          const val = []
          for (let k of table.multiKey) val.push(row[k])
          row.__key = val.join('|')
        }
        return row
      })
      return res.json(rv) 
    }
  })
  .get('/find-one/:table', authUser, generateTable, async (req, res) => {
    if (!req.table.view) throw new Error('Forbidden - List One')
    const { table } = req
    const where = formUniqueKey(table, req.query.__key)
    if (!where) return res.status(400).json({}) // bad request
    let rv = {}
    let columns = [`${table.name}.*`]
    if (table.select) columns = table.select.split(',') // custom columns... TODO need to add table name?
    let query = svc.get(table.conn)(table.name).where(where)  
    const joinCols = {}
    for (let key in table.cols) {
      const col = table.cols[key]
      const rel = mapRelation(key, table.cols[key])
      if (rel) { // if has relation and is key-value
        const { table2, table2Id, table2Text, table1Id } = rel
        query = query.leftOuterJoin(table2, table.name + '.' + table1Id, '=', table2 + '.' + table2Id) // handles joins...
        const joinCol = table1Id + '_' + table2Text
        joinCols[table1Id] = joinCol
        columns = [...columns, table2 + '.' + table2Text + ' as ' + joinCol] // add a join colomn
      }
    }
    rv = await query.column(...columns).first()
    rv = rv ? kvDb2Col(rv, joinCols, table.cols) : null // return null if not found
    return res.status(rv ? 200 : 404).json(rv)  
  })
  .patch('/update/:table/:id?',
    authUser,
    generateTable,
    storageUpload().any(), // TBD what about multiple files? also need to find the column involved...
    processJson,
    async (req, res) => {
    if (!req.table.update) throw new Error('Forbidden - Update')
    const { body, table } = req
    const where = formUniqueKey(table, req.query.__key)
    let count = 0

    if (!where) return res.status(400).json({}) // bad request
    for (const key in table.cols) { // formally used table.cols, add in auto fields?
      if (body[key] !== undefined) {
        const col = table.cols[key]
        if (!col.editor) delete body[key]
        else if (col?.hide === 'blank' && !body[key]) delete body[key]
        else {
          const invalid = isInvalidInput(col, body[key])
          if (invalid) return res.status(400).json(invalid)
          if (col.auto && col.auto === 'user') {
            body[key] = req?.decoded?.id || 'unknown'
          } else if (col.auto && col.auto === 'ts') {
            body[key] = (new Date()).toISOString()
          } else {
            // TRANSFORM INPUT
            body[key] = ['integer', 'decimal'].includes(col.type) ? Number(body[key])
            : ['datetime', 'date', 'time'].includes(col.type) ? (body[key] ? new Date(body[key]) : null)
            : body[key]
          }
        }
      }
    }
    if (Object.keys(body).length) { // update if there is something to update
      // TBD delete all related records in other tables?
      // TBD delete images for failed update?
	  	const trx = await svc.get(table.conn).transaction()
		  try {
			  count = await svc.get(table.conn)(table.name).update(body).where(where).transacting(trx)
        if (table.audit) {
          const audit = setAuditData(req, 'UPDATE', req.query.__key, body)
			    await svc.get(table.conn)('audit_logs').insert(audit).transacting(trx)
        }
        await trx.commit()
		  } catch (e) {
		    await trx.rollback()
        throw e
		  }
    }
    if (!count) {
      // nothing was updated..., if (table.upsert) do insert ?
    }
    return res.json({ count })
  })
  .post('/create/:table',
    authUser,
    generateTable,
    storageUpload().any(),
    processJson, async (req, res) => {
    if (!req.table.create) throw new Error('Forbidden - Create')
    const { table, body } = req
    for (let key in table.cols) {
      const col = table.cols[key]
      if (!col.creator) delete body[key]
      else if (col.auto && col.auto === 'pk' && key in body) delete body[key]
      else {
        const invalid = isInvalidInput(col, body[key])
        if (invalid) return res.status(400).json(invalid)
        if (col.auto && col.auto === 'user') {
          body[key] = req?.decoded?.id || 'unknown'
        } else if (col.auto && col.auto === 'ts') {
          body[key] = (new Date()).toISOString()
        } else {
          // TRANSFORM INPUT
          body[key] = ['integer', 'decimal'].includes(table.cols[key].type) ? Number(body[key])
          : ['datetime', 'date', 'time'].includes(table.cols[key].type) ? (body[key] ? new Date(body[key]) : null)
          : body[key]
        }
      }
    }
    let rv = null
  	const trx = await svc.get(table.conn).transaction()
		try {
      let query = svc.get(table.conn)(table.name).insert(body)
      if (table.pk) query = query.returning(table.pk)
      rv = await query.clone().transacting(trx)
      if (table.audit) {
        const audit = setAuditData(req, 'INSERT', '', body)
        await svc.get(table.conn)('audit_logs').insert(audit).transacting(trx)
      }
      await trx.commit()
		} catch (e) {
		  await trx.rollback()
      throw e
		}
    // let rv = null
    // let query = svc.get(table.conn)(table.name).insert(body)
    // if (table.pk) query = query.returning(table.pk)
    // rv = await query.clone()
    // const recordKey = rv?.[0] // id - also... disallow link tables input... for creation
    return res.status(201).json(rv)
  })
  .post('/remove/:table', authUser, generateTable, async (req, res) => {
    if (!req.table.delete) throw new Error('Forbidden - Delete')
    const { table } = req
    const { ids } = req.body
    if (table.deleteLimit > 0 && ids.length > table.deleteLimit) return res.status(400).json({ error: `Select up to ${table.deleteLimit} items` })
    if (ids.length < 1) return res.status(400).json({ error: 'No item selected' })

    // TODO delete relations junction, do not delete if value is in use...
	  const trx = await svc.get(table.conn).transaction()
  	try {
      if (table.pk || table.multiKey.length === 1) { // delete using pk
        const keyCol = table.pk || table.multiKey[0]
        await svc.get(table.conn)(table.name).whereIn(keyCol, ids).delete().transacting(trx)
      } else {
        const keys = ids.map(id => {
          let id_a = id.split('|')
          const multiKey = {}
          for (let i=0; i<id_a.length; i++) {
            const keyName = table.multiKey[i]
            multiKey[keyName] = id_a[i]
          }
          console.log('multiKey', multiKey); // AARON
          return svc.get(table.conn)(table.name).where(multiKey).delete().transacting(trx)
        })
        await Promise.allSettled(keys)
      }
      if (table.audit) {
        const audit = setAuditData(req, 'DELETE', ids.join(','))
        await svc.get(table.conn)('audit_logs').insert(audit).transacting(trx)
      }
      await trx.commit()
      return res.json({
        deletedRows: ids.length
      })
    } catch (e) {
      console.log(e) // TBD
      await trx.rollback()
      throw e
    }
  })
  .post('/upload/:table', authUser, generateTable, memoryUpload(uploadMemory).single('csv-file'), async (req, res) => {
    const { table } = req
    if (custom[table.name]?.upload) {
      return custom[table.name]?.upload(req, res);
    }
    if (!table.import) throw new Error('Forbidden - Upload')
    const csv = req.file.buffer.toString('utf-8')
    const output = []
    let errors = []
    let keys = []
    let line = 0
    let columnsError = false // flag as true
    const keyMap = {}
    csvParse.parse(csv)
      .on('error', (e) => console.error(e.message))
      .on('readable', function () {
        let record
        while ( (record = this.read()) ) {
          line++
          if (line === 1) {
            keys = [...record]
            keys.forEach(key => keyMap[key] = true)
            for (const k in table.cols) {
              if (
                table.cols[k].required && !keyMap[k] // required column not present
                || keyMap[k] && table.cols[k].type === 'link' // columns is a link
                || keyMap[k] && table.cols[k].auto // columns is auto
              ) {
                errors.push(`-1,Fatal Error: missing required column/s or invalid column/s`)
                columnsError = true;
                break;
              }
            }
            continue // ignore first line
          }
          if (!columnsError) {
            if (record.length === keys.length) { // ok
              if (record.join('')) {
                // TODO format before push?
                output.push(record)
              } else {
                errors.push(`${line},Empty Row`)
              }
            } else {
              errors.push(`${line},Column Count Mismatch`)
            }
          }
        }
      })
      .on('end', async () => {
        let _line = 0
        const writes = []
        for (let row of output) {
          _line++
          try {
            const obj = {}
            for (let i=0; i<keys.length; i++) {
              const colName = keys[i]
              // const col = table.cols[colName]
              // isInvalidInput(col, row[i]) // TODO: should add validation here?
              // TODO: also take care of auto populating fields?
              // TODO: handle datetime local data...
              obj[ colName ] = row[i]
            }
            writes.push(svc.get(table.conn)(table.name).insert(obj))
          } catch (e) {
            errors.push(`L2-${_line},`+'Caught exception: ' + e.toString())
          }
        }
        try {
          if (writes.length) {
            const rv = await Promise.allSettled(writes) // [ { status !== 'fulfilled', reason } ]
            rv.forEach((result, index) => {
              if (result.status !== 'fulfilled') errors.push(`L3-${index + 1},${result.reason}`)
            })
          }
        } catch (e) {
          errors.push('-2,General write error: ' + e.toString())
        }
        try {
          if (table.audit) {
            const audit = setAuditData(req, 'UPLOAD', '', { csv_data: JSON.stringify(output, null, 2), errors: JSON.stringify(errors, null, 2) })
            await svc.get(table.conn)('audit_logs').insert(audit)
          }
        } catch (e) {
          console.log('error writing to audit table')
        }
        return res.status(200).json({ errorCount: errors.length, errors })
      })
  })

  // delete file
  // export async function deleteFile(filePath) {
  //   fs.unlink(filePath, e => {
  //     if (e) console.log(e)
  //     else console.log(filePath +' deleted!')
  //   })  
  // }
}

module.exports = routes
