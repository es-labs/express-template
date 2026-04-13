## Read Me First - Requires Node.js 24 or Higher

- Contributors: read [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) before opening issues or pull requests.
- Developers: read [docs/conventions.md](docs/conventions.md) before making code changes.
- For template design principles, see this [reference](https://github.com/ais-one/cookbook?tab=readme-ov-file#1---important---read-me-first).

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

3 - Refresh the changelog from Conventional Commits

Release automation is handled by the `release-please` job inside [ci.yml](.github/workflows/ci.yml).

- It opens or updates a release PR from Conventional Commits on `main` and `rel/*`.
- Existing handwritten changelog entries remain grouped under `0.1.0`.
- Setup and workflow details live in [docs/git.md](docs/git.md).
- Troubleshooting lives in [docs/release-troubleshooting.md](docs/release-troubleshooting.md).

Important limitation: `release-please` creates release PRs from releasable commits such as `feat`, `fix`, and `deps`. A branch with only `chore` commits will not produce a release PR unless you force a release with a `Release-As:` footer in the commit body.

## Description

This repository is a monorepo template for building full-stack JavaScript applications with Node.js, Express, and Vue.

It combines backend and frontend examples in `apps/` and shared reusable code in `common/` so teams can start from a consistent structure instead of assembling the stack from scratch. It includes workspace-based package management, shared schemas and utilities, sample authentication flows, OpenAPI tooling, Docker support, GitHub Actions workflows, and MCP server examples.

Use it when you want a single repository that can host:

- Express-based backend services
- Vue and Vite frontend applications
- shared ESM modules for Node, browser, Vue, and isomorphic code
- common `zod` schemas and supporting utilities
- deployment, documentation, and database helper scripts
- sample implementations for features such as SAML, OIDC, OAuth, OTP, FIDO2, and push notifications


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

- Backend services: [docs/install-backend.md](docs/install-backend.md)
  Start from the sample Express application in `apps/` and use it as the baseline for new Node.js services.
- Frontend applications: [docs/install-frontend.md](docs/install-frontend.md)
  Use the sample Vue and Vite applications in `webs/` as scaffolding for new browser-based projects.
- Shared code and schemas: [docs/install-common.md](docs/install-common.md)
  Reference the reusable modules in `common/` for Node, browser, Vue, isomorphic utilities, and shared `zod` schemas.


## CI/CD

- [Deploy backend to container registry](.github/workflows/deploy-cr.yml)
- [Publish a package to npm](.github/workflows/deploy-npm.yml)
- [Deploy frontend (Vue) to object store](.github/workflows/deploy-bucket.yml)
