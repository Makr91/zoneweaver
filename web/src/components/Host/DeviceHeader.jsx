import React from "react";

const DeviceHeader = ({ selectedServer, loading, loadDeviceData }) => (
  <div className="titlebar box active level is-mobile mb-0 p-3">
    <div className="level-left">
      <strong>Device Monitoring</strong>
    </div>
    <div className="level-right">
      <button
        className={`button is-small is-info ${loading ? "is-loading" : ""}`}
        onClick={() => selectedServer && loadDeviceData(selectedServer)}
        disabled={loading}
      >
        <span className="icon">
          <i className="fas fa-sync" />
        </span>
        <span>Refresh</span>
      </button>
    </div>
  </div>
);

export default DeviceHeader;
