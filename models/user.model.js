import { DataTypes, Op } from '@sequelize/core';

export default sequelize => {
  const User = sequelize.define(
    'users',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [3, 50],
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
        columnName: 'password_hash',
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
        validate: {
          isIn: [['user', 'admin', 'super-admin', 'organization-admin']],
        },
      },
      organization_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        columnName: 'organization_id',
        references: {
          table: 'organizations',
          key: 'id',
        },
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
        columnName: 'last_login',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        columnName: 'is_active',
      },
      auth_provider: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'local',
        columnName: 'auth_provider',
        validate: {
          isIn: [['local', 'ldap', 'oidc', 'oauth2', 'saml']],
        },
      },
      external_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        columnName: 'external_id',
      },
      linked_at: {
        type: DataTypes.DATE,
        allowNull: true,
        columnName: 'linked_at',
      },
    },
    {
      // Table options
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // Indexes
      indexes: [
        {
          fields: ['organization_id'],
        },
        {
          fields: ['role'],
        },
        {
          fields: ['is_active'],
        },
        {
          fields: ['auth_provider'],
        },
        {
          fields: ['external_id'],
        },
      ],

      // Default scope excludes password_hash
      defaultScope: {
        attributes: {
          exclude: ['password_hash'],
        },
      },

      // Named scopes
      scopes: {
        // Include password hash for authentication
        withPassword: {
          attributes: {},
        },
        // Only active users
        active: {
          where: {
            is_active: true,
          },
        },
        // Include organization data
        withOrganization: {
          include: [
            {
              association: 'organization',
              attributes: ['id', 'name'],
            },
          ],
        },
      },
    }
  );

  // Instance methods
  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    // Always exclude password_hash when converting to JSON
    delete values.password_hash;
    return values;
  };

  // Associations
  User.associate = function (models) {
    // User belongs to Organization
    User.belongsTo(models.organization, {
      foreignKey: { name: 'organization_id', onDelete: 'CASCADE' },
      as: 'organization',
    });

    // User can have many Invitations (as the inviter)
    User.hasMany(models.invitation, {
      foreignKey: { name: 'invited_by_user_id', onDelete: 'CASCADE' },
      as: 'sentInvitations',
    });

    // User can have many Servers (if servers are user-specific)
    if (models.server) {
      User.hasMany(models.server, {
        foreignKey: { name: 'created_by', onDelete: 'SET NULL' },
        as: 'servers',
      });
    }

    // User can have many Credentials (external auth providers)
    User.hasMany(models.credential, {
      foreignKey: { name: 'user_id', onDelete: 'CASCADE' },
      as: 'credentials',
    });
  };

  // Class methods for common queries
  User.findByEmail = function (email) {
    return this.withScope('active').findOne({
      where: { email },
    });
  };

  User.findByUsername = function (username) {
    return this.withScope('active').findOne({
      where: { username },
    });
  };

  User.findByIdentifier = function (identifier) {
    return this.withScope('active').findOne({
      where: {
        [Op.or]: [{ username: identifier }, { email: identifier }],
      },
    });
  };

  User.findActiveById = function (id) {
    return this.withScope('active').findByPk(id);
  };

  User.findByOrganization = function (organizationId, includeInactive = false) {
    const scope = includeInactive ? null : 'active';
    return this.withScope(scope).findAll({
      where: { organization_id: organizationId },
      include: [
        {
          association: 'organization',
          attributes: ['id', 'name'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  };

  User.findByRole = function (role) {
    return this.withScope('active').findAll({
      where: { role },
      order: [['created_at', 'DESC']],
    });
  };

  User.isFirstUser = async function () {
    const count = await this.count({
      where: { is_active: true },
    });
    return count === 0;
  };

  // External authentication methods
  User.findByExternalId = function (provider, externalId) {
    return this.withScope('active').findOne({
      where: {
        auth_provider: provider,
        external_id: externalId,
      },
    });
  };

  User.findWithCredentials = function (userId) {
    return this.withScope('active').findByPk(userId, {
      include: [
        {
          association: 'credentials',
        },
      ],
    });
  };

  return User;
};
