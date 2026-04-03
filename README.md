## Read Me FIRST! - Requires NodeJS Version 18 or higher

> Do NOT edit this README. Go to [apps/README.md]() to view and edit user README
>
> Built from [https://github.com/es-labs/express-template]().
>
> For template design principles, see [https://github.com/ais-one/cookbook#important---read-me-first]()

## Template Maintenance

1 - Setup to allow incoming merge from upstream template update

```bash
# run once only after you `clone`, or `fork` or `delete .git and run git init`
./setup-upstream.sh
```

2 - Updating the template

```bash
# Commit and push to remote before running commands below
git fetch upstream # includes tags
git pull upstream <branch or tag> --no-rebase
# NO MORE IN USE git merge upstream/<branch or tag> --allow-unrelated-histories
# There may be some template related merge conflicts to resolve.
```

3 - Creating A New Service

Use `apps/app-sample` as an example on how to create a new service/application.

- Make a copy of the `app-sample` folder in the `apps` folder and rename it (kebab using case)
- edit the .env and .env.development files (.env.staging, .env.production environments should be in secrets)
- add `!<your-application-name>` to `apps\.gitignore`
- all you need to do is edit `<your-application-name>/routes` for your APIs
- TBD MCP and WS routes

**Important notes**
- DO NOT develop in `apps/app-sample`.
- userland changes ONLY in the `apps` folder, NEVER outside the folder. Contact template maintainer if you need something outside `apps`
- do note any conflicts to resolve when merging from upstream

4 - Creating A New Frontend

- Make a copy of the `web-sample` folder in the `apps` folder and rename it (kebab using case)
- edit the .env and .env.development files (.env.staging, .env.production environments should be in secrets)
- add `!<your-application-name>` to `apps\.gitignore`
- TBD MCP and WS routes


**Suggested Conventions**
- branch
  - main = stable
  - work = working branch
  - feat-<issue number>
  - bugfix-<issue number>
- release tags
  - use semver, e.g. 1.2.3
  - should tag main branch

---


[docs/install-backend.md]()

[docs/install-frontend.md]()

## CI/CD & Cloud Deployment

### Deployment Using Github Actions

- .github/workflows/deploy-cr.yml **TODO**
  - selectable inputs
    - git repo branch / tag
    - container repo tag

Build image and deploy to a container registry

**NOTE** secrets will not be in repo for CI/CD, those should be put in VAULT

Current Github Secrets

- CR_USERNAME: container registry login username (for deployment)
- CR_PASSWORD: container registry login password (for deployment)

Current Github Variables

- CR_HOST: container registry host (for deployment)
- CR_NS: container registry namespace (for deployment)
- CR_IMAGENAME: The image name. If not specified, the repository name will be used

### pkgs/jslib

NPM_AUTH_TOKEN

### webs

ACCESS_KEY_ID
ACCESS_KEY_SECRET


CR_USERNAME
CR_PASSWORD
vars.CR_HOST
vars.CR_NS
vars.CR_IMAGENAME


---

## References

- https://softwareengineering.stackexchange.com/questions/338597/folder-by-type-or-folder-by-feature
- https://kentcdodds.com/blog/how-i-structure-express-apps
