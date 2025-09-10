import { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";
import { FormModal } from "../common";

const EditRepositoryModal = ({
  server,
  repository,
  onClose,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    originsToAdd: [""],
    originsToRemove: [""],
    mirrorsToAdd: [""],
    mirrorsToRemove: [""],
    enabled: true,
    sticky: false,
    searchFirst: false,
    searchBefore: "",
    searchAfter: "",
    sslCert: "",
    sslKey: "",
    proxy: "",
    refresh: false,
  });

  const { makeZoneweaverAPIRequest } = useServers();

  // Initialize form with repository data
  useEffect(() => {
    if (repository) {
      setFormData((prev) => ({
        ...prev,
        enabled: repository.enabled !== false,
        sticky: repository.sticky || false,
        searchFirst: repository.search_first || false,
        searchBefore: repository.search_before || "",
        searchAfter: repository.search_after || "",
        proxy: repository.proxy || "",
      }));
    }
  }, [repository]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayChange = (arrayName, index, value) => {
    const newArray = [...formData[arrayName]];
    newArray[index] = value;
    setFormData((prev) => ({
      ...prev,
      [arrayName]: newArray,
    }));
  };

  const addToArray = (arrayName) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: [...prev[arrayName], ""],
    }));
  };

  const removeFromArray = (arrayName, index) => {
    if (formData[arrayName].length > 1) {
      const newArray = formData[arrayName].filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        [arrayName]: newArray,
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      onError("");

      // Build request data with only non-empty arrays
      const requestData = {
        enabled: formData.enabled,
        sticky: formData.sticky,
        search_first: formData.searchFirst,
        refresh: formData.refresh,
        created_by: "api",
      };

      // Add origins to add/remove if specified
      const originsToAdd = formData.originsToAdd.filter((url) => url.trim());
      if (originsToAdd.length > 0) {
        requestData.origins_to_add = originsToAdd;
      }

      const originsToRemove = formData.originsToRemove.filter((url) =>
        url.trim()
      );
      if (originsToRemove.length > 0) {
        requestData.origins_to_remove = originsToRemove;
      }

      // Add mirrors to add/remove if specified
      const mirrorsToAdd = formData.mirrorsToAdd.filter((url) => url.trim());
      if (mirrorsToAdd.length > 0) {
        requestData.mirrors_to_add = mirrorsToAdd;
      }

      const mirrorsToRemove = formData.mirrorsToRemove.filter((url) =>
        url.trim()
      );
      if (mirrorsToRemove.length > 0) {
        requestData.mirrors_to_remove = mirrorsToRemove;
      }

      // Add optional fields
      if (formData.searchBefore.trim()) {
        requestData.search_before = formData.searchBefore.trim();
      }
      if (formData.searchAfter.trim()) {
        requestData.search_after = formData.searchAfter.trim();
      }
      if (formData.sslCert.trim()) {
        requestData.ssl_cert = formData.sslCert.trim();
      }
      if (formData.sslKey.trim()) {
        requestData.ssl_key = formData.sslKey.trim();
      }
      if (formData.proxy.trim()) {
        requestData.proxy = formData.proxy.trim();
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `system/repositories/${encodeURIComponent(repository.name)}`,
        "PUT",
        requestData
      );

      if (result.success) {
        onSuccess();
      } else {
        onError(result.message || "Failed to update repository");
      }
    } catch (err) {
      onError(`Error updating repository: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Edit Repository"
      icon="fas fa-edit"
      submitText="Update Repository"
      submitIcon="fas fa-save"
      submitVariant="is-success"
      loading={loading}
    >
      {/* Current Repository Info */}
      <div className="box mb-4">
        <h3 className="title is-6">Current Repository Information</h3>
        <div className="table-container">
          <table className="table is-fullwidth">
            <tbody>
              <tr>
                <td>
                  <strong>Publisher</strong>
                </td>
                <td className="is-family-monospace">{repository.name}</td>
              </tr>
              <tr>
                <td>
                  <strong>Type</strong>
                </td>
                <td>
                  <span className="tag is-info is-small">
                    {repository.type}
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Current Location</strong>
                </td>
                <td className="is-family-monospace is-size-7">
                  {repository.location}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Origins Management */}
      <div className="box mb-4">
        <h3 className="title is-6">Origins Management</h3>

        <div className="columns">
          <div className="column">
            <label className="label">Add Origins</label>
            {formData.originsToAdd.map((origin, index) => (
              <div key={index} className="field has-addons mb-3">
                <div className="control is-expanded">
                  <input
                    className="input"
                    type="url"
                    placeholder="https://pkg.omnios.org/repository/"
                    value={origin}
                    onChange={(e) =>
                      handleArrayChange("originsToAdd", index, e.target.value)
                    }
                  />
                </div>
                <div className="control">
                  <button
                    type="button"
                    className="button has-background-danger-dark has-text-danger-light"
                    onClick={() => removeFromArray("originsToAdd", index)}
                    disabled={formData.originsToAdd.length === 1}
                  >
                    <span className="icon">
                      <i className="fas fa-trash" />
                    </span>
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="button is-info is-small"
              onClick={() => addToArray("originsToAdd")}
            >
              <span className="icon is-small">
                <i className="fas fa-plus" />
              </span>
              <span>Add Origin</span>
            </button>
          </div>

          <div className="column">
            <label className="label">Remove Origins</label>
            {formData.originsToRemove.map((origin, index) => (
              <div key={index} className="field has-addons mb-3">
                <div className="control is-expanded">
                  <input
                    className="input"
                    type="url"
                    placeholder="URL to remove"
                    value={origin}
                    onChange={(e) =>
                      handleArrayChange(
                        "originsToRemove",
                        index,
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="control">
                  <button
                    type="button"
                    className="button has-background-danger-dark has-text-danger-light"
                    onClick={() => removeFromArray("originsToRemove", index)}
                    disabled={formData.originsToRemove.length === 1}
                  >
                    <span className="icon">
                      <i className="fas fa-trash" />
                    </span>
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="button is-warning is-small"
              onClick={() => addToArray("originsToRemove")}
            >
              <span className="icon is-small">
                <i className="fas fa-minus" />
              </span>
              <span>Remove Origin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mirrors Management */}
      <div className="box mb-4">
        <h3 className="title is-6">Mirrors Management</h3>

        <div className="columns">
          <div className="column">
            <label className="label">Add Mirrors</label>
            {formData.mirrorsToAdd.map((mirror, index) => (
              <div key={index} className="field has-addons mb-3">
                <div className="control is-expanded">
                  <input
                    className="input"
                    type="url"
                    placeholder="https://mirror.example.com/repository/"
                    value={mirror}
                    onChange={(e) =>
                      handleArrayChange("mirrorsToAdd", index, e.target.value)
                    }
                  />
                </div>
                <div className="control">
                  <button
                    type="button"
                    className="button has-background-danger-dark has-text-danger-light"
                    onClick={() => removeFromArray("mirrorsToAdd", index)}
                    disabled={formData.mirrorsToAdd.length === 1}
                  >
                    <span className="icon">
                      <i className="fas fa-trash" />
                    </span>
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="button is-info is-small"
              onClick={() => addToArray("mirrorsToAdd")}
            >
              <span className="icon is-small">
                <i className="fas fa-plus" />
              </span>
              <span>Add Mirror</span>
            </button>
          </div>

          <div className="column">
            <label className="label">Remove Mirrors</label>
            {formData.mirrorsToRemove.map((mirror, index) => (
              <div key={index} className="field has-addons mb-3">
                <div className="control is-expanded">
                  <input
                    className="input"
                    type="url"
                    placeholder="URL to remove"
                    value={mirror}
                    onChange={(e) =>
                      handleArrayChange(
                        "mirrorsToRemove",
                        index,
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="control">
                  <button
                    type="button"
                    className="button has-background-danger-dark has-text-danger-light"
                    onClick={() => removeFromArray("mirrorsToRemove", index)}
                    disabled={formData.mirrorsToRemove.length === 1}
                  >
                    <span className="icon">
                      <i className="fas fa-trash" />
                    </span>
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="button is-warning is-small"
              onClick={() => addToArray("mirrorsToRemove")}
            >
              <span className="icon is-small">
                <i className="fas fa-minus" />
              </span>
              <span>Remove Mirror</span>
            </button>
          </div>
        </div>
      </div>

      {/* Repository Options */}
      <div className="box mb-4">
        <h3 className="title is-6">Repository Options</h3>

        <div className="columns">
          <div className="column">
            <div className="field">
              <div className="control">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) =>
                      handleInputChange("enabled", e.target.checked)
                    }
                  />
                  <span className="ml-2">
                    <strong>Enabled</strong> - Repository is active for package
                    operations
                  </span>
                </label>
              </div>
            </div>

            <div className="field">
              <div className="control">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={formData.sticky}
                    onChange={(e) =>
                      handleInputChange("sticky", e.target.checked)
                    }
                  />
                  <span className="ml-2">
                    <strong>Sticky</strong> - Prefer packages from this
                    publisher
                  </span>
                </label>
              </div>
            </div>

            <div className="field">
              <div className="control">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={formData.searchFirst}
                    onChange={(e) =>
                      handleInputChange("searchFirst", e.target.checked)
                    }
                  />
                  <span className="ml-2">
                    <strong>Search First</strong> - Search this repository first
                  </span>
                </label>
              </div>
            </div>

            <div className="field">
              <div className="control">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={formData.refresh}
                    onChange={(e) =>
                      handleInputChange("refresh", e.target.checked)
                    }
                  />
                  <span className="ml-2">
                    <strong>Refresh</strong> - Refresh repository metadata after
                    update
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="column">
            <div className="field">
              <label className="label">Search Before</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Publisher name"
                  value={formData.searchBefore}
                  onChange={(e) =>
                    handleInputChange("searchBefore", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Search After</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Publisher name"
                  value={formData.searchAfter}
                  onChange={(e) =>
                    handleInputChange("searchAfter", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Proxy</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="http://proxy.example.com:8080"
                  value={formData.proxy}
                  onChange={(e) => handleInputChange("proxy", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SSL Configuration */}
      <div className="box">
        <h3 className="title is-6">SSL Configuration (Optional)</h3>

        <div className="field">
          <label className="label">SSL Certificate</label>
          <div className="control">
            <textarea
              className="textarea"
              placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              value={formData.sslCert}
              onChange={(e) => handleInputChange("sslCert", e.target.value)}
              rows="3"
            />
          </div>
        </div>

        <div className="field">
          <label className="label">SSL Private Key</label>
          <div className="control">
            <textarea
              className="textarea"
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              value={formData.sslKey}
              onChange={(e) => handleInputChange("sslKey", e.target.value)}
              rows="3"
            />
          </div>
        </div>
      </div>
    </FormModal>
  );
};

export default EditRepositoryModal;
