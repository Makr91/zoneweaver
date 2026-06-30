import { DataTypes, sql } from '@sequelize/core';

export default sequelize => {
  const Organization = sequelize.define(
    'organizations',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        columnName: 'is_active',
      },
      organization_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
        columnName: 'organization_code',
        validate: {
          len: [6, 20],
          isAlphanumeric: {
            msg: 'Organization code must be alphanumeric',
          },
        },
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
          fields: ['is_active'],
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
              association: 'users',
              attributes: [],
              required: false,
            },
          ],
          attributes: {
            include: [
              [sql.fn('COUNT', sql.col('users.id')), 'total_users'],
              [
                sql.fn('COUNT', sql.literal('CASE WHEN users.is_active = true THEN 1 END')),
                'active_users',
              ],
              [
                sql.fn(
                  'COUNT',
                  sql.literal(
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

      // Hooks
      hooks: {
        // Handle cascading deletes properly
        beforeDestroy: async (organization, options) => {
          const { transaction } = options;

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
        },
      },
    }
  );

  // Associations
  Organization.associate = function (models) {
    // Organization has many Users
    Organization.hasMany(models.user, {
      foreignKey: { name: 'organization_id', onDelete: 'CASCADE' },
      as: 'users',
    });

    // Organization has many Invitations
    Organization.hasMany(models.invitation, {
      foreignKey: { name: 'organization_id', onDelete: 'CASCADE' },
      as: 'invitations',
    });
  };

  // Class methods for common queries
  Organization.findByName = function (name) {
    return this.findOne({
      where: sql.where(sql.fn('LOWER', sql.col('name')), sql.fn('LOWER', name)),
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
    return this.withScope('withStats').findAll({
      order: [['created_at', 'DESC']],
    });
  };

  Organization.getStats = async function (organizationId) {
    const result = await this.findOne({
      where: { id: organizationId },
      include: [
        {
          association: 'users',
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        [sql.fn('COUNT', sql.col('users.id')), 'total_users'],
        [
          sql.fn('COUNT', sql.literal('CASE WHEN users.is_active = true THEN 1 END')),
          'active_users',
        ],
        [
          sql.fn(
            'COUNT',
            sql.literal("CASE WHEN users.role = 'admin' AND users.is_active = true THEN 1 END")
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
        [sql.fn('COUNT', sql.col('id')), 'total_users'],
        [sql.fn('COUNT', sql.literal('CASE WHEN is_active = true THEN 1 END')), 'active_users'],
        [
          sql.fn('COUNT', sql.literal("CASE WHEN role = 'admin' AND is_active = true THEN 1 END")),
          'admin_users',
        ],
      ],
      raw: true,
    });

    return stats[0] || { total_users: 0, active_users: 0, admin_users: 0 };
  };

  return Organization;
};
