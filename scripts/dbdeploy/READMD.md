


## Reference

https://knexjs.org/guide/migrations.html#migration-cli

For migration:up command, each command will execute a single file starting with first.

So if you have 3 files (.js) in the `migrations` folder, you need to run it 3 times

For seed:run command, it will run all seed files (.js) in the `seeds` folder

## Why a seperate node package

when DB could be shared between packages


## Quick Create DB

For [express-template](https://github.com/es-labs/express-template) app-sample

```bash
npx knex --knexfile dbs/express-template-db/knexfile.js migrate:up
npx knex --knexfile dbs/express-template-db/knexfile.js migrate:up # run a second time as there are 2 files to migrate in the folder...
npx knex --knexfile dbs/express-template-db/knexfile.js seed:run
```

Then copy the created file for sqlite DB over to the project `apps\app-sample` folders

## Starting A New DB Deploy

Create and setup configuration

Create a folder for each DB required (e.g. 2 folders for 2 DBs)

**NOTE** assuming a folder called `k2db` has been created for the DB

```bash
npx knex --knexfile k2db/knexfile.js init
```

Edit the generated `knexfile.js` creating connection of each environment



### Migrate

The command below creates migration file for production environment

```bash
# npx knex migrate:make <name> --env <the environment>
# also can use NODE_ENV
npx knex --knexfile knex-sample/knexfile.js migrate:make initial --env development
# knex migrate:latest
# knex migrate:up <name options if not latest>
# knex migrate:down <name options if not latest>
# knex migrate:list
```


### Seed

```bash
# npx knex seed:make <name>
npx knex --knexfile knex-sample/knexfile.js seed:make initial
# knex seed:run
# knex seed:run --specific=seed-filename.js --specific=another-seed-filename.js
```

## TODO

How should the knexfile information be handled in the case where database secrets are in a vault or parameters are passed in as environment variables
