import PropTypes from "prop-types";

const VnicBasicFields = ({
  name,
  link,
  availableLinks,
  loadingLinks,
  onChange,
  disabled,
}) => (
  <div className="columns">
    <div className="column">
      <div className="field">
        <label className="label" htmlFor="vnic-create-name">
          VNIC Name *
        </label>
        <div className="control">
          <input
            id="vnic-create-name"
            className="input"
            type="text"
            placeholder="Auto-generated based on link"
            value={name}
            onChange={(e) => onChange("name", e.target.value)}
            disabled={disabled}
            required
          />
        </div>
        <p className="help">
          Auto-generated when you select a link. Must start with a letter.
        </p>
      </div>
    </div>
    <div className="column">
      <div className="field">
        <label className="label" htmlFor="vnic-create-link">
          Physical Link *
        </label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              id="vnic-create-link"
              value={link}
              onChange={(e) => onChange("link", e.target.value)}
              disabled={disabled || loadingLinks}
              required
            >
              <option value="">
                {loadingLinks
                  ? "Loading available links..."
                  : "Select a link to attach VNIC to"}
              </option>
              {availableLinks.map((l) => (
                <option key={l.name} value={l.name}>
                  {l.name} ({l.type}, {l.state}, {l.speed})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
);

VnicBasicFields.propTypes = {
  name: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  availableLinks: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
      state: PropTypes.string,
      speed: PropTypes.string,
    })
  ).isRequired,
  loadingLinks: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default VnicBasicFields;
