import { DataTypes, Op } from '@sequelize/core';

/**
 * Minimal express-session store backed by @sequelize/core (v7).
 *
 * Drop-in replacement for connect-session-sequelize, which is Sequelize-6-only
 * (it imports the legacy `sequelize` package and uses its v6 API). This keeps the
 * session layer on the same @sequelize/core instance as the rest of the app.
 *
 * API mirrors connect-session-sequelize so the call site is unchanged:
 *   const SessionStore = SequelizeSessionStore(session.Store);
 *   const store = new SessionStore({ db, tableName, checkExpirationInterval, expiration });
 *   await store.sync();
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

const resolveExpires = (session, fallbackMs) =>
  session.cookie && session.cookie.expires
    ? new Date(session.cookie.expires)
    : new Date(Date.now() + fallbackMs);

export default Store =>
  class SequelizeSessionStore extends Store {
    constructor(options = {}) {
      super();

      const {
        db,
        tableName = 'Sessions',
        checkExpirationInterval = FIFTEEN_MIN_MS,
        expiration = ONE_DAY_MS,
      } = options;

      if (!db) {
        throw new Error('SequelizeSessionStore requires a `db` (Sequelize instance) option');
      }

      this.expiration = expiration;
      this.sessionModel = db.define(
        tableName,
        {
          sid: { type: DataTypes.STRING, primaryKey: true },
          expires: { type: DataTypes.DATE },
          data: { type: DataTypes.TEXT },
        },
        { tableName, timestamps: true }
      );

      // Periodically purge expired rows. unref() so the timer never holds the process open.
      this.expirationInterval = setInterval(() => {
        this.clearExpiredSessions().catch(() => {});
      }, checkExpirationInterval);
      if (this.expirationInterval.unref) {
        this.expirationInterval.unref();
      }
    }

    async sync() {
      await this.sessionModel.sync();
    }

    get(sid, callback) {
      this.sessionModel
        .findByPk(sid)
        .then(row => {
          if (!row) {
            return callback(null, null);
          }
          if (row.expires && row.expires.getTime() < Date.now()) {
            return this.destroy(sid, () => callback(null, null));
          }
          let parsed;
          try {
            parsed = JSON.parse(row.data);
          } catch (parseErr) {
            return callback(parseErr);
          }
          return callback(null, parsed);
        })
        .catch(callback);
    }

    set(sid, session, callback) {
      const expires = resolveExpires(session, this.expiration);
      const data = JSON.stringify(session);
      this.sessionModel
        .upsert({ sid, expires, data })
        .then(() => callback(null))
        .catch(callback);
    }

    touch(sid, session, callback) {
      const expires = resolveExpires(session, this.expiration);
      this.sessionModel
        .update({ expires }, { where: { sid } })
        .then(() => callback(null))
        .catch(callback);
    }

    destroy(sid, callback) {
      this.sessionModel
        .destroy({ where: { sid } })
        .then(() => callback(null))
        .catch(callback);
    }

    clearExpiredSessions() {
      return this.sessionModel.destroy({
        where: { expires: { [Op.lt]: new Date() } },
      });
    }
  };
