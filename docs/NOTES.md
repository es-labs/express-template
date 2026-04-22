## Description

This document is for
- design preferences
- open questions
- caveats
- migration notes
- ideas that are not yet stable policy

### Design Features

- Fully ES Modules - JS Standards Compliant
- Named exports preferred (default exports for class, config, or a plugin)
- Use Native as much as viable (test runners, datetime, fetch / xhr, npm, git hooks)
- Option to use Javascript or Typescript for backend.
- For Typescript
  - avoid compilation, Use NodeJS native typescript
  - use `tsc --noEmit` for type checking and `zod` for runtime validation
  - avoid enums, instead... use const object pattern / string literal unions
  - avoid legacy decorators
  - avoid using <any>, use <unknown>
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
- use zod for validation and openapi generation...
- automation
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
- testing
  - use native node test runner
  - playwright for e2e testing
- Support
  - postgres as primary RDBMS, mysql as secondary.
  - redis or keyv
- DB audit logging [strategy](design/pg-audit-implementation)
- Authorization [strategy](design/authz.md)
  - RBAC, FGA, and legacy roles fallback
  - multi-tenant, scopes
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
- common/iso - both (should be simple files remove console.log)
- common/node - backend (use backend logger)
- common/vue - frontend VueJS (allow console.log, remove in prod)
- common/web - frontend plainJS (allow console.log, remove in prod)
- common/scripts


### Github Related Readings

- [security](https://github.com/settings/security_analysis)
- [repo custom properties](https://docs.github.com/en/organizations/managing-organization-settings/managing-custom-properties-for-repositories-in-your-organization)

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
