import crypto from 'crypto';

export default (sequelize, Sequelize) => {
  const Invitation = sequelize.define(
    'invitations',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'organization_id',
        references: {
          model: 'organizations',
          key: 'id',
        },
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      invite_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        field: 'invite_code',
      },
      invited_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'invited_by_user_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'expires_at',
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'used_at',
      },
    },
    {
      // Table options
      tableName: 'invitations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // Indexes
      indexes: [
        {
          unique: true,
          fields: ['invite_code'],
        },
        {
          fields: ['organization_id'],
        },
        {
          fields: ['email'],
        },
        {
          fields: ['expires_at'],
        },
        {
          fields: ['used_at'],
        },
        {
          // Compound index for checking pending invitations
          fields: ['organization_id', 'email', 'used_at', 'expires_at'],
        },
      ],

      // Default scope excludes used and expired invitations
      defaultScope: {
        where: {
          used_at: null,
          expires_at: {
            [Sequelize.Op.gt]: new Date(),
          },
        },
      },

      // Named scopes
      scopes: {
        // All invitations regardless of status
        all: {
          where: {},
        },
        // Only pending invitations
        pending: {
          where: {
            used_at: null,
            expires_at: {
              [Sequelize.Op.gt]: new Date(),
            },
          },
        },
        // Only used invitations
        used: {
          where: {
            used_at: {
              [Sequelize.Op.ne]: null,
            },
          },
        },
        // Only expired invitations
        expired: {
          where: {
            used_at: null,
            expires_at: {
              [Sequelize.Op.lte]: new Date(),
            },
          },
        },
        // Include organization and inviter data
        withDetails: {
          include: [
            {
              model: sequelize.models.organization,
              as: 'organization',
              attributes: ['id', 'name', 'description'],
            },
            {
              model: sequelize.models.user,
              as: 'invitedBy',
              attributes: ['id', 'username', 'email'],
            },
          ],
        },
      },
    }
  );

  // Virtual field for status
  Invitation.prototype.getStatus = function () {
    if (this.used_at) {
      return 'used';
    }
    if (new Date() > this.expires_at) {
      return 'expired';
    }
    return 'pending';
  };

  // Associations
  Invitation.associate = function (models) {
    // Invitation belongs to Organization
    Invitation.belongsTo(models.organization, {
      foreignKey: 'organization_id',
      as: 'organization',
      onDelete: 'CASCADE',
    });

    // Invitation belongs to User (who sent it)
    Invitation.belongsTo(models.user, {
      foreignKey: 'invited_by_user_id',
      as: 'invitedBy',
      onDelete: 'SET NULL',
    });
  };

  // Class methods for common queries
  Invitation.createInvitation = async function ({
    organizationId,
    email,
    invitedByUserId,
    expirationDays = 7,
  }) {
    const transaction = await sequelize.transaction();

    try {
      // Check if user already exists with this email
      const existingUser = await sequelize.models.user.scope('active').findOne({
        where: { email },
      });

      if (existingUser) {
        if (existingUser.organization_id === organizationId) {
          throw new Error('User with this email is already a member of this organization');
        } else {
          throw new Error('User with this email already exists in another organization');
        }
      }

      // Check for existing pending invitation
      const existingInvitation = await this.scope('pending').findOne({
        where: {
          organization_id: organizationId,
          email,
        },
      });

      if (existingInvitation) {
        throw new Error('A pending invitation already exists for this email address');
      }

      // Generate unique invite code
      const inviteCode = crypto.randomBytes(32).toString('hex');

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      // Create invitation
      const invitation = await this.create(
        {
          organization_id: organizationId,
          email,
          invite_code: inviteCode,
          invited_by_user_id: invitedByUserId,
          expires_at: expiresAt,
        },
        { transaction }
      );

      await transaction.commit();

      // Return invitation with details
      return await this.scope('withDetails').findByPk(invitation.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  Invitation.findByCode = function (inviteCode) {
    return this.scope(['all', 'withDetails']).findOne({
      where: { invite_code: inviteCode },
    });
  };

  Invitation.validateCode = async function (inviteCode) {
    const invitation = await this.findByCode(inviteCode);

    if (!invitation) {
      return {
        valid: false,
        reason: 'Invalid invitation code',
      };
    }

    if (invitation.used_at) {
      return {
        valid: false,
        reason: 'Invitation has already been used',
      };
    }

    if (new Date() > invitation.expires_at) {
      return {
        valid: false,
        reason: 'Invitation has expired',
      };
    }

    return {
      valid: true,
      invitation: {
        id: invitation.id,
        organizationId: invitation.organization_id,
        organizationName: invitation.organization?.name,
        organizationDescription: invitation.organization?.description,
        email: invitation.email,
        expiresAt: invitation.expires_at,
      },
    };
  };

  Invitation.findByOrganization = function (
    organizationId,
    { includePending = true, includeUsed = false, includeExpired = false } = {}
  ) {
    const scopes = ['withDetails'];
    const whereConditions = { organization_id: organizationId };

    // Build status filters
    const statusFilters = [];

    if (includePending) {
      statusFilters.push({
        used_at: null,
        expires_at: { [Sequelize.Op.gt]: new Date() },
      });
    }

    if (includeUsed) {
      statusFilters.push({
        used_at: { [Sequelize.Op.ne]: null },
      });
    }

    if (includeExpired) {
      statusFilters.push({
        used_at: null,
        expires_at: { [Sequelize.Op.lte]: new Date() },
      });
    }

    if (statusFilters.length > 0) {
      whereConditions[Sequelize.Op.or] = statusFilters;
    }

    return this.scope(scopes).findAll({
      where: whereConditions,
      order: [['created_at', 'DESC']],
    });
  };

  Invitation.getStats = async function (organizationId) {
    const result = await this.scope('all').findOne({
      where: { organization_id: organizationId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_invitations'],
        [
          sequelize.fn('COUNT', sequelize.literal('CASE WHEN used_at IS NOT NULL THEN 1 END')),
          'used_invitations',
        ],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal('CASE WHEN used_at IS NULL AND expires_at > NOW() THEN 1 END')
          ),
          'pending_invitations',
        ],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal('CASE WHEN used_at IS NULL AND expires_at <= NOW() THEN 1 END')
          ),
          'expired_invitations',
        ],
      ],
      raw: true,
    });

    return (
      result || {
        total_invitations: 0,
        used_invitations: 0,
        pending_invitations: 0,
        expired_invitations: 0,
      }
    );
  };

  Invitation.cleanupExpired = async function (olderThanDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.destroy({
      where: {
        expires_at: { [Sequelize.Op.lt]: cutoffDate },
        used_at: null,
      },
    });

    if (result > 0) {
      console.log(`Cleaned up ${result} expired invitations`);
    }

    return result;
  };

  // Instance methods
  Invitation.prototype.markAsUsed = function () {
    return this.update({ used_at: new Date() });
  };

  Invitation.prototype.revoke = function () {
    return this.update({ expires_at: new Date() });
  };

  Invitation.prototype.resend = function (expirationDays = 7) {
    const newInviteCode = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    return this.update({
      invite_code: newInviteCode,
      expires_at: expiresAt,
    });
  };

  Invitation.prototype.isValid = function () {
    return !this.used_at && new Date() <= this.expires_at;
  };

  Invitation.prototype.isExpired = function () {
    return !this.used_at && new Date() > this.expires_at;
  };

  Invitation.prototype.isUsed = function () {
    return !!this.used_at;
  };

  return Invitation;
};
