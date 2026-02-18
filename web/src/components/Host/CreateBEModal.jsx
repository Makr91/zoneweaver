import PropTypes from "prop-types";
import { useState, useRef } from "react";

import { useServers } from "../../contexts/ServerContext";
import { FormModal } from "../common";

const CreateBEModal = ({ server, onClose, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sourceBE: "",
    snapshot: "",
    activate: false,
    zpool: "",
    properties: [],
    createdBy: "api",
  });
  const nextPropId = useRef(0);

  const { makeZoneweaverAPIRequest } = useServers();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePropertyKeyChange = (id, newKey) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.map((prop) =>
        prop.id === id ? { ...prop, key: newKey } : prop
      ),
    }));
  };

  const handlePropertyValueChange = (id, newValue) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.map((prop) =>
        prop.id === id ? { ...prop, value: newValue } : prop
      ),
    }));
  };

  const removeProperty = (id) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.filter((prop) => prop.id !== id),
    }));
  };

  const addProperty = () => {
    const id = nextPropId.current;
    nextPropId.current += 1;
    setFormData((prev) => ({
      ...prev,
      properties: [...prev.properties, { id, key: "", value: "" }],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      onError("Boot environment name is required");
      return;
    }

    // Validate BE name format
    const beNameRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
    if (!beNameRegex.test(formData.name.trim())) {
      onError(
        "Boot environment name must start with alphanumeric character and contain only letters, numbers, dots, underscores, and hyphens"
      );
      return;
    }

    try {
      setLoading(true);
      onError("");

      const requestData = {
        name: formData.name.trim(),
        created_by: formData.createdBy,
      };

      // Add optional fields only if they have values
      if (formData.description.trim()) {
        requestData.description = formData.description.trim();
      }
      if (formData.sourceBE.trim()) {
        requestData.source_be = formData.sourceBE.trim();
      }
      if (formData.snapshot.trim()) {
        requestData.snapshot = formData.snapshot.trim();
      }
      if (formData.activate) {
        requestData.activate = true;
      }
      if (formData.zpool.trim()) {
        requestData.zpool = formData.zpool.trim();
      }

      // Add properties if any are defined
      const validProperties = formData.properties.reduce((acc, prop) => {
        if (prop.key.trim() && prop.value.trim()) {
          acc[prop.key.trim()] = prop.value.trim();
        }
        return acc;
      }, {});

      if (Object.keys(validProperties).length > 0) {
        requestData.properties = validProperties;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/boot-environments",
        "POST",
        requestData
      );

      if (result.success) {
        onSuccess();
      } else {
        onError(result.message || "Failed to create boot environment");
      }
    } catch (err) {
      onError(`Error creating boot environment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Create Boot Environment"
      icon="fas fa-plus-circle"
      submitText="Create Boot Environment"
      submitIcon="fas fa-plus"
      submitVariant="is-success"
      loading={loading}
    >
      {/* Basic Information */}
      <div className="box mb-4">
        <h3 className="title is-6">Basic Information</h3>

        <div className="field">
          <label htmlFor="be-name" className="label">
            Boot Environment Name *
          </label>
          <div className="control">
            <input
              id="be-name"
              className="input"
              type="text"
              placeholder="e.g., backup-before-update"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>
          <p className="help">
            Must start with alphanumeric character. Can contain letters,
            numbers, dots, underscores, and hyphens.
          </p>
        </div>

        <div className="field">
          <label htmlFor="be-description" className="label">
            Description (Optional)
          </label>
          <div className="control">
            <textarea
              id="be-description"
              className="textarea"
              placeholder="Brief description of this boot environment"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows="2"
            />
          </div>
        </div>
      </div>

      {/* Source Configuration */}
      <div className="box mb-4">
        <h3 className="title is-6">Source Configuration</h3>

        <div className="columns">
          <div className="column">
            <div className="field">
              <label htmlFor="be-source" className="label">
                Source Boot Environment
              </label>
              <div className="control">
                <input
                  id="be-source"
                  className="input"
                  type="text"
                  placeholder="Leave empty to use current BE"
                  value={formData.sourceBE}
                  onChange={(e) =>
                    handleInputChange("sourceBE", e.target.value)
                  }
                />
              </div>
              <p className="help">
                Source BE to clone from (default: current active BE)
              </p>
            </div>
          </div>

          <div className="column">
            <div className="field">
              <label htmlFor="be-snapshot" className="label">
                Source Snapshot
              </label>
              <div className="control">
                <input
                  id="be-snapshot"
                  className="input"
                  type="text"
                  placeholder="Snapshot name or path"
                  value={formData.snapshot}
                  onChange={(e) =>
                    handleInputChange("snapshot", e.target.value)
                  }
                />
              </div>
              <p className="help">Create BE from specific snapshot</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="box mb-4">
        <h3 className="title is-6">Advanced Options</h3>

        <div className="columns">
          <div className="column">
            <div className="field">
              <div className="control">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={formData.activate}
                    onChange={(e) =>
                      handleInputChange("activate", e.target.checked)
                    }
                  />
                  <span className="ml-2">
                    <strong>Activate on Creation</strong> - Set as active boot
                    environment for next reboot
                  </span>
                </label>
              </div>
            </div>

            <div className="field">
              <label htmlFor="be-zpool" className="label">
                ZFS Pool (Optional)
              </label>
              <div className="control">
                <input
                  id="be-zpool"
                  className="input"
                  type="text"
                  placeholder="e.g., rpool"
                  value={formData.zpool}
                  onChange={(e) => handleInputChange("zpool", e.target.value)}
                />
              </div>
              <p className="help">Specify ZFS pool (default: system pool)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Properties */}
      <div className="box">
        <h3 className="title is-6">Custom Properties</h3>

        {formData.properties.map((prop) => (
          <div key={prop.id} className="field has-addons mb-3">
            <div className="control">
              <input
                className="input"
                type="text"
                placeholder="Property name"
                value={prop.key}
                onChange={(e) =>
                  handlePropertyKeyChange(prop.id, e.target.value)
                }
              />
            </div>
            <div className="control is-expanded">
              <input
                className="input"
                type="text"
                placeholder="Property value"
                value={prop.value}
                onChange={(e) =>
                  handlePropertyValueChange(prop.id, e.target.value)
                }
              />
            </div>
            <div className="control">
              <button
                type="button"
                className="button has-background-danger-dark has-text-danger-light"
                onClick={() => removeProperty(prop.id)}
              >
                <span className="icon">
                  <i className="fas fa-trash" />
                </span>
              </button>
            </div>
          </div>
        ))}

        <button type="button" className="button is-info" onClick={addProperty}>
          <span className="icon">
            <i className="fas fa-plus" />
          </span>
          <span>Add Property</span>
        </button>

        <p className="help mt-2">
          Add custom ZFS properties to the boot environment (e.g., compression,
          mountpoint)
        </p>
      </div>
    </FormModal>
  );
};

CreateBEModal.propTypes = {
  server: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

export default CreateBEModal;
