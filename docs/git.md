## Workflow

Contributor-facing branch, pull request, and merge guidance now lives in [.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md).

Repository-wide coding and runtime conventions now live in [docs/conventions.md](./conventions.md).

This document keeps the repo's git workflow reference, branch/tag patterns, hooks notes, and merge-strategy discussion.

## Release Automation

Release automation is handled by the `release-please` job in [.github/workflows/hooks-ci.yml](../.github/workflows/hooks-ci.yml).

- The existing handwritten changelog stays grouped under version `0.1.0` in [CHANGELOG.md](../CHANGELOG.md).
- The workflow runs `release-please-action` in manifest mode using [release-please-config.json](../release-please-config.json) and [.release-please-manifest.json](../.release-please-manifest.json).
- Releases are tracked per workspace for `apps/*` and `webs/*`.
- The workflow requires a GitHub App installation token.
- Troubleshooting lives in [release-troubleshooting.md](./release-troubleshooting.md).

### How It Works

1. A commit lands on `main` or `rel/*`.
2. The `release-please` job scans merged Conventional Commits for each configured workspace.
3. If releasable commits exist for one or more workspaces, it opens or updates workspace-scoped release PRs.
4. When release PRs are merged, `release-please` updates changelogs, creates workspace-scoped tags, and publishes GitHub releases.

### Releasable Commits

- `feat`, `fix`, and `deps` trigger a release PR.
- `chore` can appear in the changelog if a release is already happening, but `chore` by itself does not trigger a release PR.
- To force a release version manually, add a `Release-As: x.y.z` footer to the commit body.

### GitHub App Token Setup

Use a GitHub App instead of a PAT if you want release PRs and release-created events to trigger downstream workflows.

1. Create the GitHub App under GitHub Settings → Developer settings → GitHub Apps → New GitHub App.
2. Disable webhooks and grant these repository permissions:
   - `Contents`: Read and write
   - `Pull requests`: Read and write
   - `Issues`: Read and write
   - `Metadata`: Read-only
3. Install the app on this repository.
4. Add the app ID to variable `RELEASE_PLEASE_APP_ID` and the PEM private key to secret `RELEASE_PLEASE_APP_PRIVATE_KEY`.
5. If your repository or organization restricts workflow-created PRs, enable the setting that allows GitHub Actions to create and approve pull requests.

Once configured, the workflow step uses [actions/create-github-app-token](https://github.com/actions/create-github-app-token) to mint a short-lived installation token and passes it to `release-please`.

If the variable or secret is missing, the workflow fails early instead of falling back to `GITHUB_TOKEN`.

### branch tags used

- <feat/fix/chore>/scope/<...>
- rel/<current release version>, rel/<next release version>
  - can add -rc.1, -beta.1 suffixes as needed
- hotfix/<current release version>/<...>
- tag/<patch version>
- main

### Branch & Tag Summary & Flow

| Branch | Branch from | Merge to | Notes |
|---|---|---|---|
| `rel/1.0` | `main` | `main` when production ready | Active dev branch |
| `feat/fix/chore` | `rel/1.0` | `rel/1.0` via PR | Day-to-day work |
| `hotfix/scope/name` | `main` | `main` + `rel/1.0` + `rel/2.0` | Emergency only |
| `tag: v1.0.0` | `rel/1.0` after merge to main | — | Full release tag |
| `tag: v1.0.1` | `rel/1.0` after hotfix merges in | — | Patch tag, then rel/1.0 → main |
| `rel/1.1` | `main` after `v1.0.0` tag | `main` when ready | Cut from stable tag |

The consistent rule is: **tags always come from `rel/*`**, never directly from `main`. Main is the destination, not the source of truth for what shipped.

### Hotfix & Backport Flow

```
hotfix/payment-crash (check out from rel/v1.0)
  → merge to main (keeps main stable)
  → merge to rel/1.0
      → tag v1.0.1 here (patch tag on rel/1.0)
      → DO NOT DO THIS! DANGEROUS! merge rel/1.0 to main (main now has the patch)
  → cherry-pick to rel/2.0 (backport)
```

---

## Hooks Usage

```bash
# remove hooks path
git config --local --unset-all core.hooksPath
# set hooks path explicitly
git config --local core.hooksPath .githooks
# or let npm prepare configure it during npm install
```

This repository uses native hooks from `.githooks/`.

- Pre-commit runs Biome checks on affected directories and schema validation tests where applicable.
- Pre-push runs workspace tests and schema validation checks.
- `npm install` also runs `npm prepare`, which configures the hooks path automatically.

To skip hooks temporarily:

```bash
git commit --no-verify
git push --no-verify
```

For the exact hook behavior, see [.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md).

## Rebase Or Merge

Use the repo workflow rather than a per-team merge style.

- Day-to-day feature and fix PRs should use squash merge.
- Open those PRs from `feat/*`, `fix/*`, or `chore/*` into the active `rel/*` branch.
- Reserve `hotfix/*` branches for urgent fixes that start from `main`, merge to `main`, and are then backported to active `rel/*` branches.
- Use cherry-pick for hotfix backports when the same fix must land in multiple release branches.

This keeps release history predictable for `release-please` and matches the contributor workflow in [.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md).

---

## Branch Protection Rules

Edit branch protection rules in **Settings** → **Branches** → **Add branch protection rule** to prevent merges when CI checks fail.

### Protection for `main` and `rel/*`

Create two rules:

1. **Pattern:** `main`
2. **Pattern:** `rel/*`

For each pattern, enable:

| Setting | Action |
|---------|--------|
| **Require a pull request before merging** | Enable. Require 1 approval. Dismiss stale approvals on new commits. |
| **Require status checks to pass** | Enable. Require branches to be up to date. |
| | Add required checks: `Commit Message Format`, `Biome Checks`, `Schema Validation Tests`, `Unit Tests`, `Integration Tests`, `E2E Tests` |
| **Require conversation resolution before merging** | Enable. |
| **Include administrators** | Enable. Prevents bypass by repo admins. |

### CI Action Shape

- [baseline](hooks-ci-base.yml)
- [standard](hooks-ci-standard.yml)

```yaml

# Full — release tags or main merge
on:
  push:
    branches: [main]
  release:
    types: [published]
jobs:
  full:
    steps:
      - everything above

```


The required check names match the job `name:` fields in [.github/workflows/hooks-ci.yml](../.github/workflows/hooks-ci.yml):

```yaml
jobs:
  commit-lint:
    name: Commit Message Format       # ← Required check
  biome:
    name: Biome Checks                # ← Required check
  schema-tests:
    name: Schema Validation Tests     # ← Required check
  unit-tests:
    name: Unit Tests                  # ← Required check
  integration-tests:
    name: Integration Tests           # ← Required check
  e2e-tests:
    name: E2E Tests                   # ← Required check
```

> **Note:** Unit and integration tests run for touched workspaces only, identified by the `detect-touched-workspaces` action. E2E tests run for touched `webs/*` workspaces only and execute the workspace `test` script.

### Result

Once configured:
- PRs show red X if any required check fails.
- Merges are blocked until all checks pass and approvals are met.
- The branch protection rules apply uniformly across day-to-day work (`rel/*` branches), production merges (`main`), and emergency hotfixes.