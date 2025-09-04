/**
 * Database Migration: Add Passport.js Authentication Fields
 * Phase 2: Database Schema & Foundation
 * 
 * This migration adds the necessary database fields and tables to support
 * external authentication providers while maintaining backward compatibility.
 */

export async function up(queryInterface, Sequelize) {
  console.log('🔄 Adding Passport.js authentication fields...');

  // Add authentication fields to users table
  console.log('  ➤ Adding auth_provider column to users table...');
  await queryInterface.addColumn('users', 'auth_provider', {
    type: Sequelize.STRING(50),
    allowNull: true,
    defaultValue: 'local',
    comment: 'Authentication provider: local, ldap, oidc, etc.'
  });

  console.log('  ➤ Adding external_id column to users table...');
  await queryInterface.addColumn('users', 'external_id', {
    type: Sequelize.STRING(255),
    allowNull: true,
    comment: 'External provider user ID'
  });

  console.log('  ➤ Adding linked_at column to users table...');
  await queryInterface.addColumn('users', 'linked_at', {
    type: Sequelize.DATE,
    allowNull: true,
    comment: 'Timestamp when external account was linked'
  });

  // Create federated_credentials table
  console.log('  ➤ Creating federated_credentials table...');
  await queryInterface.createTable('federated_credentials', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Unique federated credential identifier'
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
  });

  // Add unique constraint for provider + subject
  console.log('  ➤ Adding unique constraint for provider + subject...');
  await queryInterface.addConstraint('federated_credentials', {
    fields: ['provider', 'subject'],
    type: 'unique',
    name: 'unique_provider_subject'
  });

  // Add organization_code to organizations table
  console.log('  ➤ Adding organization_code column to organizations table...');
  await queryInterface.addColumn('organizations', 'organization_code', {
    type: Sequelize.STRING(20),
    allowNull: true,
    unique: true,
    comment: 'Organization code for domain mapping (hexcode format)'
  });

  // Update existing users to have 'local' auth_provider
  console.log('  ➤ Setting auth_provider to "local" for existing users...');
  await queryInterface.sequelize.query(
    "UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL"
  );

  console.log('✅ Passport.js authentication fields added successfully');
}

export async function down(queryInterface, Sequelize) {
  console.log('🔄 Removing Passport.js authentication fields...');

  // Remove columns from users table
  console.log('  ➤ Removing auth_provider column from users table...');
  await queryInterface.removeColumn('users', 'auth_provider');

  console.log('  ➤ Removing external_id column from users table...');
  await queryInterface.removeColumn('users', 'external_id');

  console.log('  ➤ Removing linked_at column from users table...');
  await queryInterface.removeColumn('users', 'linked_at');

  // Drop federated_credentials table
  console.log('  ➤ Dropping federated_credentials table...');
  await queryInterface.dropTable('federated_credentials');

  // Remove organization_code from organizations table
  console.log('  ➤ Removing organization_code column from organizations table...');
  await queryInterface.removeColumn('organizations', 'organization_code');

  console.log('✅ Passport.js authentication fields removed successfully');
}
