import history from 'connect-history-api-fallback';
import serveIndex from 'serve-index';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const postRoute = (app, express) => {
  const { UPLOAD_STATIC = null, WEB_STATIC = null } = globalThis.__config;
  // app.set('case sensitive routing', true)

  // Upload URL, Should use Signed URL and get from cloud storage instead
  if (UPLOAD_STATIC) {
    // connect-history-api-fallback causes problems, so do upload first

    UPLOAD_STATIC.forEach(item => {
      const { url, folder, list, listOptions } = item;
      if (url && folder) {
        const authPlaceHolder = (req, res, next) => next(); // TODO add auth here...
        app.use(url, authPlaceHolder, express.static(folder));
        if (list) app.use(url, serveIndex(folder, listOptions)); // allow file and directory to be listed
      }
    });
  }

  if (WEB_STATIC?.length) {
    app.use(history()); // causes problems when using postman - set header accept application/json in postman
    WEB_STATIC.forEach(item => {
      app.use(item.url, express.static(item.folder, item.options)); // { extensions: ['html'], index: false }
    });
  }

  // app.use(":wildcard", (req, res) => res.status(404).json({ Error: '404 Not Found...' }))
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
  // 'Bad Request': 400, 'Unauthorized': 401, 'Forbidden': 403, 'Not Found': 404, 'Conflict': 409, 'Unprocessable Entity': 422, 'Internal Server Error': 500,
  app.use(notFoundHandler); // 404 — must come after all valid routes
  app.use(errorHandler);

  return this;
};

export default postRoute;
