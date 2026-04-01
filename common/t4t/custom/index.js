import csvParse from "csv-parse";
import * as svc from "@es-labs/jslib/services";
import {
  setAuditData
} from "../t4t-utils.js";

// custom function demo
// when country table is uploaded, state data is also created (csv needs to have sufficient data for state row)
const upload = async (req, res) => {
  const { table } = req
  if (!table.import) throw new Error('Forbidden - Upload')
  const csv = req.file.buffer.toString('utf-8')
  const output = []
  let errors = []
  let keys = []
  let line = 0
  let columnsError = false
  csvParse.parse(csv)
    .on('error', (e) => console.error(e.message))
    .on('readable', function () {
        let record
        while ( (record = this.read()) ) {
          line++
          if (line === 1) {
            // check headers match...
            const headers = 'code,name,states'
            if (headers !== record.join(',')) {
              errors.push(`-1,Fatal Error: missing column/s`)
              columnsError = true
              break;
            }
            keys = [...record]
            continue // ignore first line
          } else {
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
        }
    })
    .on('end', async () => {
        let line = 0
        const writes = []
        for (let row of output) {
          line++
          try {
            const obj = {}
            obj[ keys[0] ] = row[0]
            obj[ keys[1] ] = row[1]
            const states = row[2].split('|')
            writes.push(svc.get(table.conn)(table.name).insert(obj))
            for (let i=0; i<states?.length; i++) {
              const data = {
                country_name: row[1],
                code: states[i],
                name: states[i],
              }
              writes.push(svc.get(table.conn)('state').insert(data))
            }
          } catch (e) {
            errors.push(`${line},`+'Caught exception: ' + e.toString())
          }
        }
        try {
          if (table.audit) {
            const audit = setAuditData(req, 'UPLOAD', '', { output })
            await svc.get(table.conn)('audit_logs').insert(audit)
          }
          const rv = await Promise.allSettled(writes) // [ { status !== 'fulfilled', reason } ]
          rv.forEach((result, index) => {
            if (result.status !== 'fulfilled') errors.push(`${index + 1},${result.reason}`)
          })
        } catch (e) {
          errors.push('-2,General write error: ' + e.toString())
        }
        return res.status(200).json({ errorCount: errors.length, errors })
    })
}

export default {
  country: {
    upload
  }
}
