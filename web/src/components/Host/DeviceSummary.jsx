import PropTypes from "prop-types";

const DeviceSummary = ({
  deviceCategories,
  devicesSummary,
  pptStatus,
  sectionsCollapsed,
  toggleSection,
}) => {
  if (Object.keys(deviceCategories).length === 0) {
    return null;
  }

  return (
    <div className="box mb-4">
      <div className="level is-mobile mb-3">
        <div className="level-left">
          <h4 className="title is-5 mb-0">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-chart-pie" />
              </span>
              <span>Device Categories Summary</span>
            </span>
          </h4>
        </div>
        <div className="level-right">
          <button
            className="button is-small is-ghost"
            onClick={() => toggleSection("summary")}
            title={
              sectionsCollapsed.summary ? "Expand section" : "Collapse section"
            }
          >
            <span className="icon">
              <i
                className={`fas ${sectionsCollapsed.summary ? "fa-chevron-down" : "fa-chevron-up"}`}
              />
            </span>
          </button>
        </div>
      </div>
      {!sectionsCollapsed.summary && (
        <div className="columns">
          <div className="column">
            <div className="field is-grouped is-grouped-multiline">
              {Object.entries(deviceCategories).map(([category, stats]) => (
                <div key={category} className="control">
                  <div className="tags has-addons">
                    <span className="tag">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                    <span className="tag is-info">{stats.total || 0}</span>
                  </div>
                </div>
              ))}
              <div className="control">
                <div className="tags has-addons">
                  <span className="tag">PPT Capable</span>
                  <span className="tag is-success">
                    {devicesSummary.ppt_capable ||
                      Object.values(deviceCategories).reduce(
                        (total, cat) => total + (cat.ppt_capable || 0),
                        0
                      )}
                  </span>
                </div>
              </div>
              <div className="control">
                <div className="tags has-addons">
                  <span className="tag">PPT Available</span>
                  <span className="tag is-warning">
                    {pptStatus.summary?.available || 0}
                  </span>
                </div>
              </div>
              <div className="control">
                <div className="tags has-addons">
                  <span className="tag">PPT Assigned</span>
                  <span className="tag is-danger">
                    {devicesSummary.ppt_assigned || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DeviceSummary.propTypes = {
  deviceCategories: PropTypes.object.isRequired,
  devicesSummary: PropTypes.object.isRequired,
  pptStatus: PropTypes.object.isRequired,
  sectionsCollapsed: PropTypes.object.isRequired,
  toggleSection: PropTypes.func.isRequired,
};

export default DeviceSummary;
