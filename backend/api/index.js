// backend/api/index.js
//
// Azure Function entry point that hosts the Express app defined in `app.js`.
// `azure-function-express` bridges the Azure Functions v2 HTTP trigger context
// into Express's request/response lifecycle, so every route registered on the
// Express app (e.g. GET /api/accounts, POST /api/cases/create) is served by
// this single Function named `api`.
//
// Route binding summary:
//   function.json declares `route: "api/{*path}"`  (catch-all)
//   Incoming: https://<function>.azurewebsites.net/api/accounts
//   Becomes:  req.url = "/api/accounts" inside Express
require('dotenv').config();
const createHandler = require('azure-function-express').createHandler;
const app = require('../app');

// The exported async function IS the Azure Function. Azure's runtime calls it
// with (context, req) and awaits the returned Promise.
module.exports = createHandler(app);
