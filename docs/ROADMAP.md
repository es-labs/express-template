## ROADMAP

- **IN PROGRESS**
  - JSON in env, refactor to use something else
  - fix typescript noExplicit any
  - Clean up auth and documentations
- **TO TEST** 
  - add RBAC and FGA
  - Typescript to zod, convert code to TS for node runtime...
  - audit_logs
- **BACKLOG**
  - safeJSON
  - remove barrel index.js files...
- **REVIEW**
  - use [testcontainers](https://testcontainers.com/guides/getting-started-with-testcontainers-for-nodejs/), data is not persisted
  - visualize package sizes with rollup-plugin-visualizer
  - revisit biome when vueJS support is available
  - S3/OSS


<!--
on:
  push:
    branches: [TODO]
    paths:
      - 'services/auth-service/**'
      - 'shared/**'
      - '.github/workflows/deploy-auth-service.yml'
-->
