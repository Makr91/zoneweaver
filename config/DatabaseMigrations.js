/**
 * @fileoverview Database Migration Utilities for Hyperweaver Server
 * @description Migration scaffolding. The schema itself is fully model-defined and created
 * by sequelize.sync; add per-release migration methods here (using the helpers) only when
 * an existing installation's schema must change, and call them from runMigrations.
 */

import { log } from '../utils/Logger.js';

/**
 * Database Migration Helper Class
 * @description Provides utilities for safely migrating database schemas
 */
class DatabaseMigrations {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.queryInterface = sequelize.queryInterface;
  }

  /**
   * Check if a column exists in a table
   * @param {string} tableName - Name of the table
   * @param {string} columnName - Name of the column
   * @returns {Promise<boolean>} True if column exists
   */
  async columnExists(tableName, columnName) {
    try {
      if (this.sequelize.dialect.name.startsWith('sqlite')) {
        const [results] = await this.sequelize.query(`PRAGMA table_info(${tableName})`);
        return results.some(col => col.name === columnName);
      }
      const [results] = await this.sequelize.query(`
                    SELECT COLUMN_NAME
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}'
                `);
      return results.length > 0;
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
      if (this.sequelize.dialect.name.startsWith('sqlite')) {
        const [results] = await this.sequelize.query(`
                    SELECT name FROM sqlite_master
                    WHERE type='table' AND name='${tableName}'
                `);
        return results.length > 0;
      }
      const [results] = await this.sequelize.query(`
                    SELECT TABLE_NAME
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME = '${tableName}'
                `);
      return results.length > 0;
    } catch (error) {
      log.database.warn('Failed to check if table exists', {
        tableName,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Check if an index exists on a table
   * @param {string} tableName - Name of the table
   * @param {string} indexName - Name of the index
   * @returns {Promise<boolean>} True if index exists
   */
  async indexExists(tableName, indexName) {
    try {
      if (this.sequelize.dialect.name.startsWith('sqlite')) {
        const [results] = await this.sequelize.query(`
                    SELECT name FROM sqlite_master
                    WHERE type='index' AND name='${indexName}' AND tbl_name='${tableName}'
                `);
        return results.length > 0;
      }
      const [results] = await this.sequelize.query(`
                    SELECT INDEX_NAME
                    FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE TABLE_NAME = '${tableName}' AND INDEX_NAME = '${indexName}'
                `);
      return results.length > 0;
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

      if (options.indexes) {
        const indexResults = await Promise.allSettled(
          options.indexes.map(index =>
            this.queryInterface.addIndex(tableName, index.fields, {
              name: index.name,
              unique: index.unique || false,
              type: index.type,
            })
          )
        );
        indexResults.forEach((result, i) => {
          const { name: indexName } = options.indexes[i];
          if (result.status === 'fulfilled') {
            log.database.info('Created index', { indexName, tableName });
          } else {
            log.database.warn('Failed to create index', {
              indexName,
              error: result.reason.message,
            });
          }
        });
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
   * Run all pending migrations. Currently none — the full schema is model-defined and
   * created by initializeTables; future schema changes add their migration method above
   * and call it here.
   * @returns {Promise<boolean>} True if all migrations successful
   */
  async runMigrations() {
    log.database.info('No pending database migrations');
    return true;
  }

  /**
   * Initialize database tables if they don't exist
   * @description Creates tables using Sequelize sync for new installations
   * @returns {Promise<boolean>} True if initialization successful
   */
  async initializeTables() {
    try {
      await this.sequelize.sync({ alter: false });
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

      await this.initializeTables();

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
export const createMigrationHelper = sequelize => new DatabaseMigrations(sequelize);

export default DatabaseMigrations;
