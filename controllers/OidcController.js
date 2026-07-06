import jwt from 'jsonwebtoken';
import { config } from '../index.js';
import { log } from '../utils/Logger.js';
import { verifyLogoutToken } from '../auth/oidcLogout.js';
import db from '../models/index.js';

class OidcController {
  /**
   * @swagger
   * /api/auth/oidc/{provider}:
   *   get:
   *     summary: Initiate OIDC authentication for specific provider
   *     description: Redirect user to specific OIDC provider for authentication
   *     tags: [Authentication]
   *     parameters:
   *       - in: path
   *         name: provider
   *         required: true
   *         schema:
   *           type: string
   *         description: OIDC provider name
   *         example: "CUSTOM"
   *     responses:
   *       302:
   *         description: Redirect to OIDC provider
   *       400:
   *         description: OIDC provider not enabled or not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async startOidcLogin(req, res, next) {
    try {
      const { provider } = req.params;

      if (!provider) {
        return res.status(400).json({
          success: false,
          message: 'OIDC provider name is required',
        });
      }

      // Get OIDC providers from nested configuration structure
      const oidcProvidersConfig = config.authentication?.oidc_providers?.value || {};

      // Find the specific provider
      const providerConfig = oidcProvidersConfig[provider];

      if (!providerConfig) {
        return res.status(400).json({
          success: false,
          message: `OIDC provider '${provider}' not found`,
        });
      }

      if (!providerConfig.enabled?.value) {
        return res.status(400).json({
          success: false,
          message: `OIDC provider '${provider}' is not enabled`,
        });
      }

      // Store provider in session for callback handling
      if (req.session) {
        req.session.oidcProvider = provider;
      }

      // Optional auth-request hints (mutually exclusive; register wins):
      //  - ?register / ?screen_hint=register → prompt=create: land the user on the IdP's
      //    registration form (OIDC "Initiating User Registration"; the STARTcloud IdP's
      //    RegistrationHintDetector honors it). This is how "Register" routes to the provider.
      //  - ?silent (or ?prompt=none) → prompt=none: seamless SSO. If the browser already has an
      //    IdP session the IdP returns a code with no UI (auto-login); otherwise it returns
      //    login_required, which handleOidcCallback turns into a quiet fall-back to /ui/login.
      const wantsRegister =
        req.query.register !== undefined || req.query.screen_hint === 'register';
      const wantsSilent =
        !wantsRegister && (req.query.silent !== undefined || req.query.prompt === 'none');
      let authOptions;
      if (wantsRegister) {
        authOptions = { prompt: 'create' };
      } else if (wantsSilent) {
        authOptions = { prompt: 'none' };
      }

      // Remember whether this was a silent attempt so the callback can distinguish a
      // "not signed in at the IdP" outcome (benign) from a real OIDC failure.
      if (req.session) {
        req.session.oidcSilent = wantsSilent;
      }

      // Use passport to authenticate with specific OIDC provider
      const passport = (await import('passport')).default;
      const strategyName = `oidc-${provider}`;

      log.auth.info('Starting OIDC authentication flow', {
        provider,
        strategyName,
        register: wantsRegister,
        silent: wantsSilent,
      });

      return passport.authenticate(strategyName, authOptions)(req, res, next);
    } catch (error) {
      log.auth.error('OIDC start login error', {
        error: error.message,
        provider: req.params.provider,
      });
      return res.status(500).json({
        success: false,
        message: 'Internal server error during OIDC authentication setup',
      });
    }
  }

  /**
   * @swagger
   * /api/auth/oidc/{provider}/callback:
   *   get:
   *     summary: Handle OIDC callback for specific provider
   *     description: Process the callback from specific OIDC provider and generate JWT token
   *     tags: [Authentication]
   *     parameters:
   *       - in: path
   *         name: provider
   *         required: true
   *         schema:
   *           type: string
   *         description: OIDC provider name
   *         example: "CUSTOM"
   *       - in: query
   *         name: code
   *         schema:
   *           type: string
   *         description: Authorization code from OIDC provider
   *       - in: query
   *         name: state
   *         schema:
   *           type: string
   *         description: State parameter for CSRF protection
   *     responses:
   *       302:
   *         description: Redirect to frontend with token or error
   *       400:
   *         description: OIDC provider not enabled or authentication failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - provisioning policy rejection
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async handleOidcCallback(req, res) {
    try {
      // Get provider from session (stored when authentication started)
      const provider = req.session?.oidcProvider;
      // Was this a silent (prompt=none) attempt? If so, "not signed in at the IdP" is the
      // expected answer, not a failure — fall back to the login page quietly (no error flash).
      const silent = req.session?.oidcSilent === true;

      // Clear provider + silent flag from session
      if (req.session) {
        delete req.session.oidcProvider;
        delete req.session.oidcSilent;
      }

      if (!provider) {
        return res.redirect('/ui/login?error=no_provider');
      }

      // Get OIDC providers from nested configuration structure
      const oidcProvidersConfig = config.authentication?.oidc_providers?.value || {};

      // Find the specific provider
      const providerConfig = oidcProvidersConfig[provider];

      if (!providerConfig) {
        return res.redirect(`/ui/login?error=provider_not_found&provider=${provider}`);
      }

      if (!providerConfig.enabled?.value) {
        return res.redirect(`/ui/login?error=provider_disabled&provider=${provider}`);
      }

      // Use passport to authenticate with specific OIDC provider
      const passport = (await import('passport')).default;
      const strategyName = `oidc-${provider}`;

      log.auth.info('Processing OIDC callback', {
        provider,
        strategyName,
      });

      return passport.authenticate(strategyName, {
        session: false,
        // Silent attempts must fail QUIET: passport handles strategy-level failures (e.g.
        // access_denied) via this redirect directly, so the silent case needs the benign
        // marker here too — the error-callback below only sees thrown errors.
        failureRedirect: silent
          ? '/ui/login?sso=unavailable'
          : `/ui/login?error=oidc_failed&provider=${provider}`,
      })(req, res, err => {
        if (err) {
          // Silent SSO: the IdP reports no usable session (login / interaction / consent /
          // account-selection required). That's the "not signed in" answer, not a failure —
          // fall back to the login page with a benign marker so the UI shows it without an
          // error and (per its one-shot guard) doesn't loop.
          const oidcErr = err.error || err.code;
          const benignSilent = [
            'login_required',
            'interaction_required',
            'consent_required',
            'account_selection_required',
          ].includes(oidcErr);
          if (silent && benignSilent) {
            log.auth.info('Silent OIDC auth: no active provider session', { provider, oidcErr });
            return res.redirect('/ui/login?sso=unavailable');
          }
          log.auth.error('OIDC callback error', {
            provider,
            error: err.message,
          });
          return res.redirect(`/ui/login?error=oidc_failed&provider=${provider}`);
        }

        const { user } = req;

        if (!user) {
          // In silent mode a fail (e.g. access_denied) also means "not signed in" — quiet fallback.
          if (silent) {
            log.auth.info('Silent OIDC auth: not authenticated at provider', { provider });
            return res.redirect('/ui/login?sso=unavailable');
          }
          log.auth.error('OIDC callback: No user object found', { provider });
          return res.redirect(`/ui/login?error=oidc_failed&provider=${provider}`);
        }

        // Generate JWT token for OIDC user. auth_provider = `oidc-<name>` (C1, user-identity axis).
        const token = jwt.sign(
          {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            auth_provider: `oidc-${provider}`,
          },
          config.authentication.jwt_secret.value,
          { expiresIn: config.authentication.jwt_expiration?.value || '24h' }
        );

        // Set session if using express-session
        if (req.session) {
          req.session.userId = user.id;
          req.session.username = user.username;
          req.session.role = user.role;
        }

        log.auth.info('OIDC login successful', {
          provider,
          username: user.username,
          email: user.email,
        });

        // Hand the app JWT to the SPA via the URL FRAGMENT (#token=) — the agreed design (§5.2 #1
        // / §5.1 #2): fragments aren't sent in Referer headers or written to server access logs,
        // so the bearer token doesn't leak. REQUIRES the UI's AuthCallback to read location.hash
        // (NOT ?token=/searchParams) — a coordinated flip both repos ship together. Only the app
        // JWT rides here; the OIDC tokens stay server-side in req.session.oidc (§4).
        const { protocol } = req;
        const host = req.get('host');
        const frontendUrl = `${protocol}://${host}`;

        log.auth.debug('OIDC redirect URL', {
          frontendUrl: `${frontendUrl}/ui/auth/callback`,
        });
        return res.redirect(`${frontendUrl}/ui/auth/callback#token=${encodeURIComponent(token)}`);
      });
    } catch (error) {
      log.auth.error('OIDC callback error', { error: error.message });

      // Handle specific OIDC errors
      if (
        error.message &&
        (error.message.includes('Access denied') || error.message.includes('Invitation required'))
      ) {
        return res.redirect('/ui/login?error=access_denied');
      }

      return res.redirect('/ui/login?error=token_generation_failed');
    }
  }

  /**
   * @swagger
   * /api/auth/oidc/backchannel-logout:
   *   post:
   *     summary: OIDC Back-Channel Logout receiver
   *     description: Server-to-server endpoint the OIDC provider POSTs a signed logout_token to when a user's SSO session ends. Verifies the token and revokes the matched user's app JWTs (real Single Logout). Public (no app auth) — trust comes from the token's signature/aud.
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/x-www-form-urlencoded:
   *           schema:
   *             type: object
   *             required: [logout_token]
   *             properties:
   *               logout_token:
   *                 type: string
   *                 description: Signed OIDC back-channel logout token (JWT)
   *     responses:
   *       200:
   *         description: Logout processed (user tokens revoked if matched)
   *       400:
   *         description: Missing or invalid logout_token
   */
  static async handleBackchannelLogout(req, res) {
    // Spec: back-channel logout responses must not be cached.
    res.set('Cache-Control', 'no-store');

    const logoutToken = req.body?.logout_token;
    if (!logoutToken) {
      return res
        .status(400)
        .json({ error: 'invalid_request', error_description: 'missing logout_token' });
    }

    try {
      const { providerName, sub, sid } = await verifyLogoutToken(logoutToken);

      // Correlate to a hyperweaver user via the stored federated credential — keyed by the
      // FULL provider identity ('oidc-<name>'), so a logout_token from provider X can never
      // revoke a user linked through provider Y with a colliding subject.
      const { credential: CredentialModel, user: UserModel } = db;
      const credential = sub
        ? await CredentialModel.findByProviderAndSubject(`oidc-${providerName}`, sub)
        : null;
      const user = credential ? await UserModel.findByPk(credential.user_id) : null;

      if (user) {
        // Real SLO (model (a), per-user): revoke all this user's app JWTs.
        await user.update({ tokens_valid_after: new Date() });
        log.auth.info('Back-channel logout: revoked user app tokens', {
          providerName,
          userId: user.id,
          sid,
        });
      } else {
        // Valid token but no local user — nothing to revoke; still a 200 (spec).
        log.auth.warn('Back-channel logout: no matching local user', { providerName, sub, sid });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      log.auth.warn('Back-channel logout rejected', { error: error.message });
      return res.status(400).json({ error: 'invalid_request', error_description: error.message });
    }
  }

  /**
   * @swagger
   * /api/auth/oidc/issuers:
   *   get:
   *     summary: Get trusted OIDC issuer URLs (public)
   *     description: List the issuer URLs of enabled OIDC providers (C5), for client-side use.
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Trusted issuers
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 issuers:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       provider: { type: string }
   *                       issuer: { type: string }
   *       500:
   *         description: Internal server error
   */
  static getOidcIssuers(req, res) {
    void req;
    try {
      const oidcProviders = config.authentication?.oidc_providers?.value || {};
      const issuers = [];
      Object.entries(oidcProviders).forEach(([providerName, providerConfig]) => {
        if (providerConfig.enabled?.value && providerConfig.issuer?.value) {
          issuers.push({ provider: providerName, issuer: providerConfig.issuer.value });
        }
      });
      return res.json({ issuers });
    } catch (error) {
      log.auth.error('Get trusted issuers error', { error: error.message });
      return res.status(500).json({ issuers: [] });
    }
  }
}

export default OidcController;
