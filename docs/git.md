## Workflow

### Merge Strategy

- USE git merge! + squash commit As explained by AI
- git rebase best for large open source projects

### branch tags used

- <feat/fix/chore>/scope/<...>
- release/<current release version>, release/<next release version>
- hotfix/<current release version>/<...>
- tag/<patch version>
- main

### Branch Summary & Flow

| Branch | Branch from | Merge to | Notes |
|---|---|---|---|
| `release/1.0` | `main` | `main` when production ready | Active dev branch |
| `feat/fix/chore` | `release/1.0` | `release/1.0` via PR | Day-to-day work |
| `hotfix/scope/name` | `main` | `main` + `release/1.0` + `release/2.0` | Emergency only |
| `tag: v1.0.0` | `release/1.0` after merge to main | — | Full release tag |
| `tag: v1.0.1` | `release/1.0` after hotfix merges in | — | Patch tag, then release/1.0 → main |
| `release/1.1` | `main` after v1.0.0 tag | `main` when ready | Cut from stable tag |

The consistent rule is: **tags always come from `release/*`**, never directly from `main`. Main is the destination, not the source of truth for what shipped.

### Hotfix & Backport Flow

```
hotfix/payment-crash (check out from release/v1.0)
  → merge to main                     (keeps main stable)
  → merge to release/1.0
      → tag v1.0.1 here               (patch tag on release/1.0)
      → DO NOT DO THIS! DANGEROUS! merge release/1.0 to main     (main now has the patch)
  → cherry-pick to release/2.0        (backport)
```


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

