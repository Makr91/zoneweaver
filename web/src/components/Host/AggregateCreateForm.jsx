import PropTypes from "prop-types";

/**
 * Form fields for the Aggregate Create modal.
 * Extracted to keep AggregateCreateModal under 500 lines.
 */
const AggregateCreateForm = ({
  formData,
  creating,
  newLink,
  setNewLink,
  availableLinks,
  loadingLinks,
  onInputChange,
  onAddLink,
  onRemoveLink,
  cdpServiceRunning,
}) => (
  <>
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
          onChange={(e) => onInputChange("name", e.target.value)}
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
      <label htmlFor="aggregate-link-select" className="label">
        Member Links *
      </label>
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
                    {link.link} ({link.state}, {link.speed || "Unknown speed"})
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="control">
          <button
            type="button"
            className="button is-info"
            onClick={onAddLink}
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
                  onClick={() => onRemoveLink(link)}
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
                onChange={(e) => onInputChange("policy", e.target.value)}
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
                onChange={(e) => onInputChange("lacp_mode", e.target.value)}
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
              onChange={(e) => onInputChange("lacp_timer", e.target.value)}
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
          onChange={(e) => onInputChange("unicast_address", e.target.value)}
          disabled={creating}
        />
      </div>
      <p className="help">Leave empty to auto-generate</p>
    </div>

    {cdpServiceRunning && (
      <div className="notification is-warning mb-4">
        <div className="content">
          <p>
            <strong>CDP Service Conflict</strong>
          </p>
          <p>
            The Cisco Discovery Protocol (CDP) service is currently running and
            must be disabled before creating link aggregates.
          </p>

          <div className="field mt-3">
            <div className="control">
              <label htmlFor="aggregate-disable-cdp" className="checkbox">
                <input
                  id="aggregate-disable-cdp"
                  type="checkbox"
                  checked={formData.disableCdp}
                  onChange={(e) =>
                    onInputChange("disableCdp", e.target.checked)
                  }
                  disabled={creating}
                />{" "}
                <strong className="ml-2">
                  Disable CDP service before creating aggregate
                </strong>
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
        <label htmlFor="aggregate-temporary" className="checkbox">
          <input
            id="aggregate-temporary"
            type="checkbox"
            checked={formData.temporary}
            onChange={(e) => onInputChange("temporary", e.target.checked)}
            disabled={creating}
          />{" "}
          Temporary (not persistent across reboots)
        </label>
      </div>
    </div>
  </>
);

AggregateCreateForm.propTypes = {
  formData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    links: PropTypes.arrayOf(PropTypes.string).isRequired,
    policy: PropTypes.string.isRequired,
    lacp_mode: PropTypes.string.isRequired,
    lacp_timer: PropTypes.string.isRequired,
    unicast_address: PropTypes.string.isRequired,
    temporary: PropTypes.bool.isRequired,
    disableCdp: PropTypes.bool.isRequired,
  }).isRequired,
  creating: PropTypes.bool.isRequired,
  newLink: PropTypes.string.isRequired,
  setNewLink: PropTypes.func.isRequired,
  availableLinks: PropTypes.arrayOf(PropTypes.object).isRequired,
  loadingLinks: PropTypes.bool.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onAddLink: PropTypes.func.isRequired,
  onRemoveLink: PropTypes.func.isRequired,
  cdpServiceRunning: PropTypes.bool,
};

export default AggregateCreateForm;
