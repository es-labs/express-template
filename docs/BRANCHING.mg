### branch tags used

- feat/scope/<...>
- fix/scope/<...>
- chore/scope/<...>
- release/v1.0, release/v1.1
- hotfix/v1.0/<...>
- tag/v1.0.1, tag/v1.0.2
- chore/<...>
- main

### Our Git Flow

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

