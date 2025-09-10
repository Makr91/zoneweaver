/**
 * @fileoverview Database Migration Utilities for Zoneweaver Frontend
 * @description Handles database schema migrations and updates for authentication features
 */

import { Sequelize } from 'sequelize';
import { log } from '../utils/Logger.js';

/**
 * Database Migration Helper Class
 * @description Provides utilities for safely migrating database schemas
 */
class DatabaseMigrations {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.queryInterface = sequelize.getQueryInterface();
  }

  /**
   * Check if a column exists in a table
   * @param {string} tableName - Name of the table
   * @param {string} columnName - Name of the column
   * @returns {Promise<boolean>} True if column exists
   */
  async columnExists(tableName, columnName) {
    try {
      if (this.sequelize.getDialect() === 'sqlite') {
        const [results] = await this.sequelize.query(`PRAGMA table_info(${tableName})`);
        return results.some(col => col.name === columnName);
      } else {
        // MySQL/PostgreSQL
        const [results] = await this.sequelize.query(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}'
                `);
        return results.length > 0;
      }
    } catch (error) {
      log.database.warn('Failed to check column in table', {
        tableName,
        columnName,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Check if a table exists
   * @param {string} tableName - Name of the table
   * @returns {Promise<boolean>} True if table exists
   */
  async tableExists(tableName) {
    try {
      if (this.sequelize.getDialect() === 'sqlite') {
        const [results] = await this.sequelize.query(`
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='${tableName}'
                `);
        return results.length > 0;
      } else {
        // MySQL/PostgreSQL
        const [results] = await this.sequelize.query(`
                    SELECT TABLE_NAME 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_NAME = '${tableName}'
                `);
        return results.length > 0;
      }
    } catch (error) {
      log.database.warn('Failed to check if table exists', {
        tableName,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Add a column to a table if it doesn't exist
   * @param {string} tableName - Name of the table
   * @param {string} columnName - Name of the column
   * @param {Object} columnDefinition - Sequelize column definition
   * @returns {Promise<boolean>} True if column was added or already exists
   */
  async addColumnIfNotExists(tableName, columnName, columnDefinition) {
    try {
      const exists = await this.columnExists(tableName, columnName);
      if (exists) {
        log.database.debug('Column already exists', { tableName, columnName });
        return true;
      }

      log.database.info('Adding column', { tableName, columnName });
      await this.queryInterface.addColumn(tableName, columnName, columnDefinition);
      log.database.info('Added column successfully', { tableName, columnName });
      return true;
    } catch (error) {
      log.database.error('Failed to add column', {
        tableName,
        columnName,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Create a table if it doesn't exist
   * @param {string} tableName - Name of the table
   * @param {Object} tableDefinition - Sequelize table definition
   * @param {Object} options - Table options (indexes, etc.)
   * @returns {Promise<boolean>} True if table was created or already exists
   */
  async createTableIfNotExists(tableName, tableDefinition, options = {}) {
    try {
      const exists = await this.tableExists(tableName);
      if (exists) {
        log.database.debug('Table already exists', { tableName });
        return true;
      }

      log.database.info('Creating table', { tableName });
      await this.queryInterface.createTable(tableName, tableDefinition, options);

      // Create indexes if specified
      if (options.indexes) {
        for (const index of options.indexes) {
          try {
            await this.queryInterface.addIndex(tableName, index.fields, {
              name: index.name,
              unique: index.unique || false,
              type: index.type,
            });
            log.database.info('Created index', { indexName: index.name, tableName });
          } catch (indexError) {
            log.database.warn('Failed to create index', {
              indexName: index.name,
              error: indexError.message,
            });
          }
        }
      }

      log.database.info('Created table successfully', { tableName });
      return true;
    } catch (error) {
      log.database.error('Failed to create table', {
        tableName,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Migrate users table to add authentication fields
   * @description Adds auth_provider, external_id, linked_at fields for external authentication
   * @returns {Promise<boolean>} True if migration successful
   */
  async migrateUsersTable() {
    log.database.info('Migrating users table for authentication fields');

    const tableName = 'users';
    const columnsToAdd = [
      {
        name: 'auth_provider',
        definition: {
          type: Sequelize.STRING(50),
          allowNull: true,
          defaultValue: 'local',
          comment: 'Authentication provider: local, ldap, oidc, etc.',
        },
      },
      {
        name: 'external_id',
        definition: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'External provider user ID',
        },
      },
      {
        name: 'linked_at',
        definition: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp when external account was linked',
        },
      },
    ];

    let allSuccessful = true;

    for (const column of columnsToAdd) {
      const success = await this.addColumnIfNotExists(tableName, column.name, column.definition);
      if (!success) {
        allSuccessful = false;
      }
    }

    // Set auth_provider to 'local' for existing users
    if (allSuccessful) {
      try {
        log.database.info('Setting auth_provider to "local" for existing users');
        await this.sequelize.query(
          "UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL"
        );
        log.database.info('Updated existing users to use local auth_provider');
      } catch (error) {
        log.database.warn('Failed to update existing users', { error: error.message });
      }
    }

    if (allSuccessful) {
      log.database.info('Users table migration completed successfully');
    } else {
      log.database.warn('Users table migration completed with some errors');
    }

    return allSuccessful;
  }

  /**
   * Migrate organizations table to add organization_code field
   * @description Adds organization_code field for domain mapping
   * @returns {Promise<boolean>} True if migration successful
   */
  async migrateOrganizationsTable() {
    log.database.info('Migrating organizations table for organization codes');

    const tableName = 'organizations';

    // SQLite doesn't allow adding UNIQUE columns directly, so add column first
    const columnDefinition = {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Organization code for domain mapping (hexcode format)',
    };

    const success = await this.addColumnIfNotExists(
      tableName,
      'organization_code',
      columnDefinition
    );

    // Then create unique index if column was added successfully
    if (success) {
      try {
        // Check if unique index already exists
        const indexExists = await this.indexExists(tableName, 'unique_organization_code');
        if (!indexExists) {
          log.database.info('Creating unique index on organization_code');
          await this.queryInterface.addIndex(tableName, ['organization_code'], {
            name: 'unique_organization_code',
            unique: true,
          });
          log.database.info('Created unique index on organization_code');
        } else {
          log.database.debug('Unique index on organization_code already exists');
        }
      } catch (indexError) {
        log.database.warn('Failed to create unique index on organization_code', {
          error: indexError.message,
        });
      }
    }

    if (success) {
      log.database.info('Organizations table migration completed successfully');
    } else {
      log.database.warn('Organizations table migration completed with some errors');
    }

    return success;
  }

  /**
   * Check if an index exists on a table
   * @param {string} tableName - Name of the table
   * @param {string} indexName - Name of the index
   * @returns {Promise<boolean>} True if index exists
   */
  async indexExists(tableName, indexName) {
    try {
      if (this.sequelize.getDialect() === 'sqlite') {
        const [results] = await this.sequelize.query(`
                    SELECT name FROM sqlite_master 
                    WHERE type='index' AND name='${indexName}' AND tbl_name='${tableName}'
                `);
        return results.length > 0;
      } else {
        // MySQL/PostgreSQL
        const [results] = await this.sequelize.query(`
                    SELECT INDEX_NAME 
                    FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_NAME = '${tableName}' AND INDEX_NAME = '${indexName}'
                `);
        return results.length > 0;
      }
    } catch (error) {
      log.database.warn('Failed to check if index exists on table', {
        indexName,
        tableName,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Create federated_credentials table
   * @description Creates table for storing external authentication provider credentials
   * @returns {Promise<boolean>} True if creation successful
   */
  async createCredentialsTable() {
    log.database.info('Creating federated_credentials table');

    const tableName = 'federated_credentials';
    const tableDefinition = {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique credential identifier',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Reference to users table',
      },
      provider: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Authentication provider: ldap, oidc, oauth2, etc.',
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Provider-specific user identifier (sub claim)',
      },
      external_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Additional provider user ID if different from subject',
      },
      external_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Email from external provider',
      },
      linked_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'When this credential was linked to the user',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    };

    const options = {
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
    };

    const success = await this.createTableIfNotExists(tableName, tableDefinition, options);

    if (success) {
      log.database.info('Federated credentials table created successfully');
    } else {
      log.database.warn('Federated credentials table creation failed');
    }

    return success;
  }

  /**
   * Add missing timestamp columns to existing tables
   * @description Adds created_at and updated_at columns to tables that are missing them
   * @returns {Promise<boolean>} True if migration successful
   */
  async addTimestampColumns() {
    log.database.info('Adding missing timestamp columns to existing tables');

    const tablesToUpdate = ['users', 'organizations', 'invitations', 'servers'];
    let allSuccessful = true;

    for (const tableName of tablesToUpdate) {
      const tableExists = await this.tableExists(tableName);
      if (!tableExists) {
        log.database.warn('Table does not exist, skipping', { tableName });
        continue;
      }

      log.database.debug('Checking table for timestamp columns', { tableName });

      // Add created_at column
      const createdAtSuccess = await this.addColumnIfNotExists(tableName, 'created_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW,
        comment: 'Record creation timestamp',
      });

      // Add updated_at column
      const updatedAtSuccess = await this.addColumnIfNotExists(tableName, 'updated_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW,
        comment: 'Record last update timestamp',
      });

      if (!createdAtSuccess || !updatedAtSuccess) {
        allSuccessful = false;
      }

      // Set default values for existing records
      if (createdAtSuccess || updatedAtSuccess) {
        try {
          log.database.debug('Setting default timestamps for existing records', { tableName });
          const now = new Date().toISOString();

          if (createdAtSuccess) {
            await this.sequelize.query(
              `UPDATE ${tableName} SET created_at = ? WHERE created_at IS NULL`,
              { replacements: [now] }
            );
          }

          if (updatedAtSuccess) {
            await this.sequelize.query(
              `UPDATE ${tableName} SET updated_at = ? WHERE updated_at IS NULL`,
              { replacements: [now] }
            );
          }

          log.database.info('Updated timestamp defaults', { tableName });
        } catch (error) {
          log.database.warn('Failed to set default timestamps', {
            tableName,
            error: error.message,
          });
        }
      }
    }

    if (allSuccessful) {
      log.database.info('Timestamp columns migration completed successfully');
    } else {
      log.database.warn('Timestamp columns migration completed with some errors');
    }

    return allSuccessful;
  }

  /**
   * Migrate servers table to add missing columns
   * @description Adds allow_insecure, created_by and other missing fields for servers table
   * @returns {Promise<boolean>} True if migration successful
   */
  async migrateServersTable() {
    log.database.info('Migrating servers table for missing columns');

    const tableName = 'servers';
    const columnsToAdd = [
      {
        name: 'allow_insecure',
        definition: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Allow insecure TLS connections to this server',
        },
      },
      {
        name: 'created_by',
        definition: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'User ID who created this server entry',
        },
      },
    ];

    let allSuccessful = true;

    for (const column of columnsToAdd) {
      const success = await this.addColumnIfNotExists(tableName, column.name, column.definition);
      if (!success) {
        allSuccessful = false;
      }
    }

    // Set default values for existing records
    if (allSuccessful) {
      try {
        log.database.info('Setting default values for existing servers');
        await this.sequelize.query(
          'UPDATE servers SET allow_insecure = false WHERE allow_insecure IS NULL'
        );
        log.database.info('Updated existing servers with default allow_insecure value');
      } catch (error) {
        log.database.warn('Failed to update existing servers', { error: error.message });
      }
    }

    if (allSuccessful) {
      log.database.info('Servers table migration completed successfully');
    } else {
      log.database.warn('Servers table migration completed with some errors');
    }

    return allSuccessful;
  }

  /**
   * Run all pending migrations
   * @description Executes all necessary database migrations for Passport.js authentication
   * @returns {Promise<boolean>} True if all migrations successful
   */
  async runMigrations() {
    log.database.info('Running Passport.js database migrations');

    try {
      // Add missing timestamp columns first (fixes JWT authentication)
      await this.addTimestampColumns();

      // Migrate users table (add auth fields)
      await this.migrateUsersTable();

      // Migrate organizations table (add organization_code)
      await this.migrateOrganizationsTable();

      // Migrate servers table (add allow_insecure, created_by)
      await this.migrateServersTable();

      // Create federated_credentials table
      await this.createCredentialsTable();

      log.database.info('All Passport.js database migrations completed successfully');
      return true;
    } catch (error) {
      log.database.error('Database migration failed', { error: error.message });
      return false;
    }
  }

  /**
   * Initialize database tables if they don't exist
   * @description Creates tables using Sequelize sync for new installations
   * @returns {Promise<boolean>} True if initialization successful
   */
  async initializeTables() {
    try {
      // Sync all models to create tables if they don't exist
      await this.sequelize.sync({ alter: false }); // Don't alter existing tables, just create missing ones
      log.database.info('Database tables initialized');
      return true;
    } catch (error) {
      log.database.error('Database table initialization failed', { error: error.message });
      return false;
    }
  }

  /**
   * Full database setup: initialize tables and run migrations
   * @description Complete database setup process for new and existing installations
   * @returns {Promise<boolean>} True if setup successful
   */
  async setupDatabase() {
    try {
      log.database.info('Setting up database schema');

      // First, initialize any missing tables
      await this.initializeTables();

      // Then run migrations to update existing tables
      await this.runMigrations();

      log.database.info('Database setup completed successfully');
      return true;
    } catch (error) {
      log.database.error('Database setup failed', { error: error.message });
      return false;
    }
  }
}

/**
 * Create and export a function that initializes the migration system
 * @param {Object} sequelize - Sequelize instance
 * @returns {DatabaseMigrations} Migration helper instance
 */
export function createMigrationHelper(sequelize) {
  return new DatabaseMigrations(sequelize);
}

export default DatabaseMigrations;
