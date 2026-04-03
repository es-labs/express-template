## Install & Run & Test Sample Backend

```bash
# clone repo
git clone https://github.com/es-labs/express-template.git
cd express-template
npm i
# Note your custom development folder is `<project root>/apps/app-sample`

cd apps/app-sample # go back up
npm run local # see ./package.json scripts
# For Windows OS: npm run local:win

# OR to run eslint checks - linux
NODE_ENV=development npm run lint
```

Local development sample sqlite DB `apps/common/dev.sqlite3` already created and populated

If need to **migrate** and **seed**, refer to `dbdeploy` package in `tools` workspace of [https://github.com/es-labs/jscommon]()

**Visit the following URLs**

- http://127.0.0.1:3000/api/healthcheck - app is running normally
- http://127.0.0.1:3000 - Website served by Express with functional samples and demos
- http://127.0.0.1:3000/docs - OpenAPI documentation
- http://127.0.0.1:3000/native/index.html -

**NOTES**

- No bundler frontend
  - import only vue & vue-router at index.html, pure vanilla JS no webpack or other bundler
  - export const store = reactive({}) used [instead of Vuex](https://pinia.vuejs.org/introduction.html#Why-should-I-use-Pinia)

Unit & Integration Tests:

- To run unit & integration test on **/api/categories** endpoint. E2E testing is **Work In Progress**
- TO TEST EVERYTHING PLEASE change describe.only(...) to describe(...) in the test scripts in **apps/app-sample/tests**

See package.json

```bash
# run in development only
npm run test
```

## Running Using Docker/Podman

For running using docker/podman

```bash
docker build -t express-template --target production --build-arg ARG_NODE_ENV=dev --build-arg ARG_API_PORT=3000 .
docker run -p 3000:3000 express-template
```

### Vite SPA Setup & Run - development environment

See [https://github.com/es-labs/vue-antd-template]() for a SPA frontend template that can be used with projects based on this template

---

## Project Structure & Features

See [apps/README.md]()

Features include SAML. OIDC, OAuth, Fido2 login, Push Notifications
