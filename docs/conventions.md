# Engineering Standards

This document defines repository-wide coding and runtime standards that apply across the monorepo.

Read this document before making code changes. Use [.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md) for contributor workflow, issue reporting, and pull request rules.

## Required Tooling

- [.editorconfig](../.editorconfig) is the baseline for whitespace and formatting behavior and must be followed.
- `biome` is the required formatter and linter for this repository.

## Work Tracking Standard

- Use `TODO` to mark intentionally incomplete work, planned work, or follow-up items.

## Commit Message Standard

- Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/).
- Only `feat`, `fix`, and `chore` may be used as the top-level commit types.
- Use `chore` for `build`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`, and `revert` style changes.
- Commit messages must use the format `type(scope): short description`.
- Breaking changes must add `!` before `:`.
- Use [czg](https://cz-git.qbb.sh/cli/) when generating commit messages.

## Node Runtime Standard

- Node runtime applications must import `common/node/logger` and use the global `logger` instead of `console.*`.
- Node runtime applications must import `common/node/config` for application config loading.
- `.env.json` values are for non-sensitive structured settings and are exposed globally through `globalThis.__config`.
- `.env` values are loaded into `process.env`.

## Configuration And Secrets Standard

- Secrets must not be committed to the repository.
- Secrets must be stored in environment variables or a secret manager.
- JSON config files must be used only for non-sensitive structured settings.
