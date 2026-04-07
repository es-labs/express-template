## Description

This document is for
- design preferences
- open questions
- caveats
- migration notes
- ideas that are not yet stable policy

### Design
- Fully ES Modules - JS Compliant
- Named exports preferred (default exports for class, config, or a plugin)
- Use Native as much as viable (test runners, datetime, fetch / xhr, npm, git hooks)
- npm workspaces (microservices & shared libraries)
  - apps : microservices or applications
    - default port 3000
  - common/shared code and schemas
  - webs
  - sripts
- web frontends ? to include? can be quite heavy
- use zod for validation and openapi generation...
- automation
  - non-critical
    - commit messages - czg
    - changelog - TODO
    - release - TODO (semver release)
    - code review AI - TODO
  - api documentation
  - unit and integration test generation
- global logger
  - no console log for backend
  - no logs in frontend production, errors sent to Sentry
- biome vs prettier+eslint
- zod
  - validation
  - openapi schema generation
- NO Typescript unless it becomes runtime-native
- testing
  - use native node test runner
  - playwright for e2e testing
- DB audit logging strategy (triggers + soft delete) -TODO
- jsdoc for typing and autocomplete on IDE ?


## precommits

- use biome for formatting and linting

## Secrets Security

- git guardian (use native Github for now)


## TODOS

### linting auto fix

safe - useArrowFunction, useConst
unsafe - useTemplate, useNodejsImportProtocol, useOptionalChain,  

```
npx biome <format/lint/check> common apps webs scripts
npx biome lint common apps webs scripts --only=useTemplate --write --unsafe
```

### logger usage

- apps/* - use backend logger
- webs/* - use frontend logger
- common/iso - both (should be simple files remove console.logs)
- common/node - backend (use backend logger)
- common/vue -frontend VueJS (allow console, remove in prod)
- common/web -frontend plainJS (allow console, remove in prod)
- common/scripts

### comitting

- [czg](https://cz-git.qbb.sh/cli/)
-[conventional commit]()

### Github Related To Read

- https://github.com/settings/security_analysis


### Handling Globals

```js
# Check if namespace exists, if not create it.
globalThis.__myApp = globalThis.__myApp || {};
# Define a unique symbol under a namespace
const _logger = Symbol('logger');
# Attach logger to global namespace using symbol as key
globalThis.__myApp[_logger] = myLogger;
```

Currently we choose to do so without namespace.

## DB

### User accounts

TODO

### Audit logging
- SQL Trigger + soft delete
  - mutable / immutable tables
- or something else?

on:
  push:
    branches: [TODO]
    paths:
      - 'services/auth-service/**'
      - 'shared/**'
      - '.github/workflows/deploy-auth-service.yml'


- actions/checkout@v6
- actions/setup-node@v6

## TODO
- JSON in env, refactor to use something else
  - have issue with services where there is nested JSON
- safeJSON
- remove barrel index.js files...

- auto generate project folders?
- change TODO, TODO etc. to TODO

TO view large bundle sizes
```
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  vue(),
  visualizer({
    open: true,
    filename: 'dist/stats.html'
  })
]
```

## CAVEATS!
- to fix dependency design issue between common/* projects
- workflow might need to be tested when structure changes
- note the exports properties for ES Modules projects
- avoid using creating barrel index.js files except for single class
- TODO create globalThis namespace called ?
- global values
  - __logger - imported from common/node/logger, to avoid console.log use in node runtime apps
  - __config - imported from common/node/config 

## Rules
- See [.editorconfig] on code formatting baseline
- Use `TODO` to comment code in progress. do not
- Use git merge with squash
- For node runtime applications
  - import `common/node/logger`
    - use the global logger `logger`, do not use `console.*` for backend
  - import `common/node/config`
    - `.config.json` values will be available globally via `config`
    - `.env` values will be loaded to process.env
