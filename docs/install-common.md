## Template Maintenance

1 - Setup to allow incoming merge from upstream template update

```bash
# run once only after you `clone`, or `fork` or `delete .git and run git init`
./setup-upstream.sh
```

2 - Setup for your custom code

**Important notes**
- DO NOT develop custom code in `tools/dbdeploy/dbs/express-template`. Rename it or copy it to another folder name
- userland changes ONLY in the `tools/dbdeploy/dbs` folder, NEVER outside the folder. Contact template maintainer if you need something outside `dbs`
- do note any conflicts to resolve when merging from upstream

3 - Updating the template

```bash
# Commit and push to remote before running commands below
git fetch upstream # includes tags
git pull upstream <branch or tag> --no-rebase
# NO MORE IN USE git merge upstream/<branch or tag> --allow-unrelated-histories
# There may be some template related merge conflicts to resolve.
```

## Description

This project contains reusable and shared JS code for use in JS projects.

The following libraries are:
- **Use This** [jslib](libs/jslib/README.md) - Shareable JS using ES modules ![NPM Version](https://img.shields.io/npm/v/%40es-labs%2Fjslib)
- **Maintenance Mode** [node](libs/node/README.md) - Common JS reusables ![NPM Version](https://img.shields.io/npm/v/%40es-labs%2Fnode)
- **Maintenance Mode** [esm](libs/esm/README.md) - ES Modules reusables ![NPM Version](https://img.shields.io/npm/v/%40es-labs%2Fesm)

The common tools are:
- [tools/dbdeploy/README.md]() - deploying a database using the following suppored clients
  - Knex (sqlite, mysql, postgres, mssql, snowflake, ...)


## Workspace

1. listing workspaces `npm ls -ws`

2. Updating major version by workspace `npm i @node-saml/node-saml@latest --workspace=libs/node`

3. Updating dbdeploy workspace `npm i @es-labs/node@latest --workspace=tools/dbdeploy`

## Updating

```bash
npm outdated
# may need to edit the package.json file if library is in yellow
npm update --save
```


## Publishing packages to npm

### Update Version

**IMPORTANT** before publish, bump version in each project using `npm version` command (see npm version --help for explanation)

```bash
# see package.json on more info
npm run patch:jslib # for libs/jslib
npm run patch:node # for libs/node
npm run patch:esm # for libs/esm
```

###  Publish Package

```bash
# npm publish --access public --workspace=<workspace>
# need to use --access public as it is scoped package on free plan
npm run pub:jslib # for libs/jslib
npm run pub:node # for libs/node
npm run pub:esm # for libs/esm

# OR Publish using Github Actions .github/workflows/npm-publish.yml (add AUTH TOKEN from npm to Github Secrets)
```

## References

- https://www.aspecto.io/blog/lerna-hello-world-how-to-create-a-monorepo-for-multiple-node-packages/
- https://dev.to/cesarwbr/how-to-set-up-github-actions-to-publish-a-monorepo-to-npm-54ak
- https://github.com/marketplace/actions/publish-to-npm-monorepo
- https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages
- https://nathanfries.com/posts/docker-npm-workspaces
