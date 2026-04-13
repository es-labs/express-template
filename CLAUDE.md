# CLAUDE.md

## Project overview

A monorepo template for building full-stack JavaScript applications with Node.js, Express, and Vue. It combines backend and frontend apps in `apps/`, and shared reusable code in `common/`. Designed as an updateable template — custom code is isolated so upstream template updates can be merged cleanly.

- Node.js 24+ required, npm 11+ required
- Fully ES Modules — no CommonJS
- No TypeScript — JSDoc used for typing and IDE autocomplete

## Repository structure

```
apps/              # backend and frontend apps (npm workspace)
  sample-api/      # sample backend app — copy and rename, do not develop here directly
  sample-mcp/        # MCP server example
  sample-vue-full/   # full-featured sample Vue app (port 8081)
  sample-vue-minimal/ # minimal Vue app (port 8080)
common/            # shared reusable code (npm workspaces)
  iso/             # isomorphic utilities (runs in Node and browser)
  node/            # Node.js modules, Express middleware and services
  schemas/         # shared zod schemas
  web/             # browser-only utilities and web components
  vue/             # Vue-specific shared modules
docs/              # project documentation
scripts/           # DB deployment, OpenAPI generation tooling
  dbdeploy/        # database migration and seed scripts
.github/           # GitHub Actions workflows and CONTRIBUTING.md
.githooks/         # native git hooks (pre-commit, pre-push)
```

## Setup

```bash
# 1. run once after clone/fork/git init to enable upstream template merges
./setup-upstream.sh

# 2. install all workspace dependencies
npm i

# 3. configure git hooks (also runs automatically via npm prepare)
chmod +x .githooks/setup.sh && ./.githooks/setup.sh
# or manually:
# git config core.hooksPath .githooks

# 4. run the sample backend
cd apps/sample-api && npm run start

# 5. run the minimal Vue frontend
cd apps/sample-vue-minimal && npm run dev
```

## Common commands

```bash
# linting and formatting (biome)
npm run lint           # lint all workspaces
npm run lint:fix       # auto-fix unsafe lint rules
npm run format         # format all workspaces
npm run check          # biome check with auto-fix (lint + format)
npm run ci             # biome ci (used in CI/CD)

# testing
npm run test:workspace      # run tests in apps/sample-api
npm run test:workspaces     # run tests in all workspaces

# openapi docs
npm run docs:generate        # generate merged openapi yaml
npm run docs:validate        # validate openapi docs

# workspace management
npm ls -ws                              # list all workspaces
npm i <pkg> --workspace=<path>          # install into a specific workspace
npm outdated -ws                        # check outdated packages across all workspaces
```

## Local URLs (sample backend)

| URL | Purpose |
|---|---|
| `http://127.0.0.1:3000/api/healthcheck` | Health check |
| `http://127.0.0.1:3000` | Express app with samples |
| `http://127.0.0.1:3000/native/index.html` | Unbundled Vue sample |

## Creating a new backend service

- Copy `apps/sample-api` to a new folder in `apps/` using kebab-case naming
- Edit `.env` and `.env.json` in the new folder as needed
- Inject secrets from environment variables or a secret manager — never commit secrets
- Do not develop directly in `sample-api`

## Creating a new frontend app

- Copy `apps/sample-vue-full` to a new folder in `apps/` using kebab-case naming
- Edit `.env` and `.env.development` as needed
- Routes use kebab-case and support up to 1 submenu level

## Code conventions

Read `docs/conventions.md` before making code changes.

- **Formatter and linter**: `biome` — run `npm run check` to auto-fix
- **No `console.*`** in backend — import and use `common/node/logger` as global `logger`
- **No `console.*`** in frontend production — errors go to Sentry
- **Config loading**: use `common/node/config` for app config
- **`.env.json`**: non-sensitive structured settings, exposed via `globalThis.__config`
- **`.env`**: sensitive values loaded into `process.env`
- **Exports**: named exports preferred; default exports only for a single class, config, or plugin
- **No barrel `index.js` files**
- **No default and named exports in the same file**
- **Use native**: test runner, datetime, fetch, npm, git hooks — avoid heavy libraries where possible
- **Validation**: use `zod` for all input validation and OpenAPI schema generation
- **Globals pattern** (when needed):
  ```js
  globalThis.__myApp = globalThis.__myApp || {}
  const _key = Symbol('key')
  globalThis.__myApp[_key] = value
  ```
