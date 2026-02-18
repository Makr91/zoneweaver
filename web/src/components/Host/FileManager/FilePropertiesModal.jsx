import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import FormModal from "../../common/FormModal";

import { formatFileSize } from "./FileManagerTransforms";
import PermissionEditor from "./PermissionEditor";

/**
 * Current vs new properties comparison display
 */
const PropertiesComparison = ({
  file,
  selectedUser,
  selectedUserObj,
  selectedGroup,
  selectedGroupObj,
  currentOctal,
}) => (
  <div className="field">
    <div className="notification is-info">
      <div className="columns">
        <div className="column">
          <strong>Current:</strong>
          <br />
          User: {file._zwMetadata?.uid || "Unknown"}
          <br />
          Group: {file._zwMetadata?.gid || "Unknown"}
          <br />
          Mode: {file._zwMetadata?.permissions?.octal || "Unknown"}
        </div>
        <div className="column">
          <strong>New:</strong>
          <br />
          User:{" "}
          {selectedUser
            ? `${selectedUserObj?.username} (${selectedUser})`
            : "No change"}
          <br />
          Group:{" "}
          {selectedGroup
            ? `${selectedGroupObj?.groupname} (${selectedGroup})`
            : "No change"}
          <br />
          Mode: {currentOctal}
        </div>
      </div>
    </div>
  </div>
);

PropertiesComparison.propTypes = {
  file: PropTypes.object.isRequired,
  selectedUser: PropTypes.string.isRequired,
  selectedUserObj: PropTypes.object,
  selectedGroup: PropTypes.string.isRequired,
  selectedGroupObj: PropTypes.object,
  currentOctal: PropTypes.string.isRequired,
};

/**
 * File Properties Modal Component
 * Allows viewing and editing file permissions, ownership, and metadata
 */
