> Add your readme content here, edit or remove the ones below

---

## Configuration (Environment Files)

- .env.<env> : non-sensitive config values
- .env.secret.<env> : values that are secret (should be in `vault` service for production)
- JSON values are supported, be aware of syntax errors when setting up

## Some Features

### SAML, OIDC, OAuth

- SAML & OIDC: requires [Keycloak](docker-devenv/keycloak/README.md) to be setup and express server to be run
- You can test out on [sso.html](http://127.0.0.1:3000/sso.html). The file source is [apps/app-sample/public/demo-express/sso.html]()
- for SAML and OIDC... credentials is `test` / `test`, redirect to the keycloak IDP
- for OAUTH **requires setup of github account and configs**
- Refer to the following file [router/auth.js]()

### Fido2 - TO TEST

Refer to following files for SPA sample (uses fido2-lib in backend)

- [apps/app-sample/public/demo-express/fido.html]()
  - you might need to use nip service for a "pseudo-domain" to test locally
  - take note of and use the private IP on your local machine
- [apps/app-sample/routes/fido.js]()
- you will need Windows Hello or similar service on OSX

### Push Notification

- ensure that you enable permissions for the browser
- sometimes the notifications may be blocked by company policy, you may get a push event, but no notification pops-up
- Refer to following files for SPA sample
  - [apps/app-sample/routes/webpush.js]()
  - [apps/app-sample/public/demo-express/pn.html]()
- Uses Webpush, Webpush is easier (sample config uses Webpush and runs on http://127.0.0.1:3000)
- Click the following buttons in order (see their output in console.log and screen):
  - (1) Subscribe PN, (2) Send And Receive Test PN, (3) Unsubscribe PN

## Project Structure

```
+- .github/ : github related CICD and automations
+- apps : custom apps are here in this folder
|  +- app-auth/ : authentication implementations... Oauth, SAML, OIDC, and own rollout
|  +- app-sample/ : sample custom application (prefixed with app-)
|  |  +- controllers/
|  |  +- deploy/ : deployment folder (see README.md within the deploy folder)
|  |  +- models/
|  |  +- openapi/ : OpenAPI yaml files
|  |  +- public/ : for serving static files - website
|  |  |  +- demo-express/
|  |  |  +- vue-nobundler/
|  |  +- routes/ : application REST API & websocket setup
|  |  +- tables/ : configurable table & crud
|  |  +- tests/ : Jest tests for custom application
|  |  +- uploads/ : for file uploads
|  |  +- dev.sqlite3 : sqlite DB with schema and data
|  |  +- test.http : rest API commands testing VSCode plugin (Rest Client - humao.rest-client)
|  |  +- test.py: run python from express
|  +- app-t4t/ : universal database interface application
|  +- .env.dev : on dev server
|  +- .env.development : on local dev machine
|  +- .env.sample
|  +- .gitignore
|  +- apploader.js
|  +- package.json : for app libraries
|  +- README.md
+- git-hooks/ : pre-commit and other hooks here
+- middlewares/ : common middlewares
+- router/ : common route / controller & services
+- tests/ : Jest tests for expressjs
+- .dockerignore
+- .editorconfig
+- .gitignore
+- app.js : the express app boilerplate
+- CHANGELOG.md
+- deploy.sh: TODO deployment script
+- Dockerfile
+- ecosystem.config.js: for pm2
+- env.js
+- eslint.config.js
+- index.js
+- LICENCE
+- package.json
+- README.md
```

## Relational Database Schema

### Simple Relation

- books <- 1 --- 1 -> categories - one book belongs to one category
- books <- M --- N -> authors - one book has many authors, and an author can have more than 1 book
- books <- 1 --- M -> pages - one book has many pages

### Simple Table Schema

- authors - id, name
  1, author1
  2, author2

- categories - id, name
  1, cat1
  2, cat2

- books - id, name, categoryId
  1, book1, 1
  2, book2, 1

- pages - id, name, bookId
  1, pageA, 1
  2, pageB, 1
  3, pageC, 2
  4, pageD, 2
  5, pageE, 2

- book_author - bookId, authorId
  1, 1
  1, 2
  2, 1
  2, 2

### CRUD Routes

[* === COMPLETED, ** === TESTED]

- POST /auth/signup
- POST /auth/login
- GET /auth/logout
- POST /auth/otp

- POST /api/authors
- PATCH /api/authors/:id
- GET /api/authors/:id
- GET /api/authors

- POST /api/categories
- PATCH /api/categories/:id
- GET /api/categories/:id
- GET /api/categories

- POST /api/books
- PATCH /api/books/:id
- GET /api/books/:id
- GET /api/books

- POST /books/:id/pages - add page to book
- DELETE /pages/:id - remove page from book
- PATCH /pages/:id - edit a page

- POST /books/:id/authors/:authorId - relate author to book
- DELETE /books/:id/authors/:authorId - unrelate author to book
