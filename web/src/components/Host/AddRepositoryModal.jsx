import PropTypes from "prop-types";
import { useRef, useState } from "react";

import { useServers } from "../../contexts/ServerContext";
import { FormModal } from "../common";

const AddRepositoryModal = ({ server, onClose, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const mirrorIdCounter = useRef(1);
  const [formData, setFormData] = useState({
    name: "",
    origin: "",
    mirrors: [{ id: 0, url: "" }],
    enabled: true,
    sticky: false,
    searchFirst: false,
    searchBefore: "",
    searchAfter: "",
    sslCert: "",
    sslKey: "",
    proxy: "",
  });

  const { makeZoneweaverAPIRequest } = useServers();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMirrorChange = (id, value) => {
    setFormData((prev) => ({
      ...prev,
      mirrors: prev.mirrors.map((m) =>
        m.id === id ? { ...m, url: value } : m
      ),
    }));
  };

  const addMirror = () => {
    const nextId = mirrorIdCounter.current;
    mirrorIdCounter.current += 1;
    setFormData((prev) => ({
      ...prev,
      mirrors: [...prev.mirrors, { id: nextId, url: "" }],
    }));
  };

  const removeMirror = (id) => {
    if (formData.mirrors.length > 1) {
      setFormData((prev) => ({
        ...prev,
        mirrors: prev.mirrors.filter((m) => m.id !== id),
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.origin.trim()) {
      onError("Publisher name and origin URL are required");
      return;
    }

    try {
      setLoading(true);
      onError("");

      // Filter out empty mirrors
      const validMirrors = formData.mirrors
        .map((m) => m.url.trim())
        .filter(Boolean);

      const requestData = {
        name: formData.name.trim(),
        origin: formData.origin.trim(),
        mirrors: validMirrors,
        enabled: formData.enabled,
        sticky: formData.sticky,
        search_first: formData.searchFirst,
        created_by: "api",
      };

      // Add optional fields only if they have values
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
        "system/repositories",
        "POST",
        requestData
      );

      if (result.success) {
        onSuccess();
      } else {
        onError(result.message || "Failed to add repository");
      }
    } catch (err) {
      onError(`Error adding repository: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Add Repository"
      icon="fas fa-plus-circle"
      submitText="Add Repository"
      submitIcon="fas fa-plus"
      submitVariant="is-success"
      loading={loading}
    >
      {/* Basic Information */}
      <div className="box mb-4">
        <h3 className="title is-6">Basic Information</h3>

        <div className="field">
          <label htmlFor="repo-publisher-name" className="label">
            Publisher Name *
          </label>
          <div className="control">
            <input
              id="repo-publisher-name"
              className="input"
              type="text"
              placeholder="e.g., omnios, extra.omnios"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>
          <p className="help">The name of the package publisher</p>
        </div>

        <div className="field">
          <label htmlFor="repo-origin-url" className="label">
            Origin URL *
          </label>
          <div className="control">
            <input
              id="repo-origin-url"
              className="input"
              type="url"
              placeholder="https://pkg.omnios.org/r151050/core/"
              value={formData.origin}
              onChange={(e) => handleInputChange("origin", e.target.value)}
              required
            />
          </div>
          <p className="help">The primary repository URL</p>
        </div>
      </div>

      {/* Mirror URLs */}
      <div className="box mb-4">
        <h3 className="title is-6">Mirror URLs (Optional)</h3>

        {formData.mirrors.map((mirror) => (
          <div key={mirror.id} className="field has-addons mb-3">
            <div className="control is-expanded">
              <input
                className="input"
                type="url"
                placeholder="https://mirror.example.com/repository/"
                value={mirror.url}
                onChange={(e) => handleMirrorChange(mirror.id, e.target.value)}
              />
            </div>
            <div className="control">
              <button
                type="button"
                className="button has-background-danger-dark has-text-danger-light"
                onClick={() => removeMirror(mirror.id)}
                disabled={formData.mirrors.length === 1}
              >
                <span className="icon">
                  <i className="fas fa-trash" />
                </span>
              </button>
            </div>
          </div>
        ))}

        <button type="button" className="button is-info" onClick={addMirror}>
          <span className="icon">
            <i className="fas fa-plus" />
          </span>
          <span>Add Mirror</span>
        </button>
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

AddRepositoryModal.propTypes = {
  server: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

export default AddRepositoryModal;
