## Description

The common folder contains reusable and shared JS code adn schemas for use in JS projects.

- [common/iso]() - all runtimes capable
- [common/node]() - NodeJS runtime (includes express specific middleware)
- [common/schemas]() - Common schemas written in `zod` code
- [common/web]() - browser runtime only
- [common/vue]() - vueJS specific shares 
- [scripts]() - deploying a database, generate api docs, etc.


## Workspace Command Reference

- listing workspaces `npm ls -ws`
- Install by workspace `npm i @node-saml/node-saml@latest --workspace=common/node`
- Checking npm outdated
- Updating npm update --save

## Publishing packages to npm

- need to run npm publish command on cli first if it did not exist
- start at version 0.0.1
- updating package
  - **IMPORTANT** before publish, bump version in each project using `npm version` command (see npm version --help for explanation)
  - npm publish --access public --workspace=<workspace>
  
**NOTE** `--access public` as it is scoped package on free plan

# OR Publish using Github Actions .github/workflows/npm-publish.yml (add AUTH TOKEN from npm to Github Secrets)


## References

- https://dev.to/cesarwbr/how-to-set-up-github-actions-to-publish-a-monorepo-to-npm-54ak
- https://github.com/marketplace/actions/publish-to-npm-monorepo
- https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages
- https://nathanfries.com/posts/docker-npm-workspaces
