/**
 * @fileoverview Passport.js configuration for Hyperweaver Server. Config is loaded
 * directly (not via index.js) to avoid a circular dependency.
 */

import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { loadConfig } from '../utils/config.js';
import db from '../models/index.js';
import { log } from '../utils/Logger.js';
import { setupLdapStrategy } from './ldapStrategy.js';
import { setupOidcProviders, getOidcConfiguration } from './oidcStrategies.js';

const config = loadConfig();

/**
 * JWT Strategy — matches the legacy custom middleware behavior exactly (no
 * issuer/audience initially, for compatibility). Rejects missing AND deactivated
 * users — a deactivated account's JWT must die immediately, not live out its 24h
 * (this is the "still active" check the fresh findByPk exists for). Real SLO:
 * rejects any token issued before the user's revocation cutoff (tokens_valid_after,
 * set to now() on every logout); payload.iat is seconds since epoch.
 */
passport.use(
  'jwt',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.authentication.jwt_secret.value,
    },
    async (payload, done) => {
      try {
        const { user: UserModel } = db;
        const user = await UserModel.findByPk(payload.userId);

        if (!user || user.is_active === false) {
          return done(null, false, { message: 'Invalid token - user not found' });
        }

        if (
          user.tokens_valid_after &&
          payload.iat &&
          payload.iat * 1000 < new Date(user.tokens_valid_after).getTime()
        ) {
          return done(null, false, { message: 'Token revoked' });
        }

        return done(null, {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          auth_provider: payload.auth_provider || user.auth_provider || 'local',
        });
      } catch (error) {
        log.auth.error('JWT Strategy error', { error: error.message });
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.userId);
});

passport.deserializeUser(async (userId, done) => {
  try {
    const { user: UserModel } = db;
    const user = await UserModel.findByPk(userId);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

await setupLdapStrategy();
await setupOidcProviders();

export { getOidcConfiguration };

export default passport;
