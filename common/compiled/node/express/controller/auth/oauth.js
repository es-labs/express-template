import { authFns, createToken, setTokensToHeader } from '../../../auth/index.js';

const { AUTH_ERROR_URL } = globalThis.__config;
const OAUTH_OPTIONS = globalThis.__config?.OAUTH_OPTIONS || {};
// set callback URL on github to <schema://host:port>/api/oauth/callback
// initiated from browser - window.location.replace('https://github.com/login/oauth/authorize?scope=user:email&client_id=XXXXXXXXXXXXXXXXXXXX')

// /callback
export const callbackOAuth = async (req, res) => {
  try {
    const { code, state } = req.query;
    const result = await fetch(OAUTH_OPTIONS.URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: OAUTH_OPTIONS.CLIENT_ID,
        client_secret: OAUTH_OPTIONS.CLIENT_SECRET,
        code,
        state,
      }),
    });
    const data = await result.json();
    if (data.access_token) {
      const resultUser = await fetch(OAUTH_OPTIONS.USER_URL, {
        method: 'GET',
        headers: { Authorization: `token ${data.access_token}` },
      });
      const oauthUser = await resultUser.json();
      const oauthId = oauthUser[OAUTH_OPTIONS.USER_ID]; // github id, email

      const user = await authFns.findUser({ [OAUTH_OPTIONS.FIND_ID]: oauthId }); // match github id (or email?) with our user in our application
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const { id, groups } = user;
      const tokens = await createToken({ id, groups });
      setTokensToHeader(res, tokens);
      return res.redirect(
        `${OAUTH_OPTIONS.CALLBACK}#${tokens.access_token};${tokens.refresh_token};${JSON.stringify(tokens.user_meta)}`,
      ); // use url fragment...
    }
    return res.status(401).json({ message: 'Missing Token' });
  } catch (e) {
    return AUTH_ERROR_URL ? res.redirect(AUTH_ERROR_URL) : res.status(401).json({ error: 'NOT Authenticated' });
  }
};
