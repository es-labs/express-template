# express-template Contributing Guide
Hello and thank you for your interest in helping make express-template better. Please take a few moments to review the following guidelines:

## Important Information
* For general questions, please join [Our Discussion Board](https://github.com/es-labs/express-template/discussions).
* For repository-wide coding and runtime conventions, see [docs/conventions.md](../docs/conventions.md).
* Install packages from root level only, if it is used by workspace, name the workspace

## Git Hooks Setup

This project uses native Git hooks stored in `.githooks/`. After cloning, run the setup script once to activate them:

```bash
# Make the setup script executable and run it
chmod +x .githooks/setup.sh
./.githooks/setup.sh
```

Or, if you prefer, configure the hooks path manually:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/pre-push
```

Running `npm install` will also run `npm prepare`, which configures the hooks path automatically.

### pre-commit hook

Runs automatically on every `git commit`:

| Check | Details |
|-------|---------|
| **Biome format & lint** | Runs `npx biome check` on each affected directory (`common/iso`, `common/node`, `common/vue`, `common/web`, `apps`, `webs`, `scripts`). Run `npm run check` to auto-fix. |
| **Schema validation tests** | Runs `npm run test:schemas -- <folder>` for each affected schema directory (`common/schema`, `common/schemas`, `apps/*/schema`, `apps/*/schemas`). |

To skip the pre-commit hook temporarily:
```bash
git commit --no-verify
```

### Commit messages with czg

For standardized [Conventional Commits](https://www.conventionalcommits.org/) messages, use **czg** instead of `git commit -m "…"`:

```bash
# Interactive prompt (guided commit message)
npx czg

# AI-generated commit message (requires API key configured in czg)
npx czg --ai
```

Install globally for convenience:
```bash
npm install -g czg
```

Use the repository commit conventions in [docs/conventions.md](../docs/conventions.md) for allowed commit types and breaking-change notation.

When choosing a scope in `czg`:

- Prefer a real workspace scope such as `apps/...`, `common/...`, or `webs/...` when the change is limited to one workspace.
- Use `docs` for documentation-only changes.
- Use `ci` for workflow, hook, or automation changes.
- Use `repo` for root-level or cross-cutting changes that do not fit a single workspace.

### Changelog updates

Changelog and tag automation are handled by the `release-please` job in [hooks-ci.yml](./workflows/hooks-ci.yml).

- Release PRs and changelog updates are created from Conventional Commits on `main` and `rel/*`.
- Existing handwritten notes remain grouped under `0.1.0`.
- The workflow requires `RELEASE_PLEASE_APP_ID` and `RELEASE_PLEASE_APP_PRIVATE_KEY` for the GitHub App installation token.

Important limitation: `release-please` only opens a release PR when the branch contains releasable commits such as `feat`, `fix`, or `deps`. `chore` commits can appear in release notes, but `chore` alone does not trigger a release. To force a release version, add `Release-As: x.y.z` to the commit body.

Setup details live in [docs/git.md](../docs/git.md), and troubleshooting lives in [docs/release-troubleshooting.md](../docs/release-troubleshooting.md).

### pre-push hook

Runs automatically on every `git push`:

| Check | Details |
|-------|---------|
| **Unit tests** | Runs `npm run test:workspace` (or `npm test`). |
| **Schema validation tests** | Runs `npm run test:schemas` if the script exists. |

To skip the pre-push hook temporarily:
```bash
git push --no-verify
```

## Reporting Issues
* Do not use public GitHub issues for security vulnerabilities. Follow the private reporting instructions in [SECURITY.md](./SECURITY.md).
* The issue list of this repo is **exclusively** for Bug Reports and Feature Requests.
* Bug reproductions should be as **concise** as possible.
* **Search** for your issue, it _may_ have been answered.
* See if the error is **reproducible** with the latest version.
* If reproducible, please provide a [Codepen](https://codepen.io/) or public repository that can be cloned to produce the expected behavior. It is preferred that you create an initial commit with no changes first, then another one that will cause the issue.
* **Never** comment "+1" or "me too!" on issues without leaving additional information, use the :+1: button in the top right instead.

## Pull Requests
* Always work on a new branch. Do not work directly on `main`.
* Use branch names that follow the documented workflow: `feat/<scope>/<name>`, `fix/<scope>/<name>`, or `chore/<scope>/<name>`.
* Create normal feature and fix branches from the active `rel/*` branch and open the PR back into that same `rel/*` branch.
* Reserve `hotfix/*` branches for urgent production issues. Hotfix branches start from `main`, merge to `main`, and then must be backported to active `rel/*` branches as needed.
* Do not open day-to-day feature PRs directly against `main`. In this workflow, `main` is the stable destination branch.
* PRs should be merged with a squash merge to keep history clean and consistent with the repo workflow.
* Use a descriptive PR title. Prefer the same Conventional Commit style used for commits, for example `fix(auth): handle expired token`.
* For changes and feature requests, include a clear description of the problem, the proposed behavior, and any relevant example, request, or UI/API markup.
* Reference the issue that the PR resolves, for example `Fixes #1234` or `Resolves #6458`.

