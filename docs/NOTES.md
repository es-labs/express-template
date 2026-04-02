## TBD
js-template

- pure ES modules
- go native Js as much as possible
  - test runners
  - date time
  - fetch / xhr
- workspaces
  - microservices or applications
    - default port 3000
  - common/shared code
  - packages
  - tools
- web frontends ? to include? can be quite heavy
- use zod for validation and openapi generation...
- automation
  - non-critical
    - commit messages
    - changelog
    - release
    - code review
  - api documentation
  - test generation
  - jsdoc for typing and autocomplete on IDE


### Rebase Or Merge

Scenario 1: Large Team (50+ developers)
- Strategy: Squash merge to main
- Reason: Keeps history clean, easier to track PRs
- GitHub setting: Default to squash merge
- Branch protection: Require PR reviews before merge

**recommended** Scenario 2: Monorepo with Multiple Teams 
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

