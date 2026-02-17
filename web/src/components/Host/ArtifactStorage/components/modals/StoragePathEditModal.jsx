import { useState, useEffect } from "react";
import PropTypes from "prop-types";

import { useServers } from "../../../../../contexts/ServerContext";
import FormModal from "../../../../common/FormModal";

const StoragePathEditModal = ({
  server,
  storagePath,
  onClose,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { makeZoneweaverAPIRequest } = useServers();

  // Initialize form with storage path data
  useEffect(() => {
    if (storagePath) {
      setFormData({
        name: storagePath.name || "",
        enabled: storagePath.enabled ?? true,
      });
    }
  }, [storagePath]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `artifacts/storage/paths/${storagePath.id}`,
        "PUT",
        {
          name: formData.name.trim(),
          enabled: formData.enabled,
        }
      );

      if (result.success) {
        onSuccess();
      } else {
        onError(result.message || "Failed to update storage path");
      }
    } catch (err) {
      onError(`Error updating storage path: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!storagePath) {
    return null;
  }

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Edit Storage Path"
      icon="fas fa-edit"
      submitText="Update"
      submitVariant="is-primary"
      submitIcon="fas fa-save"
      loading={loading}
      showCancelButton
    >
      <div className="field">
        <label htmlFor="edit-storage-path-name" className="label">Name</label>
        <div className="control">
          <input
            id="edit-storage-path-name"
            className={`input ${errors.name ? "is-danger" : ""}`}
            type="text"
            placeholder="e.g., Primary ISO Storage"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            disabled={loading}
          />
        </div>
        {errors.name && <p className="help is-danger">{errors.name}</p>}
        <p className="help">A descriptive name for this storage location</p>
      </div>

      {/* Read-only fields */}
      <div className="field">
        <label htmlFor="edit-storage-path-path" className="label">Path</label>
        <div className="control">
          <input
            id="edit-storage-path-path"
            className="input"
            type="text"
            value={storagePath.path}
            disabled
            readOnly
          />
        </div>
        <p className="help">Path cannot be changed after creation</p>
      </div>

      <div className="field">
        <label htmlFor="edit-storage-path-type" className="label">Type</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select id="edit-storage-path-type" value={storagePath.type} disabled>
              <option value="iso">ISO Files</option>
              <option value="image">VM Images</option>
            </select>
          </div>
        </div>
        <p className="help">Type cannot be changed after creation</p>
      </div>

      <div className="field">
        <div className="control">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => handleInputChange("enabled", e.target.checked)}
              disabled={loading}
            />
            <span className="ml-2">Enable storage location</span>
          </label>
        </div>
        <p className="help">
          {formData.enabled
            ? "This storage location can be used for uploads and downloads"
            : "This storage location is read-only when disabled"}
        </p>
      </div>

      {/* Storage location statistics */}
      <div className="notification is-light">
        <div className="content">
          <p>
            <strong>Storage Statistics:</strong>
          </p>
          <div className="columns is-mobile">
            <div className="column">
              <div className="has-text-centered">
                <p className="heading">Files</p>
                <p className="title is-6">{storagePath.file_count || 0}</p>
              </div>
            </div>
            <div className="column">
              <div className="has-text-centered">
                <p className="heading">Total Size</p>
                <p className="title is-6">
                  {storagePath.total_size
                    ? `${(storagePath.total_size / (1024 * 1024 * 1024)).toFixed(1)} GB`
                    : "0 GB"}
                </p>
              </div>
            </div>
            {storagePath.disk_usage && (
              <div className="column">
                <div className="has-text-centered">
                  <p className="heading">Disk Usage</p>
                  <p className="title is-6">
                    {storagePath.disk_usage.use_percent}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!formData.enabled && storagePath.file_count > 0 && (
        <div className="notification is-warning">
          <p>
            <strong>Warning:</strong> This storage location contains{" "}
            {storagePath.file_count} file(s). Disabling it will make these
            artifacts read-only and prevent new uploads or downloads to this
            location.
          </p>
        </div>
      )}
    </FormModal>
  );
};

StoragePathEditModal.propTypes = {
  server: PropTypes.object.isRequired,
  storagePath: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

export default StoragePathEditModal;
