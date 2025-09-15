import { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";
import { FormModal } from "../common";

const VlanCreateModal = ({ server, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    vid: "",
    link: "",
    name: "",
    force: false,
    temporary: false,
  });
  const [creating, setCreating] = useState(false);
  const [availableLinks, setAvailableLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  const { makeZoneweaverAPIRequest } = useServers();

  // Load available links when modal opens
  useEffect(() => {
    loadAvailableLinks();
  }, [server]);

  // Auto-generate VLAN name when VID or link changes
  useEffect(() => {
    if (formData.vid && formData.link) {
      generateVlanName();
    }
  }, [formData.vid, formData.link]);

  const generateVlanName = async () => {
    if (!formData.vid || !formData.link) {
      return;
    }

    try {
      // Get existing VLANs to check for conflicts
      const vlansResult = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "network/vlans",
        "GET"
      );

      const existingVlans = vlansResult.success
        ? vlansResult.data?.vlans || []
        : [];
      const existingNames = new Set(
        existingVlans.map((vlan) => vlan.link).filter(Boolean)
      );

      // Generate name following common pattern: <base_name><1000 * vid + ppa>
      // For example: ixgbe0 + VID 100 = ixgbe100000
      let suggestedName = `${formData.link}${formData.vid}000`;
      let counter = 0;

      // If name already exists, try variations
      while (existingNames.has(suggestedName) && counter < 100) {
        counter++;
        suggestedName = `${formData.link}${formData.vid}${counter.toString().padStart(3, '0')}`;
      }

      setFormData((prev) => ({
        ...prev,
        name: suggestedName,
      }));
    } catch (err) {
      console.error("Error generating VLAN name:", err);
      // Fallback to simple naming
      const fallbackName = `${formData.link}${formData.vid}000`;
      setFormData((prev) => ({
        ...prev,
        name: fallbackName,
      }));
    }
  };

  const loadAvailableLinks = async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoadingLinks(true);

      // Load physical links that VLANs can be created on
      const linksResult = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "monitoring/network/interfaces",
        "GET"
      );

      console.log("VLAN Link Loading Debug:", {
        linksResult: linksResult.success ? linksResult.data : linksResult,
      });

      const availableOptions = [];

      // Add physical links from monitoring/network/interfaces
      if (linksResult.success && linksResult.data?.interfaces) {
        linksResult.data.interfaces.forEach((link) => {
          // Only include physical interfaces for VLAN creation
          if (link.class === "phys" && link.link) {
            availableOptions.push({
              name: link.link,
              type: "Physical",
              state: link.state || "unknown",
              speed: link.speed || "unknown",
            });
          }
        });
      }

      // Deduplicate by name and filter out empty names
      const uniqueOptions = availableOptions
        .filter((option) => option.name && option.name.trim())
        .filter(
          (option, index, self) =>
            index === self.findIndex((o) => o.name === option.name)
        );

      console.log("VLAN Available Links:", uniqueOptions);
      setAvailableLinks(uniqueOptions);
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

  const validateForm = () => {
    if (!formData.vid) {
      onError("VLAN ID is required");
      return false;
    }

    const vlanId = parseInt(formData.vid);
    if (isNaN(vlanId) || vlanId < 1 || vlanId > 4094) {
      onError("VLAN ID must be between 1 and 4094");
      return false;
    }

    if (!formData.link.trim()) {
      onError("Physical link is required");
      return false;
    }

    // Validate VLAN name format if provided
    if (formData.name) {
      const nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
      if (!nameRegex.test(formData.name)) {
        onError(
          "VLAN name must start with a letter and contain only letters, numbers, and underscores"
        );
        return false;
      }
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
        vid: parseInt(formData.vid),
        link: formData.link.trim(),
        force: formData.force,
        temporary: formData.temporary,
        created_by: "api",
      };

      // Add optional custom name
      if (formData.name.trim()) {
        requestData.name = formData.name.trim();
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "network/vlans",
        "POST",
        requestData
      );

      if (result.success) {
        onSuccess();
      } else {
        onError(result.message || "Failed to create VLAN");
      }
    } catch (err) {
      onError(`Error creating VLAN: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Create VLAN"
      icon="fas fa-tags"
      submitText="Create VLAN"
      submitVariant="is-primary"
      loading={creating}
    >
      <div className="columns">
        <div className="column">
          <div className="field">
            <label className="label">VLAN ID *</label>
            <div className="control">
              <input
                className="input"
                type="number"
                min="1"
                max="4094"
                placeholder="e.g., 100"
                value={formData.vid}
                onChange={(e) => handleInputChange("vid", e.target.value)}
                disabled={creating}
                required
              />
            </div>
            <p className="help">Valid range: 1-4094</p>
          </div>
        </div>
        <div className="column">
          <div className="field">
            <label className="label">Physical Link *</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  value={formData.link}
                  onChange={(e) => handleInputChange("link", e.target.value)}
                  disabled={creating || loadingLinks}
                  required
                >
                  <option value="">
                    {loadingLinks
                      ? "Loading available links..."
                      : "Select physical interface"}
                  </option>
                  {availableLinks.map((link, index) => (
                    <option key={index} value={link.name}>
                      {link.name} ({link.state}, {link.speed})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="field">
        <label className="label">VLAN Name (Optional)</label>
        <div className="control">
          <input
            className="input"
            type="text"
            placeholder="Auto-generated based on VID and link"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            disabled={creating}
          />
        </div>
        <p className="help">
          Auto-generated when you select VID and link. Leave empty to use default.
        </p>
      </div>

      <div className="field">
        <div className="control">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={formData.force}
              onChange={(e) => handleInputChange("force", e.target.checked)}
              disabled={creating}
            />
            <span className="ml-2">
              Force creation (override compatibility checks)
            </span>
          </label>
        </div>
        <p className="help is-size-7">
          Use with caution - forces VLAN creation even on incompatible devices
        </p>
      </div>

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

export default VlanCreateModal;
