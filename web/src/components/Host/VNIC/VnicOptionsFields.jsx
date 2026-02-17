import PropTypes from "prop-types";

const VnicOptionsFields = ({ temporary, onChange, disabled }) => (
  <div className="field">
    <div className="control">
      <label className="checkbox">
        <input
          type="checkbox"
          checked={temporary}
          onChange={(e) => onChange("temporary", e.target.checked)}
          disabled={disabled}
        />
        <span className="ml-2">Temporary (not persistent across reboots)</span>
      </label>
    </div>
  </div>
);

VnicOptionsFields.propTypes = {
  temporary: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default VnicOptionsFields;
