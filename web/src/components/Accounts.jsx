import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Helmet } from '@dr.pogodin/react-helmet';
import axios from 'axios';

/**
 * Accounts component for admin user management
 * @returns {JSX.Element} Accounts component
 */
const Accounts = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [viewScope, setViewScope] = useState('organization'); // 'all' for super-admin, 'organization' for admin
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Tab and organizations state
  const [activeTab, setActiveTab] = useState('users');
  const [organizations, setOrganizations] = useState([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgMsg, setOrgMsg] = useState('');
  const [deleteModalOrg, setDeleteModalOrg] = useState(null);
  const [deleteOrgConfirmText, setDeleteOrgConfirmText] = useState('');
  
  // Invitation state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteOrganizationId, setInviteOrganizationId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');

  // Confirmation modals state
  const [confirmModalUser, setConfirmModalUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(''); // 'deactivate' or 'reactivate'
  const [confirmModalOrg, setConfirmModalOrg] = useState(null);

  // Auto-dismiss notifications
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => {
        setMsg('');
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [msg]);

  useEffect(() => {
    if (orgMsg) {
      const timer = setTimeout(() => {
        setOrgMsg('');
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [orgMsg]);

  useEffect(() => {
    if (inviteMsg) {
      const timer = setTimeout(() => {
        setInviteMsg('');
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [inviteMsg]);

  /**
   * Load data on component mount and tab change
   */
  useEffect(() => {
    if (activeTab === 'users') {
      loadAllUsers();
    } else if (activeTab === 'organizations' && user?.role === 'super-admin') {
      loadOrganizations();
    }
  }, [activeTab]);

  /**
   * Load all organizations from the API
   */
  const loadOrganizations = async () => {
    try {
      setOrgLoading(true);
      const response = await axios.get('/api/organizations');
      if (response.data.success) {
        setOrganizations(response.data.organizations);
      } else {
        setOrgMsg('Failed to load organizations');
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      setOrgMsg('Error loading organizations: ' + (error.response?.data?.message || error.message));
    } finally {
      setOrgLoading(false);
    }
  };

  /**
   * Load all users from the API
   */
  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users');
      if (response.data.success) {
        setAllUsers(response.data.users);
        setViewScope(response.data.viewScope || 'organization');
      } else {
        setMsg('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setMsg('Error loading users: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle role change for a user
   * @param {number} userId - User ID to update
   * @param {string} newRole - New role to assign
   */
  const handleRoleChange = async (userId, newRole) => {
    try {
      setLoading(true);
      setMsg('');
      
      const response = await axios.put('/api/admin/users/role', {
        userId,
        newRole
      });
      
      if (response.data.success) {
        setMsg(`User role updated to ${newRole} successfully!`);
        setEditingUser(null);
        setNewRole('');
        await loadAllUsers(); // Reload users
      } else {
        setMsg(response.data.message);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      setMsg('Error updating role: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle user deactivation
   * @param {number} userId - User ID to deactivate
   */
  const handleDeactivateUser = (userId) => {
    console.log('Deactivate button clicked for user:', userId);
    const user = allUsers.find(u => u.id === userId);
    setConfirmModalUser(user);
    setConfirmAction('deactivate');
  };

  /**
   * Handle user reactivation
   * @param {number} userId - User ID to reactivate
   */
  const handleReactivateUser = (userId) => {
    console.log('Reactivate button clicked for user:', userId);
    const user = allUsers.find(u => u.id === userId);
    setConfirmModalUser(user);
    setConfirmAction('reactivate');
  };

  /**
   * Confirm and execute user action
   */
  const confirmUserAction = async () => {
    if (!confirmModalUser || !confirmAction) return;

    try {
      setLoading(true);
      setMsg('');
      
      let response;
      if (confirmAction === 'deactivate') {
        console.log('Sending deactivation request...');
        response = await axios.delete(`/api/admin/users/${confirmModalUser.id}`);
      } else if (confirmAction === 'reactivate') {
        console.log('Sending reactivation request...');
        response = await axios.put(`/api/admin/users/${confirmModalUser.id}/reactivate`);
      }
      
      console.log('Action response:', response.data);
      
      if (response.data.success) {
        setMsg(`User ${confirmAction}d successfully!`);
        setConfirmModalUser(null);
        setConfirmAction('');
        await loadAllUsers(); // Reload users
      } else {
        setMsg(response.data.message);
      }
    } catch (error) {
      console.error(`Error ${confirmAction}ing user:`, error);
      setMsg(`Error ${confirmAction}ing user: ` + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Close confirmation modal
   */
  const closeConfirmModal = () => {
    setConfirmModalUser(null);
    setConfirmAction('');
  };

  /**
   * Handle permanent user deletion (super-admin only)
   */
  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;

    try {
      setLoading(true);
      setMsg('');
      
      const response = await axios.delete(`/api/admin/users/${deleteModalUser.id}/delete`);
      
      if (response.data.success) {
        setMsg('User permanently deleted successfully!');
        setDeleteModalUser(null);
        setDeleteConfirmText('');
        await loadAllUsers(); // Reload users
      } else {
        setMsg(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setMsg('Error deleting user: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle organization deactivation
   * @param {number} orgId - Organization ID to deactivate
   */
  const handleDeactivateOrg = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    setConfirmModalOrg(org);
  };

  /**
   * Pre-calculate organization permissions to prevent excessive re-renders
   * Uses useMemo to cache the results until organizations or user changes
   */
  const orgPermissions = useMemo(() => {
    const permissions = {};
    
    organizations.forEach(org => {
      // Super admin can modify any organization except their own
      if (user.role === 'super-admin') {
        // Use organizationId from user object (fixed backend response)
        const userOrgId = user.organizationId || user.organization_id;
        
        // Convert both to numbers for comparison to avoid type mismatch
        const normalizedUserOrgId = userOrgId ? parseInt(userOrgId) : null;
        const normalizedOrgId = parseInt(org.id);
        
        // If user has an organization, prevent them from modifying it
        if (normalizedUserOrgId && normalizedUserOrgId === normalizedOrgId) {
          permissions[org.id] = false;
        }
        // Special case: If super admin has no organization (undefined), 
        // prevent them from modifying the "Default Organization" (typically org ID 1)
        else if (!normalizedUserOrgId && org.name === 'Default Organization') {
          permissions[org.id] = false;
        }
        else {
          permissions[org.id] = true;
        }
      } else {
        permissions[org.id] = false;
      }
    });
    
    return permissions;
  }, [organizations, user]);

  /**
   * Check if current user can modify organization (optimized)
   * @param {object} org - Organization to check
   * @returns {boolean} Whether current user can modify organization
   */
  const canModifyOrg = (org) => {
    return orgPermissions[org.id] || false;
  };

  /**
   * Confirm and execute organization deactivation
   */
  const confirmOrgAction = async () => {
    if (!confirmModalOrg) return;

    try {
      setOrgLoading(true);
      setOrgMsg('');
      
      const response = await axios.put(`/api/organizations/${confirmModalOrg.id}/deactivate`);
      
      if (response.data.success) {
        setOrgMsg('Organization deactivated successfully!');
        setConfirmModalOrg(null);
        await loadOrganizations(); // Reload organizations
      } else {
        setOrgMsg(response.data.message);
      }
    } catch (error) {
      console.error('Error deactivating organization:', error);
      setOrgMsg('Error deactivating organization: ' + (error.response?.data?.message || error.message));
    } finally {
      setOrgLoading(false);
    }
  };

  /**
   * Close organization confirmation modal
   */
  const closeConfirmOrgModal = () => {
    setConfirmModalOrg(null);
  };

  /**
   * Handle permanent organization deletion (super-admin only)
   */
  const handleDeleteOrg = async () => {
    if (!deleteModalOrg) return;

    try {
      setOrgLoading(true);
      setOrgMsg('');
      
      const response = await axios.delete(`/api/organizations/${deleteModalOrg.id}`);
      
      if (response.data.success) {
        setOrgMsg('Organization permanently deleted successfully!');
        setDeleteModalOrg(null);
        setDeleteOrgConfirmText('');
        await loadOrganizations(); // Reload organizations
      } else {
        setOrgMsg(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      setOrgMsg('Error deleting organization: ' + (error.response?.data?.message || error.message));
    } finally {
      setOrgLoading(false);
    }
  };

  /**
   * Close delete modal and reset state
   */
  const closeDeleteModal = () => {
    setDeleteModalUser(null);
    setDeleteConfirmText('');
  };

  /**
   * Close organization delete modal and reset state
   */
  const closeDeleteOrgModal = () => {
    setDeleteModalOrg(null);
    setDeleteOrgConfirmText('');
  };

  /**
   * Handle sending user invitation
   */
  const handleSendInvitation = async () => {
    if (!inviteEmail) return;

    try {
      setInviteLoading(true);
      setInviteMsg('');
      
      const payload = { email: inviteEmail };
      
      // Add organization ID for super-admins if selected
      if (user?.role === 'super-admin' && inviteOrganizationId) {
        payload.organizationId = parseInt(inviteOrganizationId);
      }
      
      const response = await axios.post('/api/invitations/send', payload);
      
      if (response.data.success) {
        setInviteMsg(`Invitation sent successfully to ${inviteEmail}! The invite will expire in 7 days.`);
        setInviteEmail('');
        setInviteOrganizationId('');
        setShowInviteModal(false);
      } else {
        setInviteMsg(response.data.message);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setInviteMsg('Error sending invitation: ' + (error.response?.data?.message || error.message));
    } finally {
      setInviteLoading(false);
    }
  };

  /**
   * Close invitation modal and reset state
   */
  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteOrganizationId('');
    setInviteMsg('');
  };

  /**
   * Get role badge color
   * @param {string} role - User role
   * @returns {string} CSS class for role badge
   */
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'super-admin':
        return 'is-danger';
      case 'admin':
        return 'is-warning';
      case 'user':
        return 'is-success';
      default:
        return 'is-info';
    }
  };

  /**
   * Check if current user can modify target user
   * @param {object} targetUser - User to check permissions for
   * @returns {boolean} Whether current user can modify target user
   */
  const canModifyUser = (targetUser) => {
    // Can't modify yourself
    if (targetUser.id === user.id) return false;
    
    // Super-admin can modify anyone except other super-admins
    if (user.role === 'super-admin') {
      return targetUser.role !== 'super-admin';
    }
    
    // Admin can only modify regular users in their organization
    if (user.role === 'admin') {
      return targetUser.role === 'user';
    }
    
    return false;
  };

  return (
    <div className='zw-page-content-scrollable'>
      <Helmet>
        <meta charSet='utf-8' />
        <title>User Management - Zoneweaver</title>
        <link rel='canonical' href={window.location.origin} />
      </Helmet>
      <div className='container is-fluid p-0'>
        <div className='box p-0 is-radiusless'>
          <div className='titlebar box active level is-mobile mb-0 p-3'>
            <div className='level-left'>
              <strong>
                {user?.role === 'super-admin' ? 'Account Management' : 'User Management'}
              </strong>
              {user?.role === 'super-admin' && (
                <div className='tabs ml-4'>
                  <ul>
                    <li className={activeTab === 'users' ? 'is-active' : ''}>
                      <a onClick={() => setActiveTab('users')}>
                        <span className="icon is-small"><i className="fas fa-users"></i></span>
                        <span>Users</span>
                      </a>
                    </li>
                    <li className={activeTab === 'organizations' ? 'is-active' : ''}>
                      <a onClick={() => setActiveTab('organizations')}>
                        <span className="icon is-small"><i className="fas fa-building"></i></span>
                        <span>Organizations</span>
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className='level-right'>
              {activeTab === 'users' && (
                <span className='tag is-info'>
                  {allUsers.length} {viewScope === 'all' ? 'Total' : 'Organization'} Users
                </span>
              )}
              {activeTab === 'organizations' && user?.role === 'super-admin' && (
                <span className='tag is-info'>
                  {organizations.length} Organizations
                </span>
              )}
            </div>
          </div>

          <div className='p-4'>
            {msg && (
              <div className={`notification ${
                msg.includes('successfully') ? 'is-success' : 
                msg.includes('Error') || msg.includes('Failed') ? 'is-danger' : 
                'is-warning'
              }`}>
                <p>{msg}</p>
              </div>
            )}

            {/* Current User Info */}
            {activeTab === 'users' && (
              <div className='box mb-4'>
                <h2 className='title is-5'>Your Account</h2>
                <div className='content'>
                  <p>
                    <strong>Username:</strong> {user?.username} 
                    <span className={`tag ml-2 ${getRoleBadgeClass(user?.role)}`}>
                      {user?.role}
                    </span>
                  </p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p className='is-size-7 has-text-grey'>
                    You can manage your profile and change your password in the Profile section.
                  </p>
                </div>
              </div>
            )}

            {/* Organizations Tab Content */}
            {activeTab === 'organizations' && user?.role === 'super-admin' && (
              <div className='box mb-4'>
                <h2 className='title is-5'>Organizations Overview</h2>
                {orgMsg && (
                  <div className={`notification ${
                    orgMsg.includes('successfully') ? 'is-success' : 
                    orgMsg.includes('Error') || orgMsg.includes('Failed') ? 'is-danger' : 
                    'is-warning'
                  } mb-4`}>
                    <p>{orgMsg}</p>
                  </div>
                )}
                
                {orgLoading ? (
                  <div className='has-text-centered p-4'>
                    <div className='button is-loading is-large is-ghost'></div>
                    <p className='mt-2'>Loading organizations...</p>
                  </div>
                ) : (
                  <div className='table-container'>
                    <table className='table is-fullwidth is-hoverable'>
                      <thead>
                        <tr>
                          <th>Organization Name</th>
                          <th>Description</th>
                          <th>Total Users</th>
                          <th>Active Users</th>
                          <th>Admins</th>
                          <th>Created</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {organizations.map((org) => (
                          <tr key={org.id}>
                            <td>
                              <strong>{org.name}</strong>
                            </td>
                            <td>
                              {org.description || (
                                <span className='has-text-grey is-italic'>No description</span>
                              )}
                            </td>
                            <td>
                              <span className='tag is-info'>{org.total_users || 0}</span>
                            </td>
                            <td>
                              <span className='tag is-success'>{org.active_users || 0}</span>
                            </td>
                            <td>
                              <span className='tag is-warning'>{org.admin_users || 0}</span>
                            </td>
                            <td>
                              {new Date(org.created_at).toLocaleDateString()}
                            </td>
                            <td>
                              <span className={`tag ${org.is_active ? 'is-success' : 'is-danger'}`}>
                                {org.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div className='buttons are-small'>
                                {canModifyOrg(org) ? (
                                  <>
                                    {org.is_active && (
                                      <button 
                                        className='button is-small is-warning'
                                        onClick={() => handleDeactivateOrg(org.id)}
                                        disabled={orgLoading}
                                        title="Deactivate organization"
                                      >
                                        Deactivate
                                      </button>
                                    )}
                                    <button 
                                      className='button is-small is-danger is-outlined'
                                      onClick={() => setDeleteModalOrg(org)}
                                      disabled={orgLoading}
                                      title="Permanently delete organization (and all users)"
                                    >
                                      Delete
                                    </button>
                                  </>
                                ) : (
                                  <span className='has-text-grey is-size-7'>
                                    {user.organization_id === org.id ? 'Cannot modify own organization' : 'No permission'}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {organizations.length === 0 && (
                          <tr>
                            <td colSpan="7" className='has-text-centered has-text-grey is-italic p-4'>
                              No organizations found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Invite User Section */}
            {activeTab === 'users' && (user?.role === 'admin' || user?.role === 'super-admin') && (
              <div className='box mb-4'>
                <div className='level'>
                  <div className='level-left'>
                    <div>
                      <h2 className='title is-6 mb-2'>Invite New User</h2>
                      <p className='subtitle is-7 has-text-grey'>
                        Send an email invitation to join {user?.role === 'super-admin' && viewScope === 'all' ? 'the system' : 'your organization'}
                      </p>
                    </div>
                  </div>
                  <div className='level-right'>
                    <button 
                      className='button is-primary'
                      onClick={() => {
                        setShowInviteModal(true);
                        if (user?.role === 'super-admin' && organizations.length === 0) {
                          loadOrganizations();
                        }
                      }}
                      disabled={loading || inviteLoading}
                    >
                      <span className="icon is-small">
                        <i className="fas fa-envelope"></i>
                      </span>
                      <span>Invite User</span>
                    </button>
                  </div>
                </div>
                
                {inviteMsg && (
                  <div className={`notification ${
                    inviteMsg.includes('successfully') ? 'is-success' : 
                    inviteMsg.includes('Error') || inviteMsg.includes('Failed') ? 'is-danger' : 
                    'is-warning'
                  } mt-3`}>
                    <p>{inviteMsg}</p>
                  </div>
                )}
              </div>
            )}

            {/* Users Table */}
            {activeTab === 'users' && (
              <div className='box'>
                <div className='level mb-3'>
                  <div className='level-left'>
                    <h2 className='title is-5'>
                      {viewScope === 'all' ? 'All Users (System-wide)' : 'Organization Users'}
                    </h2>
                  </div>
                  <div className='level-right'>
                    {viewScope === 'all' && (
                      <span className='tag is-warning'>Super Admin View</span>
                    )}
                    {viewScope === 'organization' && (
                      <span className='tag is-info'>Organization View</span>
                    )}
                  </div>
                </div>
                
                {loading ? (
                  <div className='has-text-centered p-4'>
                    <div className='button is-loading is-large is-ghost'></div>
                    <p className='mt-2'>Loading users...</p>
                  </div>
                ) : (
                  <div className='table-container'>
                    <table className='table is-fullwidth is-hoverable'>
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Organization</th>
                          <th>Role</th>
                          <th>Created</th>
                          <th>Last Login</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map((targetUser) => (
                          <tr key={targetUser.id}>
                            <td>
                              <strong>
                                {targetUser.id === user.id ? user.username : targetUser.username}
                              </strong>
                              {targetUser.id === user.id && (
                                <span className='tag is-small is-info ml-2'>You</span>
                              )}
                            </td>
                            <td>{targetUser.email}</td>
                            <td>
                              {targetUser.organization_name ? (
                                targetUser.organization_name
                              ) : (
                                <span className='has-text-grey is-italic'>
                                  {targetUser.role === 'super-admin' ? 'System Admin' : 'No Organization'}
                                </span>
                              )}
                            </td>
                            <td>
                              {editingUser === targetUser.id ? (
                                <div className='field has-addons'>
                                  <div className='control'>
                                    <div className='select is-small'>
                                      <select 
                                        value={newRole} 
                                        onChange={(e) => setNewRole(e.target.value)}
                                      >
                                        <option value=''>Select Role</option>
                                        <option value='user'>User</option>
                                        <option value='admin'>Admin</option>
                                        {user.role === 'super-admin' && (
                                          <option value='super-admin'>Super Admin</option>
                                        )}
                                      </select>
                                    </div>
                                  </div>
                                  <div className='control'>
                                    <button 
                                      className='button is-small is-success'
                                      onClick={() => handleRoleChange(targetUser.id, newRole)}
                                      disabled={!newRole || loading}
                                    >
                                      Save
                                    </button>
                                  </div>
                                  <div className='control'>
                                    <button 
                                      className='button is-small'
                                      onClick={() => {
                                        setEditingUser(null);
                                        setNewRole('');
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className={`tag ${getRoleBadgeClass(targetUser.role)}`}>
                                  {targetUser.role}
                                </span>
                              )}
                            </td>
                            <td>
                              {new Date(targetUser.created_at).toLocaleDateString()}
                            </td>
                            <td>
                              {targetUser.last_login 
                                ? new Date(targetUser.last_login).toLocaleDateString()
                                : 'Never'
                              }
                            </td>
                            <td>
                              <span className={`tag ${targetUser.is_active ? 'is-success' : 'is-danger'}`}>
                                {targetUser.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              {canModifyUser(targetUser) ? (
                                <div className='buttons are-small'>
                                  {editingUser !== targetUser.id && (
                                    <>
                                      <button 
                                        className='button is-small is-warning'
                                        onClick={() => {
                                          setEditingUser(targetUser.id);
                                          setNewRole(targetUser.role);
                                        }}
                                        disabled={loading}
                                      >
                                        Edit Role
                                      </button>
                                      {targetUser.is_active ? (
                                        <button 
                                          className='button is-small is-danger'
                                          onClick={() => handleDeactivateUser(targetUser.id)}
                                          disabled={loading}
                                        >
                                          Deactivate
                                        </button>
                                      ) : (
                                        <button 
                                          className='button is-small is-success'
                                          onClick={() => handleReactivateUser(targetUser.id)}
                                          disabled={loading}
                                        >
                                          Reactivate
                                        </button>
                                      )}
                                      {user.role === 'super-admin' && (
                                        <button 
                                          className='button is-small is-danger is-outlined'
                                          onClick={() => setDeleteModalUser(targetUser)}
                                          disabled={loading}
                                          title="Permanent deletion (Super Admin only)"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              ) : (
                                <span className='has-text-grey is-size-7'>
                                  {targetUser.id === user.id ? 'Cannot modify self' : 'No permission'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Help Section */}
            <div className='box'>
              <h2 className='title is-6'>User Management Guide</h2>
              <div className='content is-size-7'>
                <div className='columns'>
                  <div className='column'>
                    <p><strong>Roles:</strong></p>
                    <ul>
                      <li><strong>User:</strong> Basic access to zones and hosts</li>
                      <li><strong>Admin:</strong> Can manage users and organization settings</li>
                      <li><strong>Super Admin:</strong> Full system access, can manage all users and organizations</li>
                    </ul>
                  </div>
                  <div className='column'>
                    <p><strong>Visibility:</strong></p>
                    <ul>
                      <li><strong>Super Admins:</strong> Can see all users across all organizations</li>
                      <li><strong>Organization Admins:</strong> Can only see users in their organization</li>
                      <li><strong>Users:</strong> Cannot access user management</li>
                    </ul>
                  </div>
                </div>
                <div className='columns'>
                  <div className='column'>
                    <p><strong>Permissions:</strong></p>
                    <ul>
                      <li>Super admins can modify any user except other super admins</li>
                      <li>Admins can only modify regular users in their organization</li>
                      <li>No one can modify their own role or deactivate themselves</li>
                    </ul>
                  </div>
                  <div className='column'>
                    <p><strong>Organizations:</strong></p>
                    <ul>
                      <li>Users belong to organizations for access control</li>
                      <li>Super admins operate at system level (no organization)</li>
                      <li>Organization admins manage users within their scope</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalUser && (
        <div className={`modal ${deleteModalUser ? 'is-active' : ''}`}>
          <div className="modal-background" onClick={closeDeleteModal}></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title has-text-danger">
                ⚠️ Permanent User Deletion
              </p>
              <button 
                className="delete" 
                aria-label="close"
                onClick={closeDeleteModal}
              ></button>
            </header>
            <section className="modal-card-body">
              <div className="content">
                <div className="notification is-danger">
                  <p><strong>WARNING: This action cannot be undone!</strong></p>
                  <p>You are about to permanently delete the following user:</p>
                </div>
                
                <div className="box ">
                  <p><strong>Username:</strong> {deleteModalUser.username}</p>
                  <p><strong>Email:</strong> {deleteModalUser.email}</p>
                  <p><strong>Role:</strong> {deleteModalUser.role}</p>
                  {deleteModalUser.organization_name && (
                    <p><strong>Organization:</strong> {deleteModalUser.organization_name}</p>
                  )}
                </div>

                <div className="field">
                  <label className="label">
                    Type "DELETE" to confirm permanent deletion:
                  </label>
                  <div className="control">
                    <input 
                      className="input" 
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      autoComplete="off"
                    />
                  </div>
                  <p className="help">
                    This will permanently remove the user and all associated data.
                  </p>
                </div>
              </div>
            </section>
            <footer className="modal-card-foot">
              <button 
                className="button is-danger"
                onClick={handleDeleteUser}
                disabled={deleteConfirmText !== 'DELETE' || loading}
              >
                {loading ? 'Deleting...' : 'Delete User Permanently'}
              </button>
              <button 
                className="button" 
                onClick={closeDeleteModal}
                disabled={loading}
              >
                Cancel
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Organization Delete Confirmation Modal */}
      {deleteModalOrg && (
        <div className={`modal ${deleteModalOrg ? 'is-active' : ''}`}>
          <div className="modal-background" onClick={closeDeleteOrgModal}></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title has-text-danger">
                ⚠️ Permanent Organization Deletion
              </p>
              <button 
                className="delete" 
                aria-label="close"
                onClick={closeDeleteOrgModal}
              ></button>
            </header>
            <section className="modal-card-body">
              <div className="content">
                <div className="notification is-danger">
                  <p><strong>WARNING: This action cannot be undone!</strong></p>
                  <p>You are about to permanently delete the following organization:</p>
                </div>
                
                <div className="box ">
                  <p><strong>Organization Name:</strong> {deleteModalOrg.name}</p>
                  <p><strong>Description:</strong> {deleteModalOrg.description || 'No description'}</p>
                  <p><strong>Total Users:</strong> {deleteModalOrg.total_users || 0}</p>
                  <p><strong>Active Users:</strong> {deleteModalOrg.active_users || 0}</p>
                  <p><strong>Created:</strong> {new Date(deleteModalOrg.created_at).toLocaleDateString()}</p>
                </div>

                {deleteModalOrg.active_users > 0 && (
                  <div className="notification is-warning">
                    <p><strong>Note:</strong> This organization has {deleteModalOrg.active_users} active users. 
                    All users in this organization will be permanently deleted along with the organization.</p>
                  </div>
                )}

                <div className="field">
                  <label className="label">
                    Type "DELETE" to confirm permanent deletion:
                  </label>
                  <div className="control">
                    <input 
                      className="input" 
                      type="text"
                      value={deleteOrgConfirmText}
                      onChange={(e) => setDeleteOrgConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      autoComplete="off"
                    />
                  </div>
                  <p className="help">
                    This will permanently remove the organization and all associated data.
                  </p>
                </div>
              </div>
            </section>
            <footer className="modal-card-foot">
              <button 
                className="button is-danger"
                onClick={handleDeleteOrg}
                disabled={deleteOrgConfirmText !== 'DELETE' || orgLoading}
              >
                {orgLoading ? 'Deleting...' : 'Delete Organization Permanently'}
              </button>
              <button 
                className="button" 
                onClick={closeDeleteOrgModal}
                disabled={orgLoading}
              >
                Cancel
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className={`modal ${showInviteModal ? 'is-active' : ''}`}>
          <div className="modal-background" onClick={closeInviteModal}></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">
                <span className="icon is-small mr-2">
                  <i className="fas fa-envelope"></i>
                </span>
                Invite New User
              </p>
              <button 
                className="delete" 
                aria-label="close"
                onClick={closeInviteModal}
              ></button>
            </header>
            <section className="modal-card-body">
              <div className="content">
                <p className="mb-4">
                  Send an email invitation to a new user to join {user?.role === 'super-admin' && viewScope === 'all' ? 'the system' : 'your organization'}. 
                  The invitation will be valid for 7 days and can only be used once.
                </p>
                
                <div className="field">
                  <label className="label">Email Address</label>
                  <div className="control has-icons-left">
                    <input 
                      className="input" 
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      autoComplete="off"
                      disabled={inviteLoading}
                    />
                    <span className="icon is-small is-left">
                      <i className="fas fa-envelope"></i>
                    </span>
                  </div>
                  <p className="help">
                    The user will receive an email with a registration link that expires in 7 days.
                  </p>
                </div>

                {user?.role === 'super-admin' && (
                  <div className="field">
                    <label className="label">Organization (Optional)</label>
                    <div className="control">
                      <div className="select is-fullwidth">
                        <select 
                          value={inviteOrganizationId}
                          onChange={(e) => setInviteOrganizationId(e.target.value)}
                          disabled={inviteLoading}
                        >
                          <option value="">Select Organization</option>
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name} ({org.active_users} active users)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="help">
                      Choose an organization for the user to join, or leave blank for a system-level invitation.
                    </p>
                  </div>
                )}

                {user?.role === 'admin' && (
                  <div className="notification is-info">
                    <p><strong>Organization Admin:</strong> This invitation will allow the user to join your organization with a 'user' role by default.</p>
                  </div>
                )}

                {inviteMsg && (
                  <div className={`notification ${
                    inviteMsg.includes('successfully') ? 'is-success' : 
                    inviteMsg.includes('Error') || inviteMsg.includes('Failed') ? 'is-danger' : 
                    'is-warning'
                  }`}>
                    <p>{inviteMsg}</p>
                  </div>
                )}
              </div>
            </section>
            <footer className="modal-card-foot">
              <button 
                className="button is-primary"
                onClick={handleSendInvitation}
                disabled={!inviteEmail || inviteLoading || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)}
              >
                {inviteLoading ? (
                  <>
                    <span className="icon is-small">
                      <i className="fas fa-spinner fa-spin"></i>
                    </span>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span className="icon is-small">
                      <i className="fas fa-paper-plane"></i>
                    </span>
                    <span>Send Invitation</span>
                  </>
                )}
              </button>
              <button 
                className="button" 
                onClick={closeInviteModal}
                disabled={inviteLoading}
              >
                Cancel
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* User Action Confirmation Modal */}
      {confirmModalUser && (
        <div className={`modal ${confirmModalUser ? 'is-active' : ''}`}>
          <div className="modal-background" onClick={closeConfirmModal}></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">
                {confirmAction === 'deactivate' ? 'Deactivate User' : 'Reactivate User'}
              </p>
              <button 
                className="delete" 
                aria-label="close"
                onClick={closeConfirmModal}
              ></button>
            </header>
            <section className="modal-card-body">
              <div className="content">
                <p>Are you sure you want to {confirmAction} <strong>{confirmModalUser.username}</strong>?</p>
              </div>
            </section>
            <footer className="modal-card-foot">
              <button 
                className={`button ${confirmAction === 'deactivate' ? 'is-danger' : 'is-success'}`}
                onClick={confirmUserAction}
                disabled={loading}
              >
                {loading ? `${confirmAction === 'deactivate' ? 'Deactivating...' : 'Reactivating...'}` : `${confirmAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}`}
              </button>
              <button 
                className="button" 
                onClick={closeConfirmModal}
                disabled={loading}
              >
                Cancel
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Organization Deactivation Confirmation Modal */}
      {confirmModalOrg && (
        <div className={`modal ${confirmModalOrg ? 'is-active' : ''}`}>
          <div className="modal-background" onClick={closeConfirmOrgModal}></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">
                Deactivate Organization
              </p>
              <button 
                className="delete" 
                aria-label="close"
                onClick={closeConfirmOrgModal}
              ></button>
            </header>
            <section className="modal-card-body">
              <div className="content">
                <p>Are you sure you want to deactivate <strong>{confirmModalOrg.name}</strong>?</p>
                <p className="mt-3 has-text-grey">This will prevent new users from joining this organization.</p>
              </div>
            </section>
            <footer className="modal-card-foot">
              <button 
                className="button is-danger"
                onClick={confirmOrgAction}
                disabled={orgLoading}
              >
                {orgLoading ? 'Deactivating...' : 'Deactivate Organization'}
              </button>
              <button 
                className="button" 
                onClick={closeConfirmOrgModal}
                disabled={orgLoading}
              >
                Cancel
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
