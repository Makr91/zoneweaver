import { DataTypes } from '@sequelize/core';
import { attachServerRequestMethods } from './serverRequests.js';

export default sequelize => {
  const Server = sequelize.define(
    'servers',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      hostname: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      port: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 65535,
        },
      },
      protocol: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https',
        validate: {
          isIn: [['http', 'https']],
        },
      },
      entity_name: {
        type: DataTypes.STRING,
        allowNull: false,
        columnName: 'entity_name',
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      api_key: {
        type: DataTypes.STRING,
        allowNull: false,
        columnName: 'api_key',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        columnName: 'is_active',
      },
      last_used: {
        type: DataTypes.DATE,
        allowNull: true,
        columnName: 'last_used',
      },
      allow_insecure: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        columnName: 'allow_insecure',
      },
      capabilities: {
        /**
         * Slim /status payload harvested from the agent (role, hypervisors, features,
         * console, auth, …)
         */
        type: DataTypes.JSON,
        allowNull: true,
        columnName: 'capabilities',
      },
      last_seen: {
        /** Last successful /status poll; stale => agent unreachable (not auto-deactivated) */
        type: DataTypes.DATE,
        allowNull: true,
        columnName: 'last_seen',
      },
    },
    {
      tableName: 'servers',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      indexes: [
        {
          unique: true,
          fields: ['hostname', 'port', 'protocol'],
        },
        {
          fields: ['is_active'],
        },
        {
          fields: ['last_used'],
        },
        {
          fields: ['entity_name'],
        },
      ],

      defaultScope: {
        where: {
          is_active: true,
        },
        attributes: {
          exclude: ['api_key'],
        },
      },

      /**
       * Named scopes. withApiKey stays scoped to active rows — a deactivated server must
       * not resolve for proxying/WS (the empty-attrs form would otherwise drop the
       * defaultScope's is_active filter). byLastUsed declares the active-only filter and
       * api_key exclusion explicitly — a named scope must not depend on the default scope
       * surviving withScope.
       */
      scopes: {
        withInactive: {
          where: {},
          attributes: {
            exclude: ['api_key'],
          },
        },
        withApiKey: {
          where: {
            is_active: true,
          },
          attributes: {},
        },
        byLastUsed: {
          where: {
            is_active: true,
          },
          attributes: {
            exclude: ['api_key'],
          },
          order: [
            ['last_used', 'DESC'],
            ['created_at', 'DESC'],
          ],
        },
      },
    }
  );

  Server.associate = function (models) {
    if (models.user) {
      Server.belongsTo(models.user, {
        foreignKey: { name: 'created_by', onDelete: 'SET NULL' },
        as: 'creator',
      });
    }
  };

  Server.prototype.getServerUrl = function () {
    return `${this.protocol}://${this.hostname}:${this.port}`;
  };

  Server.prototype.updateLastUsed = function () {
    return this.update({ last_used: new Date() });
  };

  attachServerRequestMethods(Server);

  Server.addServer = async function ({
    hostname,
    port,
    protocol,
    entityName,
    description,
    apiKey,
    allowInsecure = false,
  }) {
    const transaction = await sequelize.startUnmanagedTransaction();

    try {
      const existingServer = await this.withScope('withInactive').findOne({
        where: { hostname, port, protocol },
      });

      if (existingServer && existingServer.is_active) {
        throw new Error(`Server ${hostname}:${port} (${protocol}) already exists`);
      }

      let finalApiKey;

      if (apiKey) {
        const testResult = await this.testServerWithApiKey(
          hostname,
          port,
          protocol,
          apiKey,
          allowInsecure
        );
        if (!testResult.success) {
          throw new Error(`Provided API key is invalid: ${testResult.error}`);
        }
        finalApiKey = apiKey;
      } else {
        const apiKeyResult = await this.bootstrapApiKey({
          hostname,
          port,
          protocol,
          entityName,
          allowInsecure,
        });
        finalApiKey = apiKeyResult.apiKey;
      }

      let server;
      if (existingServer) {
        server = await existingServer.update(
          {
            entity_name: entityName,
            description,
            api_key: finalApiKey,
            is_active: true,
            allow_insecure: allowInsecure,
          },
          { transaction }
        );
      } else {
        server = await this.create(
          {
            hostname,
            port,
            protocol,
            entity_name: entityName,
            description,
            api_key: finalApiKey,
            allow_insecure: allowInsecure,
          },
          { transaction }
        );
      }

      await transaction.commit();

      const created = await this.findByPk(server.id);
      if (created) {
        await created.refreshStatus();
      }
      return created;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  Server.getAllServers = function () {
    return this.withScope('byLastUsed').findAll();
  };

  /**
   * Remove a server by ID
   * @param {number} serverId - Server ID
   * @returns {Promise<boolean>} Success status
   */
  Server.removeServer = async function (serverId) {
    const deleted = await this.destroy({ where: { id: serverId } });
    return deleted > 0;
  };

  return Server;
};
