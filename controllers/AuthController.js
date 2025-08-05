import UserModel from '../models/UserModel.js';
import OrganizationModel from '../models/OrganizationModel.js';
import InvitationModel from '../models/InvitationModel.js';
import MailController from './MailController.js';
import jwt from 'jsonwebtoken';
import { config } from '../index.js';

/**
 * Authentication controller for ZoneWeaver user management
 */
class AuthController {
  /**
   * Register a new user with organization support
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async register(req, res) {
    try {
      const { username, email, password, confirmPassword, organizationName, inviteCode } = req.body;

      // Basic validation
      if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username, email, password, and confirm password are required' 
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Passwords do not match' 
        });
      }

      if (password.length < 8) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 8 characters long' 
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid email format' 
        });
      }

      // Check if this is the first user (super-admin)
      const isFirstUser = await UserModel.isFirstUser();
      
      let organizationId = null;
      let userRole = 'user';
      let organization = null;

      if (isFirstUser) {
        // First user becomes super-admin and gets assigned to Default Organization
        userRole = 'super-admin';
        console.log('Creating first user as super-admin');
        
        // Create Default Organization for the super admin
        organization = await OrganizationModel.createOrganization({
          name: 'Default Organization',
          description: 'Auto-created organization for system administrators'
        });
        
        organizationId = organization.id;
        console.log('Created Default Organization for super admin');
        
      } else {
        // Subsequent users must either have invite code or create/join organization
        
        if (inviteCode) {
          // User is registering with an invitation
          console.log('Processing registration with invite code');
          
          const inviteValidation = await InvitationModel.validateInvitationCode(inviteCode);
          
          if (!inviteValidation.valid) {
            return res.status(400).json({
              success: false,
              message: inviteValidation.reason
            });
          }

          // Check if invitation email matches registration email
          if (inviteValidation.invitation.email.toLowerCase() !== email.toLowerCase()) {
            return res.status(400).json({
              success: false,
              message: 'This invitation is for a different email address'
            });
          }

          organizationId = inviteValidation.invitation.organizationId;
          organization = await OrganizationModel.getOrganizationById(organizationId);
          
          if (!organization) {
            return res.status(400).json({
              success: false,
              message: 'Invalid organization in invitation'
            });
          }

        } else if (organizationName) {
          // User is creating or joining an organization without invitation
          console.log('Processing registration with organization name:', organizationName);
          
          // Check if organization exists
          const existingOrg = await OrganizationModel.getOrganizationByName(organizationName);
          
          if (existingOrg) {
            // Organization exists - user needs invitation to join
            return res.status(400).json({
              success: false,
              message: 'This organization already exists. You need an invitation to join it.'
            });
          } else {
            // Check if new organization creation is allowed
            if (!config.security.allow_new_organizations) {
              return res.status(403).json({
                success: false,
                message: 'New organization registration is currently disabled. Please contact an administrator or join with an invitation code.'
              });
            }

            // Check if user already exists BEFORE creating organization
            const existingUser = await UserModel.checkUserExists(username, email);
            if (existingUser) {
              return res.status(409).json({
                success: false,
                message: 'User with this username or email already exists'
              });
            }

            // Create new organization and make user the admin
            console.log('Creating new organization:', organizationName);
            
            organization = await OrganizationModel.createOrganization({
              name: organizationName,
              description: `Organization created by ${username}`
            });
            
            organizationId = organization.id;
            userRole = 'admin'; // First user in new org becomes admin
          }

        } else {
          // No invite code and no organization name provided
          return res.status(400).json({
            success: false,
            message: 'Organization name or invitation code is required for registration'
          });
        }
      }

      // Create the user
      console.log('Creating user with organization ID:', organizationId);
      
      const newUser = await UserModel.createUser({
        username,
        email,
        password,
        role: userRole,
        organizationId
      });

      // Mark invitation as used if applicable
      if (inviteCode) {
        await InvitationModel.markInvitationAsUsed(inviteCode, newUser.id);
        console.log('Marked invitation as used');
      }

      // Send welcome email (optional - don't fail registration if email fails)
      try {
        if (organization) {
          await MailController.sendWelcomeEmail(newUser, organization.name);
          console.log('Welcome email sent successfully');
        }
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError.message);
        // Continue with registration even if email fails
      }

      // Response
      const response = {
        success: true,
        message: isFirstUser 
          ? 'Super admin account created successfully' 
          : organization 
            ? `User registered successfully in organization: ${organization.name}`
            : 'User registered successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          organizationId: newUser.organization_id,
          organizationName: organization?.name || null
        }
      };

      if (inviteCode) {
        response.message += ' (invitation accepted)';
      }

      res.status(201).json(response);

    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({ 
          success: false, 
          message: error.message 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error during registration',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async login(req, res) {
    try {
      const { identifier, password } = req.body;

      // Validation
      if (!identifier || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username/email and password are required' 
        });
      }

      // Authenticate user
      const user = await UserModel.authenticateUser(identifier, password);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        },
        config.security.jwt_secret || 'fallback-secret',
        { expiresIn: '24h' }
      );

      // Set session if using express-session
      if (req.session) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
      }

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          organizationId: user.organization_id,
          lastLogin: user.last_login
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error during login' 
      });
    }
  }

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async logout(req, res) {
    try {
      // Destroy session if using express-session
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destruction error:', err);
          }
        });
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error during logout' 
      });
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user?.userId || req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authenticated' 
        });
      }

      const user = await UserModel.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          organizationId: user.organization_id,
          createdAt: user.created_at,
          lastLogin: user.last_login
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async changePassword(req, res) {
    try {
      const userId = req.user?.userId || req.session?.userId;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authenticated' 
        });
      }

      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'All password fields are required' 
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'New passwords do not match' 
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ 
          success: false, 
          message: 'New password must be at least 8 characters long' 
        });
      }

      // Change password
      const success = await UserModel.changePassword(userId, currentPassword, newPassword);
      
      if (!success) {
        return res.status(400).json({ 
          success: false, 
          message: 'Failed to change password' 
        });
      }

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.message.includes('Current password is incorrect')) {
        return res.status(400).json({ 
          success: false, 
          message: error.message 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Verify JWT token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'No token provided' 
        });
      }

      const decoded = jwt.verify(token, config.security.jwt_secret || 'fallback-secret');
      
      // Get fresh user data
      const user = await UserModel.getUserById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token - user not found' 
        });
      }

      res.json({
        success: true,
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Token verification error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token' 
        });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired' 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Get users based on role permissions (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllUsers(req, res) {
    try {
      const currentUserId = req.user?.userId;
      const currentUserRole = req.user?.role;
      
      let users;
      
      if (currentUserRole === 'super-admin') {
        // Super-admin can see all users
        users = await UserModel.getAllUsers();
      } else if (currentUserRole === 'admin') {
        // Admin can only see users in their organization
        const currentUser = await UserModel.getUserById(currentUserId);
        if (!currentUser || !currentUser.organization_id) {
          return res.status(400).json({
            success: false,
            message: 'Admin user must belong to an organization'
          });
        }
        users = await UserModel.getUsersByOrganization(currentUser.organization_id, true); // Include inactive
      } else {
        // Regular users shouldn't have access (but middleware should prevent this)
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }
      
      res.json({
        success: true,
        users,
        viewScope: currentUserRole === 'super-admin' ? 'all' : 'organization'
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Update user role (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateUserRole(req, res) {
    try {
      const { userId, newRole } = req.body;
      const currentUserId = req.user?.userId || req.session?.userId;

      if (!userId || !newRole) {
        return res.status(400).json({ 
          success: false, 
          message: 'User ID and new role are required' 
        });
      }

      // Prevent users from changing their own role
      if (parseInt(userId) === parseInt(currentUserId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot change your own role' 
        });
      }

      // Validate role
      const validRoles = ['user', 'admin', 'super-admin'];
      if (!validRoles.includes(newRole)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid role specified' 
        });
      }

      const success = await UserModel.updateUserRole(userId, newRole);
      
      if (!success) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        message: 'User role updated successfully'
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Deactivate user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deactivateUser(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.userId || req.session?.userId;

      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'User ID is required' 
        });
      }

      // Prevent users from deactivating themselves
      if (parseInt(userId) === parseInt(currentUserId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot deactivate your own account' 
        });
      }

      const success = await UserModel.deactivateUser(userId);
      
      if (!success) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Reactivate user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async reactivateUser(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'User ID is required' 
        });
      }

      const success = await UserModel.reactivateUser(userId);
      
      if (!success) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        message: 'User reactivated successfully'
      });
    } catch (error) {
      console.error('Reactivate user error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Permanently delete user (super-admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.userId || req.session?.userId;
      const currentUserRole = req.user?.role;

      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'User ID is required' 
        });
      }

      // Only super-admin can permanently delete users
      if (currentUserRole !== 'super-admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super administrators can permanently delete users'
        });
      }

      // Prevent users from deleting themselves
      if (parseInt(userId) === parseInt(currentUserId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete your own account' 
        });
      }

      const success = await UserModel.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        message: 'User permanently deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Check if system needs initial setup
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async checkSetupStatus(req, res) {
    try {
      const users = await UserModel.getAllUsers();
      const needsSetup = users.length === 0;
      
      res.json({
        success: true,
        needsSetup,
        userCount: users.length
      });
    } catch (error) {
      console.error('Check setup status error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Send invitation email (admin/super-admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async sendInvitation(req, res) {
    try {
      const { email, organizationId } = req.body;
      const currentUserId = req.user?.userId;
      const currentUserRole = req.user?.role;

      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email is required' 
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid email format' 
        });
      }

      // Check if user already exists
      const existingUser = await UserModel.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'A user with this email already exists' 
        });
      }

      // Import models
      const OrganizationModel = (await import('../models/OrganizationModel.js')).default;
      const InvitationModel = (await import('../models/InvitationModel.js')).default;
      const MailController = (await import('./MailController.js')).default;

      // Determine target organization
      let targetOrgId = organizationId;
      
      if (currentUserRole === 'admin') {
        // Admins can only invite to their own organization
        const currentUser = await UserModel.getUserById(currentUserId);
        if (!currentUser || !currentUser.organization_id) {
          return res.status(400).json({ 
            success: false, 
            message: 'Admin user must belong to an organization to send invitations' 
          });
        }
        targetOrgId = currentUser.organization_id;
      } else if (currentUserRole === 'super-admin') {
        // Super-admins can specify organization or leave null for system-level invitation
        if (organizationId) {
          const org = await OrganizationModel.getOrganizationById(organizationId);
          if (!org) {
            return res.status(404).json({ 
              success: false, 
              message: 'Specified organization not found' 
            });
          }
        }
      }

      // Check for existing active invitation
      const existingInvitation = await InvitationModel.getActiveInvitationByEmail(email);
      if (existingInvitation) {
        return res.status(409).json({ 
          success: false, 
          message: 'An active invitation for this email already exists' 
        });
      }

      // Create invitation
      const invitation = await InvitationModel.createInvitation({
        email,
        organizationId: targetOrgId,
        invitedBy: currentUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Get organization name for email
      let organizationName = 'the system';
      if (targetOrgId) {
        const org = await OrganizationModel.getOrganizationById(targetOrgId);
        organizationName = org?.name || 'the organization';
      }

      // Send invitation email
      await MailController.sendInvitationMail(
        email, 
        invitation.code, 
        organizationName, 
        invitation.expires_at
      );

      res.json({
        success: true,
        message: `Invitation sent successfully to ${email}`,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          organizationName,
          expiresAt: invitation.expires_at
        }
      });
    } catch (error) {
      console.error('Send invitation error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error during invitation sending' 
      });
    }
  }

  /**
   * Validate invitation code
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async validateInvitation(req, res) {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invitation code is required' 
        });
      }

      const InvitationModel = (await import('../models/InvitationModel.js')).default;
      const invitation = await InvitationModel.validateInvitation(code);

      if (!invitation) {
        return res.status(404).json({ 
          success: false, 
          message: 'Invalid or expired invitation code' 
        });
      }

      res.json({
        success: true,
        invitation: {
          email: invitation.email,
          organizationId: invitation.organization_id,
          organizationName: invitation.organization_name
        }
      });
    } catch (error) {
      console.error('Validate invitation error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error during invitation validation' 
      });
    }
  }

  /**
   * Get all organizations (super-admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllOrganizations(req, res) {
    try {
      const OrganizationModel = (await import('../models/OrganizationModel.js')).default;
      const organizations = await OrganizationModel.getAllOrganizations();
      
      res.json({
        success: true,
        organizations
      });
    } catch (error) {
      console.error('Get all organizations error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Deactivate organization (super-admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deactivateOrganization(req, res) {
    try {
      const { orgId } = req.params;

      if (!orgId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Organization ID is required' 
        });
      }

      const OrganizationModel = (await import('../models/OrganizationModel.js')).default;
      const success = await OrganizationModel.deactivateOrganization(parseInt(orgId));
      
      if (!success) {
        return res.status(404).json({ 
          success: false, 
          message: 'Organization not found' 
        });
      }

      res.json({
        success: true,
        message: 'Organization deactivated successfully'
      });
    } catch (error) {
      console.error('Deactivate organization error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Delete organization (super-admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteOrganization(req, res) {
    try {
      const { orgId } = req.params;

      if (!orgId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Organization ID is required' 
        });
      }

      const OrganizationModel = (await import('../models/OrganizationModel.js')).default;
      const result = await OrganizationModel.deleteOrganization(parseInt(orgId));
      
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          message: result.message 
        });
      }

      res.json({
        success: true,
        message: 'Organization deleted successfully'
      });
    } catch (error) {
      console.error('Delete organization error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }


  // ============================================================================
  // ORGANIZATION MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * Get organization details (admin only - org admin can only see their org)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getOrganization(req, res) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      // Super-admin can access any organization
      if (currentUser.role !== 'super-admin') {
        // Get current user's organization
        const user = await UserModel.getUserById(currentUser.userId);
        if (!user || user.organization_id !== parseInt(id)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this organization'
          });
        }
      }

      const organization = await OrganizationModel.getOrganizationById(parseInt(id));
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      // Get organization statistics
      const stats = await OrganizationModel.getOrganizationStats(parseInt(id));

      res.json({
        success: true,
        organization: {
          ...organization,
          stats
        }
      });
    } catch (error) {
      console.error('Get organization error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Update organization details (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateOrganization(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const currentUser = req.user;

      // Super-admin can update any organization
      if (currentUser.role !== 'super-admin') {
        // Get current user's organization
        const user = await UserModel.getUserById(currentUser.userId);
        if (!user || user.organization_id !== parseInt(id)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this organization'
          });
        }
      }

      if (!name && !description) {
        return res.status(400).json({
          success: false,
          message: 'At least one field (name or description) is required'
        });
      }

      const updates = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;

      const success = await OrganizationModel.updateOrganization(parseInt(id), updates);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      res.json({
        success: true,
        message: 'Organization updated successfully'
      });
    } catch (error) {
      console.error('Update organization error:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: 'Organization name already exists'
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Get users in organization (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getOrganizationUsers(req, res) {
    try {
      const { id } = req.params;
      const { includeInactive } = req.query;
      const currentUser = req.user;

      // Super-admin can access any organization
      if (currentUser.role !== 'super-admin') {
        // Get current user's organization
        const user = await UserModel.getUserById(currentUser.userId);
        if (!user || user.organization_id !== parseInt(id)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this organization'
          });
        }
      }

      const users = await UserModel.getUsersByOrganization(
        parseInt(id), 
        includeInactive === 'true'
      );

      res.json({
        success: true,
        users
      });
    } catch (error) {
      console.error('Get organization users error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Get organization statistics (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getOrganizationStats(req, res) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      // Super-admin can access any organization
      if (currentUser.role !== 'super-admin') {
        // Get current user's organization
        const user = await UserModel.getUserById(currentUser.userId);
        if (!user || user.organization_id !== parseInt(id)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this organization'
          });
        }
      }

      const stats = await OrganizationModel.getOrganizationStats(parseInt(id));
      const inviteStats = await InvitationModel.getInvitationStats(parseInt(id));

      res.json({
        success: true,
        stats: {
          ...stats,
          invitations: inviteStats
        }
      });
    } catch (error) {
      console.error('Get organization stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  // ============================================================================
  // INVITATION MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * Create invitation (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createInvitation(req, res) {
    try {
      const { email, expirationDays = 7 } = req.body;
      const currentUser = req.user;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Get current user's organization
      const user = await UserModel.getUserById(currentUser.userId);
      if (!user || (!user.organization_id && currentUser.role !== 'super-admin')) {
        return res.status(400).json({
          success: false,
          message: 'You must belong to an organization to send invitations'
        });
      }

      const organizationId = user.organization_id;

      // Create invitation
      const invitation = await InvitationModel.createInvitation({
        organizationId,
        email,
        invitedByUserId: currentUser.userId,
        expirationDays: parseInt(expirationDays)
      });

      // Send invitation email
      try {
        const emailResult = await MailController.sendInvitationEmail(invitation);
        if (!emailResult.success) {
          console.error('Failed to send invitation email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError.message);
        // Continue with response even if email fails
      }

      res.status(201).json({
        success: true,
        message: 'Invitation created and sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          organizationName: invitation.organization_name,
          expiresAt: invitation.expires_at,
          invitedBy: invitation.invited_by_username
        }
      });
    } catch (error) {
      console.error('Create invitation error:', error);
      
      if (error.message.includes('already exists') || error.message.includes('already a member')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Get invitations for organization (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getInvitations(req, res) {
    try {
      const { includePending = 'true', includeUsed = 'false', includeExpired = 'false' } = req.query;
      const currentUser = req.user;

      // Get current user's organization
      const user = await UserModel.getUserById(currentUser.userId);
      if (!user || (!user.organization_id && currentUser.role !== 'super-admin')) {
        return res.status(400).json({
          success: false,
          message: 'You must belong to an organization to view invitations'
        });
      }

      const organizationId = user.organization_id;

      const invitations = await InvitationModel.getOrganizationInvitations(
        organizationId,
        includePending === 'true',
        includeUsed === 'true', 
        includeExpired === 'true'
      );

      res.json({
        success: true,
        invitations
      });
    } catch (error) {
      console.error('Get invitations error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Resend invitation (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async resendInvitation(req, res) {
    try {
      const { id } = req.params;
      const { expirationDays = 7 } = req.body;
      const currentUser = req.user;

      // Get current user's organization
      const user = await UserModel.getUserById(currentUser.userId);
      if (!user || (!user.organization_id && currentUser.role !== 'super-admin')) {
        return res.status(400).json({
          success: false,
          message: 'You must belong to an organization to resend invitations'
        });
      }

      const organizationId = user.organization_id;

      // Resend invitation
      const invitation = await InvitationModel.resendInvitation(
        parseInt(id), 
        organizationId, 
        parseInt(expirationDays)
      );

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found or already used'
        });
      }

      // Send invitation email
      try {
        const emailResult = await MailController.sendInvitationEmail(invitation);
        if (!emailResult.success) {
          console.error('Failed to send invitation email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError.message);
        // Continue with response even if email fails
      }

      res.json({
        success: true,
        message: 'Invitation resent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          organizationName: invitation.organization_name,
          expiresAt: invitation.expires_at,
          invitedBy: invitation.invited_by_username
        }
      });
    } catch (error) {
      console.error('Resend invitation error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Revoke invitation (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async revokeInvitation(req, res) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      // Get current user's organization
      const user = await UserModel.getUserById(currentUser.userId);
      if (!user || (!user.organization_id && currentUser.role !== 'super-admin')) {
        return res.status(400).json({
          success: false,
          message: 'You must belong to an organization to revoke invitations'
        });
      }

      const organizationId = user.organization_id;

      const success = await InvitationModel.revokeInvitation(parseInt(id), organizationId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found or already used'
        });
      }

      res.json({
        success: true,
        message: 'Invitation revoked successfully'
      });
    } catch (error) {
      console.error('Revoke invitation error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Validate invitation code (public endpoint)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async validateInvitation(req, res) {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Invitation code is required'
        });
      }

      const validation = await InvitationModel.validateInvitationCode(code);

      if (validation.valid) {
        res.json({
          success: true,
          valid: true,
          invitation: validation.invitation
        });
      } else {
        res.json({
          success: true,
          valid: false,
          reason: validation.reason
        });
      }
    } catch (error) {
      console.error('Validate invitation error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  // ============================================================================
  // UTILITY ENDPOINTS
  // ============================================================================

  /**
   * Check if organization exists (public endpoint)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async checkOrganizationExists(req, res) {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Organization name is required'
        });
      }

      const organization = await OrganizationModel.getOrganizationByName(name);

      res.json({
        success: true,
        exists: !!organization,
        organizationName: organization?.name || null
      });
    } catch (error) {
      console.error('Check organization exists error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Delete own account (self-deletion)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteSelfAccount(req, res) {
    try {
      const { password, confirmText } = req.body;
      const userId = req.user?.userId || req.session?.userId;
      const currentUser = req.user;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      // Validation
      if (!password || !confirmText) {
        return res.status(400).json({
          success: false,
          message: 'Password and confirmation text are required'
        });
      }

      if (confirmText !== 'DELETE') {
        return res.status(400).json({
          success: false,
          message: 'Confirmation text must be "DELETE"'
        });
      }

      // Verify password
      const user = await UserModel.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Authenticate with current password
      const isValidPassword = await UserModel.verifyPassword(userId, password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password'
        });
      }

      // Super-admins cannot delete themselves if they're the only super-admin
      if (currentUser.role === 'super-admin') {
        const allSuperAdmins = await UserModel.getUsersByRole('super-admin');
        if (allSuperAdmins.length === 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete the last super administrator account'
          });
        }
      }

      // Check if user is the last member of their organization
      let shouldDeleteOrganization = false;
      if (user.organization_id) {
        const orgUsers = await UserModel.getUsersByOrganization(user.organization_id, false); // active users only
        if (orgUsers.length === 1) {
          shouldDeleteOrganization = true;
        }
      }

      // Delete the user
      const success = await UserModel.deleteUser(userId);
      
      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete account'
        });
      }

      // Delete organization if user was the last member
      if (shouldDeleteOrganization) {
        try {
          await OrganizationModel.deleteOrganization(user.organization_id);
          console.log(`Organization ${user.organization_id} deleted as user was the last member`);
        } catch (orgError) {
          console.error('Error deleting organization after user deletion:', orgError);
          // Don't fail the user deletion if org deletion fails
        }
      }

      // Destroy session
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destruction error after account deletion:', err);
          }
        });
      }

      res.json({
        success: true,
        message: 'Account deleted successfully',
        organizationDeleted: shouldDeleteOrganization
      });
    } catch (error) {
      console.error('Self-deletion error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during account deletion'
      });
    }
  }

  /**
   * Test mail configuration (super-admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async testMail(req, res) {
    await MailController.testSmtpConnection(req, res);
  }
}

export default AuthController;
