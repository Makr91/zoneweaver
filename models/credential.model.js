import { DataTypes } from 'sequelize';

/**
 * Credential Model
 * Stores external authentication provider credentials linked to users
 */
export default function(sequelize) {
  const Credential = sequelize.define('Credential', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Unique credential identifier'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Reference to users table',
      field: 'user_id'
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Authentication provider: ldap, oidc, oauth2, etc.',
      validate: {
        isIn: {
          args: [['ldap', 'oidc', 'oauth2', 'saml']],
          msg: 'Provider must be a valid authentication provider type'
        }
      }
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Provider-specific user identifier (sub claim)'
    },
    external_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Additional provider user ID if different from subject',
      field: 'external_id'
    },
    external_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Email from external provider',
      field: 'external_email',
      validate: {
        isEmail: {
          msg: 'External email must be a valid email address'
        }
      }
    },
    linked_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When this credential was linked to the user',
      field: 'linked_at'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'federated_credentials',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['provider', 'subject'],
        name: 'unique_provider_subject'
      },
      {
        fields: ['user_id'],
        name: 'idx_federated_credentials_user_id'
      },
      {
        fields: ['provider'],
        name: 'idx_federated_credentials_provider'
      },
      {
        fields: ['external_email'],
        name: 'idx_federated_credentials_external_email'
      }
    ],
    comment: 'Stores external authentication provider credentials linked to users'
  });

  /**
   * Class methods
   */
  
  /**
   * Find credential by provider and subject
   * @param {string} provider - Authentication provider
   * @param {string} subject - Provider-specific user identifier
   * @returns {Promise<Credential|null>}
   */
  Credential.findByProviderAndSubject = async function(provider, subject) {
    return await this.findOne({
      where: { provider, subject }
    });
  };

  /**
   * Find all credentials for a user
   * @param {number} userId - User ID
   * @returns {Promise<Credential[]>}
   */
  Credential.findByUserId = async function(userId) {
    return await this.findAll({
      where: { user_id: userId },
      order: [['linked_at', 'DESC']]
    });
  };

  /**
   * Find credential by external email
   * @param {string} email - External email address
   * @returns {Promise<Credential|null>}
   */
  Credential.findByExternalEmail = async function(email) {
    return await this.findOne({
      where: { external_email: email },
      include: [{
        model: sequelize.models.User,
        as: 'user'
      }]
    });
  };

  /**
   * Link external credential to user
   * @param {number} userId - User ID
   * @param {string} provider - Authentication provider
   * @param {Object} profile - External profile data
   * @returns {Promise<Credential>}
   */
  Credential.linkToUser = async function(userId, provider, profile) {
    const email = profile.mail || profile.email || profile.emails?.[0]?.value;
    const subject = profile.subject || profile.id || profile.sub || profile.uid;
    
    return await this.create({
      user_id: userId,
      provider: provider,
      subject: subject,
      external_id: profile.id || profile.uid,
      external_email: email,
      linked_at: new Date()
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
  Credential.prototype.updateProfile = async function(profile) {
    const email = profile.email || profile.emails?.[0]?.value;
    
    return await this.update({
      external_id: profile.id || this.external_id,
      external_email: email || this.external_email,
      updated_at: new Date()
    });
  };

  /**
   * Check if credential is expired (for providers that support expiration)
   * @returns {boolean}
   */
  Credential.prototype.isExpired = function() {
    // Most providers don't expire credentials, but this can be extended
    // for providers that do (like short-lived tokens)
    return false;
  };

  return Credential;
}
