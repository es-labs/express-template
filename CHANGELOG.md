# Changelog

Historical notes before `release-please` automation are grouped under `0.1.0`.

## [0.2.0](https://github.com/es-labs/express-template/compare/0.1.0...v0.2.0) (2026-04-12)


### Features

* add commit-msg hook and commit-lint CI for czg conventional commits ([56c5139](https://github.com/es-labs/express-template/commit/56c5139aacfe04ba4a08b4c8d7957f0b9940c0a2))
* add czg.config.js with workspace scopes for interactive commit prompt ([580d0ec](https://github.com/es-labs/express-template/commit/580d0ece97944b82eb5f84cd0167fc7bad9ac878))
* add npm audit security check to pre-push hook ([ffe6741](https://github.com/es-labs/express-template/commit/ffe6741e96f68688d5e8429ea71466ff2771d76e))
* dynamically discover workspace scopes in czg.config.js ([118ff12](https://github.com/es-labs/express-template/commit/118ff1214a3656c24304d968b66ad950a0b6073a))
* run tests per impacted workspace using npm run test --workspace ([80f4509](https://github.com/es-labs/express-template/commit/80f45090fae911e52c00e59f77528197e450e4cb))

## 0.1.0

Always finding new things to implement / improve in this list!

### Historical Notes

- [chore] update packages & cleanup & work on improving documentation
- [clean] move error handling to @ss-labs/node/express/init or preRoute
- [clean] clean up @es-labs/node/auth

- [chore] update packages
  - breaking change in @es-labs/node@0.0.37

- [chore] update README.md
- [chore] update README.md
- [chore] update README.md
- [chore] remove MongoDB sample & http-proxy-middleware
- [chore] update @es-labs/node to 0.0.39
- [chore] update to eslint 9
- [chore] convert from jest to native node test runner
- [chore] remove nodemon, use native --watch instead
- [chore] update README.md, update dependencies, removed base64url package
- [chore] improve table editor app
- [feat] use Claude AI and Copilot to improve design and code
- [migrate] use express version 5
- [migrate] use pure ES modules
- [migrate] use NodeJS native env
- [migrate] use @es-labs/jslib
- [feat] - structure for microservice
- [github] - github actions deployment to containers
- [feat] add commitizen, add husky (or native git hooks), add semantic-release?
- [feat] AI assisted commits and PRs
- [feat] AI assisted release
- [iaac-cicd] terraform, Kubernetes
- [github] - github actions approval gates
- [feat] - sample MCP server
- [feat] - sample WebSocket service
- [fix] - close websockets (otherwise has force kill)
- [feat] audit log / per service? - implicit - trigger for mutable & explicit - for adding to immutable
- [feat] AI code review
- [feat] continuous document and test updates using AI skill
- [feat] copilot to generate JSDocs? API Docs? Native Unit & Integration Test
- [next-in-pipeline] re-implement MQ with redis pubsub?
- [frontend] aria
- [backend-testing] research websocket testing

### Future Product Improvement

- [@es-labs/jslib/web/bwc-combobox.js] - enhancement: replace datalist (so can check multiple times on dropdown instead of closing after each check)
- [@es-labs/jslib/web/bwc-t4t-form.js] - handle multiple parent values use case of combobox..., handle reset of multiple child columns
