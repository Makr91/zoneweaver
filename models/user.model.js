export default (sequelize, Sequelize) => {
  const User = sequelize.define("users", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50]
      }
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password_hash: {
      type: Sequelize.STRING,
      allowNull: false,
      field: 'password_hash'
    },
    role: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'user',
      validate: {
        isIn: [['user', 'admin', 'super-admin', 'organization-admin']]
      }
    },
    organization_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: 'organization_id',
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    last_login: {
      type: Sequelize.DATE,
      allowNull: true,
      field: 'last_login'
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    auth_provider: {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'local',
      field: 'auth_provider',
      validate: {
        isIn: [['local', 'ldap', 'oidc', 'oauth2', 'saml']]
      },
      comment: 'Authentication provider: local, ldap, oidc, etc.'
    },
    external_id: {
      type: Sequelize.STRING(255),
      allowNull: true,
      field: 'external_id',
      comment: 'External provider user ID'
    },
    linked_at: {
      type: Sequelize.DATE,
      allowNull: true,
      field: 'linked_at',
      comment: 'Timestamp when external account was linked'
    }
  }, {
    // Table options
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    // Indexes
    indexes: [
      {
        unique: true,
        fields: ['username']
      },
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['organization_id']
      },
      {
        fields: ['role']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['auth_provider']
      },
      {
        fields: ['external_id']
      }
    ],
    
    // Default scope excludes password_hash
    defaultScope: {
      attributes: {
        exclude: ['password_hash']
      }
    },
    
    // Named scopes
    scopes: {
      // Include password hash for authentication
      withPassword: {
        attributes: {}
      },
      // Only active users
      active: {
        where: {
          is_active: true
        }
      },
      // Include organization data
      withOrganization: {
        include: [{
          model: sequelize.models.organizations,
          as: 'organization',
          attributes: ['id', 'name']
        }]
      }
    }
  });

  // Instance methods
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    // Always exclude password_hash when converting to JSON
    delete values.password_hash;
    return values;
  };

  // Associations
  User.associate = function(models) {
    // User belongs to Organization
    User.belongsTo(models.organization, {
      foreignKey: "organization_id",
      as: "organization",
      onDelete: 'SET NULL'
    });
    
    // User can have many Invitations (as the inviter)
    User.hasMany(models.invitation, {
      foreignKey: "invited_by",
      as: "sentInvitations",
      onDelete: 'SET NULL'
    });
    
    // User can have many Servers (if servers are user-specific)
    if (models.server) {
      User.hasMany(models.server, {
        foreignKey: "created_by",
        as: "servers",
        onDelete: 'SET NULL'
      });
    }
    
    // User can have many Credentials (external auth providers)
    User.hasMany(models.credential, {
      foreignKey: "user_id",
      as: "credentials",
      onDelete: 'CASCADE'
    });
  };

  // Class methods for common queries
  User.findByEmail = function(email) {
    return this.scope('active').findOne({
      where: { email }
    });
  };

  User.findByUsername = function(username) {
    return this.scope('active').findOne({
      where: { username }
    });
  };

  User.findByIdentifier = function(identifier) {
    return this.scope('active').findOne({
      where: {
        [Sequelize.Op.or]: [
          { username: identifier },
          { email: identifier }
        ]
      }
    });
  };

  User.findActiveById = function(id) {
    return this.scope('active').findByPk(id);
  };

  User.findByOrganization = function(organizationId, includeInactive = false) {
    const scope = includeInactive ? null : 'active';
    return this.scope(scope).findAll({
      where: { organization_id: organizationId },
      include: [{
        model: sequelize.models.organizations,
        as: 'organization',
        attributes: ['id', 'name']
      }],
      order: [['created_at', 'DESC']]
    });
  };

  User.findByRole = function(role) {
    return this.scope('active').findAll({
      where: { role },
      order: [['created_at', 'DESC']]
    });
  };

  User.isFirstUser = async function() {
    const count = await this.count({
      where: { is_active: true }
    });
    return count === 0;
  };

  // External authentication methods
  User.findByExternalId = function(provider, externalId) {
    return this.scope('active').findOne({
      where: { 
        auth_provider: provider,
        external_id: externalId 
      }
    });
  };

  User.findWithCredentials = function(userId) {
    return this.scope('active').findByPk(userId, {
      include: [{
        model: sequelize.models.credential,
        as: 'credentials'
      }]
    });
  };

  return User;
};
