import { v4 as uuidv4 } from 'uuid';

export const auditMiddleware = db => {
  return async (req, res, next) => {
    // Adapt these to match your auth middleware output
    const userId = req.user?.id ?? null;
    const tenantId = req.user?.tenantId ?? null; // remove if single-tenant
    const sessionId = req.headers['x-request-id'] ?? req.sessionID ?? null;

    req.dbTransaction = callback =>
      db.transaction(async trx => {
        // One UUID links all audit_log rows from this transaction together
        const txId = uuidv4();

        // set_config with true = SET LOCAL
        // Scoped to this transaction — clears on commit or rollback
        await trx.raw(
          `
          SELECT
            set_config('app.current_user_id',   ?, true),
            set_config('app.current_tenant_id', ?, true),
            set_config('app.session_id',        ?, true),
            set_config('app.transaction_id',    ?, true)
        `,
          [userId ?? '', tenantId ?? '', sessionId ?? '', txId],
        );

        return callback(trx);
      });

    next();
  };
};

// simple id/ids
// await hardDelete(trx, 'orders', [42, 43], 'reason')
// composite key
// await hardDelete(trx, 'order_items', [{ order_id: 1, product_id: 7 }, { order_id: 2, product_id: 3 }], 'reason')
export const hardDelete = async (trx, tableName, recordId, reason) => {
  const { rows } = await trx.raw(`SELECT current_setting('app.current_user_id', true) AS uid`);
  const deletedBy = rows[0].uid;

  const ids = Array.isArray(recordId) ? recordId : [recordId];
  const isComposite = ids[0] !== null && typeof ids[0] === 'object';

  // Build whereIn for simple id or composite key
  const buildWhereIn = q => {
    if (isComposite) {
      const keys = Object.keys(ids[0]);
      return q.whereIn(
        keys,
        ids.map(id => keys.map(k => id[k])),
      );
    }
    return q.whereIn('id', ids);
  };

  const records = await buildWhereIn(trx(tableName));

  // Validate all requested records exist
  if (isComposite) {
    const keys = Object.keys(ids[0]);
    const toKey = obj => JSON.stringify(keys.map(k => obj[k]));
    const foundKeys = new Set(records.map(toKey));
    const missing = ids.filter(id => !foundKeys.has(toKey(id)));
    if (missing.length > 0)
      throw new Error(`Records not found in ${tableName}: ${missing.map(id => JSON.stringify(id)).join(', ')}`);
  } else {
    const foundIds = new Set(records.map(r => r.id));
    const missing = ids.filter(id => !foundIds.has(id));
    if (missing.length > 0) throw new Error(`Records not found in ${tableName}: ${missing.join(', ')}`);
  }

  // Serialize record_id — composite keys stored as JSON, simple ids as string
  const toRecordIdStr = isComposite
    ? record => {
        const keys = Object.keys(ids[0]);
        return JSON.stringify(Object.fromEntries(keys.map(k => [k, record[k]])));
      }
    : record => String(record.id);

  await trx('hard_delete_log').insert(
    records.map(record => ({
      table_name: tableName,
      record_id: toRecordIdStr(record),
      deleted_by: deletedBy,
      reason,
      deleted_data: JSON.stringify(record),
    })),
  );

  await buildWhereIn(trx(tableName)).delete();
};
