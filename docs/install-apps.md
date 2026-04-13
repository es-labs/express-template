## Install & Run & Test Sample Backend

```bash
npm i
cd apps/sample-api
npm run start
```

Local development, run `npm run serve` command in `scripts/dbdeploy` folder to run the database locally

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
- To run the full test set, change `describe.only(...)` to `describe(...)` in the test scripts under `apps/sample-api/tests`.

See package.json

```bash
# run in development only
npm run test
```

## Running Using Docker/Podman

For running with Docker or Podman:

```bash
docker build -t express-template --target production --build-arg APP_NAME=sample-api --build-arg API_PORT=3000 .
docker run -p 3000:3000 express-template
```

---

Features include SAML, OIDC, OAuth, FIDO2 login, and push notifications.

## Creating A New Node.js Backend Or Service

- Make a copy of the `sample-api` folder in the `apps` folder and rename it using kebab-case.
- Edit the `.env` and `.env.json` files as needed. For production, inject secrets from environment variables or a secret manager.
- TODO MCP and WS routes



## Install & Run Minimal Vue Application

```bash
npm i
cd apps/sample-vue-minimal
npm run dev
```

Visit `http://127.0.0.1:8080` on browser to view application

## Install & Run Sample Vue Application

Run a more extensive sample, in `apps/sample-vue-full`, and view on `http://127.0.0.1:8081`

**Note For Login**

Login using one of the following:  
- Faked Login: [NOTE: API calls to protected Endpoints WILL FAIL!]:
  - Login: fake a user and login, no backend needed, just click button
  - Login Callback: fake a callback and set fake user and login, no backend needed, just click button
- Login: normal login with OTP, express server needs to be run
  - Details are already **prefilled** with the following values; just click the Login button.
  - Username and password: `test`
  - OTP (if enabled, for example `USE_OTP=TEST`): use `111111`; it is already prefilled.
- Enterprise SSO (SAML2, OIDC) is available in the sample app.

### E2E Tests

```bash
npx playwright install chromium
npx playwright test --browser=chromium

cd apps/sample-vue-full
npm run test:e2e
```

### Run With Mock Service Worker

```bash
# TODO
npm run local:mocked # run locally with mock service worker (many other API calls will fail because they are not mocked)
```
---

## Creating A New Web or Vue Frontend

- Make a copy of the `sample-vue-full` folder in the `apps` folder and rename it using kebab-case.
- Edit the `.env` and `.env.development` files as needed.
  - `.env` is common to all environments for the app
  - `.env.[MODE]` indicates the environment file to use (command to use: npx vite build --mode $1). default is `development`
- `apps/sample-vue-full` is a sample skeleton that can be used as scaffolding
  - `ROUTES` property
    - Use kebab-case; it will be converted to capitalized menu labels in the UI.
    - only up to 1 submenu level
      - /first-level
      - /submenu/second-level
    - Paths:
      - `'~/xxx.js'` from the **<project>/src** folder
      - `'/xxx.js'` from the **<project>** folder

### Sample Deployment

1. Configure `.env.prd`.
2. Run the workflow [.github/workflows/deploy-bucket.yml](../.github/workflows/deploy-bucket.yml) and select the production environment.

### References
- https://ideas.digitalocean.com/storage/p/deploy-static-sites-to-spacescdn
- https://docs.digitalocean.com/products/spaces/reference/s3-compatibility
- https://es-labs.sgp1-static.digitaloceanspaces.com
