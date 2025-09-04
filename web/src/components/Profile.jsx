import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Helmet } from '@dr.pogodin/react-helmet';
import axios from 'axios';

const Profile = () => {
  const { user, logout } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deleteData, setDeleteData] = useState({
    password: '',
    confirmText: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  /**
   * Handle password change
   */
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMsg('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMsg('New password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      setMsg('');
      
      const response = await axios.post('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      
      if (response.data.success) {
        setMsg('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordChange(false);
      } else {
        setMsg(response.data.message);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMsg('Error changing password: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle account deletion
   */
  const handleDeleteAccount = async () => {
    if (deleteData.confirmText !== 'DELETE') {
      setMsg('You must type "DELETE" to confirm account deletion');
      return;
    }

    try {
      setLoading(true);
      setMsg('');
      
      const response = await axios.delete('/api/auth/delete-account', {
        data: {
          password: deleteData.password,
          confirmText: deleteData.confirmText
        }
      });
      
      if (response.data.success) {
        // Account deleted successfully, redirect to login
        await logout();
        window.location.href = '/ui/login?message=Account deleted successfully';
      } else {
        setMsg(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setMsg('Error deleting account: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Close delete modal and reset form
   */
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteData({ password: '', confirmText: '' });
    setMsg('');
  };

  /**
   * Get role badge color
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
        return 'is-light';
    }
  };

  return (
    <div className="zw-page-content-scrollable">
      <Helmet>
        <meta charSet='utf-8' />
        <title>Profile - Zoneweaver</title>
        <link rel='canonical' href={window.location.origin} />
      </Helmet>
      <div className="container is-fluid p-0">
        <div className="box p-0 is-radiusless">
          <div className="titlebar box active level is-mobile mb-0 p-3">
            <div className="level-left">
              <strong>User Profile</strong>
            </div>
          </div>

          <div className="p-4">
            {msg && (
              <div className={`notification ${
                msg.includes('successfully') ? 'is-success' : 
                msg.includes('Error') || msg.includes('must') ? 'is-danger' : 
                'is-warning'
              }`}>
                <p>{msg}</p>
              </div>
            )}

            <div className="columns">
              <div className="column is-one-third">
                {/* Profile Information */}
                <div className="box">
                  <h2 className="title is-5">Profile Information</h2>
                  <div className="content">
                    {user?.gravatar?.avatar_url && (
                      <div className="field has-text-centered mb-4">
                        <figure className="image is-128x128 is-inline-block">
                          <img 
                            src={user.gravatar.avatar_url} 
                            alt="Profile Avatar" 
                            className="is-rounded"
                          />
                        </figure>
                      </div>
                    )}
                    
                    {user?.gravatar?.display_name && (
                      <div className="field">
                        <label className="label">Display Name</label>
                        <div className="control">
                          <input 
                            className="input" 
                            type="text" 
                            value={user.gravatar.display_name} 
                            disabled 
                          />
                        </div>
                      </div>
                    )}
                    
                    {user?.gravatar?.first_name && (
                      <div className="field">
                        <label className="label">First Name</label>
                        <div className="control">
                          <input 
                            className="input" 
                            type="text" 
                            value={user.gravatar.first_name} 
                            disabled 
                          />
                        </div>
                      </div>
                    )}
                    
                    {user?.gravatar?.last_name && (
                      <div className="field">
                        <label className="label">Last Name</label>
                        <div className="control">
                          <input 
                            className="input" 
                            type="text" 
                            value={user.gravatar.last_name} 
                            disabled 
                          />
                        </div>
                      </div>
                    )}
                    
                    {user?.gravatar?.job_title && (
                      <div className="field">
                        <label className="label">Job Title</label>
                        <div className="control">
                          <input 
                            className="input" 
                            type="text" 
                            value={user.gravatar.job_title} 
                            disabled 
                          />
                        </div>
                      </div>
                    )}
                    
                    {user?.gravatar?.location && (
                      <div className="field">
                        <label className="label">Location</label>
                        <div className="control">
                          <input 
                            className="input" 
                            type="text" 
                            value={user.gravatar.location} 
                            disabled 
                          />
                        </div>
                      </div>
                    )}
                    
                    {user?.gravatar?.timezone && (
                      <div className="field">
                        <label className="label">Timezone</label>
                        <div className="control">
                          <input 
                            className="input" 
                            type="text" 
                            value={user.gravatar.timezone} 
                            disabled 
                          />
                        </div>
                      </div>
                    )}
                    
                    {(!user?.gravatar || Object.keys(user.gravatar).length === 0) && (
                      <div className="notification is-info">
                        <p>No Gravatar profile found for this email address.</p>
                        <p className="is-size-7 mt-2">
                          <a href="https://gravatar.com" target="_blank" rel="noopener noreferrer">
                            Create a Gravatar profile
                          </a> to display your profile information here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="column">
                {/* Account Information */}
                <div className="box">
                  <h2 className="title is-5">Account Information</h2>
                  <div className="content">
                    <div className="field">
                      <label className="label">Username</label>
                      <div className="control">
                        <input 
                          className="input" 
                          type="text" 
                          value={user?.username || ''} 
                          disabled 
                        />
                      </div>
                    </div>
                    
                    <div className="field">
                      <label className="label">Email</label>
                      <div className="control">
                        <input 
                          className="input" 
                          type="email" 
                          value={user?.email || ''} 
                          disabled 
                        />
                      </div>
                    </div>
                    
                    <div className="field">
                      <label className="label">Role</label>
                      <div className="control">
                        <span className={`tag is-medium ${getRoleBadgeClass(user?.role)}`}>
                          {user?.role || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="field">
                      <label className="label">Member Since</label>
                      <div className="control">
                        <input 
                          className="input" 
                          type="text" 
                          value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'} 
                          disabled 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Management */}
                <div className="box">
                  <h2 className="title is-5">Password Management</h2>
                  
                  {!showPasswordChange ? (
                    <div>
                      <p className="mb-3">Change your account password for enhanced security.</p>
                      <button 
                        className="button is-primary"
                        onClick={() => setShowPasswordChange(true)}
                      >
                        Change Password
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordChange}>
                      <div className="field">
                        <label className="label">Current Password</label>
                        <div className="control">
                          <input 
                            className="input" 
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="field">
                        <label className="label">New Password</label>
                        <div className="control">
                          <input 
                            className="input" 
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            required
                            minLength="8"
                          />
                        </div>
                        <p className="help">Must be at least 8 characters long</p>
                      </div>
                      
                      <div className="field">
                        <label className="label">Confirm New Password</label>
                        <div className="control">
                          <input 
                            className="input" 
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="field is-grouped">
                        <div className="control">
                          <button 
                            type="submit" 
                            className={`button is-primary ${loading ? 'is-loading' : ''}`}
                            disabled={loading}
                          >
                            Update Password
                          </button>
                        </div>
                        <div className="control">
                          <button 
                            type="button" 
                            className="button"
                            onClick={() => {
                              setShowPasswordChange(false);
                              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                              setMsg('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>

                {/* Account Deletion */}
                <div className="box">
                  <h2 className="title is-5 has-text-danger">Danger Zone</h2>
                  <div className="notification is-danger">
                    <p><strong>Warning:</strong> Account deletion is permanent and cannot be undone.</p>
                    {user?.role === 'super-admin' && (
                      <p><strong>Note:</strong> As a super-admin, you cannot delete your account if you are the last super-admin.</p>
                    )}
                  </div>
                  
                  <button 
                    className="button is-danger is-outlined"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className={`modal ${showDeleteModal ? 'is-active' : ''}`}>
          <div className="modal-background" onClick={closeDeleteModal}></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title has-text-danger">
                ⚠️ Delete Account
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
                  <p>You are about to permanently delete your account:</p>
                </div>
                
                <div className="box has-background-grey-lighter">
                  <p><strong>Username:</strong> {user?.username}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Role:</strong> {user?.role}</p>
                </div>

                <div className="field">
                  <label className="label">Current Password</label>
                  <div className="control">
                    <input 
                      className="input" 
                      type="password"
                      value={deleteData.password}
                      onChange={(e) => setDeleteData({...deleteData, password: e.target.value})}
                      placeholder="Enter your current password"
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="label">
                    Type "DELETE" to confirm account deletion:
                  </label>
                  <div className="control">
                    <input 
                      className="input" 
                      type="text"
                      value={deleteData.confirmText}
                      onChange={(e) => setDeleteData({...deleteData, confirmText: e.target.value})}
                      placeholder="Type DELETE to confirm"
                      autoComplete="off"
                    />
                  </div>
                  <p className="help">
                    This will permanently remove your account and all associated data.
                  </p>
                </div>
              </div>
            </section>
            <footer className="modal-card-foot">
              <button 
                className="button is-danger"
                onClick={handleDeleteAccount}
                disabled={deleteData.confirmText !== 'DELETE' || !deleteData.password || loading}
              >
                {loading ? 'Deleting...' : 'Delete Account Permanently'}
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
    </div>
  );
};

export default Profile;
