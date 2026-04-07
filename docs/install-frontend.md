## Install & Run Minimal VueJS Application

```bash
npm i
cd webs/vue-minimal
npm run dev
```

Visit `http://127.0.0.1:8080` on browser to view application

## Install & Run Sample VueJS Application

Run a more extensive sample, in `webs/vue-sample`, and view on `http://127.0.0.1:8081`

**Note For Login**

Login using one of the following:  
- Faked Login: [NOTE: API calls to protected Endpoints WILL FAIL!]:
  - Login: fake a user and login, no backend needed, just click button
  - Login Callback: fake a callback and set fake user and login, no backend needed, just click button
- Login: normal login with OTP, express server needs to be run
  - details already **prefilled** with following values, just click on Login button
  - User and password is `test`
  - OTP (if enabled - e.g. USE_OTP=TEST): use 111111 as otp pin, already prefilled, click on OTP button
- Enterprise SSO (SAML2, OIDC) refer to [https://github.com/es-labs/express-template#saml-oidc-oauth]() for info

### TODO E2E Tests:

```bash
npx playwright install chromium
npx playwright test --browser=chromium

cd webs/vue-sample
npm run test:e2e
```

### TODO Run with MockServiceWorker

```bash
# TODO
npm run local:mocked # run locally with mock service worker (many other API calls will fail because they are not mocked)
```
---

## Creating A New Web or VueJS Frontend

- Make a copy of the `vue-sample` folder in the `webs` folder and rename it (kebab using case)
- edit the .env and .env.development files as needed
  - `.env` is common to all environments for the app
  - `.env.[MODE]` indicates the environment file to use (command to use: npx vite build --mode $1). default is `development`
- `webs/vue-sample` is a sample skeleton that can be used as scaffolding
  - `ROUTES` property
    - use kebab-case, will be converted to Capital Case in menu display
    - only up to 1 submenu level
      - /first-level
      - /submenu/second-level
    - paths
      - '~/xxx.js' from **<project>/src** folder
      - '/xxx.js' from **<project>** folder

### Sample Deployment - TODO

1. configure .env.prd
2. run the following workflow `.github\workflows\deploy-bucket.yml`, select env as production

### References
- https://ideas.digitalocean.com/storage/p/deploy-static-sites-to-spacescdn
- https://docs.digitalocean.com/products/spaces/reference/s3-compatibility
- https://es-labs.sgp1-static.digitaloceanspaces.com

