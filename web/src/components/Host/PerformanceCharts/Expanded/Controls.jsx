import PropTypes from "prop-types";

const ExpandedChartControls = ({ visibility, setVisibility, labels }) => (
  <div className="mb-4">
    <div className="field is-grouped is-grouped-centered">
      {Object.entries(labels).map(([key, { label, className }]) => (
        <div className="control" key={key}>
          <button
            className={`button is-small ${
              visibility[key] ? className : "is-dark"
            }`}
            onClick={() =>
              setVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            title={`Toggle ${label} visibility`}
          >
            <span className="icon">
              <i
                className={`fas ${visibility[key] ? "fa-eye" : "fa-eye-slash"}`}
              />
            </span>
            <span>{label}</span>
          </button>
        </div>
      ))}
    </div>
  </div>
);

ExpandedChartControls.propTypes = {
  visibility: PropTypes.object.isRequired,
  setVisibility: PropTypes.func.isRequired,
  labels: PropTypes.object.isRequired,
};

export default ExpandedChartControls;
