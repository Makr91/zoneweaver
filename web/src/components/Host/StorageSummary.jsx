import PropTypes from "prop-types";

const StorageSummary = ({
  storagePools,
  storageDatasets,
  storageDisks,
  sectionsCollapsed,
  toggleSection,
}) => {
  if (
    storagePools.length === 0 &&
    storageDatasets.length === 0 &&
    storageDisks.length === 0
  ) {
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
              <span>Storage Summary</span>
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
              <div className="control">
                <div className="tags has-addons">
                  <span className="tag">Total Pools</span>
                  <span className="tag is-info">{storagePools.length}</span>
                </div>
              </div>
              <div className="control">
                <div className="tags has-addons">
                  <span className="tag">Total Datasets</span>
                  <span className="tag is-info">{storageDatasets.length}</span>
                </div>
              </div>
              <div className="control">
                <div className="tags has-addons">
                  <span className="tag">Physical Disks</span>
                  <span className="tag is-info">{storageDisks.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

StorageSummary.propTypes = {
  storagePools: PropTypes.array.isRequired,
  storageDatasets: PropTypes.array.isRequired,
  storageDisks: PropTypes.array.isRequired,
  sectionsCollapsed: PropTypes.object.isRequired,
  toggleSection: PropTypes.func.isRequired,
};

export default StorageSummary;
