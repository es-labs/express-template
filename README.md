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

2 - Updating the template

```bash
# Commit and push to remote before running commands below
git fetch upstream # includes tags
git pull upstream <branch or tag> --no-rebase
# NO MORE IN USE git merge upstream/<branch or tag> --allow-unrelated-histories
# There may be some template related merge conflicts to resolve.
```

3 - Creating A New Service

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

4 - Creating A New Frontend

- Make a copy of the `web-sample` folder in the `apps` folder and rename it (kebab using case)
- edit the .env and .env.development files (.env.staging, .env.production environments should be in secrets)
- add `!<your-application-name>` to `apps\.gitignore`
- TBD MCP and WS routes


## UNDER REFACTORING ##

Need to tidy up documentation and tie up loose ends.

NOTES [docs/NOTES.md]()
HOOKS [docs/HOOKS.md]()
CHANGELOG [CHANGELOG.md]()

**Suggested Conventions**
- 
- branch
  - main = stable
  - work = working branch
  - feat-<issue number>
  - bugfix-<issue number>
- release tags
  - use semver, e.g. 1.2.3
  - should tag main branch

---

See [.github/CONTRIBUTING.md]() - to setup the Git Hooks


## Common Library and all Node backends

- use logger instead of console.log

### SPA Setup & Run - development environment

See [docs/install-backend.md]() - for the sample Express App 

See [docs/install-frontend.md]() - for the sample Vue SPA

See [docs/install-jslib] - for instructions on the shared library

## CI/CD & Cloud Deployment Using Github Actions

**NOTE** secrets will not be in repo for CI/CD, those should be put in VAULT

### Deploying To A Container Registry

Build image and deploy to a container registry

- Reference Workflow
  - [https://github.com/es-labs/express-template/blob/main/.github/workflows/deploy-cr.yml]
- selectable inputs
  - git repo branch / tag
  - container image tag
  - path to dockerfile
  - environment (development, staging, production)
- Github Secrets
  - CR_USERNAME: container registry login username (for deployment)
  - CR_PASSWORD: container registry login password (for deployment)
- Github Variables
  - CR_HOST: container registry host (for deployment)
  - CR_NS: container registry namespace (for deployment)
  - CR_IMAGENAME: The image name. If not specified, the repository name will be used

### common/jslib - TBD

Publish a package to NPM

- Reference Workflow
  - [https://github.com/es-labs/express-template/blob/main/.github/workflows/deploy-npm.yml]
- Github Secrets
  - NPM_AUTH_TOKEN
- Selectable Inputs
  - git repo branch / tag
  - project to publish (currently only jslib)

### Deploying To An Object Store

Build VueJS project and deploy to object storage

- Reference Workflow
  - [https://github.com/es-labs/express-template/blob/main/.github/workflows/deploy-bucket.yml]
- Selectable Inputs
  - Cloud Provider (oss, s3)
  - git repo branch / tag
  - application name
  - bucket name
  - environment (development, staging, production)
- Github Secrets
  - ACCESS_KEY_ID
  - ACCESS_KEY_SECRET
