import { DataTypes } from '@sequelize/core';

/**
 * Credential Model
 * Stores external authentication provider credentials linked to users
 */
export default function (sequelize) {
  const Credential = sequelize.define(
    'Credential',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          table: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        columnName: 'user_id',
      },
      provider: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: {
            args: [['ldap', 'oidc', 'oauth2', 'saml']],
            msg: 'Provider must be a valid authentication provider type',
          },
        },
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      external_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        columnName: 'external_id',
      },
      external_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        columnName: 'external_email',
        validate: {
          isEmail: {
            msg: 'External email must be a valid email address',
          },
        },
      },
      linked_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        columnName: 'linked_at',
      },
    },
    {
      tableName: 'federated_credentials',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['provider', 'subject'],
          name: 'unique_provider_subject',
        },
        {
          fields: ['user_id'],
          name: 'idx_federated_credentials_user_id',
        },
        {
          fields: ['provider'],
          name: 'idx_federated_credentials_provider',
        },
        {
          fields: ['external_email'],
          name: 'idx_federated_credentials_external_email',
        },
      ],
    }
  );

  // Associations
  Credential.associate = function (models) {
    Credential.belongsTo(models.user, {
      foreignKey: { name: 'user_id', onDelete: 'CASCADE' },
      as: 'user',
    });
  };

  /**
   * Class methods
   */

  /**
   * Find credential by provider and subject
   * @param {string} provider - Authentication provider
   * @param {string} subject - Provider-specific user identifier
   * @returns {Promise<Credential|null>}
   */
  Credential.findByProviderAndSubject = function (provider, subject) {
    return this.findOne({
      where: { provider, subject },
    });
  };

  /**
   * Find all credentials for a user
   * @param {number} userId - User ID
   * @returns {Promise<Credential[]>}
   */
  Credential.findByUserId = function (userId) {
    return this.findAll({
      where: { user_id: userId },
      order: [['linked_at', 'DESC']],
    });
  };

  /**
   * Find credential by external email
   * @param {string} email - External email address
   * @returns {Promise<Credential|null>}
   */
  Credential.findByExternalEmail = function (email) {
    return this.findOne({
      where: { external_email: email },
      include: [
        {
          association: 'user',
        },
      ],
    });
  };

  /**
   * Link external credential to user
   * @param {number} userId - User ID
   * @param {string} provider - Authentication provider
   * @param {Object} profile - External profile data
   * @returns {Promise<Credential>}
   */
  Credential.linkToUser = function (userId, provider, profile) {
    const email = profile.mail || profile.email || profile.emails?.[0]?.value;
    const subject = profile.subject || profile.id || profile.sub || profile.uid;

    return this.create({
      user_id: userId,
      provider,
      subject,
      external_id: profile.id || profile.uid,
      external_email: email,
      linked_at: new Date(),
    });
  };

  /**
   * Instance methods
   */

  /**
   * Update external profile data
   * @param {Object} profile - Updated profile data from provider
   * @returns {Promise<Credential>}
   */
  Credential.prototype.updateProfile = function (profile) {
    const email = profile.email || profile.emails?.[0]?.value;

    return this.update({
      external_id: profile.id || this.external_id,
      external_email: email || this.external_email,
      updated_at: new Date(),
    });
  };

  /**
   * Check if credential is expired (for providers that support expiration)
   * @returns {boolean}
   */
  Credential.prototype.isExpired = function () {
    // Most providers don't expire credentials, but this can be extended
    // for providers that do (like short-lived tokens)
    return false;
  };

  return Credential;
}
