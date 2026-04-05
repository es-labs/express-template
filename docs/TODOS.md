## linting auto fix

useArrowFunction - safe
useConst - safe
useOptionalChain
useTemplate
useNodejsImportProtocol
noConsole (set to warn first, convert using logger, then set back to error)

```
npx biome <format/lint/check> common apps webs scripts
npx biome lint common apps webs scripts
 --only=useTemplate --write --unsafe
```

## 
apps/* - use backend logger
webs/* - use frontend logger
common/iso - both (should be simple files remove console.logs)
common/node - backend (use backend logger)
common/vue -frontend VueJS (allow console, remove in prod)
common/web -frontend plainJS (allow console, remove in prod)
common/scripts

## comitting

czg https://cz-git.qbb.sh/cli/



# WIP
- remove barrel index.js files...
- JSON in env, refactor to use something else
- safeJSON
- husky / commitizen

## Github Related To Read
- https://github.com/settings/security_analysis


# DB

## User accounts

TBD

## Audit logging
- SQL Trigger + soft delete
  - mutable / immutable tables
- or something else?




on:
  push:
    branches: [tbd]
    paths:
      - 'services/auth-service/**'
      - 'shared/**'
      - '.github/workflows/deploy-auth-service.yml'


- actions/checkout@v6
- actions/setup-node@v6