## folder structure

- apps: backend applications
- common: common javascript used by the apps folder (TBD also for other folders), also common schemas
  - packages can be uploaded to npm
- docs: documentation
- scripts: deploy, documentation scripts
- webs: frontend applications using VueJS


## Design
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
    - changelog - TBD
    - release - TBD (semver release)
    - code review AI - TBD
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
- DB audit logging strategy (triggers + soft delete) -TBD
- jsdoc for typing and autocomplete on IDE ?


### Rebase Or Merge

Scenario 1: Large Team (50+ developers)
- Strategy: Squash merge to main
- Reason: Keeps history clean, easier to track PRs
- GitHub setting: Default to squash merge
- Branch protection: Require PR reviews before merge

**recommended** Scenario 2: Monorepo with Multiple Teams 
- Strategy: Merge commits with meaningful messages
- Reason: Need to track which team merged what
- Command: git merge --no-ff
- Message: "Merge PR #123: Feature X (Team A)"

Scenario 3: Microservices
- Strategy: Squash merge per service
- Reason: Each service is independent, one commit = one deploy
- Per-service branch protection with squash merge

Scenario 4: Open Source Project
- Strategy: Rebase + merge
- Reason: Linear history, clean for contributors
- Setting: Allow rebase merge in GitHub
- Enforce: Require commits to be signed



## precommits

- use biome for formatting and linting
- git guardian (use native Github for now)



## TODOS

### linting auto fix

safe - useArrowFunction, useConst
unsafe - useTemplate, useNodejsImportProtocol, useOptionalChain,  

```
npx biome <format/lint/check> common apps webs scripts
npx biome lint common apps webs scripts
 --only=useTemplate --write --unsafe
```

###
apps/* - use backend logger
webs/* - use frontend logger
common/iso - both (should be simple files remove console.logs)
common/node - backend (use backend logger)
common/vue -frontend VueJS (allow console, remove in prod)
common/web -frontend plainJS (allow console, remove in prod)
common/scripts

### comitting

czg https://cz-git.qbb.sh/cli/

### Github Related To Read
- https://github.com/settings/security_analysis


## DB

### User accounts

TBD

### Audit logging
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

## WIP
- JSON in env, refactor to use something else
// Define a unique symbol under a namespace
// globalThis.__myApp = globalThis.__myApp || {};
// const _logger = Symbol('logger');
// globalThis.__myApp[_logger] = myLogger;
  - have issue with services where there is nested JSON
- safeJSON
- remove barrel index.js files...

- auto generate project folders?
- change TBD, WIP etc. to TODO

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
- TBD create globalThis namespace called ?
- global values
  - __logger - imported from common/node/logger, to avoid console.log use in node runtime apps
  - __config - imported from common/node/config 
