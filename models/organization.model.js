export default (sequelize, Sequelize) => {
  const Organization = sequelize.define(
    'organizations',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      organization_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
        field: 'organization_code',
        validate: {
          len: [6, 20],
          isAlphanumeric: {
            msg: 'Organization code must be alphanumeric',
          },
        },
        comment: 'Organization code for domain mapping (hexcode format)',
      },
    },
    {
      // Table options
      tableName: 'organizations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // Indexes
      indexes: [
        {
          unique: true,
          fields: ['name'],
        },
        {
          fields: ['is_active'],
        },
        {
          unique: true,
          fields: ['organization_code'],
        },
      ],

      // Default scope only includes active organizations
      defaultScope: {
        where: {
          is_active: true,
        },
      },

      // Named scopes
      scopes: {
        // Include inactive organizations
        withInactive: {
          where: {},
        },
        // Include user statistics
        withStats: {
          include: [
            {
              model: sequelize.models.users,
              as: 'users',
              attributes: [],
              required: false,
            },
          ],
          attributes: {
            include: [
              [sequelize.fn('COUNT', sequelize.col('users.id')), 'total_users'],
              [
                sequelize.fn(
                  'COUNT',
                  sequelize.literal('CASE WHEN users.is_active = true THEN 1 END')
                ),
                'active_users',
              ],
              [
                sequelize.fn(
                  'COUNT',
                  sequelize.literal(
                    "CASE WHEN users.role = 'admin' AND users.is_active = true THEN 1 END"
                  )
                ),
                'admin_users',
              ],
            ],
          },
          group: ['organizations.id'],
        },
      },
    }
  );

  // Associations
  Organization.associate = function (models) {
    // Organization has many Users
    Organization.hasMany(models.user, {
      foreignKey: 'organization_id',
      as: 'users',
      onDelete: 'CASCADE',
    });

    // Organization has many Invitations
    Organization.hasMany(models.invitation, {
      foreignKey: 'organization_id',
      as: 'invitations',
      onDelete: 'CASCADE',
    });
  };

  // Class methods for common queries
  Organization.findByName = function (name) {
    return this.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('name')),
        sequelize.fn('LOWER', name)
      ),
    });
  };

  Organization.findByOrganizationCode = function (organizationCode) {
    return this.findOne({
      where: { organization_code: organizationCode },
    });
  };

  Organization.findActiveById = function (id) {
    return this.findByPk(id);
  };

  Organization.findAllWithStats = function () {
    return this.scope('withStats').findAll({
      order: [['created_at', 'DESC']],
    });
  };

  Organization.getStats = async function (organizationId) {
    const result = await this.findOne({
      where: { id: organizationId },
      include: [
        {
          model: sequelize.models.user,
          as: 'users',
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('users.id')), 'total_users'],
        [
          sequelize.fn('COUNT', sequelize.literal('CASE WHEN users.is_active = true THEN 1 END')),
          'active_users',
        ],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal(
              "CASE WHEN users.role = 'admin' AND users.is_active = true THEN 1 END"
            )
          ),
          'admin_users',
        ],
      ],
      group: ['organizations.id'],
      raw: true,
    });

    return result || { total_users: 0, active_users: 0, admin_users: 0 };
  };

  // Instance methods
  Organization.prototype.deactivate = function () {
    return this.update({ is_active: false });
  };

  Organization.prototype.activate = function () {
    return this.update({ is_active: true });
  };

  Organization.prototype.getStats = async function () {
    const stats = await sequelize.models.user.findAll({
      where: { organization_id: this.id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_users'],
        [
          sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_active = true THEN 1 END')),
          'active_users',
        ],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal("CASE WHEN role = 'admin' AND is_active = true THEN 1 END")
          ),
          'admin_users',
        ],
      ],
      raw: true,
    });

    return stats[0] || { total_users: 0, active_users: 0, admin_users: 0 };
  };

  // Hook to handle cascading deletes properly
  Organization.addHook('beforeDestroy', async (organization, options) => {
    const transaction = options.transaction;

    // Delete all users in this organization
    await sequelize.models.user.destroy({
      where: { organization_id: organization.id },
      transaction,
    });

    // Delete all pending invitations
    if (sequelize.models.invitation) {
      await sequelize.models.invitation.destroy({
        where: { organization_id: organization.id },
        transaction,
      });
    }
  });

  return Organization;
};
