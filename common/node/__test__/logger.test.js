/*
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const createMiddleware = label => {
    const fn = vi.fn((req, res, next) => next?.());
    fn._label = label;
    return fn;
  };

  const app = {
    use: vi.fn(),
  };

  const server = {
    on: vi.fn(),
    close: vi.fn(cb => cb?.()),
  };

  const expressModule = vi.fn(() => app);
  expressModule.json = vi.fn(options => {
    const fn = createMiddleware('express.json');
    fn._options = options;
    return fn;
  });
  expressModule.urlencoded = vi.fn(options => {
    const fn = createMiddleware('express.urlencoded');
    fn._options = options;
    return fn;
  });

  return {
    createMiddleware,
    app,
    server,
    expressModule,
    httpCreateServer: vi.fn(() => server),
    httpsCreateServer: vi.fn(() => server),
    servicesStart: vi.fn(),
    servicesStop: vi.fn(),
    servicesGet: vi.fn(key => {
      if (key === 'keyv') return 'mock-keyv';
      if (key === 'knex1') return 'mock-knex1';
      return `mock-${key}`;
    }),
    authSetup: vi.fn(),
    healthRouter: { __type: 'health-router' },
    helmetNoSniff: vi.fn(() => createMiddleware('helmet.noSniff')),
    helmetXssFilter: vi.fn(() => createMiddleware('helmet.xssFilter')),
    helmetHidePoweredBy: vi.fn(() => createMiddleware('helmet.hidePoweredBy')),
    helmetContentSecurityPolicy: vi.fn(options => {
      const fn = createMiddleware('helmet.contentSecurityPolicy');
      fn._options = options;
      return fn;
    }),
    cors: vi.fn(options => {
      const fn = createMiddleware('cors');
      fn._options = options;
      return fn;
    }),
    cookieParser: vi.fn(secret => {
      const fn = createMiddleware('cookieParser');
      fn._secret = secret;
      return fn;
    }),
    pathMatch: vi.fn(route => url => url === route),
  };
});

vi.mock('helmet', () => ({
  default: {
    noSniff: mocks.helmetNoSniff,
    xssFilter: mocks.helmetXssFilter,
    hidePoweredBy: mocks.helmetHidePoweredBy,
    contentSecurityPolicy: mocks.helmetContentSecurityPolicy,
  },
}));

vi.mock('cors', () => ({
  default: mocks.cors,
}));

vi.mock('cookie-parser', () => ({
  default: mocks.cookieParser,
}));

vi.mock('path-to-regexp', () => ({
  default: {
    match: mocks.pathMatch,
  },
}));

vi.mock('node:http', () => ({
  default: {
    createServer: mocks.httpCreateServer,
  },
}));

vi.mock('node:https', () => ({
  default: {
    createServer: mocks.httpsCreateServer,
  },
}));

vi.mock('express', () => ({
  default: mocks.expressModule,
}));

vi.mock('../node/services/index.js', () => ({
  start: mocks.servicesStart,
  stop: mocks.servicesStop,
  get: mocks.servicesGet,
}));

vi.mock('../node/auth/index.js', () => ({
  setup: mocks.authSetup,
}));

vi.mock('./health/router.js', () => ({
  healthRouter: mocks.healthRouter,
}));

vi.mock('../node/logging/index.js', () => ({
  logger: {},
}));

vi.mock('@common/node/logging', () => ({
  logger: {},
}));

const baseEnv = { ...process.env };

function resetModuleMocks() {
  mocks.app.use.mockReset();

  mocks.server.on.mockReset();
  mocks.server.close.mockReset();
  mocks.server.close.mockImplementation(cb => cb?.());

  mocks.expressModule.mockReset();
  mocks.expressModule.mockImplementation(() => mocks.app);

  mocks.expressModule.json.mockReset();
  mocks.expressModule.json.mockImplementation(options => {
    const fn = mocks.createMiddleware('express.json');
    fn._options = options;
    return fn;
  });

  mocks.expressModule.urlencoded.mockReset();
  mocks.expressModule.urlencoded.mockImplementation(options => {
    const fn = mocks.createMiddleware('express.urlencoded');
    fn._options = options;
    return fn;
  });

  mocks.httpCreateServer.mockReset();
  mocks.httpCreateServer.mockImplementation(() => mocks.server);

  mocks.httpsCreateServer.mockReset();
  mocks.httpsCreateServer.mockImplementation(() => mocks.server);

  mocks.servicesStart.mockReset();
  mocks.servicesStop.mockReset();
  mocks.servicesStop.mockResolvedValue(undefined);
  mocks.servicesGet.mockReset();
  mocks.servicesGet.mockImplementation(key => {
    if (key === 'keyv') return 'mock-keyv';
    if (key === 'knex1') return 'mock-knex1';
    return `mock-${key}`;
  });

  mocks.authSetup.mockReset();

  mocks.helmetNoSniff.mockReset();
  mocks.helmetNoSniff.mockImplementation(() => mocks.createMiddleware('helmet.noSniff'));

  mocks.helmetXssFilter.mockReset();
  mocks.helmetXssFilter.mockImplementation(() => mocks.createMiddleware('helmet.xssFilter'));

  mocks.helmetHidePoweredBy.mockReset();
  mocks.helmetHidePoweredBy.mockImplementation(() => mocks.createMiddleware('helmet.hidePoweredBy'));

  mocks.helmetContentSecurityPolicy.mockReset();
  mocks.helmetContentSecurityPolicy.mockImplementation(options => {
    const fn = mocks.createMiddleware('helmet.contentSecurityPolicy');
    fn._options = options;
    return fn;
  });

  mocks.cors.mockReset();
  mocks.cors.mockImplementation(options => {
    const fn = mocks.createMiddleware('cors');
    fn._options = options;
    return fn;
  });

  mocks.cookieParser.mockReset();
  mocks.cookieParser.mockImplementation(secret => {
    const fn = mocks.createMiddleware('cookieParser');
    fn._secret = secret;
    return fn;
  });

  mocks.pathMatch.mockReset();
  mocks.pathMatch.mockImplementation(route => url => url === route);
}

function applyEnv(env = {}) {
  process.env = { ...baseEnv };

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined || value === null) {
      delete process.env[key];
    } else {
      process.env[key] = String(value);
    }
  }
}

async function loadPreRoute(env = {}) {
  vi.resetModules();
  resetModuleMocks();
  applyEnv(env);
  const mod = await import('./preRoute.js');
  return mod.default;
}

function getMountedMiddleware(label) {
  return mocks.app.use.mock.calls.find(([first]) => first?._label === label)?.[0];
}

function getAnonymousMiddlewares() {
  return mocks.app.use.mock.calls
    .filter(([first]) => typeof first === 'function' && !first._label)
    .map(([first]) => first);
}

describe('preRoute', () => {
  beforeEach(() => {
    resetModuleMocks();
    applyEnv();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...baseEnv };
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns app, express, and server while wiring services, auth, and the health router', async () => {
    const preRoute = await loadPreRoute({
      GRACEFUL_EXIT: '',
      COOKIE_SECRET: 'test-cookie-secret',
    });

    const result = preRoute();

    expect(result.app).toBe(mocks.app);
    expect(result.express).toBe(mocks.expressModule);
    expect(result.server).toBe(mocks.server);

    expect(mocks.httpCreateServer).toHaveBeenCalledWith(mocks.app);
    expect(mocks.httpsCreateServer).not.toHaveBeenCalled();

    expect(mocks.servicesStart).toHaveBeenCalledWith(mocks.app, mocks.server);
    expect(mocks.servicesStart.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.authSetup.mock.invocationCallOrder[0],
    );

    expect(mocks.servicesGet).toHaveBeenNthCalledWith(1, 'keyv');
    expect(mocks.servicesGet).toHaveBeenNthCalledWith(2, 'knex1');
    expect(mocks.authSetup).toHaveBeenCalledWith('mock-keyv', 'mock-knex1');

    expect(mocks.app.use.mock.calls[1]).toEqual(['/health', mocks.healthRouter]);
    expect(mocks.cookieParser).toHaveBeenCalledWith('test-cookie-secret');
  });

  it('creates an HTTPS server when certificate configuration is present', async () => {
    const preRoute = await loadPreRoute({
      GRACEFUL_EXIT: '',
      HTTPS_CERTIFICATE: 'cert-data',
      HTTPS_PRIVATE_KEY: 'key-data',
      HTTPS_PASSPHRASE: 'passphrase',
    });

    preRoute();

    expect(mocks.httpsCreateServer).toHaveBeenCalledWith(
      expect.objectContaining({
        cert: 'cert-data',
        key: 'key-data',
        passphrase: 'passphrase',
      }),
      mocks.app,
    );
    expect(mocks.httpCreateServer).not.toHaveBeenCalled();
  });

  it('registers graceful shutdown handlers and stops services only once', async () => {
    vi.useFakeTimers();

    const processOnSpy = vi.spyOn(process, 'on');
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined);

    const preRoute = await loadPreRoute({
      GRACEFUL_EXIT: '1',
      SHUTDOWN_TIMEOUT_MS: '250',
    });

    preRoute();

    expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('SIGQUIT', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));

    const sigtermHandler = processOnSpy.mock.calls.find(([event]) => event === 'SIGTERM')[1];

    await sigtermHandler('SIGTERM');
    await Promise.resolve();
    await Promise.resolve();

    expect(mocks.server.close).toHaveBeenCalledTimes(1);
    expect(mocks.servicesStop).toHaveBeenCalledTimes(1);
    expect(processExitSpy).toHaveBeenCalledWith(0);

    await sigtermHandler('SIGTERM');
    expect(mocks.server.close).toHaveBeenCalledTimes(1);
    expect(mocks.servicesStop).toHaveBeenCalledTimes(1);
  });

  it('destroys non-websocket upgrade requests and leaves websocket upgrades alone', async () => {
    const preRoute = await loadPreRoute({
      GRACEFUL_EXIT: '',
    });

    preRoute();

    const upgradeHandler = mocks.server.on.mock.calls.find(([event]) => event === 'upgrade')[1];

    const badSocket = { destroy: vi.fn() };
    upgradeHandler({ headers: { upgrade: 'h2c' } }, badSocket, Buffer.alloc(0));
    expect(badSocket.destroy).toHaveBeenCalledTimes(1);

    const wsSocket = { destroy: vi.fn() };
    upgradeHandler({ headers: { upgrade: 'websocket' } }, wsSocket, Buffer.alloc(0));
    expect(wsSocket.destroy).not.toHaveBeenCalled();
  });

  it('applies Helmet middleware based on HELMET_OPTIONS', async () => {
    const preRoute = await loadPreRoute({
      GRACEFUL_EXIT: '',
      HELMET_OPTIONS: JSON.stringify({
        nosniff: true,
        xssfilter: true,
        hideServer: true,
        csp: { directives: { defaultSrc: ["'self'"] } },
      }),
    });

    preRoute();

    expect(mocks.helmetNoSniff).toHaveBeenCalledTimes(1);
    expect(mocks.helmetXssFilter).toHaveBeenCalledTimes(1);
    expect(mocks.helmetHidePoweredBy).toHaveBeenCalledTimes(1);
    expect(mocks.helmetContentSecurityPolicy).toHaveBeenCalledWith({
      directives: { defaultSrc: ["'self'"] },
    });

    expect(getMountedMiddleware('helmet.noSniff')).toBeTruthy();
    expect(getMountedMiddleware('helmet.xssFilter')).toBeTruthy();
    expect(getMountedMiddleware('helmet.hidePoweredBy')).toBeTruthy();
    expect(getMountedMiddleware('helmet.contentSecurityPolicy')).toBeTruthy();
  });

  it('throws when HELMET_OPTIONS is invalid JSON', async () => {
    const preRoute = await loadPreRoute({
      GRACEFUL_EXIT: '',
      HELMET_OPTIONS: '{invalid-json',
    });

    expect(() => preRoute()).toThrow();
  });

  it('applies parsed CORS options and sets missing CORS default headers', async () => {
    const preRoute = await loadPreRoute({
      GRACEFUL_EXIT: '',
      CORS_OPTIONS: JSON.stringify({ origin: 'https://example.com', credentials: true }),
      CORS_DEFAULTS: JSON.stringify({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }),
    });

    preRoute();

    expect(mocks.cors).toHaveBeenCalledWith({
      origin: 'https://example.com',
      credentials: true,
    });
    expect(getMountedMiddleware('cors')).toBeTruthy();

    const corsDefaultsMiddleware = getAnonymousMiddlewares()[2];
    const next = vi.fn();
    const res = {
      get: vi.fn(() => undefined),
      set: vi.fn(),
    };

    corsDefaultsMiddleware({}, res, next);

    expect(res.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.set).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws when CORS_DEFAULTS is invalid JSON', async () => {
    const preRoute = await loadPreRoute({
      GRACEFUL_EXIT: '',
      CORS_DEFAULTS: '{bad-json',
    });

    expect(() => preRoute()).toThrow();
  });

  it('skips express.json for raw routes and uses parsed body-parser options for normal routes', async () => {
    const preRoute = await loadPreRoute({
      GRACEFUL_EXIT: '',
      BODYPARSER_RAW_ROUTES: '/webhook,/upload',
      BODYPARSER_JSON: JSON.stringify({ limit: '5mb' }),
      BODYPARSER_URLENCODED: JSON.stringify({ extended: false, limit: '1mb' }),
    });

    preRoute();

    expect(mocks.expressModule.urlencoded).toHaveBeenCalledWith({
      extended: false,
      limit: '1mb',
    });

    const bodySelectorMiddleware = getAnonymousMiddlewares()[2];

    const rawNext = vi.fn();
    bodySelectorMiddleware({ originalUrl: '/webhook' }, {}, rawNext);

    expect(mocks.expressModule.json).not.toHaveBeenCalled();
    expect(rawNext).toHaveBeenCalledTimes(1);

    const normalNext = vi.fn();
    const req = { originalUrl: '/users' };
    const res = {};

    bodySelectorMiddleware(req, res, normalNext);

    expect(mocks.expressModule.json).toHaveBeenCalledWith({ limit: '5mb' });

    const jsonMiddleware = mocks.expressModule.json.mock.results[0].value;
    expect(jsonMiddleware).toHaveBeenCalledWith(req, res, normalNext);
  });

  it('uses the default rounded cookie secret when COOKIE_SECRET is not provided', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(28800000 * 10 + 1234);

    const preRoute = await loadPreRoute({
      GRACEFUL_EXIT: '',
      COOKIE_SECRET: undefined,
    });

    preRoute();

    expect(mocks.cookieParser).toHaveBeenCalledWith(String(28800000 * 10));
  });

  it('updates Error.stackTraceLimit from STACK_TRACE_LIMIT', async () => {
    const preRoute = await loadPreRoute({
      GRACEFUL_EXIT: '',
      STACK_TRACE_LIMIT: '12',
    });

    preRoute();

    expect(Error.stackTraceLimit).toBe(12);
  });

  it('swallows auth setup errors and continues bootstrapping', async () => {
    mocks.authSetup.mockImplementationOnce(() => {
      throw new Error('auth setup failed');
    });

    const preRoute = await loadPreRoute({
      GRACEFUL_EXIT: '',
    });

    expect(() => preRoute()).not.toThrow();
    expect(mocks.servicesStart).toHaveBeenCalledTimes(1);
  });
});
*/