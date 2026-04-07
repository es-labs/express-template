## Read Me FIRST! - Requires NodeJS Version 24 or higher

> Do NOT edit this README. 
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

## Description

This repository is a monorepo template for building full-stack JavaScript applications with Node.js, Express, and Vue.

It combines backend application examples in `apps/`, frontend application examples in `webs/`, and shared reusable code in `common/` so teams can start new services and web apps from a consistent structure instead of assembling the stack from scratch.

The repository is designed as a practical starting point for API services, browser applications, and supporting platform code, with workspace-based package management, shared schemas and utilities, sample authentication flows, OpenAPI tooling, Docker support, GitHub Actions workflows, and MCP server examples.

Use it when you want a single repository that can host:

- Express-based backend services
- Vue and Vite frontend applications
- shared ESM modules for Node, browser, Vue, and isomorphic code
- common `zod` schemas and supporting utilities
- deployment, documentation, and database helper scripts
- sample implementations for features such as SAML, OIDC, OAuth, OTP, FIDO2, and push notifications

## General Contents

- apps: backend applications workspaces
- common: common javascript used by `apps` or `webs`
  - TODO: packages that can be uploaded to npm and then installed (OPTIONAL)
- docs: documentation
- scripts: deploy, documentation scripts
- webs: frontend applications using VueJS/vanillaJS workspaces


## Project Guides

Use the following guides depending on what you want to build or extend in this repository:

- Backend services: [docs/install-backend.md](docs/install-backend.md)
  Start from the sample Express application in `apps/` and use it as the baseline for new Node.js services.
- Frontend applications: [docs/install-frontend.md](docs/install-frontend.md)
  Use the sample Vue and Vite applications in `webs/` as scaffolding for new browser-based projects.
- Shared code and schemas: [docs/install-common.md](docs/install-common.md)
  Reference the reusable modules in `common/` for Node, browser, Vue, isomorphic utilities, and shared `zod` schemas.


## UNDER REFACTORING ##

Need to tidy up documentation.

- [docs/NOTES.md](docs/NOTES.md) - notes
- [docs/HOOKS.md](docs/HOOKS.md) - git hooks
- [docs/git.md](docs/git.md) - the workflow, branch naming and merge strategy, changelog and release using semver
- [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) - to setup the Git Hooks

---


## CI/CD & Cloud Deployment Using Github Actions

**NOTE** secrets will not be in repo for CI/CD, those should be put in VAULT

### Deploy To Container Registry

[.github/workflows/deploy-cr.yml](.github/workflows/deploy-cr.yml)

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

### common/jslib - TODO

Publish a package to NPM

- Reference Workflow

[.github/workflows/deploy-npm.yml](.github/workflows/deploy-npm.yml)

- Github Secrets
  - NPM_AUTH_TOKEN
- Selectable Inputs
  - git repo branch / tag
  - project to publish (currently only jslib)

### Deploying To Object Store

Build VueJS project and deploy to Object Store

[.github/workflows/deploy-bucket.yml](.github/workflows/deploy-bucket.yml)

- Selectable Inputs
  - Cloud Provider (oss, s3)
  - git repo branch / tag
  - application name
  - bucket name
  - environment (development, staging, production)
- Github Secrets
  - ACCESS_KEY_ID
  - ACCESS_KEY_SECRET
  - OSS_HOST (if required)