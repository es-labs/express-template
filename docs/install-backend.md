## Install & Run & Test Sample Backend

```bash
npm i
cd apps/app-sample
npm run start
```

Local development sample sqlite DB `apps/app-sample/dev.sqlite3` already created and populated

If you need to **migrate** and **seed**, refer to the `scripts/dbdeploy` workspace.

**Visit the following URLs**

- http://127.0.0.1:3000/api/healthcheck - app is running normally
- http://127.0.0.1:3000 - Website served by Express with functional samples and demos
- http://127.0.0.1:3000/native/index.html - unbundled Vue website sample

**Notes**

- No bundler frontend
  - Imports only `vue` and `vue-router` in `index.html`, with plain JavaScript and no bundler.
  - Uses `export const store = reactive({})` [instead of Vuex](https://pinia.vuejs.org/introduction.html#Why-should-I-use-Pinia).

Unit & Integration Tests:

- To run unit and integration tests for the **/api/categories** endpoint. E2E testing is still in progress.
- To run the full test set, change `describe.only(...)` to `describe(...)` in the test scripts under `apps/app-sample/tests`.

See package.json

```bash
# run in development only
npm run test
```

## Running Using Docker/Podman

For running with Docker or Podman:

```bash
docker build -t express-template --target production --build-arg APP_NAME=app-sample --build-arg API_PORT=3000 .
docker run -p 3000:3000 express-template
```

---

Features include SAML, OIDC, OAuth, FIDO2 login, and push notifications.

## Creating A New Node.js Backend Or Service

- Make a copy of the `app-sample` folder in the `apps` folder and rename it using kebab-case.
- Edit the `.env` and `.env.json` files as needed. For production, inject secrets from environment variables or a secret manager.
- TODO MCP and WS routes
