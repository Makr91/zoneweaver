import { sendInvitation } from './invitations/send.js';
import { validateInvitation } from './invitations/validate.js';
import { createInvitation } from './invitations/create.js';
import { getInvitations } from './invitations/get.js';
import { resendInvitation } from './invitations/resend.js';
import { revokeInvitation } from './invitations/revoke.js';

const InvitationController = {
  sendInvitation,
  validateInvitation,
  createInvitation,
  getInvitations,
  resendInvitation,
  revokeInvitation,
};

export default InvitationController;
