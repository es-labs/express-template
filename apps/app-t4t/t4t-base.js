const csvParse = require('csv-parse')
const { Parser } = require('@json2csv/plainjs')
const svc = require('@es-labs/node/services')

const {
  isInvalidInput, mapRelation, formUniqueKey, kvDb2Col, setAuditData
} = require('./t4t-utils.js')


exports.upload = async (req, res) => {
  console.log('base upload')
  const { table } = req
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
            // isInvalidInput(col, row[i], key) // TODO: should add validation here?
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
}

exports.find = async (req, res) => {
  if (!req.table.view) throw new Error('Forbidden - List All')
  const { table } = req
  let { page = 1, limit = 25, filters = null, sorter = null, csv = '' } = req.query
  page = parseInt(page) // 1-based
  limit = parseInt(limit)
  // console.log('t4t filters and sort', filters, sorter, table.name, page, limit)
  filters = JSON.parse(filters ? filters : null) // ignore where col === null, sort it 'or' first then 'and' // [ { col, op, val,andOr } ]
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
    let _key = key
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
      // if (table.cols[key]?.link?.display === 'fields') { // .type === 'link'
      //   table.cols[key]?.link?.cfields.split(',').map()
      // }
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
}

exports.findOne = async (req, res) => {
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
}

exports.remove = async (req, res) => {
  if (!req.table.delete) throw new Error('Forbidden - Delete')
  const { table } = req
  const { ids } = req.body
  if (table.deleteLimit > 0 && ids.length > table.deleteLimit) return res.status(400).json({ error: `Select up to ${tabledeleteLimit} items` })
  if (ids.length < 1) return res.status(400).json({ error: 'No item selected' })

  // TODO delete relations junction, do not delete if value is in use... // use Foreign Key...
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
}

exports.update = async (req, res) => {
  if (!req.table.update) throw new Error('Forbidden - Update')
  const { body, table } = req
  const where = formUniqueKey(table, req.query.__key)
  let count = 0

  if (!where) return res.status(400).json({}) // bad request
  for (const key in table.cols) { // formally used table.cols, add in auto fields?
    if (body[key] !== undefined) {
      const col = table.cols[key]
      if (!col.editor) delete body[key]
      else if (col.edit !== true) delete body[key]
      else if (col?.hide === 'blank' && !body[key]) delete body[key]
      else {
        const invalid = isInvalidInput(col, body[key], key)
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
}

exports.create = async (req, res) => {
  if (!req.table.create) throw new Error('Forbidden - Create')
  const { table, body } = req
  for (let key in table.cols) {
    const col = table.cols[key]
    if (!col.creator) delete body[key]
    else if (col.add !== true) delete body[key]
    else if (col.auto && col.auto === 'pk' && key in body) delete body[key]
    else {
      const invalid = isInvalidInput(col, body[key], key)
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
}
