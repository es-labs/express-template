## Description

This document is for
- design preferences
- open questions
- caveats
- migration notes
- ideas that are not yet stable policy

### Design
- Fully ES Modules - JS Standards Compliant
- Named exports preferred (default exports for class, config, or a plugin)
- Use Native as much as viable (test runners, datetime, fetch / xhr, npm, git hooks)
- npm workspaces (microservices & shared libraries)
  - apps : microservices or applications (frontend or backend)
    - shared-<tenant1>
    - <tenant1>-<app1>
    - <tenant1>-<app2>
    ...
    - shared-<tenantN>
    - <tenantN>-<app1>
    - <tenantN>-<app2>
    - default port 3000
  - common/shared code and schemas
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
  - openapi schema generation (zod-openapi)
- NO Typescript unless it becomes runtime-native
- testing
  - use native node test runner
  - playwright for e2e testing
- Support postgres as primary RDBMS, mysql as secondary.
  - DO NOT USE mongoDB
- DB audit logging [strategy](decs/pg-audit-implementation)
- jsdoc for typing and autocomplete on IDE ?


## precommits

- use biome for formatting and linting

## pushes / PR merges to main and release branches

- run ci before merge
  - repo-wide format check, no autofix
  - repo-wide lint check, no autofix
  - repo-wide schema check, no autofix
  - repo-wide testing, no autofix
  - repo-side package audit, no autofix?
- do not allow PR merge if checks fail

## Secrets Security

- git guardian (use native Github for now)


## TODOS

### linting auto fix

safe - useArrowFunction, useConst
unsafe - useTemplate, useNodejsImportProtocol, useOptionalChain,  

```
npx biome <format/lint/check> common apps scripts
npx biome lint common apps scripts --only=useTemplate --write --unsafe
```

### logger usage

- apps/* - use backend logger for backend, frontend logger not implemented
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

### CAVEATS!
- to fix dependency design issue between common/* projects
- workflow might need to be tested when structure changes
- use named exports, unless single class or function then use export default
- do not create barrel index.js files
- do not use named exports and export default in same file
