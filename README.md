## Description

This repository is a monorepo template for building full-stack JavaScript applications, micro-services and frontends with Node.js (**version 24 or Higher**).

The folders contents are as follows:
- `apps`: userland backend and frontend application workspaces
- `scripts`: deployment and documentation scripts
- `common`: shared JavaScript used by `apps` / `scripts`
- `docs`: for documentation

## Quickstart

Getting started with
- Sample API [backend](docs/install.md#Run-Sample-API)
- Sample Vue [minimal frontend](docs/install.md#Run-Sample-Vue)
- Sample Vue [full frontend](docs/install.md#Run-Sample-Vue)

Creating your own apps/services
- API [backend](docs/install.md#Create-New-Backend-App-Or-Service)
- Vue [frontend](docs/install.md#Create New Web or Vue Frontend)

Publish common/** workspace to [npm](docs/install.md#Publishing-packages-to-npm). **for template maintainers ONLY**

## Read Me First

- Contributors: read [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) before opening issues or pull requests.
- End Users: **BEFORE** making **ANY** changes. Read the following:

- SETUP
  - [git hooks](docs/git.md#hooks-usage)
  - [branch protection](docs/git.md#branch-protection-rules)
  - [release automation](docs/git.md#release-automation)
  - [secret scanning](https://docs.github.com/en/enterprise-cloud@latest/code-security/concepts/secret-security/about-secret-scanning)
- Read
  - [branching instructions](docs/git.md#branching)
  - [merge strategy](docs/git.md#rebase-or-merge)
  - [engineering standards](docs/conventions.md)
  - format, lint, commit message, language, tooling, etc.
  - [triggering release](docs/git.md#releasable-commits)
  - [workflows](docs/git.md#ci-action-shape)
  - [template updating details](.github/workflows/update-template.yml)
  - [docs/NOTES.md](docs/NOTES.md) - design features, internal notes, caveats.
  - [Design Features](docs/NOTES.md#Design-Features)
  - [roadmap](docs/ROADMAP.md)

The `apps` folder is for **userland** content. E.g workspace codes, documents, scripts, schemas, etc.

Other files and folders are managed by template maintainers.

## Sample Applications, Implementations And Usage

- `apps/sample-api`: Express-based backend services
- `apps/sample-vue-full`: Vue and Vite frontend
- `common/*`: shared ESM modules for Node, browser, Vue, and isomorphic code
  - sample implementations for SAML, OIDC, OAuth, OTP, FIDO2, and push notifications, zod, OpenAPI, etc.
  - TODO telegram, whatsapp, etc.
- `scripts/dbdeploy` database deployment, documentation, and database helper scripts

## CI/CD

- [Deploy backend to container registry](.github/workflows/deploy-cr.yml)
- [Publish a package to npm](.github/workflows/deploy-npm.yml)
- [Deploy frontend (Vue) to object store](.github/workflows/deploy-bucket.yml)
