import React from "react";

const IpAddressTable = ({ ipAddresses, sectionsCollapsed, toggleSection }) => (
  <div className="box mb-4">
    <div className="level is-mobile mb-3">
      <div className="level-left">
        <h4 className="title is-5 mb-0">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-globe" />
            </span>
            <span>IP Addresses</span>
          </span>
        </h4>
      </div>
      <div className="level-right">
        <button
          className="button is-small is-ghost"
          onClick={() => toggleSection("ipAddresses")}
          title={
            sectionsCollapsed.ipAddresses
              ? "Expand section"
              : "Collapse section"
          }
        >
          <span className="icon">
            <i
              className={`fas ${sectionsCollapsed.ipAddresses ? "fa-chevron-down" : "fa-chevron-up"}`}
            />
          </span>
        </button>
      </div>
    </div>
    {!sectionsCollapsed.ipAddresses &&
      (ipAddresses.length > 0 ? (
        <div className="table-container">
          <table className="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>Interface</th>
                <th>IP Address</th>
                <th>Netmask/Prefix</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ipAddresses.map((ip, index) => (
                <tr key={index}>
                  <td>
                    <strong>{ip.interface}</strong>
                  </td>
                  <td>
                    <code>{ip.ip_address}</code>
                  </td>
                  <td>
                    <code>
                      {ip.prefix_length ? `/${ip.prefix_length}` : "N/A"}
                    </code>
                  </td>
                  <td>
                    <span className="tag is-info">
                      {ip.ip_version || "IPv4"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`tag ${ip.state === "ok" || ip.state === "up" ? "is-success" : "is-warning"}`}
                    >
                      {ip.state || "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="notification is-info">
          <p>
            No IP address data available or monitoring endpoint not configured.
          </p>
        </div>
      ))}
  </div>
);

export default IpAddressTable;
