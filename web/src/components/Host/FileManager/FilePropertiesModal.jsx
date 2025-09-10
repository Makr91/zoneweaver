import { useState, useEffect } from 'react';
import FormModal from '../../common/FormModal';
import { getPathFromFile, formatFileSize } from './FileManagerTransforms';

/**
 * File Properties Modal Component
 * Allows viewing and editing file permissions, ownership, and metadata
 */
const FilePropertiesModal = ({ isOpen, onClose, file, api, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [systemUsers, setSystemUsers] = useState([]);
  const [systemGroups, setSystemGroups] = useState([]);
  
  // Permission state
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [permissions, setPermissions] = useState({
    owner: { read: true, write: true, execute: false },
    group: { read: true, write: false, execute: false },
    other: { read: true, write: false, execute: false }
  });
  const [customMode, setCustomMode] = useState('');
  const [useCustomMode, setUseCustomMode] = useState(false);
  const [applyRecursively, setApplyRecursively] = useState(false);

  // Load system users and groups on mount
  useEffect(() => {
    if (isOpen) {
      loadSystemData();
      initializePermissions();
    }
  }, [isOpen, file]);

  const loadSystemData = async () => {
    try {
      const [usersResult, groupsResult] = await Promise.all([
        api.getSystemUsers(),
        api.getSystemGroups()
      ]);

      if (usersResult.success && usersResult.data?.users) {
        setSystemUsers(usersResult.data.users);
      }

      if (groupsResult.success && groupsResult.data?.groups) {
        setSystemGroups(groupsResult.data.groups);
      }
    } catch (error) {
      console.error('Error loading system data:', error);
    }
  };

  const initializePermissions = () => {
    if (!file?._zwMetadata?.permissions) return;

    const perms = file._zwMetadata.permissions;
    setCustomMode(perms.octal || '644');
    
    // Set current user and group
    setSelectedUser(file._zwMetadata.uid?.toString() || '1000');
    setSelectedGroup(file._zwMetadata.gid?.toString() || '1000');

    // Parse octal permissions into checkbox states
    const octal = perms.octal || '644';
    const parseOctal = (digit) => ({
      read: (parseInt(digit) & 4) !== 0,
      write: (parseInt(digit) & 2) !== 0,
      execute: (parseInt(digit) & 1) !== 0
    });

    if (octal.length === 3) {
      setPermissions({
        owner: parseOctal(octal[0]),
        group: parseOctal(octal[1]),
        other: parseOctal(octal[2])
      });
    }
  };

  const calculateOctalFromCheckboxes = () => {
    const calcDigit = (perms) => 
      (perms.read ? 4 : 0) + (perms.write ? 2 : 0) + (perms.execute ? 1 : 0);
    
    return `${calcDigit(permissions.owner)}${calcDigit(permissions.group)}${calcDigit(permissions.other)}`;
  };

  const handlePermissionChange = (category, permission, value) => {
    setPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [permission]: value
      }
    }));
    setUseCustomMode(false); // Switch back to checkbox mode when user clicks checkboxes
  };

  const handleCustomModeChange = (value) => {
    setCustomMode(value);
    setUseCustomMode(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const permissionData = {
        uid: selectedUser ? parseInt(selectedUser) : undefined,
        gid: selectedGroup ? parseInt(selectedGroup) : undefined,
        mode: useCustomMode ? customMode : calculateOctalFromCheckboxes(),
        recursive: applyRecursively && file.isDirectory
      };

      // Remove undefined values
      Object.keys(permissionData).forEach(key => 
        permissionData[key] === undefined && delete permissionData[key]
      );

      const result = await api.updatePermissions(file, permissionData);
      
      if (result.success) {
        onSuccess(result);
        onClose();
      } else {
        setError(result.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      setError('Failed to update permissions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!file) return null;

  const currentOctal = useCustomMode ? customMode : calculateOctalFromCheckboxes();
  const selectedUserObj = systemUsers.find(u => u.uid.toString() === selectedUser);
  const selectedGroupObj = systemGroups.find(g => g.gid.toString() === selectedGroup);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={`Properties: ${file.name}`}
      icon="fas fa-cog"
      submitText="Apply Changes"
      submitVariant="is-primary"
      submitIcon="fas fa-save"
      loading={loading}
      showCancelButton={true}
      className="is-large"
    >
      {/* File info */}
      <div className="field">
        <div className="notification is-dark">
          <div className="columns">
            <div className="column">
              <strong>Name:</strong> {file.name}<br />
              <strong>Path:</strong> {file.path}<br />
              <strong>Type:</strong> {file.isDirectory ? 'Directory' : 'File'}
            </div>
            <div className="column">
              <strong>Size:</strong> {formatFileSize(file.size)}<br />
              <strong>Modified:</strong> {file.updatedAt ? new Date(file.updatedAt).toLocaleString() : 'Unknown'}<br />
              <strong>MIME Type:</strong> {file._zwMetadata?.mimeType || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="notification is-danger">
          <button className="delete is-small" onClick={() => setError('')}></button>
          {error}
        </div>
      )}

      <div className="columns">
        {/* Ownership */}
        <div className="column">
          <h5 className="title is-6">Ownership</h5>
          
          {/* User selection */}
          <div className="field">
            <label className="label">User</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select 
                  value={selectedUser} 
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Keep current</option>
                  {systemUsers.map(user => (
                    <option key={user.uid} value={user.uid.toString()}>
                      {user.username} ({user.uid})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="help">
              Current: {selectedUserObj?.username || 'Unknown'} ({selectedUser || file._zwMetadata?.uid || 'Unknown'})
            </p>
          </div>

          {/* Group selection */}
          <div className="field">
            <label className="label">Group</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select 
                  value={selectedGroup} 
                  onChange={(e) => setSelectedGroup(e.target.value)}
                >
                  <option value="">Keep current</option>
                  {systemGroups.map(group => (
                    <option key={group.gid} value={group.gid.toString()}>
                      {group.groupname} ({group.gid})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="help">
              Current: {selectedGroupObj?.groupname || 'Unknown'} ({selectedGroup || file._zwMetadata?.gid || 'Unknown'})
            </p>
          </div>
        </div>

        {/* Permissions */}
        <div className="column">
          <h5 className="title is-6">Permissions</h5>
          
          {/* Permission checkboxes */}
          <div className="field">
            <div className="table-container">
              <table className="table is-narrow is-fullwidth">
                <thead>
                  <tr>
                    <th></th>
                    <th>Read</th>
                    <th>Write</th>
                    <th>Execute</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Owner</strong></td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={permissions.owner.read}
                        onChange={(e) => handlePermissionChange('owner', 'read', e.target.checked)}
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={permissions.owner.write}
                        onChange={(e) => handlePermissionChange('owner', 'write', e.target.checked)}
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={permissions.owner.execute}
                        onChange={(e) => handlePermissionChange('owner', 'execute', e.target.checked)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Group</strong></td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={permissions.group.read}
                        onChange={(e) => handlePermissionChange('group', 'read', e.target.checked)}
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={permissions.group.write}
                        onChange={(e) => handlePermissionChange('group', 'write', e.target.checked)}
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={permissions.group.execute}
                        onChange={(e) => handlePermissionChange('group', 'execute', e.target.checked)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Other</strong></td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={permissions.other.read}
                        onChange={(e) => handlePermissionChange('other', 'read', e.target.checked)}
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={permissions.other.write}
                        onChange={(e) => handlePermissionChange('other', 'write', e.target.checked)}
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={permissions.other.execute}
                        onChange={(e) => handlePermissionChange('other', 'execute', e.target.checked)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Octal mode display/editor */}
          <div className="field">
            <label className="label">
              <input 
                type="checkbox" 
                checked={useCustomMode}
                onChange={(e) => setUseCustomMode(e.target.checked)}
              />
              <span className="ml-2">Use custom octal mode</span>
            </label>
            <div className="control">
              <input
                className="input"
                type="text"
                value={useCustomMode ? customMode : currentOctal}
                onChange={(e) => handleCustomModeChange(e.target.value)}
                placeholder="644"
                disabled={!useCustomMode}
                pattern="[0-7]{3,4}"
              />
            </div>
            <p className="help">
              Current calculated: {currentOctal} | 
              Original: {file._zwMetadata?.permissions?.octal || 'Unknown'}
            </p>
          </div>

          {/* Common permission presets */}
          <div className="field">
            <label className="label">Quick Presets</label>
            <div className="buttons">
              <button
                type="button"
                className="button is-small"
                onClick={() => {
                  setPermissions({
                    owner: { read: true, write: true, execute: false },
                    group: { read: true, write: false, execute: false },
                    other: { read: true, write: false, execute: false }
                  });
                  setUseCustomMode(false);
                }}
              >
                644 (rw-r--r--)
              </button>
              <button
                type="button"
                className="button is-small"
                onClick={() => {
                  setPermissions({
                    owner: { read: true, write: true, execute: true },
                    group: { read: true, write: false, execute: true },
                    other: { read: true, write: false, execute: true }
                  });
                  setUseCustomMode(false);
                }}
              >
                755 (rwxr-xr-x)
              </button>
              <button
                type="button"
                className="button is-small"
                onClick={() => {
                  setPermissions({
                    owner: { read: true, write: true, execute: false },
                    group: { read: false, write: false, execute: false },
                    other: { read: false, write: false, execute: false }
                  });
                  setUseCustomMode(false);
                }}
              >
                600 (rw-------)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recursive option for directories */}
      {file.isDirectory && (
        <div className="field">
          <div className="control">
            <label className="checkbox">
              <input 
                type="checkbox" 
                checked={applyRecursively}
                onChange={(e) => setApplyRecursively(e.target.checked)}
              />
              <span className="ml-2">Apply changes recursively to all contents</span>
            </label>
          </div>
          <p className="help has-text-warning">
            Warning: Recursive changes will affect all files and subdirectories
          </p>
        </div>
      )}

      {/* Current vs new comparison */}
      <div className="field">
        <div className="notification is-info">
          <div className="columns">
            <div className="column">
              <strong>Current:</strong><br />
              User: {file._zwMetadata?.uid || 'Unknown'}<br />
              Group: {file._zwMetadata?.gid || 'Unknown'}<br />
              Mode: {file._zwMetadata?.permissions?.octal || 'Unknown'}
            </div>
            <div className="column">
              <strong>New:</strong><br />
              User: {selectedUser ? `${selectedUserObj?.username} (${selectedUser})` : 'No change'}<br />
              Group: {selectedGroup ? `${selectedGroupObj?.groupname} (${selectedGroup})` : 'No change'}<br />
              Mode: {currentOctal}
            </div>
          </div>
        </div>
      </div>

      {/* Permission explanation */}
      <div className="field">
        <div className="notification is-dark is-small">
          <div className="content is-small">
            <strong>Permission Guide:</strong><br />
            <strong>Read (r)</strong> - View file contents or list directory<br />
            <strong>Write (w)</strong> - Modify file or create/delete in directory<br />
            <strong>Execute (x)</strong> - Run file as program or enter directory<br />
            <strong>Common modes:</strong> 644 (files), 755 (directories/executables), 600 (private files)
          </div>
        </div>
      </div>
    </FormModal>
  );
};

export default FilePropertiesModal;
