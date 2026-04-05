## linting auto fix

useArrowFunction - safe
useConst - safe
useOptionalChain
useTemplate
useNodejsImportProtocol
noConsole (set to warn first, convert using logger, then set back to error)

```
npx biome format common apps webs scripts
npx biome lint common apps webs scripts
```

## 
apps/* - use backend logger
webs/* - use frontend logger
common/iso - both (should be simple files remove console.logs)
common/node - backend (use backend logger)
common/node/express - backend (use backend logger)
common/vue -frontend (allow console, remove in prod)
common/web -frontend (allow console, remove in prod)

# WIP
- remove barrel index.js files...
- JSON in env, refactor to use something else
- safeJSON

## Github Related To Read
- https://github.com/settings/security_analysis


# DB

## User accounts

TBD

## Audit logging
- SQL Trigger + soft delete
  - mutable / immutable tables
- or something else?