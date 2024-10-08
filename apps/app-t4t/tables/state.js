module.exports = {
  conn: 'knex',
  name: 'state',
  create: false,
  update: false,
  delete: 0,
  import: true,
  export: true,
  multiSelect: true,
  cols: {
    id: {
      label: 'ID',
      auto: 'pk',
      hide: true,
      add: 'hide',
      edit: 'readonly'
    },
    country_name: {
      label: 'Code',
      type: 'string',
      ui: {
        tag: 'input'
      },
    },
    code: {
      label: 'Code',
      type: 'string',
      ui: {
        tag: 'input'
      },
    },
    name: {
      label: 'Name',
      type: 'string',
      ui: {
        tag: 'input'
      },
    }
  },
  pk: '',
  multiKey: [],
  required: [],
  auto: [],
  nonAuto: []
}
