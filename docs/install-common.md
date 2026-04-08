## Description

The `common` workspaces contain reusable shared code and schemas for use across applications in this monorepo.

- [common/iso](../common/iso) - isomorphic utilities that can run across multiple JavaScript runtimes
- [common/node](../common/node) - Node.js runtime modules, including Express-specific middleware and services
- [common/schemas](../common/schemas) - shared schemas written in `zod`
- [common/web](../common/web) - browser-only utilities and web components
- [common/vue](../common/vue) - Vue-specific shared modules
- [scripts](../scripts) - repository scripts for database deployment, OpenAPI generation, and related tooling


## Workspace Command Reference

- List workspaces: `npm ls -ws`
- Install by workspace: `npm i @node-saml/node-saml@latest --workspace=common/node`
- Check outdated packages: `npm outdated -ws`
- Update packages: `npm update --save`

## Publishing packages to npm

- Run `npm publish` from the CLI first if the package has not been published before.
- Start at version `0.0.1`.
- When updating a package:
  - **IMPORTANT** before publish, bump version in each project using `npm version` command (see npm version --help for explanation)
  - npm publish --access public --workspace=<workspace>
  
**NOTE** Use `--access public` because the package is scoped and published on a free plan.

Or publish using GitHub Actions with [.github/workflows/deploy-npm.yml](../.github/workflows/deploy-npm.yml). Add the npm auth token to GitHub Secrets first.


## References

- https://dev.to/cesarwbr/how-to-set-up-github-actions-to-publish-a-monorepo-to-npm-54ak
- https://github.com/marketplace/actions/publish-to-npm-monorepo
- https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages
- https://nathanfries.com/posts/docker-npm-workspaces
