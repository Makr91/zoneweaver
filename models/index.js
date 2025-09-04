import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';
import { loadConfig } from '../utils/config.js';

let config;
try {
  config = loadConfig();
} catch (e) {
  console.error(`Failed to load configuration: ${e.message}`);
  process.exit(1);
}

const dbConfig = config.database;

// Configure Sequelize based on database dialect
// Handle both flat format and UI metadata format
const dialect = dbConfig.dialect?.value || dbConfig.dialect || 'sqlite';
const logging = dbConfig.logging?.value || dbConfig.logging || false;

let sequelizeConfig = {
  logging: logging,
  dialect: dialect,
};

if (dialect === 'sqlite') {
  // SQLite configuration - use storage from config or fallback
  sequelizeConfig.storage = dbConfig.storage?.value || dbConfig.path || './data/zoneweaver.db';
  
  // Ensure the directory exists for SQLite database file
  const storageDir = path.dirname(sequelizeConfig.storage);
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true, mode: 0o755 });
    console.log(`Created SQLite database directory: ${storageDir}`);
  }
} else {
  // MySQL/PostgreSQL/MariaDB configuration
  sequelizeConfig.host = dbConfig.host?.value || dbConfig.host || 'localhost';
  sequelizeConfig.port = dbConfig.port?.value || dbConfig.port || (dialect === 'postgresql' ? 5432 : 3306);
  
  // Connection pooling
  const poolConfig = dbConfig.pool;
  if (poolConfig) {
    sequelizeConfig.pool = {
      max: poolConfig.max?.value || poolConfig.max || 5,
      min: poolConfig.min?.value || poolConfig.min || 0,
      acquire: poolConfig.acquire?.value || poolConfig.acquire || 30000,
      idle: poolConfig.idle?.value || poolConfig.idle || 10000
    };
  }
}

const databaseName = dialect === 'sqlite' ? null : (dbConfig.database_name?.value || dbConfig.database_name || 'zoneweaver');
const username = dialect === 'sqlite' ? null : (dbConfig.user?.value || dbConfig.user || 'zoneweaver');
const password = dialect === 'sqlite' ? null : (dbConfig.password?.value || dbConfig.password || '');

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
  'credential.model.js'
];

// Initialize models - handle async imports properly
const modelPromises = modelFiles.map(async (file) => {
  try {
    const { default: modelDefiner } = await import(`./${file}`);
    const modelName = file.replace('.model.js', '');
    return { modelName, modelDefiner };
  } catch (error) {
    console.warn(`Could not load model ${file}: ${error.message}`);
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

// Test database connection and sync
try {
  await sequelize.authenticate();
  console.log(`✅ Database connection established successfully (${sequelizeConfig.dialect})`);
  
  // Sync database in development
  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
  }
} catch (error) {
  console.error('❌ Unable to connect to database:', error.message);
  throw error;
}

export default db;
