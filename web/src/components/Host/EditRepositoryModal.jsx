import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";

import { useServers } from "../../contexts/ServerContext";
import { FormModal } from "../common";

import UrlListEditor from "./UrlListEditor";

const EditRepositoryModal = ({
  server,
  repository,
  onClose,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const nextEntryId = useRef(1);
  const [formData, setFormData] = useState({
    originsToAdd: [{ id: 0, value: "" }],
    originsToRemove: [{ id: 0, value: "" }],
    mirrorsToAdd: [{ id: 0, value: "" }],
    mirrorsToRemove: [{ id: 0, value: "" }],
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

  const handleArrayChange = (arrayName, id, value) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].map((entry) =>
        entry.id === id ? { ...entry, value } : entry
      ),
    }));
  };

  const addToArray = (arrayName) => {
    const id = nextEntryId.current;
    nextEntryId.current += 1;
    setFormData((prev) => ({
      ...prev,
      [arrayName]: [...prev[arrayName], { id, value: "" }],
    }));
  };

  const removeFromArray = (arrayName, id) => {
    setFormData((prev) => {
      if (prev[arrayName].length <= 1) {
        return prev;
      }
      return {
        ...prev,
        [arrayName]: prev[arrayName].filter((entry) => entry.id !== id),
      };
    });
  };

  const extractValues = (entries) =>
    entries.map((entry) => entry.value.trim()).filter(Boolean);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      onError("");

      const requestData = {
        enabled: formData.enabled,
        sticky: formData.sticky,
        search_first: formData.searchFirst,
        refresh: formData.refresh,
        created_by: "api",
      };

      const originsToAdd = extractValues(formData.originsToAdd);
      if (originsToAdd.length > 0) {
        requestData.origins_to_add = originsToAdd;
      }

      const originsToRemove = extractValues(formData.originsToRemove);
      if (originsToRemove.length > 0) {
        requestData.origins_to_remove = originsToRemove;
      }

      const mirrorsToAdd = extractValues(formData.mirrorsToAdd);
      if (mirrorsToAdd.length > 0) {
        requestData.mirrors_to_add = mirrorsToAdd;
      }

      const mirrorsToRemove = extractValues(formData.mirrorsToRemove);
      if (mirrorsToRemove.length > 0) {
        requestData.mirrors_to_remove = mirrorsToRemove;
      }

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
            <UrlListEditor
              label="Add Origins"
              entries={formData.originsToAdd}
              placeholder="https://pkg.omnios.org/repository/"
              onEntryChange={(id, value) =>
                handleArrayChange("originsToAdd", id, value)
              }
              onAdd={() => addToArray("originsToAdd")}
              onRemove={(id) => removeFromArray("originsToAdd", id)}
              addButtonText="Add Origin"
              addButtonClass="is-info"
              addButtonIcon="fa-plus"
            />
          </div>
          <div className="column">
            <UrlListEditor
              label="Remove Origins"
              entries={formData.originsToRemove}
              placeholder="URL to remove"
              onEntryChange={(id, value) =>
                handleArrayChange("originsToRemove", id, value)
              }
              onAdd={() => addToArray("originsToRemove")}
              onRemove={(id) => removeFromArray("originsToRemove", id)}
              addButtonText="Remove Origin"
              addButtonClass="is-warning"
              addButtonIcon="fa-minus"
            />
          </div>
        </div>
      </div>

      {/* Mirrors Management */}
      <div className="box mb-4">
        <h3 className="title is-6">Mirrors Management</h3>
        <div className="columns">
          <div className="column">
            <UrlListEditor
              label="Add Mirrors"
              entries={formData.mirrorsToAdd}
              placeholder="https://mirror.example.com/repository/"
              onEntryChange={(id, value) =>
                handleArrayChange("mirrorsToAdd", id, value)
              }
              onAdd={() => addToArray("mirrorsToAdd")}
              onRemove={(id) => removeFromArray("mirrorsToAdd", id)}
              addButtonText="Add Mirror"
              addButtonClass="is-info"
              addButtonIcon="fa-plus"
            />
          </div>
          <div className="column">
            <UrlListEditor
              label="Remove Mirrors"
              entries={formData.mirrorsToRemove}
              placeholder="URL to remove"
              onEntryChange={(id, value) =>
                handleArrayChange("mirrorsToRemove", id, value)
              }
              onAdd={() => addToArray("mirrorsToRemove")}
              onRemove={(id) => removeFromArray("mirrorsToRemove", id)}
              addButtonText="Remove Mirror"
              addButtonClass="is-warning"
              addButtonIcon="fa-minus"
            />
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
              <label htmlFor="repo-search-before" className="label">
                Search Before
              </label>
              <div className="control">
                <input
                  id="repo-search-before"
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
              <label htmlFor="repo-search-after" className="label">
                Search After
              </label>
              <div className="control">
                <input
                  id="repo-search-after"
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
              <label htmlFor="repo-proxy" className="label">
                Proxy
              </label>
              <div className="control">
                <input
                  id="repo-proxy"
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
          <label htmlFor="repo-ssl-cert" className="label">
            SSL Certificate
          </label>
          <div className="control">
            <textarea
              id="repo-ssl-cert"
              className="textarea"
              placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              value={formData.sslCert}
              onChange={(e) => handleInputChange("sslCert", e.target.value)}
              rows="3"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="repo-ssl-key" className="label">
            SSL Private Key
          </label>
          <div className="control">
            <textarea
              id="repo-ssl-key"
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

EditRepositoryModal.propTypes = {
  server: PropTypes.object.isRequired,
  repository: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

export default EditRepositoryModal;
