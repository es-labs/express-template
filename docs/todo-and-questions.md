

## TODO

- **IN PROGRESS** JSON in env, refactor to use something else
  - have issue with services where there is nested JSON
- safeJSON
- remove barrel index.js files...
- add RBAC
- audit_logs
on:
  push:
    branches: [TODO]
    paths:
      - 'services/auth-service/**'
      - 'shared/**'
      - '.github/workflows/deploy-auth-service.yml'

- visualize package
TO view large bundle sizes
```
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  vue(),
  visualizer({
    open: true,
    filename: 'dist/stats.html'
  })
]
```

- revisit biome when vueJS support is available


## Questions

- should we use [testcontainers](https://testcontainers.com/guides/getting-started-with-testcontainers-for-nodejs/), data is not persisted

- [pglite](https://pglite.dev/) supports only pg but can persist data, number of connections is limited to 1 though, but you get pg plugins