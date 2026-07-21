import passport from 'passport';
import { authenticateLdapUser } from './ldapClient.js';
import { loadConfig } from '../utils/config.js';
import db from '../models/index.js';
import { log } from '../utils/Logger.js';
import { handleExternalUser } from './externalUser.js';

const config = loadConfig();

/**
 * LDAP passport strategy backed by ldapts (search-then-bind).
 *
 * Replaces passport-ldapauth, whose underlying ldapjs is decommissioned. Reads
 * `username`/`password` from the request body (the shape ldapLogin sends),
 * verifies them via ldapClient.authenticateLdapUser, then provisions the user
 * through the shared handleExternalUser flow. Implements just the surface
 * passport needs (`name` + `authenticate`, using the success/fail/error helpers
 * passport injects onto the strategy per request).
 */
class LdapStrategy {
  constructor() {
    this.name = 'ldap';
  }

  authenticate(req) {
    const username = req.body?.username;
    const password = req.body?.password;

    if (!username || !password) {
      this.fail({ message: 'Missing LDAP credentials' }, 400);
      return;
    }

    authenticateLdapUser(username, password)
      .then(async ldapUser => {
        log.auth.info('LDAP authentication successful for user', {
          user: ldapUser.uid || ldapUser.cn || username,
        });
        const result = await handleExternalUser('ldap', ldapUser);
        log.auth.info('LDAP user processing complete', { username: result.username });
        this.success(result);
      })
      .catch(error => {
        if (error.ldapAuthFailure) {
          log.auth.info('LDAP authentication failed', { user: username });
          this.fail({ message: 'LDAP authentication failed' });
        } else {
          log.auth.error('LDAP Strategy error', { error: error.message, stack: error.stack });
          this.error(error);
        }
      });
  }
}

/**
 * LDAP Strategy - External authentication via LDAP
 */
export const setupLdapStrategy = async () => {
  try {
    const { user: UserModel } = db;
    await UserModel.findOne({ limit: 1 });
  } catch {
    log.database.info('Database not ready yet, waiting for migrations to complete');
    await new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
  }

  if (!config.authentication?.ldap_enabled?.value) {
    log.auth.info('LDAP authentication disabled in configuration');
    return;
  }

  log.auth.info('Setting up LDAP authentication strategy (ldapts)');
  passport.use('ldap', new LdapStrategy());
  log.auth.info('LDAP authentication strategy configured successfully');
};
