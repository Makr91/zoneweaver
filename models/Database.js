import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as YAML from 'yaml';
import { loadConfig } from '../utils/config.js';

/**
 * Database class for managing SQLite database operations
 * Handles user authentication and API key storage for Zoneweaver
 */
class Database {
  constructor() {
    this.db = null;
    const config = loadConfig();
    this.dbPath = config.database?.path || './data/zoneweaver.db';
  }

  /**
   * Initialize the database connection and create tables if they don't exist
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Create database connection (better-sqlite3 is synchronous)
    this.db = new BetterSqlite3(this.dbPath);
      
      // Enable WAL mode for better performance and concurrency
      this.db.pragma('journal_mode = WAL');

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Create necessary tables for user authentication and API key management
   * @returns {Promise<void>}
   */
  async createTables() {
    // Organizations table (create first as it's referenced by others)
    const createOrganizationsTable = `
      CREATE TABLE IF NOT EXISTS organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )
    `;

    // Users table for Zoneweaver authentication
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )
    `;

    // Invitations table
    const createInvitationsTable = `
      CREATE TABLE IF NOT EXISTS invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        invitation_code TEXT UNIQUE NOT NULL,
        invited_by_user_id INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME,
        used_by_user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (organization_id) REFERENCES organizations (id),
        FOREIGN KEY (invited_by_user_id) REFERENCES users (id),
        FOREIGN KEY (used_by_user_id) REFERENCES users (id),
        UNIQUE(organization_id, email, is_active)
      )
    `;

    // Servers table for application-level Zoneweaver API Server management
    const createServersTable = `
      CREATE TABLE IF NOT EXISTS servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hostname TEXT NOT NULL,
        port INTEGER NOT NULL,
        protocol TEXT NOT NULL DEFAULT 'https',
        entity_name TEXT NOT NULL,
        description TEXT,
        api_key TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used DATETIME,
        UNIQUE(hostname, port, protocol)
      )
    `;

    // Sessions table for user session management
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;

    this.db.exec(createOrganizationsTable);
    this.db.exec(createUsersTable);
    this.db.exec(createInvitationsTable);
    this.db.exec(createServersTable);
    this.db.exec(createSessionsTable);

    // Handle migration - add organization_id column if it doesn't exist
    await this.addOrganizationIdToUsers();

    // Handle existing users migration
    await this.handleExistingUsersMigration();
  }

  /**
   * Add organization_id column to users table if it doesn't exist
   * @returns {Promise<void>}
   */
  async addOrganizationIdToUsers() {
    try {
      // Check if organization_id column exists
      const tableInfo = this.db.prepare("PRAGMA table_info(users)").all();
      const hasOrgIdColumn = tableInfo.some(column => column.name === 'organization_id');
      
      if (!hasOrgIdColumn) {
        console.log('Adding organization_id column to users table...');
        this.db.exec('ALTER TABLE users ADD COLUMN organization_id INTEGER REFERENCES organizations(id)');
        console.log('Successfully added organization_id column');
      }
    } catch (error) {
      console.error('Error adding organization_id column:', error);
      throw error;
    }
  }

  /**
   * Handle migration of existing users to organization structure
   * @returns {Promise<void>}
   */
  async handleExistingUsersMigration() {
    try {
      // Check if users table exists and has data
      const users = this.db.prepare('SELECT COUNT(*) as count FROM users').all();
      const userCount = users[0].count;

      if (userCount > 0) {
        console.log(`Found ${userCount} existing users, checking migration...`);
        
        // Check if we need to create a default organization
        const orgs = this.db.prepare('SELECT COUNT(*) as count FROM organizations').all();
        const orgCount = orgs[0].count;

        if (orgCount === 0) {
          console.log('Creating default organization for existing users...');
          
          // Create a default organization
          const insertOrg = this.db.prepare('INSERT INTO organizations (name, description) VALUES (?, ?)');
          const result = insertOrg.run('Default Organization', 'Auto-created organization for existing users');
          
          const defaultOrgId = result.lastInsertRowid;
          
          // Update all users without organization_id to use the default organization
          const usersWithoutOrg = this.db.prepare('SELECT id FROM users WHERE organization_id IS NULL').all();
          
          if (usersWithoutOrg.length > 0) {
            console.log(`Migrating ${usersWithoutOrg.length} users to default organization...`);
            
            const updateUser = this.db.prepare('UPDATE users SET organization_id = ? WHERE id = ?');
            
            for (const user of usersWithoutOrg) {
              updateUser.run(defaultOrgId, user.id);
            }
            
            console.log('Successfully migrated existing users to default organization');
          }
        }
      }
    } catch (error) {
      console.error('Error handling existing users migration:', error);
      // Don't throw - let the app continue even if migration has issues
    }
  }

  /**
   * Get database instance
   * @returns {Database} Database instance
   */
  getDb() {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
const database = new Database();
export default database;
