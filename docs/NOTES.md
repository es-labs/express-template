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
    - changelog - release-please workflow
    - release - release-please workflow
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


### Github Related Readings

- https://github.com/settings/security_analysis
- https://docs.github.com/en/organizations/managing-organization-settings/managing-custom-properties-for-repositories-in-your-organization

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

### TODO

- JSON in env, refactor to use something else
  - have issue with services where there is nested JSON
- safeJSON
- remove barrel index.js files...
- auto generate project folders?
- User accounts ? what is this? TODO
- Audit logging
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

### CAVEATS!
- to fix dependency design issue between common/* projects
- workflow might need to be tested when structure changes
- use named exports, unless single class or function then use export default
- do not create barrel index.js files
- do not use named exports and export default in same file
