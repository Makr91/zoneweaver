import { DataTypes } from '@sequelize/core';

/**
 * ServerOrg Model — which orgs own a registered agent. Junction shape: an agent can be
 * owned by multiple orgs; every owning org sees the whole agent (including unassigned
 * machines). org_uuid is the cross-app org identity (IdP claim uuid or local org uuid).
 */
export default sequelize => {
  const ServerOrg = sequelize.define(
    'server_orgs',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      server_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        columnName: 'server_id',
        references: {
          table: 'servers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      org_uuid: {
        type: DataTypes.STRING(36),
        allowNull: false,
        columnName: 'org_uuid',
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      tableName: 'server_orgs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['server_id', 'org_uuid'],
          name: 'unique_server_org',
        },
        {
          fields: ['org_uuid'],
          name: 'idx_server_orgs_org_uuid',
        },
      ],
    }
  );

  ServerOrg.associate = function (models) {
    ServerOrg.belongsTo(models.server, {
      foreignKey: { name: 'server_id', onDelete: 'CASCADE' },
      as: 'server',
    });
  };

  ServerOrg.findOrgsForServer = function (serverId) {
    return this.findAll({ where: { server_id: serverId } });
  };

  ServerOrg.findServerIdsForOrgs = async function (orgUuids) {
    const rows = await this.findAll({ where: { org_uuid: orgUuids } });
    return [...new Set(rows.map(row => row.server_id))];
  };

  ServerOrg.setOrgsForServer = async function (serverId, orgUuids) {
    await this.destroy({ where: { server_id: serverId } });
    await this.bulkCreate(orgUuids.map(orgUuid => ({ server_id: serverId, org_uuid: orgUuid })));
  };

  return ServerOrg;
};
