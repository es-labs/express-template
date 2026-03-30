## Read Me FIRST! - Requires NodeJS Version 18 or higher

> Do NOT edit this README. Go to [apps/README.md]() to view and edit user README
>
> Built from [https://github.com/es-labs/express-template]().
>
> For template design principles, see [https://github.com/ais-one/cookbook#important---read-me-first]()

## Template Maintenance

1 - Setup to allow incoming merge from upstream template update

```bash
# run once only after you `clone`, or `fork` or `delete .git and run git init`
./setup-upstream.sh
```

2 - Creating A New Serrvice

Use `apps/app-sample` as an example on how to create a new service/application.

- Make a copy of the `app-sample` folder in the `apps` folder and rename it (kebab using case)
- edit the .env and .env.development files (.env.staging, .env.production environments should be in secrets)
- add `!<your-application-name>` to `apps\.gitignore`
- all you need to do is edit `<your-application-name>/routes` for your APIs
- TBD MCP and WS routes

**Important notes**
- DO NOT develop in `apps/app-sample`.
- userland changes ONLY in the `apps` folder, NEVER outside the folder. Contact template maintainer if you need something outside `apps`
- do note any conflicts to resolve when merging from upstream

3 - Updating the template

```bash
# Commit and push to remote before running commands below
git fetch upstream # includes tags
git pull upstream <branch or tag> --no-rebase
# NO MORE IN USE git merge upstream/<branch or tag> --allow-unrelated-histories
# There may be some template related merge conflicts to resolve.
```

**Suggested Conventions**
- branch
  - main = stable
  - work = working branch
  - feat-<issue number>
  - bugfix-<issue number>
- release tags
  - use semver, e.g. 1.2.3
  - should tag main branch

---

## Install & Run & Test

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

## CI/CD & Cloud Deployment

### Deployment Using Github Actions

- .github/workflows/deploy-cr.yml **TODO**
  - selectable inputs
    - git repo branch / tag
    - container repo tag

Build image and deploy to a container registry

**NOTE** secrets will not be in repo for CI/CD, those should be put in VAULT

Current Github Secrets

- CR_USERNAME: container registry login username (for deployment)
- CR_PASSWORD: container registry login password (for deployment)

Current Github Variables

- CR_HOST: container registry host (for deployment)
- CR_NS: container registry namespace (for deployment)
- CR_IMAGENAME: The image name. If not specified, the repository name will be used

---

## References

- https://softwareengineering.stackexchange.com/questions/338597/folder-by-type-or-folder-by-feature
- https://kentcdodds.com/blog/how-i-structure-express-apps
