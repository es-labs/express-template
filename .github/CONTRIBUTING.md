# express-template Contributing Guide
Hello and thank you for your interest in helping make express-template better. Please take a few moments to review the following guidelines:

## IMPORTANT INFORMATION
* For general questions, please join [Our Discussion Board](https://github.com/es-labs/express-template/discussions).

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
| **Schema validation tests** | Runs `npm run test:schemas` when files in `schema/` or `schemas/` folders are staged. |

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
* The issue list of this repo is **exclusively** for Bug Reports and Feature Requests.
* Bug reproductions should be as **concise** as possible.
* **Search** for your issue, it _may_ have been answered.
* See if the error is **reproduceable** with the latest version.
* If reproduceable, please provide a [Codepen](https://codepen.io/) or public repository that can be cloned to produce the expected behavior. It is preferred that you create an initial commit with no changes first, then another one that will cause the issue. 
* **Never** comment "+1" or "me too!" on issues without leaving additional information, use the :+1: button in the top right instead.

## Pull Requests
* Always work on a new branch. Making changes on your fork's `dev` or `master` branch can cause problems. (See [The beginner's guide to contributing to a GitHub project](https://akrabat.com/the-beginners-guide-to-contributing-to-a-github-project/))
* Bug fixes should be submitted to the `master` branch.
* New features and breaking changes should be submitted to the `dev` branch.
* Use a descriptive title no more than 64 characters long. This will be used as the commit message when your PR is merged. 
* For changes and feature requests, please include an example of what you are trying to solve and an example of the markup. It is preferred that you create an issue first however, as that will allow the team to review your proposal before you start. 
* Please reference the issue # that the PR resolves, something like `Fixes #1234` or `Resolves #6458` (See [closing issues using keywords](https://help.github.com/articles/closing-issues-using-keywords/))

