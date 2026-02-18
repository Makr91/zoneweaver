import { Helmet } from "@dr.pogodin/react-helmet";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useServers } from "../../contexts/ServerContext";

import DashboardHealthModal from "./DashboardHealthModal";
import DashboardQuickActions from "./DashboardQuickActions";
import DashboardServerCards from "./DashboardServerCards";
import DashboardSummaryCards from "./DashboardSummaryCards";
import { calculateInfrastructureSummary } from "./dashboardUtils";

/**
 * Multi-Host Application Overview Dashboard
 *
 * Provides an infrastructure-wide view across all configured
 * Zoneweaver API Servers, showing aggregate data and health status.
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

  const fetchInfrastructureData = useCallback(async () => {
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
        } catch (fetchErr) {
          return {
            server,
            success: false,
            data: null,
            healthData: null,
            error: fetchErr.message || "Connection failed",
          };
        }
      });

      const results = await Promise.all(serverPromises);

      setInfrastructureData({
        servers: results,
        summary: calculateInfrastructureSummary(results),
        lastUpdated: new Date().toISOString(),
      });
      setLastRefresh(new Date());
    } catch (outerErr) {
      setError(`Error fetching infrastructure overview: ${outerErr.message}`);
    } finally {
      setLoading(false);
    }
  }, [servers, makeZoneweaverAPIRequest, getMonitoringHealth]);

  // Navigation helpers
  const navigateToServer = useCallback(
    (server) => {
      selectServer(server);
      navigate("/ui/hosts");
    },
    [selectServer, navigate]
  );

  const navigateToZones = useCallback(() => {
    navigate("/ui/zones");
  }, [navigate]);

  const navigateToServerRegister = useCallback(() => {
    navigate("/ui/settings/zoneweaver?tab=servers");
  }, [navigate]);

  const navigateToZoneRegister = useCallback(() => {
    navigate("/ui/zone-register");
  }, [navigate]);

  const navigateToSettings = useCallback(() => {
    navigate("/ui/settings");
  }, [navigate]);

  useEffect(() => {
    if (!serversLoading && servers && servers.length > 0) {
      fetchInfrastructureData();

      const interval = setInterval(fetchInfrastructureData, 30 * 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [servers, serversLoading, fetchInfrastructureData]);

  // Loading state
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

  // No servers state
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

      <div className="container is-fluid p-0">
        <div className="box p-0 is-radiusless">
          <div className="p-4 has-background-grey">
            {/* Header */}
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

            {summary && (
              <DashboardSummaryCards
                summary={summary}
                onShowHealthModal={() => setShowHealthModal(true)}
              />
            )}

            <DashboardQuickActions
              servers={infrastructureData.servers || []}
              summary={summary || {}}
              onNavigateZoneRegister={navigateToZoneRegister}
              onNavigateZones={navigateToZones}
              onNavigateServerRegister={navigateToServerRegister}
              onNavigateSettings={navigateToSettings}
            />

            <DashboardServerCards
              servers={infrastructureData.servers || []}
              onNavigateToServer={navigateToServer}
            />

            <DashboardHealthModal
              isOpen={showHealthModal}
              onClose={() => setShowHealthModal(false)}
              servers={infrastructureData.servers || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
