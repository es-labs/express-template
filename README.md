## Read Me FIRST! - Requires NodeJS Version 18 or higher

> Do NOT edit this README. 
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

## Creating A New NodeJS Backend Application Or Service

[Read Here](docs/install-backend.md)

## Creating A New Web or VueJS Frontend

[Read Here](docs/install-frontend.md)

## Documentation On Common Codes and Schemas

[Read Here](docs/install-common.md)


## UNDER REFACTORING ##

Need to tidy up documentation.

- [docs/NOTES.md](docs/NOTES.md) - notes
- [docs/HOOKS.md](docs/HOOKS.md) - git hooks
- [docs/BRANCHING.md](docs/BRANCHING.md) - branch naming and merge strategy, changelog and release using semver
- [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) - to setup the Git Hooks

---


## CI/CD & Cloud Deployment Using Github Actions

**NOTE** secrets will not be in repo for CI/CD, those should be put in VAULT

### Deploy To Container Registry

[.github/workflows/deploy-cr.yml](.github/workflows/deploy-cr.yml)

- selectable inputs
  - git repo branch / tag
  - container image tag
  - path to dockerfile
  - environment (development, staging, production)
- Github Secrets
  - CR_USERNAME: container registry login username (for deployment)
  - CR_PASSWORD: container registry login password (for deployment)
- Github Variables
  - CR_HOST: container registry host (for deployment)
  - CR_NS: container registry namespace (for deployment)
  - CR_IMAGENAME: The image name. If not specified, the repository name will be used

### common/jslib - TBD

Publish a package to NPM

- Reference Workflow

[.github/workflows/deploy-npm.yml](.github/workflows/deploy-npm.yml)

- Github Secrets
  - NPM_AUTH_TOKEN
- Selectable Inputs
  - git repo branch / tag
  - project to publish (currently only jslib)

### Deploying To Object Store

Build VueJS project and deploy to Object Store

[.github/workflows/deploy-bucket.yml](.github/workflows/deploy-bucket.yml)

- Selectable Inputs
  - Cloud Provider (oss, s3)
  - git repo branch / tag
  - application name
  - bucket name
  - environment (development, staging, production)
- Github Secrets
  - ACCESS_KEY_ID
  - ACCESS_KEY_SECRET
  - OSS_HOST (if required)