const FilePropertiesModal = ({ isOpen, onClose, file, api, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [systemUsers, setSystemUsers] = useState([]);
  const [systemGroups, setSystemGroups] = useState([]);

  // Permission state
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [permissions, setPermissions] = useState({
    owner: { read: true, write: true, execute: false },
    group: { read: true, write: false, execute: false },
    other: { read: true, write: false, execute: false },
  });
  const [customMode, setCustomMode] = useState("");
  const [useCustomMode, setUseCustomMode] = useState(false);
  const [applyRecursively, setApplyRecursively] = useState(false);

  // Define functions before useEffect
  const loadSystemData = useCallback(async () => {
    try {
      const [usersResult, groupsResult] = await Promise.all([
        api.getSystemUsers(),
        api.getSystemGroups(),
      ]);

      if (usersResult.success && usersResult.data?.users) {
        setSystemUsers(usersResult.data.users);
      }

      if (groupsResult.success && groupsResult.data?.groups) {
        setSystemGroups(groupsResult.data.groups);
      }
    } catch {
      // System data loading failed silently
    }
  }, [api]);

  const initializePermissions = useCallback(() => {
    if (!file?._zwMetadata?.permissions) {
      return;
    }

    const perms = file._zwMetadata.permissions;
    setCustomMode(perms.octal || "644");

    setSelectedUser(file._zwMetadata.uid?.toString() || "1000");
    setSelectedGroup(file._zwMetadata.gid?.toString() || "1000");

    const octal = perms.octal || "644";
    const parseOctal = (digit) => ({
      read: (parseInt(digit) & 4) !== 0,
      write: (parseInt(digit) & 2) !== 0,
      execute: (parseInt(digit) & 1) !== 0,
    });

    if (octal.length === 3) {
      setPermissions({
        owner: parseOctal(octal[0]),
        group: parseOctal(octal[1]),
        other: parseOctal(octal[2]),
      });
    }
  }, [file]);

  // Load system users and groups on mount
  useEffect(() => {
    if (isOpen) {
      loadSystemData();
      initializePermissions();
    }
  }, [isOpen, loadSystemData, initializePermissions]);

  const calculateOctalFromCheckboxes = () => {
    const calcDigit = (perms) =>
      (perms.read ? 4 : 0) + (perms.write ? 2 : 0) + (perms.execute ? 1 : 0);

    return `${calcDigit(permissions.owner)}${calcDigit(permissions.group)}${calcDigit(permissions.other)}`;
  };

  const handlePermissionChange = (category, permission, value) => {
    setPermissions((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [permission]: value,
      },
    }));
    setUseCustomMode(false);
  };

  const handleCustomModeChange = (value) => {
    setCustomMode(value);
    setUseCustomMode(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const permissionData = {
        uid: selectedUser ? parseInt(selectedUser) : undefined,
        gid: selectedGroup ? parseInt(selectedGroup) : undefined,
        mode: useCustomMode ? customMode : calculateOctalFromCheckboxes(),
        recursive: applyRecursively && file.isDirectory,
      };

      // Remove undefined values
      Object.keys(permissionData).forEach(
        (key) => permissionData[key] === undefined && delete permissionData[key]
      );

      const result = await api.updatePermissions(file, permissionData);

      if (result.success) {
        onSuccess(result);
        onClose();
      } else {
        setError(result.message || "Failed to update permissions");
      }
    } catch (submitErr) {
      setError(`Failed to update permissions: ${submitErr.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!file) {
    return null;
  }

  const currentOctal = useCustomMode
    ? customMode
    : calculateOctalFromCheckboxes();
  const selectedUserObj = systemUsers.find(
    (u) => u.uid.toString() === selectedUser
  );
  const selectedGroupObj = systemGroups.find(
    (g) => g.gid.toString() === selectedGroup
  );

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
      showCancelButton
      className="is-large"
    >
      {/* File info */}
      <div className="field">
        <div className="notification is-dark">
          <div className="columns">
            <div className="column">
              <strong>Name:</strong> {file.name}
              <br />
              <strong>Path:</strong> {file.path}
              <br />
              <strong>Type:</strong> {file.isDirectory ? "Directory" : "File"}
            </div>
            <div className="column">
              <strong>Size:</strong> {formatFileSize(file.size)}
              <br />
              <strong>Modified:</strong>{" "}
              {file.updatedAt
                ? new Date(file.updatedAt).toLocaleString()
                : "Unknown"}
              <br />
              <strong>MIME Type:</strong>{" "}
              {file._zwMetadata?.mimeType || "Unknown"}
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="notification is-danger">
          <button className="delete is-small" onClick={() => setError("")} />
          {error}
        </div>
      )}

      <div className="columns">
        {/* Ownership */}
        <div className="column">
          <h5 className="title is-6">Ownership</h5>

          {/* User selection */}
          <div className="field">
            <label htmlFor="file-props-user" className="label">
              User
            </label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  id="file-props-user"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Keep current</option>
                  {systemUsers.map((user) => (
                    <option key={user.uid} value={user.uid.toString()}>
                      {user.username} ({user.uid})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="help">
              Current: {selectedUserObj?.username || "Unknown"} (
              {selectedUser || file._zwMetadata?.uid || "Unknown"})
            </p>
          </div>

          {/* Group selection */}
          <div className="field">
            <label htmlFor="file-props-group" className="label">
              Group
            </label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  id="file-props-group"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                >
                  <option value="">Keep current</option>
                  {systemGroups.map((group) => (
                    <option key={group.gid} value={group.gid.toString()}>
                      {group.groupname} ({group.gid})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="help">
              Current: {selectedGroupObj?.groupname || "Unknown"} (
              {selectedGroup || file._zwMetadata?.gid || "Unknown"})
            </p>
          </div>
        </div>

        {/* Permissions - extracted component */}
        <PermissionEditor
          permissions={permissions}
          onPermissionChange={handlePermissionChange}
          useCustomMode={useCustomMode}
          setUseCustomMode={setUseCustomMode}
          customMode={customMode}
          currentOctal={currentOctal}
          onCustomModeChange={handleCustomModeChange}
          originalOctal={file._zwMetadata?.permissions?.octal}
          setPermissions={setPermissions}
        />
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
              <span className="ml-2">
                Apply changes recursively to all contents
              </span>
            </label>
          </div>
          <p className="help has-text-warning">
            Warning: Recursive changes will affect all files and subdirectories
          </p>
        </div>
      )}

      {/* Current vs new comparison */}
      <PropertiesComparison
        file={file}
        selectedUser={selectedUser}
        selectedUserObj={selectedUserObj}
        selectedGroup={selectedGroup}
        selectedGroupObj={selectedGroupObj}
        currentOctal={currentOctal}
      />

      {/* Permission explanation */}
      <div className="field">
        <div className="notification is-dark is-small">
          <div className="content is-small">
            <strong>Permission Guide:</strong>
            <br />
            <strong>Read (r)</strong> - View file contents or list directory
            <br />
            <strong>Write (w)</strong> - Modify file or create/delete in
            directory
            <br />
            <strong>Execute (x)</strong> - Run file as program or enter
            directory
            <br />
            <strong>Common modes:</strong> 644 (files), 755
            (directories/executables), 600 (private files)
          </div>
        </div>
      </div>
    </FormModal>
  );
};

FilePropertiesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  file: PropTypes.object,
  api: PropTypes.object.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default FilePropertiesModal;
