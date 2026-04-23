import type { NextFunction, Request, Response } from 'express';

// ─── Column definition loaded from YAML table config ─────────────────────────

export interface ColDef {
  required?: boolean;
  multiKey?: boolean;
  auto?: string | false;
  editor?: string | boolean;
  edit?: boolean | string;
  creator?: string | boolean;
  add?: boolean | string;
  hide?: 'omit' | 'blank';
  type?: string;
  ui?: {
    tag?: string;
    attrs?: {
      type?: string;
      pattern?: string;
      maxLength?: number;
      maxlength?: number;
      min?: number | string;
      max?: number | string;
    };
    [key: string]: unknown;
  };
  options?: {
    foreignKey?: string;
    tableName?: string;
    key?: string;
    text?: string;
    column?: string;
    joinFromTable?: string;
  };
}

// ─── Table definition built from YAML + middleware augmentation ───────────────

export interface TableDef {
  name: string;
  conn: string;
  pk: string;
  multiKey: string[];
  required: string[];
  auto: string[];
  cols: Record<string, ColDef>;
  view: string | boolean;
  create: string | boolean;
  update: string | boolean;
  delete: string | boolean;
  import: string | boolean;
  export: string | boolean;
  select?: string;
  defaultSort?: unknown[];
  deleteLimit: number;
  fileConfigUi: Record<string, unknown>;
  db: string;
}

// ─── Relation metadata returned by mapRelation ────────────────────────────────

export interface RelationDef {
  table2: string;
  table2Id: string;
  table2Text: string;
  table1Id: string;
  tableJoinFrom: string;
  table2Column: string;
}

// ─── Express Request extended with t4t table context ─────────────────────────

export interface T4TRequest extends Request {
  table: TableDef;
  fileCount?: Record<string, number>;
}

// ─── Internal types ───────────────────────────────────────────────────────────

type InvalidInputResult = { status: string; message: string; key?: string | null } | false;

interface AuditData {
  user: string;
  timestamp: Date;
  db_name: string;
  table_name: string;
  op: string;
  where_cols: string;
  where_vals: string;
  cols_changed: string;
  prev_values: string;
  new_values: string;
}

// ─── Exported utilities ───────────────────────────────────────────────────────

export const noAuthFunc = (_req: Request, res: Response, _next: NextFunction): void => {
  const message = 'no user auth middleware set';
  res.status(500).send(message);
};

export const isInvalidInput = (col: ColDef, val: unknown, key: string | null = null): InvalidInputResult => {
  const inputTypeNumbers = ['number', 'range', 'date', 'datetime-local', 'month', 'time', 'week'];
  const inputTypeText = ['text', 'tel', 'email', 'password', 'url', 'search'];
  const { ui, required, multiKey } = col;
  // TODO check for required also...
  if (required || multiKey) {
    if (val !== 0 && !val) return { status: 'error', message: `required input` };
  }
  if (ui?.tag === 'input') {
    const attrs = ui?.attrs;
    if (attrs) {
      if (inputTypeText.includes(attrs.type ?? '')) {
        if (attrs.pattern) {
          if (!new RegExp(attrs.pattern).test(val as string)) return { status: 'error', message: `wrong format`, key };
        }
        if (attrs.maxLength) {
          if ((val as string).length > Number(attrs.maxlength))
            return { status: 'error', message: `max length exceeded` };
        }
      } else if (inputTypeNumbers.includes(attrs.type ?? '')) {
        if (Number(val) < Number(attrs.min)) return { status: 'error', message: `min exceeded` };
        if (Number(val) > Number(attrs.max)) return { status: 'error', message: `min exceeded` };
      }
    }
  } else if (ui?.tag === 'select') {
    // TODO if options present, validate with it
  }
  return false;
};

export const processJson = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (req.files) {
    // it is formdata
    let obj = {};
    for (const key in req.body) {
      const part = req.body[key];
      obj = JSON.parse(part);
    }
    req.body = obj;
  }
  next();
};

// both are comma separated strings
export const roleOperationMatch = (role: string, operation: string | boolean, _col: string | null = null): boolean => {
  // logger.info('roleOperationMatch (col, role, operation)', col, role, operation)
  if (typeof operation === 'boolean') return operation;
  const operations = operation.split(',');
  const roles = role.split(',');
  for (const _role of roles) {
    for (const _operation of operations) {
      if (_operation === _role) return true;
    }
  }
  return false;
};

export const formUniqueKey = (table: TableDef, args: string): Record<string, unknown> | null => {
  if (table.pk) return { [`${table.name}.${table.pk}`]: args }; // return for pk
  const where: Record<string, unknown> = {}; // return for multiKey
  const val_a = args.split('|');
  if (val_a.length !== table.multiKey.length) return null; // error numbers do not match
  for (let i = 0; i < val_a.length; i++) {
    if (!val_a[i]) return null;
    const key = table.multiKey[i];
    where[`${table.name}.${key}`] = ['integer', 'decimal'].includes(table.cols[key].type ?? '')
      ? Number(val_a[i])
      : ['datetime', 'date', 'time'].includes(table.cols[key].type ?? '')
        ? new Date(val_a[i])
        : val_a[i];
    // TOREMOVE where[table.name + '.' + key] = val_a[i]
  }
  return Object.keys(where).length ? where : null;
};

export const mapRelation = (_key: string, col: ColDef): RelationDef | null => {
  // foreignKey get from yaml config, so make sure there is foreignKey
  const table1Id = col?.options?.foreignKey;
  const table2 = col?.options?.tableName;
  const table2Id = col?.options?.key;
  const table2Text = col?.options?.text;
  const table2Column = col?.options?.column;
  const tableJoinFrom = col?.options?.joinFromTable;

  if (table2 && table2Id && table2Text && table1Id && tableJoinFrom && table2Column) {
    return { table2, table2Id, table2Text, table1Id, tableJoinFrom, table2Column };
  }
  return null;
};

// for reads
// map a key value of a row from DB read...  to desired output for that key (db field)
export const kvDb2Col = (
  _row: Record<string, unknown>,
  _joinCols: Record<string, string>,
  _tableCols: Record<string, ColDef>,
): Record<string, unknown> => {
  for (const k in _row) {
    if (_tableCols[k]) {
      if (_tableCols[k].hide === 'omit') delete _row[k];
      else if (_tableCols[k].hide === 'blank') _row[k] = '';
      else {
        if (_row[k] instanceof Date) {
          // map date set as ISO String
          _row[k] = (_row[k] as Date).toISOString();
        }
        if (_joinCols[k]) {
          const v = _joinCols[k];
          _row[k] = { key: _row[k], text: _row[v] };
          delete _row[v]; // remove column created by join
        }
      }
    } else {
      logger.info(`Missing Col: ${k}`);
    }
  }
  return _row;
};

export const setAuditData = (
  req: Request,
  op: string,
  keys = '',
  body: Record<string, unknown> | string = '',
): AuditData => ({
  user: (req as T4TRequest)?.user?.sub?.toString() ?? '---',
  timestamp: new Date(),
  db_name: (req as T4TRequest).table.db,
  table_name: (req as T4TRequest).table.name,
  op,
  where_cols: keys ? (req as T4TRequest)?.table?.pk || (req as T4TRequest)?.table?.multiKey?.join('|') || '' : '',
  where_vals: keys,
  cols_changed: typeof body === 'object' ? JSON.stringify(Object.keys(body), null, 2) : '',
  prev_values: '', // TODO
  new_values: typeof body === 'object' ? JSON.stringify(Object.values(body), null, 2) : body.toString(),
});
