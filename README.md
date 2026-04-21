## Read Me First - Requires Node.js 24 or Higher

- Contributors: read [.github/CONTRIBUTING.md]() before opening issues or pull requests.
  - setup hooks [docs/git.md#Hooks-Usage]()
  - setup release automation [docs/git.md#Release-Automation]()
  - setup branch protection [docs/git.md#Branch-Protection-Rules]()
- Developers - **BEFORE** making **ANY** changes. Read the following:
  - branching instructions [docs/git.md#Branching]()
  - engineering standards [docs/conventions.md]()
  - commit message standard []()
  - merge strategy [docs/git.md#Rebase-Or-Merge]()
  - triggering release [docs/git.md#Releasable-Commits]()
  - workflows []()
- For template design principles, see this [reference](https://github.com/ais-one/cookbook?tab=readme-ov-file#1---important---read-me-first).

## Template Maintenance

Refer to [.github/workflows/update-template.yml]() for description and details on updating template. Userland folders `apps` and `scripts` are untouched.


## Description

This repository is a monorepo template for building full-stack JavaScript applications with Node.js, Express, and Vue.

It combines backend and frontend examples in `apps/` and shared reusable code in `common/` so teams can start from a consistent structure instead of assembling the stack from scratch. It includes workspace-based package management, shared schemas and utilities, sample authentication flows, OpenAPI tooling, Docker support, GitHub Actions workflows, and MCP server examples.

Further Reading
- [Design Features](docs/NOTES.md#Design-Features)
- [Sample Applications And Implementations](docs/NOTES.md#Sample-Applications-And-Implementations)

## Documentation Map

Use these documents depending on the part of the repository you are working on:

- [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) - contributor setup, hooks, issue reporting, and pull request guidance
- [docs/git.md](docs/git.md) - git workflow, release flow, tags, and merge strategy
- [docs/conventions.md](docs/conventions.md) - coding, tooling, commit, and runtime conventions
- [docs/NOTES.md](docs/NOTES.md) - internal notes, caveats, and open questions

## General Contents

- `apps`: backend and frontend application workspaces
- `common`: shared JavaScript used by `apps`
- `docs`: project documentation
- `scripts`: deployment and documentation scripts


## Project Guides

Use the following guides depending on what you want to build or extend in this repository:

- Backend services: [docs/install-apps.md](docs/install-apps.md)
  Start from the sample Express application in `apps/` and use it as the baseline for new Node.js servicesm or Use the sample Vue and Vite applications as scaffolding for new browser-based projects.
- Shared code and schemas: [docs/install-common.md](docs/install-common.md)
  Reference the reusable modules in `common/` for Node, browser, Vue, isomorphic utilities, and shared `zod` schemas.


## CI/CD

- [Deploy backend to container registry](.github/workflows/deploy-cr.yml)
- [Publish a package to npm](.github/workflows/deploy-npm.yml)
- [Deploy frontend (Vue) to object store](.github/workflows/deploy-bucket.yml)
