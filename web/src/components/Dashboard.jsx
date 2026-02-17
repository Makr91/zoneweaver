import { Helmet } from "@dr.pogodin/react-helmet";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useServers } from "../contexts/ServerContext";

import { ContentModal } from "./common";

/**
 * Multi-Host Application Overview Dashboard
 *
 * This dashboard provides an infrastructure-wide view across all configured
 * Zoneweaver API Servers, showing aggregate data and health status rather than
 * detailed single-host information (which is available in Hosts.jsx).
 */
const Dashboard = () => {
  const [infrastructureData, setInfrastructureData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [showHealthModal, setShowHealthModal] = useState(false);

  const {
    makeZoneweaverAPIRequest,
    getMonitoringHealth,
    servers,
    loading: serversLoading,
    selectServer,
  } = useServers();
  const navigate = useNavigate();

  // Fetch infrastructure data from all servers
  const fetchInfrastructureData = async () => {
    if (!servers || servers.length === 0) {
      setError(
        "No Zoneweaver API Servers configured. Please add a server first."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const serverPromises = servers.map(async (server) => {
        try {
          // Fetch both stats and health data
          const [statsResult, healthResult] = await Promise.allSettled([
            makeZoneweaverAPIRequest(
              server.hostname,
              server.port,
              server.protocol,
              "stats"
            ),
            getMonitoringHealth(server.hostname, server.port, server.protocol),
          ]);

          const statsSuccess =
            statsResult.status === "fulfilled" && statsResult.value.success;
          const healthSuccess =
            healthResult.status === "fulfilled" && healthResult.value.success;

          const getErrorMessage = () => {
            if (statsSuccess) {
              return null;
            }
            if (statsResult.status === "fulfilled") {
              return statsResult.value.message || "Failed to fetch data";
            }
            return statsResult.reason?.message || "Connection failed";
          };

          return {
            server,
            success: statsSuccess,
            data: statsSuccess ? statsResult.value.data : null,
            healthData: healthSuccess ? healthResult.value.data : null,
            error: getErrorMessage(),
          };
        } catch (error) {
          return {
            server,
            success: false,
            data: null,
            healthData: null,
            error: error.message || "Connection failed",
          };
        }
      });

      const results = await Promise.all(serverPromises);

      // Process results into infrastructure overview
      const processed = {
        servers: results,
        summary: calculateInfrastructureSummary(results),
        lastUpdated: new Date().toISOString(),
      };

      setInfrastructureData(processed);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching infrastructure data:", error);
      setError("Error fetching infrastructure overview");
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregate infrastructure metrics
  const calculateInfrastructureSummary = (serverResults) => {
    const summary = {
      totalServers: serverResults.length,
      onlineServers: 0,
      offlineServers: 0,
      totalZones: 0,
      runningZones: 0,
      stoppedZones: 0,
      totalMemory: 0,
      usedMemory: 0,
      healthyServers: 0,
      totalIssues: 0,
      serversRequiringReboot: 0,
      recentActivity: [],
    };

    serverResults.forEach((result) => {
      if (result.success && result.data) {
        summary.onlineServers++;

        // Zone statistics
        const allZones = result.data.allzones || [];
        const runningZones = result.data.runningzones || [];

        summary.totalZones += allZones.length;
        summary.runningZones += runningZones.length;
        summary.stoppedZones += allZones.length - runningZones.length;

        // Memory statistics
        if (result.data.totalmem && result.data.freemem) {
          summary.totalMemory += result.data.totalmem;
          summary.usedMemory += result.data.totalmem - result.data.freemem;
        }

        // Health assessment (count individual issues)
        const hasHighLoad = result.data.loadavg && result.data.loadavg[0] > 2;
        const hasLowFreeMemory =
          result.data.totalmem &&
          result.data.freemem &&
          result.data.freemem / result.data.totalmem < 0.1;
        const requiresReboot = result.healthData?.reboot_required;
        const hasFaults = result.healthData?.faultStatus?.hasFaults;
        const faultCount = result.healthData?.faultStatus?.faultCount || 0;

        let issueCount = 0;
        if (hasHighLoad) {
          issueCount++;
        }
        if (hasLowFreeMemory) {
          issueCount++;
        }
        if (requiresReboot) {
          issueCount++;
          summary.serversRequiringReboot++;
        }
        if (hasFaults) {
          issueCount += faultCount; // Add individual faults as separate issues
        }

        if (issueCount > 0) {
          summary.totalIssues += issueCount;
        } else {
          summary.healthyServers++;
        }
      } else {
        summary.offlineServers++;
        summary.totalIssues++; // Count offline as 1 issue
      }
    });

    return summary;
  };

  // Helper functions
  const bytesToSize = (bytes) => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) {
      return "0 Byte";
    }
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${Math.round(bytes / 1024 ** i, 2)} ${sizes[i]}`;
  };

  const getServerHealthStatus = (serverResult) => {
    if (!serverResult.success) {
      return "offline";
    }

    const { data } = serverResult;
    if (!data) {
      return "offline";
    }

    // Check for performance issues
    const hasHighLoad = data.loadavg && data.loadavg[0] > 2;
    const hasLowFreeMemory =
      data.totalmem && data.freemem && data.freemem / data.totalmem < 0.1;

    if (hasHighLoad || hasLowFreeMemory) {
      return "warning";
    }
    return "healthy";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "has-text-success";
      case "warning":
        return "has-text-warning";
      case "offline":
        return "has-text-danger";
      default:
        return "has-text-grey";
    }
  };

  // Navigation helpers
  const navigateToServer = (server) => {
    selectServer(server);
    navigate("/ui/hosts");
  };

  const navigateToZones = () => {
    navigate("/ui/zones");
  };

  const navigateToServerRegister = () => {
    navigate("/ui/settings/zoneweaver?tab=servers");
  };

  const navigateToZoneRegister = () => {
    navigate("/ui/zone-register");
  };

  // Effects
  useEffect(() => {
    if (!serversLoading && servers && servers.length > 0) {
      fetchInfrastructureData();

      // Set up auto-refresh every 30 seconds (less frequent than single host)
      const interval = setInterval(fetchInfrastructureData, 30 * 1000);
      return () => clearInterval(interval);
    }
  }, [servers, serversLoading]);

  // Loading state - Updated container structure for full width
  if (serversLoading || (loading && !infrastructureData.servers)) {
    return (
      <div className="zw-page-content-scrollable">
        <div className="container is-fluid p-0">
          <div className="box p-0 is-radiusless">
            <div className="p-4 has-background-grey">
              <div className="box has-text-centered p-6">
                <div className="button is-loading is-large is-ghost" />
                <p className="mt-2">Loading infrastructure overview...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No servers state - Updated container structure for full width
  if (!servers || servers.length === 0) {
    return (
      <div className="zw-page-content-scrollable">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Infrastructure Overview - Zoneweaver</title>
          <link rel="canonical" href={window.location.origin} />
        </Helmet>
        <div className="container is-fluid p-0">
          <div className="box p-0 is-radiusless">
            <div className="p-4 has-background-grey">
              <div className="notification is-info">
                <h2 className="title is-4">Welcome to Zoneweaver</h2>
                <p className="mb-4">
                  Get started by adding your first Zoneweaver API Server to
                  begin managing your infrastructure.
                </p>
                <button
                  onClick={navigateToServerRegister}
                  className="button is-primary"
                >
                  <span className="icon">
                    <i className="fas fa-plus" />
                  </span>
                  <span>Add Zoneweaver API Server</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { summary } = infrastructureData;

  return (
    <div className="zw-page-content-scrollable">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Infrastructure Overview - Zoneweaver</title>
        <link rel="canonical" href={window.location.origin} />
      </Helmet>

      {/* Updated container structure for full width */}
      <div className="container is-fluid p-0">
        <div className="box p-0 is-radiusless">
          <div className="p-4 has-background-grey">
            {/* Header with rounded corners */}
            <div className="box mb-3">
              <div className="level is-mobile">
                <div className="level-left">
                  <div className="level-item">
                    <div>
                      <h1 className="title is-3 mb-1">
                        Infrastructure Overview
                      </h1>
                      <p className="subtitle is-6 has-text-grey">
                        Managing {summary?.totalServers || 0} servers with{" "}
                        {summary?.totalZones || 0} zones
                        {lastRefresh && (
                          <span className="ml-2">
                            • Last updated {lastRefresh.toLocaleTimeString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="level-right">
                  <div className="level-item">
                    <button
                      className={`button is-small ${loading ? "is-loading" : ""}`}
                      onClick={fetchInfrastructureData}
                      disabled={loading}
                    >
                      <span className="icon">
                        <i className="fas fa-sync-alt" />
                      </span>
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="notification is-danger mb-4">
                <p>{error}</p>
              </div>
            )}

            {/* Infrastructure Summary Cards */}
            {summary && (
              <div className="columns is-multiline mb-3">
                <div className="column is-3">
                  <div className="box has-text-centered">
                    <div className="heading">Total Servers</div>
                    <div className="title is-2 has-text-info">
                      {summary.totalServers}
                    </div>
                    <div className="level is-mobile mt-2">
                      <div className="level-item has-text-centered">
                        <div>
                          <div className="heading has-text-success">Online</div>
                          <div className="title is-6">
                            {summary.onlineServers}
                          </div>
                        </div>
                      </div>
                      <div className="level-item has-text-centered">
                        <div>
                          <div className="heading has-text-danger">Offline</div>
                          <div className="title is-6">
                            {summary.offlineServers}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="column is-3">
                  <div className="box has-text-centered">
                    <div className="heading">Total Zones</div>
                    <div className="title is-2 has-text-primary">
                      {summary.totalZones}
                    </div>
                    <div className="level is-mobile mt-2">
                      <div className="level-item has-text-centered">
                        <div>
                          <div className="heading has-text-success">
                            Running
                          </div>
                          <div className="title is-6">
                            {summary.runningZones}
                          </div>
                        </div>
                      </div>
                      <div className="level-item has-text-centered">
                        <div>
                          <div className="heading has-text-warning">
                            Stopped
                          </div>
                          <div className="title is-6">
                            {summary.stoppedZones}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="column is-3">
                  <div className="box has-text-centered">
                    <div className="heading">Memory Usage</div>
                    <div className="title is-2 has-text-link">
                      {summary.totalMemory > 0
                        ? `${Math.round((summary.usedMemory / summary.totalMemory) * 100)}%`
                        : "N/A"}
                    </div>
                    <div className="mt-2">
                      <div className="heading">
                        {summary.totalMemory > 0
                          ? `${bytesToSize(summary.usedMemory)} / ${bytesToSize(summary.totalMemory)}`
                          : "No data available"}
                      </div>
                      {summary.totalMemory > 0 && (
                        <progress
                          className="progress is-small is-link mt-2"
                          value={summary.usedMemory}
                          max={summary.totalMemory}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="column is-3">
                  <button
                    type="button"
                    className={`box has-text-centered button is-ghost p-4 ${summary.totalIssues > 0 ? "is-clickable" : ""}`}
                    onClick={() => {
                      if (summary.totalIssues > 0) {
                        setShowHealthModal(true);
                      }
                    }}
                    title={
                      summary.totalIssues > 0 ? "Click to view details" : ""
                    }
                    style={{ width: "100%", border: "none" }}
                    disabled={summary.totalIssues === 0}
                  >
                    <div className="heading">Health Status</div>
                    <div className="title is-2 has-text-success">
                      {summary.healthyServers}
                    </div>
                    <div className="level is-mobile mt-2">
                      <div className="level-item has-text-centered">
                        <div>
                          <div className="heading has-text-success">
                            Healthy
                          </div>
                          <div className="title is-6">
                            {summary.healthyServers}
                          </div>
                        </div>
                      </div>
                      <div className="level-item has-text-centered">
                        <div>
                          <div className="heading has-text-warning">Issues</div>
                          <div className="title is-6">
                            {summary.totalIssues}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions and Zone Distribution */}
            <div className="columns mb-3">
              <div className="column is-8">
                <div className="box">
                  <h2 className="title is-4 mb-4">
                    <span className="icon-text">
                      <span className="icon">
                        <i className="fas fa-bolt" />
                      </span>
                      <span>Quick Actions</span>
                    </span>
                  </h2>

                  <div className="columns is-multiline">
                    <div className="column is-6">
                      <button
                        className="button is-fullwidth is-primary is-medium"
                        onClick={navigateToZoneRegister}
                      >
                        <span className="icon">
                          <i className="fas fa-plus" />
                        </span>
                        <span>Create New Zone</span>
                      </button>
                    </div>
                    <div className="column is-6">
                      <button
                        className="button is-fullwidth is-info is-medium"
                        onClick={navigateToZones}
                      >
                        <span className="icon">
                          <i className="fas fa-list" />
                        </span>
                        <span>Manage Zones</span>
                      </button>
                    </div>
                    <div className="column is-6">
                      <button
                        className="button is-fullwidth is-success is-medium"
                        onClick={navigateToServerRegister}
                      >
                        <span className="icon">
                          <i className="fas fa-server" />
                        </span>
                        <span>Add New Host</span>
                      </button>
                    </div>
                    <div className="column is-6">
                      <button
                        onClick={() => navigate("/ui/settings")}
                        className="button is-fullwidth is-link is-medium"
                      >
                        <span className="icon">
                          <i className="fas fa-cog" />
                        </span>
                        <span>Settings</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="column is-4">
                <div className="box">
                  <h2 className="title is-4 mb-4">
                    <span className="icon-text">
                      <span className="icon">
                        <i className="fas fa-chart-pie" />
                      </span>
                      <span>Zone Distribution</span>
                    </span>
                  </h2>

                  <div className="content">
                    {infrastructureData.servers &&
                    infrastructureData.servers.length > 0 ? (
                      <>
                        {infrastructureData.servers
                          .filter((s) => s.success && s.data)
                          .map((serverResult) => {
                            const zoneCount =
                              serverResult.data.allzones?.length || 0;
                            const runningCount =
                              serverResult.data.runningzones?.length || 0;
                            const percentage =
                              summary.totalZones > 0
                                ? Math.round(
                                    (zoneCount / summary.totalZones) * 100
                                  )
                                : 0;

                            return (
                              <div
                                key={`${serverResult.server.hostname}-${serverResult.server.port}`}
                                className="mb-3"
                              >
                                <div className="level is-mobile mb-1">
                                  <div className="level-left">
                                    <div className="level-item">
                                      <strong className="is-size-7">
                                        {serverResult.server.hostname}
                                      </strong>
                                    </div>
                                  </div>
                                  <div className="level-right">
                                    <div className="level-item">
                                      <span className="is-size-7">
                                        {zoneCount} zones ({percentage}%)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <progress
                                  className="progress is-small is-primary"
                                  value={zoneCount}
                                  max={summary.totalZones || 1}
                                />
                                <p className="is-size-7 has-text-grey">
                                  {runningCount} running,{" "}
                                  {zoneCount - runningCount} stopped
                                </p>
                              </div>
                            );
                          })}

                        <hr className="my-3" />

                        <div className="has-text-centered">
                          <p className="heading">Total Infrastructure</p>
                          <p className="title is-5">
                            {summary?.totalZones || 0} Zones
                          </p>
                          <p className="subtitle is-7 has-text-grey">
                            Across {summary?.onlineServers || 0} active hosts
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="has-text-centered has-text-grey">
                        <p>No zone data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Server Status - Individual Cards */}
            <div className="columns is-multiline is-variable is-2 mb-0">
              {infrastructureData.servers?.map((serverResult) => {
                const { server, success, data, error } = serverResult;
                const status = getServerHealthStatus(serverResult);
                const statusColor = getStatusColor(status);

                // Determine tooltip text based on status
                let statusTooltip = "Host is healthy";
                if (status === "offline") {
                  statusTooltip = error || "Connection failed";
                } else if (status === "warning") {
                  const issues = [];
                  if (data?.loadavg?.[0] > 2) {
                    issues.push("High CPU load");
                  }
                  if (
                    data?.totalmem &&
                    data?.freemem &&
                    data.freemem / data.totalmem < 0.1
                  ) {
                    issues.push("Low memory");
                  }
                  statusTooltip = issues.join(", ");
                }

                return (
                  <div
                    key={`${server.hostname}-${server.port}-card`}
                    className="column is-6"
                  >
                    <div className="box">
                      <h2 className="title is-5 mb-3">
                        <span className="icon-text">
                          <span
                            className={`icon ${statusColor}`}
                            title={statusTooltip}
                          >
                            <i className="fas fa-circle is-size-7" />
                          </span>
                          <span>{server.hostname}</span>
                        </span>
                      </h2>

                      {success && data ? (
                        <>
                          <p className="subtitle is-6 has-text-grey mb-3">
                            {data?.type || "Unknown"} {data?.release || ""}
                          </p>

                          <div className="columns is-mobile mb-3">
                            <div className="column">
                              <div className="has-text-centered">
                                <div className="heading">Zones</div>
                                <div className="title is-4">
                                  {data.runningzones?.length || 0} /{" "}
                                  {data.allzones?.length || 0}
                                </div>
                              </div>
                            </div>
                            <div className="column">
                              <div className="has-text-centered">
                                <div className="heading">CPU Load</div>
                                <div className="title is-4">
                                  {data.loadavg
                                    ? data.loadavg[0].toFixed(2)
                                    : "N/A"}
                                </div>
                              </div>
                            </div>
                            <div className="column">
                              <div className="has-text-centered">
                                <div className="heading">Memory</div>
                                <div className="title is-4">
                                  {data.totalmem && data.freemem
                                    ? `${Math.round(((data.totalmem - data.freemem) / data.totalmem) * 100)}%`
                                    : "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            className="button is-fullwidth is-primary"
                            onClick={() => navigateToServer(server)}
                          >
                            <span className="icon">
                              <i className="fas fa-arrow-right" />
                            </span>
                            <span>View Details</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="subtitle is-6 has-text-grey mb-3">
                            Connection Failed
                          </p>

                          <div className="columns is-mobile mb-3">
                            <div className="column">
                              <div className="has-text-centered">
                                <div className="heading">Zones</div>
                                <div className="title is-4 has-text-grey">
                                  -
                                </div>
                              </div>
                            </div>
                            <div className="column">
                              <div className="has-text-centered">
                                <div className="heading">CPU Load</div>
                                <div className="title is-4 has-text-grey">
                                  -
                                </div>
                              </div>
                            </div>
                            <div className="column">
                              <div className="has-text-centered">
                                <div className="heading">Memory</div>
                                <div className="title is-4 has-text-grey">
                                  -
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            className="button is-fullwidth is-primary"
                            onClick={() => navigateToServer(server)}
                            disabled
                          >
                            <span className="icon">
                              <i className="fas fa-arrow-right" />
                            </span>
                            <span>View Details</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Health Status Modal */}
            {showHealthModal && (
              <ContentModal
                isOpen={showHealthModal}
                onClose={() => setShowHealthModal(false)}
                title="Infrastructure Health Issues"
                icon="fas fa-exclamation-triangle"
              >
                {infrastructureData.servers &&
                  infrastructureData.servers
                    .filter(
                      (s) =>
                        getServerHealthStatus(s) !== "healthy" ||
                        s.healthData?.reboot_required
                    )
                    .map((serverResult) => {
                      const status = getServerHealthStatus(serverResult);
                      const statusColor =
                        status === "offline" ? "is-danger" : "is-warning";
                      const issues = [];
                      const rebootInfo = serverResult.healthData?.reboot_info;

                      if (status === "offline") {
                        issues.push(serverResult.error || "Connection failed");
                      } else if (status === "warning" && serverResult.data) {
                        if (serverResult.data.loadavg?.[0] > 2) {
                          issues.push(
                            `High CPU load: ${serverResult.data.loadavg[0].toFixed(2)}`
                          );
                        }
                        if (
                          serverResult.data.totalmem &&
                          serverResult.data.freemem &&
                          serverResult.data.freemem /
                            serverResult.data.totalmem <
                            0.1
                        ) {
                          const memUsed = Math.round(
                            ((serverResult.data.totalmem -
                              serverResult.data.freemem) /
                              serverResult.data.totalmem) *
                              100
                          );
                          issues.push(`Low memory: ${memUsed}% used`);
                        }
                      }

                      // Add reboot requirement if present
                      if (serverResult.healthData?.reboot_required) {
                        const reasons =
                          rebootInfo?.reasons?.join(", ") ||
                          "Configuration changes";
                        const ageMinutes = rebootInfo?.age_minutes || 0;
                        const timeAgo =
                          ageMinutes > 60
                            ? `${Math.floor(ageMinutes / 60)}h ${ageMinutes % 60}m ago`
                            : `${ageMinutes}m ago`;
                        issues.push(
                          `Reboot required (${reasons}) - Changed ${timeAgo}`
                        );
                      }

                      // Add fault information if present
                      if (serverResult.healthData?.faultStatus?.hasFaults) {
                        const { faultStatus } = serverResult.healthData;
                        const faultSummary =
                          faultStatus.severityLevels?.join(", ") || "Unknown";
                        issues.push(
                          `${faultStatus.faultCount} system fault${faultStatus.faultCount === 1 ? "" : "s"} (${faultSummary})`
                        );
                      }

                      return (
                        <div
                          key={`${serverResult.server.hostname}-${serverResult.server.port}-health`}
                          className={`notification ${serverResult.healthData?.reboot_required ? "is-warning" : statusColor} mb-3`}
                        >
                          <div className="level is-mobile">
                            <div className="level-left">
                              <strong>{serverResult.server.hostname}</strong>
                            </div>
                            <div className="level-right">
                              {serverResult.healthData?.reboot_required && (
                                <span className="tag is-warning">
                                  <span className="icon is-small">
                                    <i className="fas fa-redo" />
                                  </span>
                                  <span>Reboot Required</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <ul className="mt-2">
                            {issues.map((issue) => (
                              <li key={issue}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
              </ContentModal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
