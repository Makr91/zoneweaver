/**
 * @fileoverview LDAP client helpers (ldapts)
 * @description Search-then-bind LDAP authentication plus a connectivity test,
 *   built on ldapts (actively maintained) — replaces the decommissioned ldapjs
 *   that passport-ldapauth/ldapauth-fork relied on. Shared by the passport LDAP
 *   strategy (auth/passport.js) and the admin LDAP test endpoint
 *   (AuthController.testLdap) so both talk to the directory identically.
 */

import { Client } from 'ldapts';
import { loadConfig } from '../utils/config.js';
import { log } from '../utils/Logger.js';

/**
 * RFC 4515 filter-value escaping — prevents LDAP injection via the username.
 */
const FILTER_ESCAPES = { '\\': '\\5c', '*': '\\2a', '(': '\\28', ')': '\\29' };
const escapeFilterValue = value => String(value).replace(/[\\*()]/g, ch => FILTER_ESCAPES[ch]);

/**
 * Read the current LDAP configuration fresh, so an admin's just-saved settings
 * are honored without needing a process restart.
 * @returns {Object} Normalized LDAP configuration
 */
const getLdapConfig = () => {
  const { authentication } = loadConfig();
  return {
    url: authentication.ldap_url.value,
    bindDN: authentication.ldap_bind_dn.value,
    bindCredentials: authentication.ldap_bind_credentials.value,
    searchBase: authentication.ldap_search_base.value,
    searchFilter: authentication.ldap_search_filter.value,
    searchAttributes: (authentication.ldap_search_attributes.value || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    tlsRejectUnauthorized: authentication.ldap_tls_reject_unauthorized?.value || false,
  };
};

/**
 * Create an ldapts client for the configured server.
 * @param {Object} ldapConfig - Normalized config from getLdapConfig
 * @returns {Client} ldapts client
 */
const createLdapClient = ldapConfig =>
  new Client({
    url: ldapConfig.url,
    timeout: 10000,
    connectTimeout: 10000,
    tlsOptions: { rejectUnauthorized: ldapConfig.tlsRejectUnauthorized },
  });

/**
 * Substitute the username into the configured search filter, supporting both the
 * {{username}} and {{identifier}} placeholders, with the value escaped.
 * @param {string} searchFilter - Configured filter template
 * @param {string} username - Username to substitute
 * @returns {string} Concrete LDAP filter
 */
const buildSearchFilter = (searchFilter, username) => {
  const escaped = escapeFilterValue(username);
  return searchFilter.replace(/\{\{username\}\}/g, escaped).replace(/\{\{identifier\}\}/g, escaped);
};

/**
 * Authenticate a user against LDAP via search-then-bind: bind as the service
 * account, locate the user, then bind as the user's own DN to verify the
 * password.
 * @param {string} username - LDAP username
 * @param {string} password - LDAP password
 * @returns {Promise<Object>} The user's directory entry (attributes + dn)
 * @throws {Error} with `.ldapAuthFailure = true` when the user is not found or
 *   the password is wrong; connection/TLS/config errors propagate as-is.
 */
export const authenticateLdapUser = async (username, password) => {
  const ldapConfig = getLdapConfig();
  const searchClient = createLdapClient(ldapConfig);
  let userEntry;

  try {
    await searchClient.bind(ldapConfig.bindDN, ldapConfig.bindCredentials);

    const { searchEntries } = await searchClient.search(ldapConfig.searchBase, {
      scope: 'sub',
      filter: buildSearchFilter(ldapConfig.searchFilter, username),
      ...(ldapConfig.searchAttributes.length && { attributes: ldapConfig.searchAttributes }),
    });

    if (searchEntries.length === 0) {
      const notFound = new Error('LDAP authentication failed: user not found');
      notFound.ldapAuthFailure = true;
      throw notFound;
    }

    [userEntry] = searchEntries;
  } finally {
    await searchClient.unbind().catch(() => {
      /* best-effort unbind */
    });
  }

  // Verify the password by binding as the located user's own DN.
  const userClient = createLdapClient(ldapConfig);
  try {
    await userClient.bind(userEntry.dn, password);
  } catch (bindError) {
    log.auth.debug('LDAP user bind rejected', { dn: userEntry.dn, error: bindError.message });
    const badCreds = new Error('LDAP authentication failed: invalid credentials');
    badCreds.ldapAuthFailure = true;
    throw badCreds;
  } finally {
    await userClient.unbind().catch(() => {
      /* best-effort unbind */
    });
  }

  return userEntry;
};

/**
 * Run the admin LDAP connectivity test: service-account bind + search, plus an
 * optional end-to-end user authentication. Returns the staged result flags the
 * test panel expects. Throws on connection/bind/search failure (the controller
 * surfaces that as a 500).
 * @param {{ testUsername?: string, testPassword?: string }} [options]
 * @returns {Promise<{connectionTest: boolean, bindTest: boolean, searchTest: boolean, authTest: boolean|null}>}
 */
export const testLdapConnection = async ({ testUsername, testPassword } = {}) => {
  const ldapConfig = getLdapConfig();
  const results = { connectionTest: false, bindTest: false, searchTest: false, authTest: null };
  const client = createLdapClient(ldapConfig);

  try {
    // bind() opens the connection and authenticates the service account together.
    await client.bind(ldapConfig.bindDN, ldapConfig.bindCredentials);
    results.connectionTest = true;
    results.bindTest = true;

    await client.search(ldapConfig.searchBase, {
      scope: 'sub',
      filter: buildSearchFilter(ldapConfig.searchFilter, 'testuser'),
      ...(ldapConfig.searchAttributes.length && { attributes: ldapConfig.searchAttributes }),
    });
    results.searchTest = true;
  } finally {
    await client.unbind().catch(() => {
      /* best-effort unbind */
    });
  }

  // Optional: verify a real user's credentials end-to-end.
  if (testUsername && testPassword) {
    try {
      await authenticateLdapUser(testUsername, testPassword);
      results.authTest = true;
    } catch {
      results.authTest = false;
    }
  }

  return results;
};
