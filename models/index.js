import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';
import { loadConfig } from '../utils/config.js';
import { createMigrationHelper } from '../config/DatabaseMigrations.js';
import { log, createTimer } from '../utils/Logger.js';

let config;
try {
  config = loadConfig();
} catch (e) {
  log.app.error('Failed to load configuration', { error: e.message });
  process.exit(1);
}

const dbConfig = {
  dialect: config.database.dialect.value,
  storage: config.database.storage?.value,
  host: config.database.host?.value,
  port: config.database.port?.value,
  user: config.database.user?.value,
  password: config.database.password?.value,
  database: config.database.database_name?.value,
  logging: config.database.logging?.value,
  pool: {
    max: config.database.pool?.max?.value,
    min: config.database.pool?.min?.value,
    acquire: config.database.pool?.acquire?.value,
    idle: config.database.pool?.idle?.value,
  },
};

// Configure Sequelize based on database dialect
// Handle both flat format and UI metadata format
const dialect = dbConfig.dialect?.value || dbConfig.dialect || 'sqlite';
const loggingEnabled = dbConfig.logging?.value || dbConfig.logging || false;

// Custom logging function for Sequelize
const sequelizeLogging = loggingEnabled ? (msg, timing) => {
  // Parse the query to check if it's a slow query
  if (timing && timing > 1000) {
    log.database.warn('Slow database query', { 
      query: msg, 
      duration_ms: timing 
    });
  } else {
    // Log regular queries at debug level
    log.database.debug(msg, { timing });
  }
} : false;

const sequelizeConfig = {
  logging: sequelizeLogging,
  dialect,
  benchmark: true, // Enable timing for all queries
};

if (dialect === 'sqlite') {
  // SQLite configuration - use storage from config
  sequelizeConfig.storage = dbConfig.storage;

  // Ensure the directory exists for SQLite database file
  const storageDir = path.dirname(sequelizeConfig.storage);
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true, mode: 0o755 });
    log.database.info('Created SQLite database directory', { directory: storageDir });
  }

  log.database.info('Using SQLite database', { storage: sequelizeConfig.storage });
} else {
  // MySQL/PostgreSQL/MariaDB configuration
  sequelizeConfig.host = dbConfig.host?.value || dbConfig.host || 'localhost';
  sequelizeConfig.port =
    dbConfig.port?.value || dbConfig.port || (dialect === 'postgresql' ? 5432 : 3306);

  // Connection pooling
  const poolConfig = dbConfig.pool;
  if (poolConfig) {
    sequelizeConfig.pool = {
      max: poolConfig.max?.value || poolConfig.max || 5,
      min: poolConfig.min?.value || poolConfig.min || 0,
      acquire: poolConfig.acquire?.value || poolConfig.acquire || 30000,
      idle: poolConfig.idle?.value || poolConfig.idle || 10000,
    };
  }
}

const databaseName =
  dialect === 'sqlite'
    ? null
    : dbConfig.database_name?.value || dbConfig.database_name || 'zoneweaver';
const username =
  dialect === 'sqlite' ? null : dbConfig.user?.value || dbConfig.user || 'zoneweaver';
const password = dialect === 'sqlite' ? null : dbConfig.password?.value || dbConfig.password || '';

const sequelize = new Sequelize(databaseName, username, password, sequelizeConfig);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models - using dynamic imports for ES modules
const modelFiles = [
  'user.model.js',
  'organization.model.js',
  'invitation.model.js',
  'server.model.js',
  'credential.model.js',
];

// Initialize models - handle async imports properly
const modelPromises = modelFiles.map(async file => {
  try {
    const { default: modelDefiner } = await import(`./${file}`);
    const modelName = file.replace('.model.js', '');
    return { modelName, modelDefiner };
  } catch (error) {
    log.database.warn('Could not load model', { 
      file, 
      error: error.message 
    });
    return null;
  }
});

// Wait for all models to load
const loadedModels = await Promise.all(modelPromises);

// Create model instances
loadedModels.forEach(result => {
  if (result) {
    const { modelName, modelDefiner } = result;
    db[modelName] = modelDefiner(sequelize, Sequelize);
  }
});

// Define associations after all models are loaded
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Test database connection and run migrations
try {
  const connectionTimer = createTimer('database_connection');
  await sequelize.authenticate();
  const connectionTime = connectionTimer.end();
  
  log.database.info('Database connection established successfully', { 
    dialect: sequelizeConfig.dialect,
    duration_ms: connectionTime
  });

  // Initialize automatic migration system
  const migrationTimer = createTimer('database_migration');
  const migrationHelper = createMigrationHelper(sequelize);
  await migrationHelper.setupDatabase();
  const migrationTime = migrationTimer.end();
  
  log.database.info('Database migrations completed', {
    duration_ms: migrationTime
  });
} catch (error) {
  log.database.error('Unable to connect to database', { 
    error: error.message,
    dialect: sequelizeConfig.dialect
  });
  throw error;
}

export default db;
