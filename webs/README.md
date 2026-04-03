## Read Me FIRST!

**Important notes** - **TO UPDATE!**
- DO NOT develop custom code using `apps/vue-sample` or `apps/vue-minimal`. Rename it or copy it to another folder name
- do note any conflicts to resolve when merging from upstream

---

## Install & Run & E2E Test

```bash
npm i
cd apps/vue-sample
npm run dev # run 1st sample web application in <project root>/apps/web-sample
```

# Visit `http://127.0.0.1:8080` to view application

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

[TODO] E2E Tests:

```bash
npx playwright install chromium
npx playwright test --browser=chromium

cd apps
npm run test:e2e
```

[TODO] Run with MockServiceWorker

```bash
# TBD
npm run local:mocked # run locally with mock service worker (many other API calls will fail because they are not mocked)
```

---

## Project Structure And Features

See [apps/README.md]()

## Frontend Custom Application Notes

Setting up your custom frontend

**Notes:**
- `apps/vue-sample` is a sample skeleton that can be used as scaffolding
  - `ROUTES` property
    - use kebab-case, will be converted to Capital Case in menu display
    - only up to 1 submenu level
      - /first-level
      - /submenu/second-level
    - paths
      - '~/xxx.js' from **<project>/src** folder
      - '/xxx.js' from **<project>** folder
- **IMPORTANT NOTE** When you create a new application
  - create it in the `apps` folder
  - add folder entry to `apps/.gitignore` so that the folder can be included in git
  - add new entry in the package.json folder to run the application
    - e.g. npx vite build --config apps/<your-app-name>/vite.config.js --mode <environment>
  - update vite.config.js `root` property folder name to be <your-app-name>

### Sample Deployment - WIP

1. configure .env.production
2. run the following workflow `.github\workflows\deploy-gh-pages.yml`, select env as production

- https://ideas.digitalocean.com/storage/p/deploy-static-sites-to-spacescdn
- https://docs.digitalocean.com/products/spaces/reference/s3-compatibility
- https://es-labs.sgp1-static.digitaloceanspaces.com

PUT ?website HTTP/1.1
Host: example.com.s3.<Region>.amazonaws.com
Content-Length: 256
Date: Thu, 27 Jan 2011 12:00:00 GMT
Authorization: signatureValue

<WebsiteConfiguration xmlns='http://s3.amazonaws.com/doc/2006-03-01/'>
    <IndexDocument>
        <Suffix>index.html</Suffix>
    </IndexDocument>
    <ErrorDocument>
        <Key>index.html</Key>
    </ErrorDocument>
</WebsiteConfiguration>

## Notes & Todos

- Move the following files to userland folder if possible
  - package.json (may not be necessary)
- [Why Use Vite](https://indepth.dev/a-note-on-vite-a-very-fast-dev-build-tool/)




> Add your readme content here, edit or remove the ones below

---

## Project Structure

TBD - To Redo

```
+- common/ : codes here user may not need to touch much, commonly used in project
|  +- plugins/ : i18n, fetch, ws (websocket), useMediaQuery
|  +- views/ : NotFound, NotAllowed, EmptyView
|  +- msw.js : for mock service worker [NEED TO SPECIFY PATH TO MOCKS]
|  +- pwa.js : for PWA (work in progress)
|  +- sentry.js : for error reporting
+- apps/
|  +- vue-sample/
|  |  +- components/
|  |  +- envs/ : dotenv files here
|  |  +- layouts/ : your layouts here
|  |  +- mocks/ : for msw
|  |  +- public/ : web public html folder
|  |  +- setups/ : see README.md in here
|  |  +- style/ : see README.md in here
|  |  +- tests/ : example.spec.js
|  |  +- views/ : your pages here
|  |  +- App.vue
|  |  +- index.html
|  |  +- main.js
|  |  +- playwright.config.js
|  |  +- router.js
|  |  +- store.js : or store/index.js
|  |  +- vite.config.js
|  +- vue-minimal/ : a minimal vue web app
|  +- <Your-Custom-Frontend>/: folder with prefix "-web" are your custom frontend code (your frontend repo)
|  +- .gitignore
|  +- package.json
|  +- README.md
+- .gitguardian.yml
+- .gitignore
+- .prettierrc.js
+- CHANGELOG.md
+- eslint.config.js
+- package.json
+- README.md
+- setup-upstream.sh
```

TO view large bundle sizes

import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  vue(),
  visualizer({
    open: true,
    filename: 'dist/stats.html'
  })
]