## Workflow

TODO - MOVE THIS TO CONTRIBUTING.md

### Base Rules
- TODO - See branch summary on code flows
  - create a release branch from main branch if there is none
  - checkout new branch from a release branch for work
- See [.editorconfig] on code formatting baseline
- Use `TODO` for work in progress as well as planned work
- Use git merge with squash commit
  - TBD...
- For node runtime applications
  - import `common/node/logger`
    - use the global logger `logger`, do not use `console.*`
  - import `common/node/config`
    - `.config.json` values will be available globally via `config`
    - `.env` values will be loaded to process.env
- Use `biome` for formatting and linting
- commiting
  - based on [conventional commit](https://www.conventionalcommits.org/)
  - use only feat, fix, chore
  - chore for (build, chore, ci, docs, style, refactor, perf, test, revert)
  - format is type(scope): <...details>
  - prepend ! before : for breaking changes
  - Tool used is [czg](https://cz-git.qbb.sh/cli/) with AI optional

### branch tags used

- <feat/fix/chore>/scope/<...>
- rel/<current release version>, rel/<next release version>
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
# to remove hooks in git
git config --local --unset-all core.hooksPath
# set git hooks path explicitly
git config --local core.hooksPath .githooks
# or implicitly set it when using npm `prepare` script
```

### Minimal Hooks

Pre-commit:  
✅ ESLint (staged files)  
✅ Prettier (auto-fix)  
✅ Type check  
✅ Commit message validation  
  
Pre-push:  
✅ Full test suite  
✅ Build  
✅ Security audit  

### Complete (Production)

Pre-commit:  
✅ ESLint (staged files)  
✅ Prettier (auto-fix)  
✅ Type check (quick)  
✅ Spell check  
✅ Debug code detection  
✅ Commit message validation  
  
Pre-push:  
✅ Full test suite with coverage  
✅ Build verification  
✅ Security audit  
✅ Bundle size analysis  
✅ Integration tests  
✅ Merge conflict check  

CI/CD:  
✅ All above checks  
✅ E2E tests  
✅ Coverage reporting  
✅ Performance monitoring  
✅ Deployment  


### Summary Table

|Task|Pre-Commit|Pre-Push|CI/CD|
|----|----------|--------|-----|
|Lint|✅ Staged only|✅ Full|✅ Full|
|Format|✅ Auto-fix|⚠️ Optional|✅ Check|
|Type check|✅ Quick|✅ Full|✅ Full|
|Tests|❌ No|✅ Unit|✅ All|
|Build|❌ No|✅ Yes|✅ Yes|
|Security|❌ No|✅ Audit|✅ Scan|
|Bundle size|❌ No|✅ Check|✅ Track|
|Integration tests|❌ No|✅ Yes|✅ Yes|
|E2E tests|❌ No|❌ No|✅ Yes|
|Coverage|❌ No|⚠️ Optional|✅ Report|


## Rebase Or Merge

Scenario 1: Large Team (50+ developers)
- Strategy: Squash merge to main
- Reason: Keeps history clean, easier to track PRs
- GitHub setting: Default to squash merge
- Branch protection: Require PR reviews before merge

**RECOMMENDED** Scenario 2: Monorepo with Multiple Teams 
- Strategy: Merge commits with meaningful messages
- Reason: Need to track which team merged what
- Command: git merge --no-ff
- Message: "Merge PR #123: Feature X (Team A)"

Scenario 3: Microservices
- Strategy: Squash merge per service
- Reason: Each service is independent, one commit = one deploy
- Per-service branch protection with squash merge

Scenario 4: Open Source Project
- Strategy: Rebase + merge
- Reason: Linear history, clean for contributors
- Setting: Allow rebase merge in GitHub
- Enforce: Require commits to be signed

