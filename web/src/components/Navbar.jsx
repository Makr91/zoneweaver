import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { useServers } from "../contexts/ServerContext";
import {
  canControlZones,
  canAccessZoneConsole,
  canStartStopZones,
  canRestartZones,
  canDestroyZones,
  canControlHosts,
  canPowerOffHosts,
} from "../utils/permissions";

import { FormModal } from "./common";

const Navbar = () => {
  const [isModal, setModalState] = useState(true);

  const handleModalClick = () => {
    setModalState(!isModal);
  };

  const [zones, setZones] = useState(null);
  const [currentMode, setCurrentMode] = useState("");
  const [currentAction, setCurrentAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [vncLoading, setVncLoading] = useState(false);

  // Enhanced zone status mapping for all possible states
  const getZoneStatus = (zoneName) => {
    if (!zones || !zones.data) {
      return "unknown";
    }

    // Check if we have detailed zone information
    if (zones.data.zoneDetails && zones.data.zoneDetails[zoneName]) {
      return (
        zones.data.zoneDetails[zoneName].state ||
        zones.data.zoneDetails[zoneName].status
      );
    }

    // Fallback to basic running/stopped logic
    const runningZones = zones.data.runningzones || [];
    const allZones = zones.data.allzones || [];

    if (runningZones.includes(zoneName)) {
      return "running";
    } else if (allZones.includes(zoneName)) {
      return "installed"; // Assume installed if in allzones but not running
    }

    return "unknown";
  };

  // Enhanced status dot color mapping for all zone states
  const getStatusDotColor = (status) => {
    switch (status?.toLowerCase()) {
      case "running":
        return "has-text-success"; // Green - zone is running
      case "ready":
        return "has-text-info"; // Blue - ready to run
      case "installed":
        return "has-text-link"; // Light blue - installed but not ready
      case "configured":
        return "has-text-warning"; // Yellow - configured but not installed
      case "shutting_down":
      case "shutting-down":
        return "has-text-warning"; // Orange - in transition
      case "incomplete":
        return "has-text-danger"; // Red - problematic state
      case "down":
      case "stopped":
        return "has-text-grey-dark"; // Dark gray - shut down
      default:
        return "has-text-grey"; // Gray for unknown
    }
  };

  // Get human-readable status text
  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "running":
        return "Running";
      case "ready":
        return "Ready";
      case "installed":
        return "Installed";
      case "configured":
        return "Configured";
      case "shutting_down":
      case "shutting-down":
        return "Shutting Down";
      case "incomplete":
        return "Incomplete";
      case "down":
        return "Down";
      case "stopped":
        return "Stopped";
      default:
        return "Unknown";
    }
  };
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    servers: allServers,
    getServers,
    currentServer,
    selectServer,
    currentZone,
    selectZone,
    clearZone,
    makeZoneweaverAPIRequest,
    startZone,
    stopZone,
    restartZone,
    deleteZone,
    startVncSession,
    stopVncSession,
    getVncSessionInfo,
    restartHost,
    rebootHost,
    shutdownHost,
    getHostStatus,
  } = useServers();

  // Zone action handlers
  const handleZoneAction = async (action) => {
    if (!currentServer || !currentZone) {
      return;
    }

    try {
      setLoading(true);
      let result;

      switch (action) {
        case "start":
          result = await startZone(
            currentServer.hostname,
            currentServer.port,
            currentServer.protocol,
            currentZone
          );
          break;
        case "shutdown":
          result = await stopZone(
            currentServer.hostname,
            currentServer.port,
            currentServer.protocol,
            currentZone
          );
          break;
        case "restart":
          result = await restartZone(
            currentServer.hostname,
            currentServer.port,
            currentServer.protocol,
            currentZone
          );
          break;
        case "kill":
          result = await stopZone(
            currentServer.hostname,
            currentServer.port,
            currentServer.protocol,
            currentZone,
            true
          );
          break;
        case "destroy":
          result = await deleteZone(
            currentServer.hostname,
            currentServer.port,
            currentServer.protocol,
            currentZone
          );
          break;
        default:
          console.warn("Unknown action:", action);
          return;
      }

      if (result.success) {
        console.log(`Zone ${action} initiated successfully`);
        // Refresh zones list after a delay
        setTimeout(() => {
          if (currentServer) {
            makeZoneweaverAPIRequest(
              currentServer.hostname,
              currentServer.port,
              currentServer.protocol,
              "stats"
            )
              .then((res) => {
                if (res.success) {
                  setZones({ data: res.data });
                }
              })
              .catch((error) =>
                console.error("Error refreshing zones:", error)
              );
          }
        }, 2000);
      } else {
        console.error(`Failed to ${action} zone:`, result.message);
      }
    } catch (error) {
      console.error(`Error during zone ${action}:`, error);
    } finally {
      setLoading(false);
      handleModalClick(); // Close modal
    }
  };

  // Host action handlers
  const handleHostAction = async (action) => {
    if (!currentServer) {
      return;
    }

    try {
      setLoading(true);
      let result;

      switch (action) {
        case "restart":
          result = await restartHost(
            currentServer.hostname,
            currentServer.port,
            currentServer.protocol,
            {
              gracePeriod: 60,
              message: "Host restart initiated via Zoneweaver UI"
            }
          );
          break;
        case "reboot":
          result = await rebootHost(
            currentServer.hostname,
            currentServer.port,
            currentServer.protocol
          );
          break;
        case "shutdown":
          result = await shutdownHost(
            currentServer.hostname,
            currentServer.port,
            currentServer.protocol,
            {
              gracePeriod: 60,
              message: "Host shutdown initiated via Zoneweaver UI"
            }
          );
          break;
        default:
          console.warn("Unknown host action:", action);
          return;
      }

      if (result.success) {
        console.log(`Host ${action} initiated successfully`);
        console.log("Task ID:", result.data.task_id);
        
        // For restart/reboot actions, start health monitoring
        if (action === "restart" || action === "reboot") {
          setTimeout(() => {
            startHealthMonitoring();
          }, 3000); // Start monitoring after 3 seconds
        }
      } else {
        console.error(`Failed to ${action} host:`, result.message);
      }
    } catch (error) {
      console.error(`Error during host ${action}:`, error);
    } finally {
      setLoading(false);
      handleModalClick(); // Close modal
    }
  };

  // Health monitoring with exponential backoff
  const startHealthMonitoring = () => {
    console.log("🔄 Starting health monitoring...");
    let retryCount = 0;
    const maxRetries = 12; // ~5 minutes total
    
    const checkHealth = async () => {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 60000); // Cap at 60 seconds
      
      try {
        console.log(`⏱️ Health check attempt ${retryCount + 1}/${maxRetries} (delay: ${delay}ms)`);
        const response = await axios.get('/api/health');
        
        if (response.data.success) {
          console.log("✅ Server is back online, refreshing page...");
          // Small delay to ensure server is fully ready
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          return;
        }
      } catch (error) {
        console.log(`❌ Health check failed (attempt ${retryCount + 1}): ${error.message}`);
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`⏳ Retrying in ${delay}ms...`);
        setTimeout(checkHealth, delay);
      } else {
        console.log("⚠️ Maximum retry attempts reached. Server may need manual intervention.");
        // Show user a message that they can manually refresh
        alert("Host restart is taking longer than expected. Please refresh the page manually to check if the server is back online.");
      }
    };
    
    // Start the first check
    checkHealth();
  };

  // VNC Console handlers
  const handleVncConsole = async (openInNewTab = false) => {
    if (!currentServer || !currentZone) {
      return;
    }

    try {
      setVncLoading(true);
      console.log(`Starting VNC console for zone: ${currentZone}`);

      const result = await startVncSession(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        currentZone
      );

      if (result.success) {
        // Navigate to zones page with VNC parameter to auto-open console (react-vnc only)
        navigate(`/ui/zones?vnc=${currentZone}`);
      } else {
        console.error(
          `Failed to start VNC console for ${currentZone}:`,
          result.message
        );
      }
    } catch (error) {
      console.error("Error starting VNC console:", error);
    } finally {
      setVncLoading(false);
    }
  };

  const handleKillVncSession = async () => {
    if (!currentServer || !currentZone) {
      return;
    }

    try {
      setVncLoading(true);
      console.log(`Killing VNC session for zone: ${currentZone}`);

      const result = await stopVncSession(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        currentZone
      );

      if (result.success) {
        console.log(`VNC session killed for ${currentZone}`);
      } else {
        console.error(
          `Failed to kill VNC session for ${currentZone}:`,
          result.message
        );
      }
    } catch (error) {
      console.error("Error killing VNC session:", error);
    } finally {
      setVncLoading(false);
    }
  };

  const handleKillZloginSession = async () => {
    if (!currentServer || !currentZone) {
      return;
    }

    try {
      setVncLoading(true); // Reuse same loading state
      console.log(`Killing zlogin session for zone: ${currentZone}`);

      // First get all active zlogin sessions to find the one for this zone
      const sessionsResult = await makeZoneweaverAPIRequest(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        "zlogin/sessions"
      );

      if (sessionsResult.success && sessionsResult.data) {
        const activeSessions = Array.isArray(sessionsResult.data)
          ? sessionsResult.data
          : sessionsResult.data.sessions || [];

        const activeZoneSession = activeSessions.find(
          (session) =>
            session.zone_name === currentZone && session.status === "active"
        );

        if (activeZoneSession) {
          // Kill the specific session by ID
          const killResult = await makeZoneweaverAPIRequest(
            currentServer.hostname,
            currentServer.port,
            currentServer.protocol,
            `zlogin/sessions/${activeZoneSession.id}/stop`,
            "DELETE"
          );

          if (killResult.success) {
            console.log(`zlogin session killed for ${currentZone}`);
          } else {
            console.error(
              `Failed to kill zlogin session for ${currentZone}:`,
              killResult.message
            );
          }
        } else {
          console.log(`No active zlogin session found for ${currentZone}`);
        }
      } else {
        console.error("Failed to get zlogin sessions:", sessionsResult.message);
      }
    } catch (error) {
      console.error("Error killing zlogin session:", error);
    } finally {
      setVncLoading(false);
    }
  };

  // Check if current page supports sharing (has host/zone parameters)
  const isShareableRoute = () => {
    const path = location.pathname;
    return (
      path.startsWith("/ui/host") ||
      path.startsWith("/ui/zone") ||
      path === "/ui/zones"
    );
  };

  // Share URL generator and clipboard copy
  const handleShareCurrentPage = async () => {
    if (!isShareableRoute()) {
      console.warn("Share not available on this page");
      return;
    }
    try {
      // Build URL with current selections
      const baseUrl = `${window.location.origin}${location.pathname}`;
      const params = new URLSearchParams();

      if (currentServer) {
        params.set("host", currentServer.hostname);
      }

      if (currentZone) {
        params.set("zone", currentZone);
      }

      const shareUrl = params.toString()
        ? `${baseUrl}?${params.toString()}`
        : baseUrl;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      // Show success feedback (could be enhanced with a toast notification)
      console.log("📋 Share URL copied to clipboard:", shareUrl);

      // Optional: You could add a temporary success message here
    } catch (error) {
      console.error("Failed to copy URL to clipboard:", error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        const baseUrl = `${window.location.origin}${location.pathname}`;
        const params = new URLSearchParams();

        if (currentServer) {
          params.set("host", currentServer.hostname);
        }

        if (currentZone) {
          params.set("zone", currentZone);
        }

        const shareUrl = params.toString()
          ? `${baseUrl}?${params.toString()}`
          : baseUrl;
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        console.log("📋 Share URL copied to clipboard (fallback):", shareUrl);
      } catch (fallbackError) {
        console.error(
          "Failed to copy URL using fallback method:",
          fallbackError
        );
      }
    }
  };

  const getActionVariant = (action) => {
    switch (action) {
      case "start":
        return "is-success";
      case "restart":
        return "is-warning";
      case "shutdown":
      case "kill":
      case "destroy":
        return "is-danger";
      default:
        return "is-primary";
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "start":
        return "fas fa-play";
      case "restart":
        return "fas fa-redo";
      case "shutdown":
        return "fas fa-stop";
      case "kill":
        return "fas fa-skull";
      case "destroy":
        return "fas fa-trash";
      default:
        return "fas fa-cogs";
    }
  };

  const ZoneControlDropdown = () => {
    const userRole = user?.role;

    return (
      <div className="dropdown is-right is-hoverable">
        <button
          className="dropdown-trigger button"
          aria-haspopup="true"
          aria-controls="dropdown-menu"
        >
          <span>Zone Controls</span>
          <span className="icon is-small">
            <i className="fa fa-angle-down" aria-hidden="true" />
          </span>
        </button>
        <div className="dropdown-menu" id="zone-control-menu" role="menu">
          <div className="dropdown-content">
            {/* Share link option - available when on shareable routes */}
            {isShareableRoute() && currentServer && (
              <>
                <button
                  onClick={handleShareCurrentPage}
                  className="dropdown-item"
                  title="Copy shareable link to clipboard"
                >
                  <span className="icon has-text-info mr-2">
                    <i className="fas fa-share-alt" />
                  </span>
                  <span>Share Link</span>
                </button>
                <hr className="dropdown-divider" />
              </>
            )}

            {/* Basic zone controls - available to all users */}
            {canStartStopZones(userRole) && (
              <>
                <button
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("shutdown");
                    setCurrentMode("zone");
                  }}
                  className="dropdown-item"
                >
                  <span className="icon has-text-danger mr-2">
                    <i className="fas fa-stop" />
                  </span>
                  <span>Shutdown</span>
                </button>
                <button
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("start");
                    setCurrentMode("zone");
                  }}
                  className="dropdown-item"
                >
                  <span className="icon has-text-success mr-2">
                    <i className="fas fa-play" />
                  </span>
                  <span>Power On</span>
                </button>
              </>
            )}

            {canRestartZones(userRole) && (
              <button
                onClick={() => {
                  handleModalClick();
                  setCurrentAction("restart");
                  setCurrentMode("zone");
                }}
                className="dropdown-item"
              >
                <span className="icon has-text-warning mr-2">
                  <i className="fas fa-redo" />
                </span>
                <span>Restart</span>
              </button>
            )}

            {/* Advanced controls - admin only */}
            {canDestroyZones(userRole) && (
              <>
                <hr className="dropdown-divider" />
                <button
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("kill");
                    setCurrentMode("zone");
                  }}
                  className="dropdown-item"
                >
                  <span className="icon has-text-danger mr-2">
                    <i className="fas fa-skull" />
                  </span>
                  <span>Force Kill</span>
                </button>
                <button className="dropdown-item">
                  <span className="icon mr-2">
                    <i className="fas fa-camera" />
                  </span>
                  <span>Snapshot</span>
                </button>
                <button
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("provision");
                    setCurrentMode("zone");
                  }}
                  className="dropdown-item"
                >
                  <span className="icon mr-2">
                    <i className="fas fa-cogs" />
                  </span>
                  <span>Provision</span>
                </button>
                <button
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("destroy");
                    setCurrentMode("zone");
                  }}
                  className="dropdown-item"
                >
                  <span className="icon has-text-danger mr-2">
                    <i className="fas fa-trash" />
                  </span>
                  <span>Destroy</span>
                </button>
              </>
            )}

            {/* Show limited access message for users */}
            {!canDestroyZones(userRole) && (
              <>
                <hr className="dropdown-divider" />
                <div className="has-text-grey-light has-text-centered p-2 is-size-7">
                  Advanced controls require admin privileges
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const HostControlDropdown = () => {
    const userRole = user?.role;

    return (
      <div className="dropdown is-right is-hoverable">
        <button
          className="dropdown-trigger button"
          aria-haspopup="true"
          aria-controls="dropdown-menu"
        >
          <span>Host Actions</span>
          <span className="icon is-small">
            <i className="fa fa-angle-down" aria-hidden="true" />
          </span>
        </button>
        <div className="dropdown-menu" id="host-control-menu" role="menu">
          <div className="dropdown-content">
            {/* Share link option - available when on shareable routes */}
            {isShareableRoute() && currentServer && (
              <>
                <button
                  onClick={handleShareCurrentPage}
                  className="dropdown-item"
                  title="Copy shareable link to clipboard"
                >
                  <span className="icon has-text-info mr-2">
                    <i className="fas fa-share-alt" />
                  </span>
                  <span>Share Link</span>
                </button>
                <hr className="dropdown-divider" />
              </>
            )}

            {/* Read-only actions available to all users */}
            <a href="/ui/hosts" className="dropdown-item">
              <span className="icon has-text-info mr-2">
                <i className="fas fa-eye" />
              </span>
              <span>View Host Details</span>
            </a>
            <a href="/ui/zones" className="dropdown-item">
              <span className="icon has-text-info mr-2">
                <i className="fas fa-server" />
              </span>
              <span>Manage Zones</span>
            </a>

            {canPowerOffHosts(userRole) && (
              <>
                <hr className="dropdown-divider" />
                <button
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("restart");
                    setCurrentMode("host");
                  }}
                  className="dropdown-item"
                >
                  <span className="icon has-text-warning mr-2">
                    <i className="fas fa-redo" />
                  </span>
                  <span>Restart Host</span>
                </button>
                <button
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("shutdown");
                    setCurrentMode("host");
                  }}
                  className="dropdown-item"
                >
                  <span className="icon has-text-danger mr-2">
                    <i className="fas fa-power-off" />
                  </span>
                  <span>Power Off Host</span>
                </button>
              </>
            )}

            {/* Show read-only message for users */}
            {!canControlHosts(userRole) && (
              <>
                <hr className="dropdown-divider" />
                <div className="has-text-grey-light has-text-centered p-2 is-size-7">
                  Host controls require admin privileges
                  <br />
                  Users have read-only access to host information
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ZoneList = (props) => (
    <div
      className="dropdown-menu dropdown-content"
      id="zone-select"
      role="menu"
    >
      {currentZone && (
        <button
          onClick={() => {
            clearZone();
          }}
          className="dropdown-item"
        >
          <span className="icon has-text-warning mr-2">
            <i className="fas fa-times" />
          </span>
          <span>Deselect Zone</span>
        </button>
      )}
      {props.zones.data.allzones
        .filter((zone) => zone !== currentZone)
        .map((zone) => {
          const status = getZoneStatus(zone);
          const statusColor = getStatusDotColor(status);

          return (
            <button
              key={zone}
              onClick={() => {
                selectZone(zone);
              }}
              className="dropdown-item zw-navbar-zone-item"
            >
              <span>{zone}</span>
              <span
                className={`icon ${statusColor}`}
                title={`Status: ${status}`}
              >
                <i className="fas fa-circle is-size-7" />
              </span>
            </button>
          );
        })}
    </div>
  );

  useEffect(() => {
    // Set initial current server if we don't have one and there are servers available
    if (!currentServer && allServers && allServers.length > 0) {
      selectServer(allServers[0]);
    }
  }, [allServers, currentServer, selectServer]);

  useEffect(() => {
    // Fetch zones from current server
    if (currentServer && user) {
      const serverUrl = `${currentServer.protocol}://${currentServer.hostname}:${currentServer.port}`;
      axios
        .get(
          `/api/zapi/${currentServer.protocol}/${currentServer.hostname}/${currentServer.port}/stats`
        )
        .then((res) => {
          setZones(res);
        })
        .catch((error) => {
          console.error("Error fetching zones:", error);
        });
    }
  }, [currentServer, user]);

  return (
    <div className="hero-head">
      <nav className="level" role="navigation" aria-label="main navigation">
        {!isModal && (
          <FormModal
            isOpen={!isModal}
            onClose={handleModalClick}
            onSubmit={() => 
              currentMode === "host" 
                ? handleHostAction(currentAction)
                : handleZoneAction(currentAction)
            }
            title={`Confirm ${currentMode} ${currentAction}`}
            icon={getActionIcon(currentAction)}
            submitText={loading ? "Processing..." : currentAction}
            submitVariant={getActionVariant(currentAction)}
            loading={loading}
          >
            {currentMode === "host" && currentServer && (
              <div className="notification is-warning">
                <p>
                  <strong>Target:</strong> {currentServer.hostname}
                </p>
                <p>This action will {currentAction === "restart" ? "restart" : "shutdown"} the entire host system.</p>
                <p><strong>Warning:</strong> This will interrupt all system services and user sessions.</p>
              </div>
            )}
            {currentMode === "zone" && currentZone && (
              <div className="notification is-info">
                <p>
                  <strong>Target:</strong> {currentZone}
                </p>
                <p>This action will be performed on the selected zone.</p>
              </div>
            )}
          </FormModal>
        )}
        <div className="level-left">
          {currentServer ? (
            <div className="dropdown is-hoverable">
              <button
                className="dropdown-trigger button px-2"
                aria-haspopup="true"
                aria-controls="dropdown-menu"
              >
                <span>Host</span>
                <span className="icon">
                  <i className="fa fa-angle-down" aria-hidden="true" />
                </span>
              </button>

              <div
                className="dropdown-menu dropdown-content"
                id="host-select"
                role="menu"
              >
                {allServers &&
                  allServers.map((server, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        selectServer(server);
                        console.log("Host selected:", server.hostname);
                      }}
                      className="dropdown-item"
                    >
                      {server.hostname}
                    </button>
                  ))}
              </div>
              <div className="px-1 button">{currentServer.hostname}</div>
            </div>
          ) : (
            <a
              href="/ui/settings/zoneweaver?tab=servers"
              className="px-1 button"
            >
              <span>Add Server</span>
              <span className="icon has-text-success">
                <i className="fas fa-plus" />
              </span>
            </a>
          )}
          <div className="divider is-primary mx-4 is-vertical">|</div>
          <div className="dropdown is-hoverable">
            <button
              className="dropdown-trigger button px-2"
              aria-haspopup="true"
              aria-controls="dropdown-menu"
            >
              <span>Zone</span>
              <span className="icon">
                <i className="fa fa-angle-down" aria-hidden="true" />
              </span>
            </button>

            {zones && <ZoneList zones={zones} />}
            <div className="px-1 button is-flex is-align-items-center is-justify-content-space-between">
              <span>{currentZone}</span>
              {currentZone && (
                <span
                  className={`icon is-small ml-2 ${getStatusDotColor(getZoneStatus(currentZone))}`}
                  title={`Status: ${getZoneStatus(currentZone)}`}
                >
                  <i className="fas fa-circle is-size-8" />
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="level-right">
          {currentZone ? <ZoneControlDropdown /> : <HostControlDropdown />}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
