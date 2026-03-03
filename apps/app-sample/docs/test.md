ais-one: Generate API documentation for this file

GitHub Copilot: Read [](file:///Users/user/work/foss/express-template/apps/app-sample/routes/base.js)

Here's a simple API reference for base.js in `express-template/apps/app-sample`:

---

## 🚀 `app-sample` Base Routes

This module exports an `express.Router` with a handful of utility endpoints used for health‑checks and basic connectivity tests.

### 🧩 Dependencies

- **express** – for routing.
- **@es-labs/node/services** – provides database connection objects (`knex`).

> ⚠️ There is also an unused helper `openMissingFile()` demonstrating error handling, but it’s not wired up.

---

### 🔗 Routes

#### `GET /`
**Description:** basic liveness check; confirms the server is running.  
**Response:**  
```json
{ "status": "app-sample OK" }
```

---

#### `GET /healthcheck`
**Description:** a secondary health endpoint.  
**Response:**  
```json
{ "status": "app-sample/healthcheck OK" }
```

---

#### `GET /check-db`
**Description:** attempts a query on the configured database connection to verify connectivity.

- **Query parameters:**
  - `conn` (optional) – name of the connection to use. Defaults to `knex1` (see `.env.sample`).
  - `sql` (optional)  – SQL statement to execute. Defaults to `SELECT 1`.

- **Success response (200):**
  ```json
  {
    "connectionName": "knex1",
    "db": "<client name>",      // e.g. "pg", "mysql"
    "result": <raw query result>
  }
  ```

- **Error response (500):** returns the thrown error object; server logs the error to the console.

---

### 📝 Notes

- The `openMissingFile()` function (above the exports) shows an example of reading a file and the danger of throwing in a callback – it isn’t used.
- Healthiness comments at the top explain different levels of operational checks, from merely responding to requests through verifying third‑party integrations.

---

You can include this markdown in your project’s documentation, or convert it to OpenAPI/Swagger specs if needed.