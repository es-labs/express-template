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

# WIP
@es-labs/jslib
@common/iso/sleep.js
@common/node/services/index
- JSON in env, refactor to use something else
- fix logging
- organize files
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