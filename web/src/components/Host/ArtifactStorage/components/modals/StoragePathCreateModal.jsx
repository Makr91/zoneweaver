import React, { useState } from "react";

import { useServers } from "../../../../../contexts/ServerContext";
import FormModal from "../../../../common/FormModal";

const StoragePathCreateModal = ({ server, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    type: "iso",
    enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { makeZoneweaverAPIRequest } = useServers();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.path.trim()) {
      newErrors.path = "Path is required";
    } else if (!formData.path.startsWith("/")) {
      newErrors.path = "Path must be an absolute path starting with /";
    }

    if (!formData.type) {
      newErrors.type = "Type is required";
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
        "artifacts/storage/paths",
        "POST",
        {
          name: formData.name.trim(),
          path: formData.path.trim(),
          type: formData.type,
          enabled: formData.enabled,
        }
      );

      if (result.success) {
        onSuccess();
      } else {
        onError(result.message || "Failed to create storage path");
      }
    } catch (err) {
      onError(`Error creating storage path: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Create Storage Path"
      icon="fas fa-plus"
      submitText="Create"
      submitVariant="is-primary"
      submitIcon="fas fa-plus"
      loading={loading}
      showCancelButton
    >
      <div className="field">
        <label className="label">Name</label>
        <div className="control">
          <input
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

      <div className="field">
        <label className="label">Path</label>
        <div className="control">
          <input
            className={`input ${errors.path ? "is-danger" : ""}`}
            type="text"
            placeholder="e.g., /data/isos"
            value={formData.path}
            onChange={(e) => handleInputChange("path", e.target.value)}
            disabled={loading}
          />
        </div>
        {errors.path && <p className="help is-danger">{errors.path}</p>}
        <p className="help">
          Absolute path to the storage directory on the host system
        </p>
      </div>

      <div className="field">
        <label className="label">Type</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              value={formData.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
              disabled={loading}
            >
              <option value="iso">ISO Files</option>
              <option value="image">VM Images</option>
            </select>
          </div>
        </div>
        {errors.type && <p className="help is-danger">{errors.type}</p>}
        <p className="help">
          Type of artifacts this storage location will contain
        </p>
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
          Enabled storage locations can be used for uploads and downloads.
          Disabled locations are read-only.
        </p>
      </div>

      <div className="notification is-info">
        <div className="content">
          <p>
            <strong>Important:</strong>
          </p>
          <ul>
            <li>
              The specified path must exist and be writable by the OmniOS system
            </li>
            <li>
              Ensure adequate disk space is available for artifact storage
            </li>
            <li>
              Path validation will be performed when creating the storage
              location
            </li>
          </ul>
        </div>
      </div>
    </FormModal>
  );
};

export default StoragePathCreateModal;
