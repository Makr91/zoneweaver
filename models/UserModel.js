import bcrypt from 'bcrypt';
import database from './Database.js';

/**
 * User model for handling user authentication and management
 */
class UserModel {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email address
   * @param {string} userData.password - Plain text password
   * @param {string} [userData.role='user'] - User role
   * @param {number} [userData.organizationId] - Organization ID (null for super-admin)
   * @returns {Promise<Object>} Created user object (without password)
   */
  static async createUser({ username, email, password, role = 'user', organizationId = null }) {
    try {
      const db = database.getDb();
      
      // Check if user already exists
      const existingUser = await db.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );
      
      if (existingUser) {
        throw new Error('User with this username or email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert user
      const result = await db.run(
        'INSERT INTO users (username, email, password_hash, role, organization_id) VALUES (?, ?, ?, ?, ?)',
        [username, email, passwordHash, role, organizationId]
      );

      // Return user without password
      const newUser = await db.get(
        'SELECT id, username, email, role, organization_id, created_at, is_active FROM users WHERE id = ?',
        [result.lastID]
      );

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with username/email and password
   * @param {string} identifier - Username or email
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} User object (without password) if authenticated, null otherwise
   */
  static async authenticateUser(identifier, password) {
    try {
      const db = database.getDb();
      
      // Find user by username or email
      const user = await db.get(
        'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
        [identifier, identifier]
      );

      if (!user) {
        return null;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return null;
      }

      // Update last login
      await db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      // Return user without password
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Check if user exists by username or email
   * @param {string} username - Username to check
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} True if user exists, false otherwise
   */
  static async checkUserExists(username, email) {
    try {
      const db = database.getDb();
      
      const user = await db.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      return !!user;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User object (without password) or null
   */
  static async getUserById(userId) {
    try {
      const db = database.getDb();
      
      const user = await db.get(
        'SELECT id, username, email, role, organization_id, created_at, last_login, is_active FROM users WHERE id = ? AND is_active = 1',
        [userId]
      );

      return user || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get all users (super-admin function)
   * @returns {Promise<Array>} Array of user objects (without passwords)
   */
  static async getAllUsers() {
    try {
      const db = database.getDb();
      
      const users = await db.all(
        `SELECT u.id, u.username, u.email, u.role, u.organization_id, u.created_at, u.last_login, u.is_active,
         o.name as organization_name
         FROM users u 
         LEFT JOIN organizations o ON u.organization_id = o.id
         ORDER BY u.created_at DESC`
      );

      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Get users by organization ID (organization admin function)
   * @param {number} organizationId - Organization ID
   * @param {boolean} [includeInactive=false] - Include inactive users
   * @returns {Promise<Array>} Array of user objects (without passwords)
   */
  static async getUsersByOrganization(organizationId, includeInactive = false) {
    try {
      const db = database.getDb();
      
      const activeFilter = includeInactive ? '' : 'AND u.is_active = 1';
      
      const users = await db.all(
        `SELECT u.id, u.username, u.email, u.role, u.organization_id, u.created_at, u.last_login, u.is_active,
         o.name as organization_name
         FROM users u 
         JOIN organizations o ON u.organization_id = o.id
         WHERE u.organization_id = ? ${activeFilter}
         ORDER BY u.created_at DESC`,
        [organizationId]
      );

      return users;
    } catch (error) {
      console.error('Error getting users by organization:', error);
      throw error;
    }
  }

  /**
   * Check if this is the first user in the system
   * @returns {Promise<boolean>} Whether this would be the first user
   */
  static async isFirstUser() {
    try {
      const db = database.getDb();
      
      const userCount = await db.get(
        'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
      );

      return userCount.count === 0;
    } catch (error) {
      console.error('Error checking if first user:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User object (without password) or null
   */
  static async getUserByEmail(email) {
    try {
      const db = database.getDb();
      
      const user = await db.get(
        `SELECT u.id, u.username, u.email, u.role, u.organization_id, u.created_at, u.last_login, u.is_active,
         o.name as organization_name
         FROM users u 
         LEFT JOIN organizations o ON u.organization_id = o.id
         WHERE u.email = ? AND u.is_active = 1`,
        [email]
      );

      return user || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Update user role
   * @param {number} userId - User ID
   * @param {string} newRole - New role
   * @returns {Promise<boolean>} Success status
   */
  static async updateUserRole(userId, newRole) {
    try {
      const db = database.getDb();
      
      const result = await db.run(
        'UPDATE users SET role = ? WHERE id = ?',
        [newRole, userId]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Deactivate user (soft delete)
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async deactivateUser(userId) {
    try {
      const db = database.getDb();
      
      const result = await db.run(
        'UPDATE users SET is_active = 0 WHERE id = ?',
        [userId]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Reactivate user
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async reactivateUser(userId) {
    try {
      const db = database.getDb();
      
      const result = await db.run(
        'UPDATE users SET is_active = 1 WHERE id = ?',
        [userId]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error reactivating user:', error);
      throw error;
    }
  }

  /**
   * Permanently delete user (hard delete)
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteUser(userId) {
    try {
      const db = database.getDb();
      
      const result = await db.run(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const db = database.getDb();
      
      // Get current user
      const user = await db.get('SELECT password_hash FROM users WHERE id = ?', [userId]);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      const result = await db.run(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [newPasswordHash, userId]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Verify user password
   * @param {number} userId - User ID
   * @param {string} password - Password to verify
   * @returns {Promise<boolean>} Whether password is valid
   */
  static async verifyPassword(userId, password) {
    try {
      const db = database.getDb();
      
      // Get current user
      const user = await db.get('SELECT password_hash FROM users WHERE id = ?', [userId]);
      
      if (!user) {
        return false;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      return isValidPassword;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Promise<Array>} Array of users with specified role
   */
  static async getUsersByRole(role) {
    try {
      const db = database.getDb();
      
      const users = await db.all(
        'SELECT id, username, email, role, created_at, last_login, is_active, organization_id FROM users WHERE role = ? AND is_active = 1',
        [role]
      );

      return users;
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }
}

export default UserModel;
