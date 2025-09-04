/**
 * @fileoverview Database Migration Utilities for Zoneweaver Frontend
 * @description Handles database schema migrations and updates for authentication features
 */

import { Sequelize } from 'sequelize';

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
            console.warn(`Failed to check column ${columnName} in table ${tableName}:`, error.message);
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
            console.warn(`Failed to check if table ${tableName} exists:`, error.message);
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
                console.log(`  ✓ Column ${tableName}.${columnName} already exists`);
                return true;
            }

            console.log(`  + Adding column ${tableName}.${columnName}...`);
            await this.queryInterface.addColumn(tableName, columnName, columnDefinition);
            console.log(`  ✅ Added column ${tableName}.${columnName}`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to add column ${tableName}.${columnName}:`, error.message);
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
                console.log(`  ✓ Table ${tableName} already exists`);
                return true;
            }

            console.log(`  + Creating table ${tableName}...`);
            await this.queryInterface.createTable(tableName, tableDefinition, options);
            
            // Create indexes if specified
            if (options.indexes) {
                for (const index of options.indexes) {
                    try {
                        await this.queryInterface.addIndex(tableName, index.fields, {
                            name: index.name,
                            unique: index.unique || false,
                            type: index.type
                        });
                        console.log(`  ✅ Created index ${index.name} on ${tableName}`);
                    } catch (indexError) {
                        console.warn(`  ⚠️ Failed to create index ${index.name}:`, indexError.message);
                    }
                }
            }

            console.log(`  ✅ Created table ${tableName}`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to create table ${tableName}:`, error.message);
            return false;
        }
    }

    /**
     * Migrate users table to add authentication fields
     * @description Adds auth_provider, external_id, linked_at fields for external authentication
     * @returns {Promise<boolean>} True if migration successful
     */
    async migrateUsersTable() {
        console.log('🔧 Migrating users table for authentication fields...');
        
        const tableName = 'users';
        const columnsToAdd = [
            {
                name: 'auth_provider',
                definition: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                    defaultValue: 'local',
                    comment: 'Authentication provider: local, ldap, oidc, etc.'
                }
            },
            {
                name: 'external_id',
                definition: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    comment: 'External provider user ID'
                }
            },
            {
                name: 'linked_at',
                definition: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    comment: 'Timestamp when external account was linked'
                }
            }
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
                console.log('  + Setting auth_provider to "local" for existing users...');
                await this.sequelize.query(
                    "UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL"
                );
                console.log('  ✅ Updated existing users to use local auth_provider');
            } catch (error) {
                console.warn('  ⚠️ Failed to update existing users:', error.message);
            }
        }

        if (allSuccessful) {
            console.log('✅ Users table migration completed successfully');
        } else {
            console.warn('⚠️ Users table migration completed with some errors');
        }

        return allSuccessful;
    }

    /**
     * Migrate organizations table to add organization_code field
     * @description Adds organization_code field for domain mapping
     * @returns {Promise<boolean>} True if migration successful
     */
    async migrateOrganizationsTable() {
        console.log('🔧 Migrating organizations table for organization codes...');
        
        const tableName = 'organizations';
        const columnsToAdd = [
            {
                name: 'organization_code',
                definition: {
                    type: Sequelize.STRING(20),
                    allowNull: true,
                    unique: true,
                    comment: 'Organization code for domain mapping (hexcode format)'
                }
            }
        ];

        let allSuccessful = true;
        
        for (const column of columnsToAdd) {
            const success = await this.addColumnIfNotExists(tableName, column.name, column.definition);
            if (!success) {
                allSuccessful = false;
            }
        }

        if (allSuccessful) {
            console.log('✅ Organizations table migration completed successfully');
        } else {
            console.warn('⚠️ Organizations table migration completed with some errors');
        }

        return allSuccessful;
    }

    /**
     * Create federated_credentials table
     * @description Creates table for storing external authentication provider credentials
     * @returns {Promise<boolean>} True if creation successful
     */
    async createCredentialsTable() {
        console.log('🔧 Creating federated_credentials table...');
        
        const tableName = 'federated_credentials';
        const tableDefinition = {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                comment: 'Unique credential identifier'
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                comment: 'Reference to users table'
            },
            provider: {
                type: Sequelize.STRING(50),
                allowNull: false,
                comment: 'Authentication provider: ldap, oidc, oauth2, etc.'
            },
            subject: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Provider-specific user identifier (sub claim)'
            },
            external_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'Additional provider user ID if different from subject'
            },
            external_email: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: 'Email from external provider'
            },
            linked_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
                comment: 'When this credential was linked to the user'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        };

        const options = {
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
            ]
        };

        const success = await this.createTableIfNotExists(tableName, tableDefinition, options);

        if (success) {
            console.log('✅ Federated credentials table created successfully');
        } else {
            console.warn('⚠️ Federated credentials table creation failed');
        }

        return success;
    }

    /**
     * Run all pending migrations
     * @description Executes all necessary database migrations for Passport.js authentication
     * @returns {Promise<boolean>} True if all migrations successful
     */
    async runMigrations() {
        console.log('🔄 Running Passport.js database migrations...');
        
        try {
            // Migrate users table (add auth fields)
            await this.migrateUsersTable();
            
            // Migrate organizations table (add organization_code)
            await this.migrateOrganizationsTable();
            
            // Create federated_credentials table
            await this.createCredentialsTable();
            
            console.log('✅ All Passport.js database migrations completed successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Database migration failed:', error.message);
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
            console.log('✅ Database tables initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Database table initialization failed:', error.message);
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
            console.log('🔧 Setting up database schema...');
            
            // First, initialize any missing tables
            await this.initializeTables();
            
            // Then run migrations to update existing tables
            await this.runMigrations();
            
            console.log('✅ Database setup completed successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Database setup failed:', error.message);
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
