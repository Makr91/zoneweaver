import React from "react";

const RoutingTable = ({ routes, sectionsCollapsed, toggleSection }) => (
  <div className="box mb-4">
    <div className="level is-mobile mb-3">
      <div className="level-left">
        <h4 className="title is-5 mb-0">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-route"></i>
            </span>
            <span>Routing Table</span>
          </span>
        </h4>
      </div>
      <div className="level-right">
        <button
                      className='button is-small is-ghost'
                      onClick={() => toggleSection('routingTable')}
                      title={sectionsCollapsed.routingTable ? 'Expand section' : 'Collapse section'}
        >
          <span className="icon">
            <i
              className={`fas ${sectionsCollapsed.routingTable ? "fa-chevron-down" : "fa-chevron-up"}`}
            ></i>
          </span>
        </button>
      </div>
    </div>
    {!sectionsCollapsed.routingTable &&
      (routes.length > 0 ? (
        <div className="table-container">
          <table className="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>Interface</th>
                <th>Destination</th>
                <th>Gateway</th>
                <th>Metric</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route, index) => (
                <tr key={index}>
                  <td>
                    <strong>{route.interface || "N/A"}</strong>
                  </td>
                  <td>
                    <code>{route.destination || "N/A"}</code>
                  </td>
                  <td>
                    <code>{route.gateway || "N/A"}</code>
                  </td>
                  <td>N/A</td>
                  <td>
                    <span className="tag is-dark">Static</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="notification is-info">
          <p>
            No routing table data available or monitoring endpoint not
            configured.
          </p>
        </div>
      ))}
  </div>
);

export default RoutingTable;
