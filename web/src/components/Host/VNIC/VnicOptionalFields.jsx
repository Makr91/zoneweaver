import PropTypes from "prop-types";

const VnicOptionalFields = ({ vlanId, macAddress, onChange, disabled }) => (
  <div className="columns">
    <div className="column">
      <div className="field">
        <label className="label" htmlFor="vnic-create-vlan">
          VLAN ID (Optional)
        </label>
        <div className="control">
          <input
            id="vnic-create-vlan"
            className="input"
            type="number"
            min="1"
            max="4094"
            placeholder="e.g., 100"
            value={vlanId}
            onChange={(e) => onChange("vlan_id", e.target.value)}
            disabled={disabled}
          />
        </div>
        <p className="help">1-4094 (leave empty for untagged)</p>
      </div>
    </div>
    <div className="column">
      <div className="field">
        <label className="label" htmlFor="vnic-create-mac">
          MAC Address (Optional)
        </label>
        <div className="control">
          <input
            id="vnic-create-mac"
            className="input"
            type="text"
            placeholder="XX:XX:XX:XX:XX:XX"
            value={macAddress}
            onChange={(e) => onChange("mac_address", e.target.value)}
            disabled={disabled}
          />
        </div>
        <p className="help">Leave empty to auto-generate</p>
      </div>
    </div>
  </div>
);

VnicOptionalFields.propTypes = {
  vlanId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  macAddress: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default VnicOptionalFields;
