import { DataTypes } from '@sequelize/core';

/**
 * MachineOrg Model — which org(s) a machine on an agent belongs to. Junction shape: a
 * machine may carry multiple org rows (single-org today, multi-org deliberately not
 * ruled out). Machines are identified by their agent-canonical name within a server.
 * A machine with NO rows is visible only to the agent's owning orgs.
 */
export default sequelize => {
  const MachineOrg = sequelize.define(
    'machine_orgs',
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
      machine_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        columnName: 'machine_name',
        validate: {
          notEmpty: true,
        },
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
      tableName: 'machine_orgs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['server_id', 'machine_name', 'org_uuid'],
          name: 'unique_machine_org',
        },
        {
          fields: ['server_id', 'org_uuid'],
          name: 'idx_machine_orgs_server_org',
        },
      ],
    }
  );

  MachineOrg.associate = function (models) {
    MachineOrg.belongsTo(models.server, {
      foreignKey: { name: 'server_id', onDelete: 'CASCADE' },
      as: 'server',
    });
  };

  MachineOrg.findForServer = function (serverId) {
    return this.findAll({ where: { server_id: serverId } });
  };

  MachineOrg.findOrgsForMachine = async function (serverId, machineName) {
    const rows = await this.findAll({
      where: { server_id: serverId, machine_name: machineName },
    });
    return rows.map(row => row.org_uuid);
  };

  MachineOrg.setOrgsForMachine = async function (serverId, machineName, orgUuids) {
    await this.destroy({ where: { server_id: serverId, machine_name: machineName } });
    await this.bulkCreate(
      orgUuids.map(orgUuid => ({
        server_id: serverId,
        machine_name: machineName,
        org_uuid: orgUuid,
      }))
    );
  };

  MachineOrg.stampMachine = function (serverId, machineName, orgUuid) {
    return this.findOrCreate({
      where: { server_id: serverId, machine_name: machineName, org_uuid: orgUuid },
      defaults: { server_id: serverId, machine_name: machineName, org_uuid: orgUuid },
    });
  };

  return MachineOrg;
};
