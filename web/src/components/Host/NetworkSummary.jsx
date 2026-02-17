const NetworkSummary = ({
  networkInterfaces,
  sectionsCollapsed,
  toggleSection,
}) => {
  if (networkInterfaces.length === 0) {
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
              <span>Network Summary</span>
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
                  <span className="tag">Total Interfaces</span>
                  <span className="tag is-info">
                    {networkInterfaces.length}
                  </span>
                </div>
              </div>
              <div className="control">
                <div className="tags has-addons">
                  <span className="tag">Physical</span>
                  <span className="tag is-primary">
                    {networkInterfaces.filter((i) => i.class === "phys").length}
                  </span>
                </div>
              </div>
              <div className="control">
                <div className="tags has-addons">
                  <span className="tag">Virtual</span>
                  <span className="tag is-info">
                    {networkInterfaces.filter((i) => i.class === "vnic").length}
                  </span>
                </div>
              </div>
              <div className="control">
                <div className="tags has-addons">
                  <span className="tag">Up</span>
                  <span className="tag is-success">
                    {networkInterfaces.filter((i) => i.state === "up").length}
                  </span>
                </div>
              </div>
              <div className="control">
                <div className="tags has-addons">
                  <span className="tag">Down</span>
                  <span className="tag is-danger">
                    {networkInterfaces.filter((i) => i.state === "down").length}
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

export default NetworkSummary;
