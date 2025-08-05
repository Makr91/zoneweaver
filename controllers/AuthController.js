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
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     description: Create a new user account with organization support. First user becomes super-admin.
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *           examples:
   *             firstUser:
   *               summary: First user (becomes super-admin)
   *               value:
   *                 username: "admin"
   *                 email: "admin@example.com"
   *                 password: "securePassword123"
   *                 confirmPassword: "securePassword123"
   *                 organizationName: "Default Organization"
   *             withInvite:
   *               summary: User with invitation code
   *               value:
   *                 username: "john_doe"
   *                 email: "john@example.com"
   *                 password: "securePassword123"
   *                 confirmPassword: "securePassword123"
   *                 inviteCode: "inv_abc123def456"
   *             newOrg:
   *               summary: User creating new organization
   *               value:
   *                 username: "jane_admin"
   *                 email: "jane@company.com"
   *                 password: "securePassword123"
   *                 confirmPassword: "securePassword123"
   *                 organizationName: "Jane's Company"
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "User registered successfully in organization: Acme Corp"
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *       409:
   *         description: User already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Authenticate user and get JWT token
   *     description: Login with username/email and password to receive JWT authentication token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *           examples:
   *             withUsername:
   *               summary: Login with username
   *               value:
   *                 identifier: "admin"
   *                 password: "securePassword123"
   *             withEmail:
   *               summary: Login with email
   *               value:
   *                 identifier: "admin@example.com"
   *                 password: "securePassword123"
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: Missing credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "Username/email and password are required"
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Invalid credentials"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout user
   *     description: Logout user and destroy session (for session-based auth)
   *     tags: [Authentication]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Logout successful"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/auth/profile:
   *   get:
   *     summary: Get current user profile
   *     description: Retrieve the authenticated user's profile information
   *     tags: [Authentication]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Not authenticated"
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "User not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/auth/change-password:
   *   post:
   *     summary: Change user password
   *     description: Change the authenticated user's password
   *     tags: [Authentication]
   *     security:
   *       - JwtAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [currentPassword, newPassword, confirmPassword]
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 description: Current password for verification
   *                 example: "oldPassword123"
   *               newPassword:
   *                 type: string
   *                 minLength: 8
   *                 description: New password (minimum 8 characters)
   *                 example: "newSecurePassword456"
   *               confirmPassword:
   *                 type: string
   *                 description: Confirm new password (must match newPassword)
   *                 example: "newSecurePassword456"
   *     responses:
   *       200:
   *         description: Password changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Password changed successfully"
   *       400:
   *         description: Validation error or incorrect current password
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingFields:
   *                 summary: Missing required fields
   *                 value:
   *                   success: false
   *                   message: "All password fields are required"
   *               passwordMismatch:
   *                 summary: New passwords don't match
   *                 value:
   *                   success: false
   *                   message: "New passwords do not match"
   *               incorrectCurrent:
   *                 summary: Incorrect current password
   *                 value:
   *                   success: false
   *                   message: "Current password is incorrect"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/auth/verify:
   *   get:
   *     summary: Verify JWT token validity
   *     description: Verify if the provided JWT token is valid and get user info
   *     tags: [Authentication]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Token is valid
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 valid:
   *                   type: boolean
   *                   example: true
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Token is invalid or expired
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               noToken:
   *                 summary: No token provided
   *                 value:
   *                   success: false
   *                   message: "No token provided"
   *               invalidToken:
   *                 summary: Invalid token
   *                 value:
   *                   success: false
   *                   message: "Invalid token"
   *               expiredToken:
   *                 summary: Expired token
   *                 value:
   *                   success: false
   *                   message: "Token expired"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/admin/users:
   *   get:
   *     summary: Get all users (Admin only)
   *     description: Retrieve all users. Super-admin sees all users, admin sees only users in their organization.
   *     tags: [Admin - User Management]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 users:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/User'
   *                 viewScope:
   *                   type: string
   *                   enum: [all, organization]
   *                   description: Scope of users returned
   *                   example: "organization"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/admin/users/role:
   *   put:
   *     summary: Update user role (Admin only)
   *     description: Change a user's role/permission level. Admins can only modify users in their organization.
   *     tags: [Admin - User Management]
   *     security:
   *       - JwtAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [userId, newRole]
   *             properties:
   *               userId:
   *                 type: integer
   *                 description: ID of the user to update
   *                 example: 5
   *               newRole:
   *                 type: string
   *                 enum: [user, admin, super-admin]
   *                 description: New role to assign
   *                 example: "admin"
   *     responses:
   *       200:
   *         description: User role updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "User role updated successfully"
   *       400:
   *         description: Validation error or cannot change own role
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingFields:
   *                 summary: Missing required fields
   *                 value:
   *                   success: false
   *                   message: "User ID and new role are required"
   *               ownRole:
   *                 summary: Cannot change own role
   *                 value:
   *                   success: false
   *                   message: "Cannot change your own role"
   *               invalidRole:
   *                 summary: Invalid role specified
   *                 value:
   *                   success: false
   *                   message: "Invalid role specified"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "User not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/admin/users/{userId}:
   *   delete:
   *     summary: Deactivate user (Admin only)
   *     description: Deactivate a user account (soft delete). Admins can only deactivate users in their organization.
   *     tags: [Admin - User Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the user to deactivate
   *         example: 5
   *     responses:
   *       200:
   *         description: User deactivated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "User deactivated successfully"
   *       400:
   *         description: Cannot deactivate own account
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingUserId:
   *                 summary: Missing user ID
   *                 value:
   *                   success: false
   *                   message: "User ID is required"
   *               ownAccount:
   *                 summary: Cannot deactivate own account
   *                 value:
   *                   success: false
   *                   message: "Cannot deactivate your own account"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "User not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/admin/users/{userId}/reactivate:
   *   put:
   *     summary: Reactivate user (Admin only)
   *     description: Reactivate a previously deactivated user account. Admins can only reactivate users in their organization.
   *     tags: [Admin - User Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the user to reactivate
   *         example: 5
   *     responses:
   *       200:
   *         description: User reactivated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "User reactivated successfully"
   *       400:
   *         description: Missing user ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "User ID is required"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "User not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/admin/users/{userId}/delete:
   *   delete:
   *     summary: Permanently delete user (Super-admin only)
   *     description: Permanently delete a user account (hard delete). This action cannot be undone.
   *     tags: [Admin - User Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the user to permanently delete
   *         example: 5
   *     responses:
   *       200:
   *         description: User permanently deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "User permanently deleted successfully"
   *       400:
   *         description: Cannot delete own account or missing user ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingUserId:
   *                 summary: Missing user ID
   *                 value:
   *                   success: false
   *                   message: "User ID is required"
   *               ownAccount:
   *                 summary: Cannot delete own account
   *                 value:
   *                   success: false
   *                   message: "Cannot delete your own account"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Only super administrators can permanently delete users"
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "User not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/auth/setup-status:
   *   get:
   *     summary: Check if system needs initial setup
   *     description: Check if the system has been initialized with the first user (super-admin)
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Setup status retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 needsSetup:
   *                   type: boolean
   *                   description: Whether system needs initial setup (first user)
   *                   example: false
   *                 userCount:
   *                   type: integer
   *                   description: Total number of users in the system
   *                   example: 3
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/invitations/send:
   *   post:
   *     summary: Send invitation email (Admin only)
   *     description: Send an invitation email to join an organization. Admins can only invite to their own organization.
   *     tags: [Invitations]
   *     security:
   *       - JwtAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Email address to send invitation to
   *                 example: "newuser@example.com"
   *               organizationId:
   *                 type: integer
   *                 description: Organization ID (super-admin only, admins use their own org)
   *                 example: 2
   *     responses:
   *       200:
   *         description: Invitation sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Invitation sent successfully to newuser@example.com"
   *                 invitation:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 15
   *                     email:
   *                       type: string
   *                       example: "newuser@example.com"
   *                     organizationName:
   *                       type: string
   *                       example: "Acme Corporation"
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-01-11T17:18:00.324Z"
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingEmail:
   *                 summary: Missing email
   *                 value:
   *                   success: false
   *                   message: "Email is required"
   *               invalidEmail:
   *                 summary: Invalid email format
   *                 value:
   *                   success: false
   *                   message: "Invalid email format"
   *               noOrganization:
   *                 summary: Admin must belong to organization
   *                 value:
   *                   success: false
   *                   message: "Admin user must belong to an organization to send invitations"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Organization not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: User already exists or active invitation exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               userExists:
   *                 summary: User already exists
   *                 value:
   *                   success: false
   *                   message: "A user with this email already exists"
   *               inviteExists:
   *                 summary: Active invitation exists
   *                 value:
   *                   success: false
   *                   message: "An active invitation for this email already exists"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/invitations/validate/{code}:
   *   get:
   *     summary: Validate invitation code
   *     description: Check if an invitation code is valid and retrieve invitation details (public endpoint)
   *     tags: [Invitations]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Invitation code to validate
   *         example: "inv_abc123def456"
   *     responses:
   *       200:
   *         description: Invitation validation result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               oneOf:
   *                 - type: object
   *                   properties:
   *                     success:
   *                       type: boolean
   *                       example: true
   *                     invitation:
   *                       type: object
   *                       properties:
   *                         email:
   *                           type: string
   *                           example: "invited@example.com"
   *                         organizationId:
   *                           type: integer
   *                           example: 1
   *                         organizationName:
   *                           type: string
   *                           example: "Acme Corporation"
   *                 - type: object
   *                   properties:
   *                     success:
   *                       type: boolean
   *                       example: false
   *                     message:
   *                       type: string
   *                       example: "Invalid or expired invitation code"
   *       400:
   *         description: Missing invitation code
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "Invitation code is required"
   *       404:
   *         description: Invalid or expired invitation code
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Invalid or expired invitation code"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/organizations:
   *   get:
   *     summary: Get all organizations (Super-admin only)
   *     description: Retrieve list of all organizations in the system
   *     tags: [Organization Management]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Organizations retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 organizations:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Organization'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/organizations/{orgId}/deactivate:
   *   put:
   *     summary: Deactivate organization (Super-admin only)
   *     description: Deactivate an organization (soft delete). All users in the organization will be affected.
   *     tags: [Organization Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: orgId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the organization to deactivate
   *         example: 2
   *     responses:
   *       200:
   *         description: Organization deactivated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Organization deactivated successfully"
   *       400:
   *         description: Missing organization ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "Organization ID is required"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Organization not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Organization not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/organizations/{orgId}:
   *   delete:
   *     summary: Delete organization (Super-admin only)
   *     description: Permanently delete an organization (hard delete). All users in the organization will be deleted.
   *     tags: [Organization Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: orgId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the organization to delete
   *         example: 2
   *     responses:
   *       200:
   *         description: Organization deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Organization deleted successfully"
   *       400:
   *         description: Cannot delete organization with active users
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingOrgId:
   *                 summary: Missing organization ID
   *                 value:
   *                   success: false
   *                   message: "Organization ID is required"
   *               hasActiveUsers:
   *                 summary: Organization has active users
   *                 value:
   *                   success: false
   *                   message: "Cannot delete organization with active users"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Organization not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Organization not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/organizations/{id}:
   *   get:
   *     summary: Get organization details (Admin only)
   *     description: Retrieve detailed information about a specific organization
   *     tags: [Organization Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Organization ID
   *         example: 1
   *     responses:
   *       200:
   *         description: Organization details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 organization:
   *                   $ref: '#/components/schemas/Organization'
   *                 stats:
   *                   type: object
   *                   properties:
   *                     userCount:
   *                       type: integer
   *                       description: Number of users in organization
   *                       example: 15
   *                     serverCount:
   *                       type: integer
   *                       description: Number of servers assigned
   *                       example: 3
   *                     activeUsers:
   *                       type: integer
   *                       description: Number of active users
   *                       example: 12
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Organization not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/organizations/{id}:
   *   put:
   *     summary: Update organization details (Admin only)
   *     description: Update name and description of an organization. Admins can only update their own organization.
   *     tags: [Organization Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Organization ID
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: New organization name
   *                 example: "Updated Corporation"
   *               description:
   *                 type: string
   *                 description: New organization description
   *                 example: "Updated description for the organization"
   *             minProperties: 1
   *     responses:
   *       200:
   *         description: Organization updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Organization updated successfully"
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "At least one field (name or description) is required"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied to this organization
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Organization not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Organization name already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/organizations/{id}/users:
   *   get:
   *     summary: Get users in organization (Admin only)
   *     description: Retrieve all users belonging to a specific organization. Admins can only view users in their own organization.
   *     tags: [Organization Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Organization ID
   *         example: 1
   *       - in: query
   *         name: includeInactive
   *         required: false
   *         schema:
   *           type: boolean
   *         description: Include deactivated users in results
   *         example: false
   *     responses:
   *       200:
   *         description: Organization users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 users:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/User'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied to this organization
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/organizations/{id}/stats:
   *   get:
   *     summary: Get organization statistics (Admin only)
   *     description: Retrieve detailed statistics for a specific organization including user counts and invitations
   *     tags: [Organization Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Organization ID
   *         example: 1
   *     responses:
   *       200:
   *         description: Organization statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 stats:
   *                   type: object
   *                   properties:
   *                     userCount:
   *                       type: integer
   *                       description: Total number of users in organization
   *                       example: 15
   *                     activeUsers:
   *                       type: integer
   *                       description: Number of active users
   *                       example: 12
   *                     adminCount:
   *                       type: integer
   *                       description: Number of admin users
   *                       example: 2
   *                     invitations:
   *                       type: object
   *                       properties:
   *                         pending:
   *                           type: integer
   *                           description: Number of pending invitations
   *                           example: 3
   *                         used:
   *                           type: integer
   *                           description: Number of used invitations
   *                           example: 8
   *                         expired:
   *                           type: integer
   *                           description: Number of expired invitations
   *                           example: 1
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied to this organization
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/invitations:
   *   post:
   *     summary: Create invitation (Admin only)
   *     description: Create and send an invitation to join the current user's organization
   *     tags: [Invitation Management]
   *     security:
   *       - JwtAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Email address to send invitation to
   *                 example: "newuser@example.com"
   *               expirationDays:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 30
   *                 description: Number of days until invitation expires
   *                 example: 7
   *                 default: 7
   *     responses:
   *       201:
   *         description: Invitation created and sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Invitation created and sent successfully"
   *                 invitation:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 15
   *                     email:
   *                       type: string
   *                       example: "newuser@example.com"
   *                     organizationName:
   *                       type: string
   *                       example: "Acme Corporation"
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-01-11T17:18:00.324Z"
   *                     invitedBy:
   *                       type: string
   *                       example: "admin"
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingEmail:
   *                 summary: Missing email
   *                 value:
   *                   success: false
   *                   message: "Email address is required"
   *               invalidEmail:
   *                 summary: Invalid email format
   *                 value:
   *                   success: false
   *                   message: "Invalid email format"
   *               noOrganization:
   *                 summary: Must belong to organization
   *                 value:
   *                   success: false
   *                   message: "You must belong to an organization to send invitations"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: User already exists or is already a member
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/invitations:
   *   get:
   *     summary: Get invitations for organization (Admin only)
   *     description: Retrieve all invitations for the current user's organization with filtering options
   *     tags: [Invitation Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: query
   *         name: includePending
   *         required: false
   *         schema:
   *           type: boolean
   *           default: true
   *         description: Include pending invitations
   *         example: true
   *       - in: query
   *         name: includeUsed
   *         required: false
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include used invitations
   *         example: false
   *       - in: query
   *         name: includeExpired
   *         required: false
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include expired invitations
   *         example: false
   *     responses:
   *       200:
   *         description: Invitations retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 invitations:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Invitation'
   *       400:
   *         description: Must belong to organization
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "You must belong to an organization to view invitations"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/invitations/{id}/resend:
   *   post:
   *     summary: Resend invitation (Admin only)
   *     description: Resend an existing invitation with a new expiration date
   *     tags: [Invitation Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Invitation ID to resend
   *         example: 15
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               expirationDays:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 30
   *                 description: Number of days until invitation expires
   *                 example: 7
   *                 default: 7
   *     responses:
   *       200:
   *         description: Invitation resent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Invitation resent successfully"
   *                 invitation:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 15
   *                     email:
   *                       type: string
   *                       example: "newuser@example.com"
   *                     organizationName:
   *                       type: string
   *                       example: "Acme Corporation"
   *                     expiresAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-01-11T17:18:00.324Z"
   *                     invitedBy:
   *                       type: string
   *                       example: "admin"
   *       400:
   *         description: Must belong to organization
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "You must belong to an organization to resend invitations"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Invitation not found or already used
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Invitation not found or already used"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/invitations/{id}:
   *   delete:
   *     summary: Revoke invitation (Admin only)
   *     description: Revoke an existing invitation, preventing it from being used
   *     tags: [Invitation Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Invitation ID to revoke
   *         example: 15
   *     responses:
   *       200:
   *         description: Invitation revoked successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Invitation revoked successfully"
   *       400:
   *         description: Must belong to organization
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "You must belong to an organization to revoke invitations"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Invitation not found or already used
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Invitation not found or already used"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/organizations/check/{name}:
   *   get:
   *     summary: Check if organization exists (Public)
   *     description: Check if an organization with the given name already exists (public endpoint for registration)
   *     tags: [Organization Management]
   *     parameters:
   *       - in: path
   *         name: name
   *         required: true
   *         schema:
   *           type: string
   *         description: Organization name to check
   *         example: "Acme Corporation"
   *     responses:
   *       200:
   *         description: Organization existence check completed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 exists:
   *                   type: boolean
   *                   description: Whether organization exists
   *                   example: true
   *                 organizationName:
   *                   type: string
   *                   nullable: true
   *                   description: Organization name if exists, null otherwise
   *                   example: "Acme Corporation"
   *       400:
   *         description: Missing organization name
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "Organization name is required"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/auth/delete-account:
   *   delete:
   *     summary: Delete own account (self-deletion)
   *     description: Permanently delete the authenticated user's account with password confirmation
   *     tags: [Authentication]
   *     security:
   *       - JwtAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [password, confirmText]
   *             properties:
   *               password:
   *                 type: string
   *                 description: Current password for verification
   *                 example: "currentPassword123"
   *               confirmText:
   *                 type: string
   *                 description: Must be exactly "DELETE" to confirm deletion
   *                 example: "DELETE"
   *     responses:
   *       200:
   *         description: Account deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Account deleted successfully"
   *                 organizationDeleted:
   *                   type: boolean
   *                   description: Whether user's organization was also deleted (if they were the last member)
   *                   example: false
   *       400:
   *         description: Validation error or cannot delete last super-admin
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingFields:
   *                 summary: Missing required fields
   *                 value:
   *                   success: false
   *                   message: "Password and confirmation text are required"
   *               wrongConfirm:
   *                 summary: Wrong confirmation text
   *                 value:
   *                   success: false
   *                   message: "Confirmation text must be \"DELETE\""
   *               lastSuperAdmin:
   *                 summary: Cannot delete last super-admin
   *                 value:
   *                   success: false
   *                   message: "Cannot delete the last super administrator account"
   *               invalidPassword:
   *                 summary: Invalid password
   *                 value:
   *                   success: false
   *                   message: "Invalid password"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   * @swagger
   * /api/mail/test:
   *   post:
   *     summary: Test SMTP mail configuration (Super-admin only)
   *     description: Test the SMTP configuration by attempting to connect to the mail server
   *     tags: [Mail Testing]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: SMTP connection test completed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Whether SMTP connection was successful
   *                   example: true
   *                 message:
   *                   type: string
   *                   description: Result message
   *                   example: "SMTP connection successful"
   *                 details:
   *                   type: object
   *                   description: Connection details (if successful)
   *                   properties:
   *                     host:
   *                       type: string
   *                       example: "smtp.gmail.com"
   *                     port:
   *                       type: integer
   *                       example: 587
   *                     secure:
   *                       type: boolean
   *                       example: false
   *       400:
   *         description: SMTP connection failed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "SMTP connection failed"
   *                 error:
   *                   type: string
   *                   description: Detailed error message
   *                   example: "Authentication failed"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async testMail(req, res) {
    await MailController.testSmtpConnection(req, res);
  }
}

export default AuthController;
