import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import { useServers } from "../../contexts/ServerContext";
import { FormModal } from "../common";

const AggregateCreateModal = ({
  server,
  existingAggregates,
  cdpServiceRunning,
  onClose,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    links: [],
    policy: "L4",
    lacp_mode: "off",
    lacp_timer: "short",
    unicast_address: "",
    temporary: false,
    disableCdp: false,
  });
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [availableLinks, setAvailableLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [currentStep, setCurrentStep] = useState("");

  const { makeZoneweaverAPIRequest } = useServers();

  // Generate next available aggregate name
  const generateNextAggregateName = useCallback(() => {
    if (!existingAggregates) {
      return "aggr0";
    }

    // Extract numeric suffixes from existing aggregate names
    // Handle both .name and .link fields from JSON response
    const existingNumbers = existingAggregates
      .map((agg) => agg.name || agg.link)
      .filter((name) => name && name.startsWith("aggr"))
      .map((name) => {
        const match = name.match(/^aggr(?:\d+)$/);
        return match ? parseInt(name.slice(4), 10) : -1;
      })
      .filter((num) => num >= 0)
      .sort((a, b) => a - b);

    // Find the next available number
    let nextNumber = 0;
    for (const num of existingNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }

    return `aggr${nextNumber}`;
  }, [existingAggregates]);

  const loadAvailableLinks = useCallback(async () => {
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

      console.log("Aggregate Link Loading Debug:", {
        result: result.success ? result.data : result,
      });

      if (result.success && result.data?.interfaces) {
        // Filter for physical links that can be aggregated (be more permissive)
        const physicalLinks = result.data.interfaces.filter(
          (link) =>
            link.class === "phys" || (link.link && link.class !== "vnic")
        );

        // Deduplicate by link name
        const uniqueLinks = physicalLinks.filter(
          (link, index, self) =>
            index === self.findIndex((l) => l.link === link.link)
        );

        console.log("Aggregate Available Links:", uniqueLinks);
        setAvailableLinks(uniqueLinks);
      }
    } catch (err) {
      console.error("Error loading available links:", err);
    } finally {
      setLoadingLinks(false);
    }
  }, [server, makeZoneweaverAPIRequest]);

  // Load available physical links and set default name when modal opens
  useEffect(() => {
    loadAvailableLinks();

    // Set the default aggregate name
    const defaultName = generateNextAggregateName();
    setFormData((prev) => ({
      ...prev,
      name: defaultName,
    }));
  }, [server, existingAggregates, loadAvailableLinks, generateNextAggregateName]);

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
      onError("Aggregate name is required");
      return false;
    }

    if (formData.links.length === 0) {
      onError("At least one link is required");
      return false;
    }

    // Validate aggregate name format
    const nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!nameRegex.test(formData.name)) {
      onError(
        "Aggregate name must start with a letter and contain only letters, numbers, and underscores"
      );
      return false;
    }

    // Validate MAC address if provided
    if (formData.unicast_address) {
      const macRegex = /^(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
      if (!macRegex.test(formData.unicast_address)) {
        onError("Invalid MAC address format (must be XX:XX:XX:XX:XX:XX)");
        return false;
      }
    }

    return true;
  };

  const disableCdpService = async () => {
    setCurrentStep("Disabling CDP service...");

    const result = await makeZoneweaverAPIRequest(
      server.hostname,
      server.port,
      server.protocol,
      "services/action",
      "POST",
      {
        action: "disable",
        fmri: "svc:/network/cdp:default",
        created_by: "api",
      }
    );

    if (!result.success) {
      throw new Error(result.message || "Failed to disable CDP service");
    }

    return result;
  };

  const createAggregate = async () => {
    setCurrentStep("Creating link aggregate...");

    const requestData = {
      name: formData.name.trim(),
      links: formData.links,
      policy: formData.policy,
      lacp_mode: formData.lacp_mode,
      lacp_timer: formData.lacp_timer,
      temporary: formData.temporary,
      created_by: "api",
    };

    // Add optional MAC address
    if (formData.unicast_address.trim()) {
      requestData.unicast_address = formData.unicast_address.trim();
    }

    const result = await makeZoneweaverAPIRequest(
      server.hostname,
      server.port,
      server.protocol,
      "network/aggregates",
      "POST",
      requestData
    );

    if (!result.success) {
      throw new Error(result.message || "Failed to create link aggregate");
    }

    return result;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Check if CDP needs to be disabled but user hasn't checked the option
    if (cdpServiceRunning && !formData.disableCdp) {
      onError(
        'CDP service is running. Please check "Disable CDP service" to proceed.'
      );
      return;
    }

    try {
      setCreating(true);
      onError("");
      setCurrentStep("");

      // Step 1: Disable CDP service if needed
      if (cdpServiceRunning && formData.disableCdp) {
        await disableCdpService();
      }

      // Step 2: Create the aggregate
      await createAggregate();

      setCurrentStep("Aggregate created successfully!");
      onSuccess();
    } catch (err) {
      onError(
        `${currentStep ? `${currentStep.replace("...", "")}: ` : ""}${err.message}`
      );
    } finally {
      setCreating(false);
      setCurrentStep("");
    }
  };

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Create Aggregate"
      icon="fas fa-plus-circle"
      submitText="Create Aggregate"
      submitVariant="is-primary"
      loading={creating}
      additionalActions={
        currentStep && (
          <div className="level-item">
            <p className="has-text-info">
              <span className="icon mr-1">
                <i className="fas fa-spinner fa-spin" />
              </span>
              {currentStep}
            </p>
          </div>
        )
      }
    >
      <div className="field">
        <label htmlFor="aggregate-name" className="label">
          Aggregate Name *
        </label>
        <div className="control">
          <input
            id="aggregate-name"
            className="input"
            type="text"
            placeholder="e.g., aggr0"
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

      <div className="field">
        <span className="label">Member Links *</span>
        <div className="field has-addons">
          <div className="control is-expanded">
            <div className="select is-fullwidth">
              <select
                id="aggregate-link-select"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                disabled={creating || loadingLinks}
              >
                <option value="">
                  {loadingLinks
                    ? "Loading physical links..."
                    : "Select a physical link to add"}
                </option>
                {availableLinks
                  .filter((link) => !formData.links.includes(link.link))
                  .map((link) => (
                    <option key={link.link} value={link.link}>
                      {link.link} ({link.state}, {link.speed || "Unknown speed"}
                      )
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

      <div className="columns">
        <div className="column">
          <div className="field">
            <label htmlFor="aggregate-policy" className="label">
              Load Balancing Policy
            </label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  id="aggregate-policy"
                  value={formData.policy}
                  onChange={(e) => handleInputChange("policy", e.target.value)}
                  disabled={creating}
                >
                  <option value="L2">L2 - MAC based</option>
                  <option value="L3">L3 - IP based</option>
                  <option value="L4">L4 - IP + Port based</option>
                  <option value="L2L3">L2L3 - MAC + IP</option>
                  <option value="L2L4">L2L4 - MAC + IP + Port</option>
                  <option value="L3L4">L3L4 - IP + Port</option>
                  <option value="L2L3L4">L2L3L4 - All layers</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="column">
          <div className="field">
            <label htmlFor="aggregate-lacp-mode" className="label">
              LACP Mode
            </label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  id="aggregate-lacp-mode"
                  value={formData.lacp_mode}
                  onChange={(e) =>
                    handleInputChange("lacp_mode", e.target.value)
                  }
                  disabled={creating}
                >
                  <option value="off">Off</option>
                  <option value="active">Active</option>
                  <option value="passive">Passive</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {formData.lacp_mode !== "off" && (
        <div className="field">
          <label htmlFor="aggregate-lacp-timer" className="label">
            LACP Timer
          </label>
          <div className="control">
            <div className="select is-fullwidth">
              <select
                id="aggregate-lacp-timer"
                value={formData.lacp_timer}
                onChange={(e) =>
                  handleInputChange("lacp_timer", e.target.value)
                }
                disabled={creating}
              >
                <option value="short">Short (1 second)</option>
                <option value="long">Long (30 seconds)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="aggregate-mac" className="label">
          MAC Address (Optional)
        </label>
        <div className="control">
          <input
            id="aggregate-mac"
            className="input"
            type="text"
            placeholder="XX:XX:XX:XX:XX:XX"
            value={formData.unicast_address}
            onChange={(e) =>
              handleInputChange("unicast_address", e.target.value)
            }
            disabled={creating}
          />
        </div>
        <p className="help">Leave empty to auto-generate</p>
      </div>

      {/* CDP Service Warning and Toggle */}
      {cdpServiceRunning && (
        <div className="notification is-warning mb-4">
          <div className="content">
            <p>
              <strong>CDP Service Conflict</strong>
            </p>
            <p>
              The Cisco Discovery Protocol (CDP) service is currently running
              and must be disabled before creating link aggregates.
            </p>

            <div className="field mt-3">
              <div className="control">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={formData.disableCdp}
                    onChange={(e) =>
                      handleInputChange("disableCdp", e.target.checked)
                    }
                    disabled={creating}
                  />
                  <span className="ml-2">
                    <strong>
                      Disable CDP service before creating aggregate
                    </strong>
                  </span>
                </label>
              </div>
              <p className="help">
                This will stop the CDP service to allow aggregate creation. You
                can re-enable it later from the Services page.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="field">
        <div className="control">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={formData.temporary}
              onChange={(e) => handleInputChange("temporary", e.target.checked)}
              disabled={creating}
            />
            <span className="ml-2">
              Temporary (not persistent across reboots)
            </span>
          </label>
        </div>
      </div>
    </FormModal>
  );
};

AggregateCreateModal.propTypes = {
  server: PropTypes.object.isRequired,
  existingAggregates: PropTypes.array,
  cdpServiceRunning: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

export default AggregateCreateModal;
