// working SAML ADFS example
// no refresh token, issue own OAuth2 like JWT server

import { SAML } from '@node-saml/node-saml';
import { createToken, setTokensToHeader } from '@common/node/auth/index';

const { SAML_OPTIONS, SAML_JWT_MAP, SAML_CERTIFICATE, SAML_PRIVATE_KEY, AUTH_ERROR_URL } = process.env;
const samlJwtMap = JSON.parse(SAML_JWT_MAP || null);
const samlOptions = JSON.parse(SAML_OPTIONS || null);

if (samlOptions) {
  if (SAML_CERTIFICATE) samlOptions.privateCert = SAML_CERTIFICATE;
  if (SAML_PRIVATE_KEY) {
    samlOptions.privateKey = SAML_PRIVATE_KEY;
    samlOptions.decryptionPvk = SAML_PRIVATE_KEY;
  }
}

const saml = samlOptions ? new SAML(samlOptions) : null;

// /login
export const login = async (req, res) => {
  // return res.redirect('/' + token...) // for faking, bypass real callback
  // console.debug(req.header('referer'), req.query.RelayState)
  // getAuthorizeUrlAsync(RelayState: string, host: string | undefined, options: AuthOptions)
  const authUrl = await saml?.getAuthorizeUrlAsync(req.query.RelayState); // validatePostResponseAsync (calls..., processValidlySignedPostRequestAsync)
  res.redirect(authUrl);
};

// POST /callback
export const auth = async (req, res) => {
  try {
    const parsedResponse = await saml?.validatePostResponseAsync(req.body);

    // TEST
    // console.log(typeof parsedResponse, parsedResponse)
    // res.json({ message: 'testing node-saml ok', parsedResponse })

    // Callback
    try {
      const TO = req.body.RelayState;
      const authenticated = !parsedResponse.loggedOut;
      const user = {
        id: parsedResponse.profile[samlJwtMap.id], // id: req.user.nameID, // string
        groups: parsedResponse.profile[samlJwtMap.groups], // groups: req.user.Role, // comma seperated string or array or object...
      };
      if (!TO) {
        // if no RelayState, then it is a test
        return res.status(200).json({
          authenticated,
          user,
        });
      }
      // console.log(TO, user, authenticated, samlJwtMap, parsedResponse['Role'])
      if (authenticated) {
        const tokens = await createToken(user);
        setTokensToHeader(res, tokens);
        return res.redirect(`${TO}#${tokens.access_token};${tokens.refresh_token};${JSON.stringify(tokens.user_meta)}`); // use url fragment...
      } else {
        return AUTH_ERROR_URL ? res.redirect(AUTH_ERROR_URL) : res.status(401).json({ error: 'NOT Authenticated' });
      }
    } catch (e) {
      //   return AUTH_ERROR_URL ? res.redirect(AUTH_ERROR_URL) : res.status(500).json({ error: e.toString() })
    }
  } catch (e) {
    // console.log('SAML callback error', e)
    res.json({
      message: e.toString(),
      note: 'Currently it always triggers invalid document signature fix is on the way',
    });
  }
  res.send('ok');
};
