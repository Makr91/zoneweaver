import PropTypes from "prop-types";

const UrlListEditor = ({
  label,
  entries,
  placeholder,
  onEntryChange,
  onAdd,
  onRemove,
  addButtonText,
  addButtonClass,
  addButtonIcon,
}) => (
  <div>
    <span className="label">{label}</span>
    {entries.map((entry) => (
      <div key={entry.id} className="field has-addons mb-3">
        <div className="control is-expanded">
          <input
            className="input"
            type="url"
            placeholder={placeholder}
            value={entry.value}
            onChange={(e) => onEntryChange(entry.id, e.target.value)}
          />
        </div>
        <div className="control">
          <button
            type="button"
            className="button has-background-danger-dark has-text-danger-light"
            onClick={() => onRemove(entry.id)}
            disabled={entries.length === 1}
          >
            <span className="icon">
              <i className="fas fa-trash" />
            </span>
          </button>
        </div>
      </div>
    ))}
    <button
      type="button"
      className={`button is-small ${addButtonClass}`}
      onClick={onAdd}
    >
      <span className="icon is-small">
        <i className={`fas ${addButtonIcon}`} />
      </span>
      <span>{addButtonText}</span>
    </button>
  </div>
);

UrlListEditor.propTypes = {
  label: PropTypes.string.isRequired,
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      value: PropTypes.string.isRequired,
    })
  ).isRequired,
  placeholder: PropTypes.string.isRequired,
  onEntryChange: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  addButtonText: PropTypes.string.isRequired,
  addButtonClass: PropTypes.string.isRequired,
  addButtonIcon: PropTypes.string.isRequired,
};

export default UrlListEditor;