- Mark incomplete or planned work with `TODO`

## Commit conventions

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/).

Only three types are allowed:

| Type | Use for |
|---|---|
| `feat` | new behaviour the user/consumer sees |
| `fix` | corrects broken behaviour |
| `chore` | everything else — build, ci, docs, style, refactor, perf, test, revert |

Format: `type(scope): short description`
Breaking changes: add `!` before the colon — `feat(auth)!: replace token format`

Use `czg` for interactive or AI-assisted commit messages:
```bash
npx czg          # interactive prompt
npx czg --ai     # AI-generated message (requires API key)
```

## Git hooks

Hooks live in `.githooks/` and are activated by `npm install` (via `npm prepare`) or manually via `git config core.hooksPath .githooks`.

**Pre-commit** (runs on `git commit`):
- Biome format and lint on affected directories
- Schema validation tests for affected schema directories

**Pre-push** (runs on `git push`):
- Unit tests (`npm run test:workspace`)
- Schema validation tests

Skip hooks temporarily:
```bash
git commit --no-verify
git push --no-verify
```

## Branch conventions

| Branch | Branch from | Merge to | Notes |
|---|---|---|---|
| `rel/1.0` | `main` | `main` when production ready | Active dev branch |
| `feat/scope/name` | `rel/1.0` | `rel/1.0` via PR | New features |
| `fix/scope/name` | `rel/1.0` | `rel/1.0` via PR | Bug fixes |
| `chore/scope/name` | `rel/1.0` | `rel/1.0` via PR | Maintenance |
| `hotfix/scope/name` | `main` | `main` + `rel/1.0` + `rel/2.0` | Emergency only |
| `tag: v1.0.0` | `rel/1.0` after merge to main | — | Full release tag |
| `tag: v1.0.1` | `rel/1.0` after hotfix merges in | — | Patch tag only, no merge back to main |
| `rel/2.0` | `main` after `v1.0.0` tag | `main` when ready | Next dev cycle |

**Key rules:**
- Tags always come from `rel/*`, never directly from `main`
- `main` only receives merges from `rel/*` or `hotfix/*`
- Hotfix backport to next release uses `git cherry-pick`, reviewed as a separate PR
- PRs use squash merge to keep history clean
- PR titles follow Conventional Commits style: `fix(auth): handle expired token`

## Updating from upstream template

```bash
# commit and push your changes first, then:
git fetch upstream          # includes tags
git pull upstream <branch or tag> --no-rebase
# resolve any template-related merge conflicts
```

## Docker / Podman

```bash
docker build -t express-template \
  --target production \
  --build-arg APP_NAME=sample-api \
  --build-arg API_PORT=3000 .

docker run -p 3000:3000 express-template
```

## CI/CD (GitHub Actions)

| Workflow | Purpose |
|---|---|
| `.github/workflows/deploy-cr.yml` | Build and push image to container registry |
| `.github/workflows/deploy-npm.yml` | Publish a package to npm |
| `.github/workflows/deploy-bucket.yml` | Deploy Vue frontend to object store |

Required GitHub Secrets:
- `CR_USERNAME` — container registry username
- `CR_PASSWORD` — container registry password

Required GitHub Variables:
- `CR_HOST` — container registry host
- `CR_NS` — container registry namespace
- `CR_IMAGENAME` — image name (defaults to repo name)

> Secrets must never be stored in the repo — use a secrets vault for CI/CD.

## Key documentation

| File | Purpose |
|---|---|
| `.github/CONTRIBUTING.md` | Contributor workflow, hooks, issue reporting, PR rules |
| `docs/conventions.md` | Coding, tooling, commit, and runtime standards |
| `docs/git.md` | Git workflow, branch/tag patterns, merge strategy |
| `docs/install-backend.md` | Backend setup and development guide |
| `docs/install-frontend.md` | Frontend setup and development guide |
| `docs/install-common.md` | Shared code and workspace reference |
| `docs/NOTES.md` | Design decisions, caveats, open questions, TODOs |
