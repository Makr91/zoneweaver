import PropTypes from "prop-types";
import { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";
import { FormModal } from "../common";

const BridgeCreateModal = ({ server, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: "",
    protection: "stp",
    priority: 32768,
    max_age: 20,
    hello_time: 2,
    forward_delay: 15,
    force_protocol: 3,
    links: [],
  });
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [availableLinks, setAvailableLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  const { makeZoneweaverAPIRequest } = useServers();

  // Load available links when modal opens
  useEffect(() => {
    loadAvailableLinks();
  }, [server]);

  const loadAvailableLinks = async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoadingLinks(true);

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "monitoring/network/interfaces",
        "GET"
      );

      console.log("Bridge Link Loading Debug:", {
        result: result.success ? result.data : result,
      });

      if (result.success && result.data?.interfaces) {
        // Filter for links that can be bridged (be more permissive)
        const bridgeableLinks = result.data.interfaces.filter(
          (link) =>
            link.link &&
            (link.class === "phys" || link.class === "vnic" || !link.class)
        );

        // Deduplicate by link name
        const uniqueLinks = bridgeableLinks.filter(
          (link, index, self) =>
            index === self.findIndex((l) => l.link === link.link)
        );

        console.log("Bridge Available Links:", uniqueLinks);
        setAvailableLinks(uniqueLinks);
      }
    } catch (err) {
      console.error("Error loading available links:", err);
    } finally {
      setLoadingLinks(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addLink = () => {
    if (newLink.trim() && !formData.links.includes(newLink.trim())) {
      setFormData((prev) => ({
        ...prev,
        links: [...prev.links, newLink.trim()],
      }));
      setNewLink("");
    }
  };

  const removeLink = (linkToRemove) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((link) => link !== linkToRemove),
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      onError("Bridge name is required");
      return false;
    }

    // Validate bridge name format
    const nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!nameRegex.test(formData.name)) {
      onError(
        "Bridge name must start with a letter and contain only letters, numbers, and underscores"
      );
      return false;
    }

    if (formData.priority < 0 || formData.priority > 65535) {
      onError("Priority must be between 0 and 65535");
      return false;
    }

    if (formData.max_age < 6 || formData.max_age > 40) {
      onError("Max age must be between 6 and 40 seconds");
      return false;
    }

    if (formData.hello_time < 1 || formData.hello_time > 10) {
      onError("Hello time must be between 1 and 10 seconds");
      return false;
    }

    if (formData.forward_delay < 4 || formData.forward_delay > 30) {
      onError("Forward delay must be between 4 and 30 seconds");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);
      onError("");

      const requestData = {
        name: formData.name.trim(),
        protection: formData.protection,
        priority: parseInt(formData.priority),
        max_age: parseInt(formData.max_age),
        hello_time: parseInt(formData.hello_time),
        forward_delay: parseInt(formData.forward_delay),
        force_protocol: parseInt(formData.force_protocol),
        links: formData.links,
        created_by: "api",
      };

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "network/bridges",
        "POST",
        requestData
      );

      if (result.success) {
        onSuccess();
      } else {
        onError(result.message || "Failed to create bridge");
      }
    } catch (err) {
      onError(`Error creating bridge: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Create Bridge"
      icon="fas fa-plus-circle"
      submitText="Create Bridge"
      submitVariant="is-primary"
      loading={creating}
    >
      <div className="field">
        <label htmlFor="bridge-name" className="label">
          Bridge Name *
        </label>
        <div className="control">
          <input
            id="bridge-name"
            className="input"
            type="text"
            placeholder="e.g., bridge0"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            disabled={creating}
            required
          />
        </div>
        <p className="help">
          Must start with a letter and contain only letters, numbers, and
          underscores
        </p>
      </div>

      <div className="columns">
        <div className="column">
          <div className="field">
            <label htmlFor="bridge-protection" className="label">
              Protection
            </label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  id="bridge-protection"
                  value={formData.protection}
                  onChange={(e) =>
                    handleInputChange("protection", e.target.value)
                  }
                  disabled={creating}
                >
                  <option value="stp">STP (Spanning Tree Protocol)</option>
                  <option value="rstp">RSTP (Rapid Spanning Tree)</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="column">
          <div className="field">
            <label htmlFor="bridge-priority" className="label">
              Priority
            </label>
            <div className="control">
              <input
                id="bridge-priority"
                className="input"
                type="number"
                min="0"
                max="65535"
                value={formData.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
                disabled={creating}
              />
            </div>
            <p className="help">0-65535 (default: 32768)</p>
          </div>
        </div>
      </div>

      <div className="columns">
        <div className="column">
          <div className="field">
            <label htmlFor="bridge-max-age" className="label">
              Max Age (seconds)
            </label>
            <div className="control">
              <input
                id="bridge-max-age"
                className="input"
                type="number"
                min="6"
                max="40"
                value={formData.max_age}
                onChange={(e) => handleInputChange("max_age", e.target.value)}
                disabled={creating}
              />
            </div>
            <p className="help">6-40 seconds</p>
          </div>
        </div>
        <div className="column">
          <div className="field">
            <label htmlFor="bridge-hello-time" className="label">
              Hello Time (seconds)
            </label>
            <div className="control">
              <input
                id="bridge-hello-time"
                className="input"
                type="number"
                min="1"
                max="10"
                value={formData.hello_time}
                onChange={(e) =>
                  handleInputChange("hello_time", e.target.value)
                }
                disabled={creating}
              />
            </div>
            <p className="help">1-10 seconds</p>
          </div>
        </div>
        <div className="column">
          <div className="field">
            <label htmlFor="bridge-forward-delay" className="label">
              Forward Delay (seconds)
            </label>
            <div className="control">
              <input
                id="bridge-forward-delay"
                className="input"
                type="number"
                min="4"
                max="30"
                value={formData.forward_delay}
                onChange={(e) =>
                  handleInputChange("forward_delay", e.target.value)
                }
                disabled={creating}
              />
            </div>
            <p className="help">4-30 seconds</p>
          </div>
        </div>
      </div>

      <div className="field">
        <span className="label">Member Links (Optional)</span>
        <div className="field has-addons">
          <div className="control is-expanded">
            <div className="select is-fullwidth">
              <select
                id="bridge-link-select"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                disabled={creating || loadingLinks}
              >
                <option value="">
                  {loadingLinks
                    ? "Loading available links..."
                    : "Select a link to add to bridge"}
                </option>
                {availableLinks
                  .filter((link) => !formData.links.includes(link.link))
                  .map((link) => (
                    <option key={link.link} value={link.link}>
                      {link.link} ({link.class}, {link.state},{" "}
                      {link.speed || "Unknown speed"})
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="control">
            <button
              type="button"
              className="button is-info"
              onClick={addLink}
              disabled={!newLink.trim() || creating}
            >
              Add Link
            </button>
          </div>
        </div>

        {formData.links.length > 0 && (
          <div className="content mt-3">
            <p>
              <strong>Current Links:</strong>
            </p>
            <div className="tags">
              {formData.links.map((link) => (
                <span key={link} className="tag is-info">
                  {link}
                  <button
                    type="button"
                    className="delete is-small"
                    onClick={() => removeLink(link)}
                    disabled={creating}
                  />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </FormModal>
  );
};

BridgeCreateModal.propTypes = {
  server: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

export default BridgeCreateModal;
