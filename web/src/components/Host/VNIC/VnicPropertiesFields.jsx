import PropTypes from "prop-types";
import { useState } from "react";

const commonProperties = [
  "maxbw",
  "priority",
  "cpus",
  "protection",
  "allowed-ips",
  "allowed-dhcp-cids",
  "rxrings",
  "txrings",
  "mtu",
  "cos",
  "pvid",
  "ethertype",
];

const propertyValueOptions = {
  priority: ["low", "medium", "high"],
  protection: ["mac-nospoof", "restricted", "ip-nospoof", "dhcp-nospoof"],
  cos: ["0", "1", "2", "3", "4", "5", "6", "7"],
  ethertype: [
    "0x0800",
    "0x86dd",
    "0x0806",
    "0x8100",
    "0x8137",
    "0x809b",
    "0x8863",
    "0x8864",
  ],
  maxbw: ["10M", "100M", "1G", "10G", "25G", "40G", "100G"],
  rxrings: ["1", "2", "4", "8", "16"],
  txrings: ["1", "2", "4", "8", "16"],
  mtu: ["1500", "9000", "9216", "1514", "1518"],
};

const VnicPropertiesFields = ({
  properties,
  onAddProperty,
  onRemoveProperty,
  disabled,
}) => {
  const [propertyKey, setPropertyKey] = useState("");
  const [propertyValue, setPropertyValue] = useState("");

  const handleAdd = () => {
    if (propertyKey.trim() && propertyValue.trim()) {
      onAddProperty(propertyKey.trim(), propertyValue.trim());
      setPropertyKey("");
      setPropertyValue("");
    }
  };

  const getPropertyValueInput = () => {
    if (propertyValueOptions[propertyKey]) {
      return (
        <div className="select is-fullwidth">
          <select
            value={propertyValue}
            onChange={(e) => setPropertyValue(e.target.value)}
            disabled={disabled}
          >
            <option value="">Select {propertyKey} value</option>
            {propertyValueOptions[propertyKey].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <input
        className="input"
        type="text"
        placeholder="Property value"
        value={propertyValue}
        onChange={(e) => setPropertyValue(e.target.value)}
        disabled={disabled}
      />
    );
  };

  return (
    <div className="field">
      <label className="label" htmlFor="vnic-create-prop-key">
        Additional Properties
      </label>
      <div className="field has-addons">
        <div className="control">
          <div className="select">
            <select
              id="vnic-create-prop-key"
              value={propertyKey}
              onChange={(e) => setPropertyKey(e.target.value)}
              disabled={disabled}
            >
              <option value="">Select property</option>
              {commonProperties
                .filter((prop) => !properties[prop])
                .map((prop) => (
                  <option key={prop} value={prop}>
                    {prop}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="control is-expanded">{getPropertyValueInput()}</div>
        <div className="control">
          <button
            type="button"
            className="button is-info"
            onClick={handleAdd}
            disabled={!propertyKey.trim() || !propertyValue.trim() || disabled}
          >
            Add
          </button>
        </div>
      </div>

      {Object.keys(properties).length > 0 && (
        <div className="content mt-3">
          <p>
            <strong>Current Properties:</strong>
          </p>
          <div className="tags">
            {Object.entries(properties).map(([key, value]) => (
              <span key={key} className="tag is-info">
                {key}={value}
                <button
                  type="button"
                  className="delete is-small"
                  onClick={() => onRemoveProperty(key)}
                  disabled={disabled}
                />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

VnicPropertiesFields.propTypes = {
  properties: PropTypes.object.isRequired,
  onAddProperty: PropTypes.func.isRequired,
  onRemoveProperty: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default VnicPropertiesFields;
