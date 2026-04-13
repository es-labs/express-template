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

