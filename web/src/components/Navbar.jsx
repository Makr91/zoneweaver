import PropTypes from "prop-types";

import {
  canStartStopZones,
  canRestartZones,
  canDestroyZones,
  canControlHosts,
  canPowerOffHosts,
} from "../utils/permissions";

import { FormModal } from "./common";
import {
  HostRestartOptions,
  HostShutdownOptions,
} from "./Navbar/HostActionModalContent";
import {
  getZoneStatus,
  getStatusDotColor,
  getActionVariant,
  getActionIcon,
  isShareableRoute,
} from "./Navbar/navbarUtils";
import { useNavbarActions } from "./Navbar/useNavbarActions";

const Navbar = () => {
  const {
    isModal,
    zones,
    currentMode,
    setCurrentMode,
    currentAction,
    setCurrentAction,
    loading,
    hostActionOptions,
    setHostActionOptions,
    recoveryFailed,
    setRecoveryFailed,
    handleModalClick,
    handleZoneAction,
    handleHostAction,
    handleShareCurrentPage,
    navigate,
    location,
    user,
    allServers,
    currentServer,
    currentZone,
    selectServer,
    selectZone,
    clearZone,
  } = useNavbarActions();

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
            {isShareableRoute(location.pathname) && currentServer && (
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
            {isShareableRoute(location.pathname) && currentServer && (
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

            <button
              onClick={() => navigate("/ui/hosts")}
              className="dropdown-item"
            >
              <span className="icon has-text-info mr-2">
                <i className="fas fa-eye" />
              </span>
              <span>View Host Details</span>
            </button>
            <button
              onClick={() => navigate("/ui/host-manage")}
              className="dropdown-item"
            >
              <span className="icon has-text-info mr-2">
                <i className="fas fa-cogs" />
              </span>
              <span>Manage Host</span>
            </button>

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

  const ZoneList = ({ zones: zoneData }) => (
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
      {zoneData.data.allzones
        .filter((zone) => zone !== currentZone)
        .map((zone) => {
          const status = getZoneStatus(zones, zone);
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

  ZoneList.propTypes = {
    zones: PropTypes.shape({
      data: PropTypes.shape({
        allzones: PropTypes.arrayOf(PropTypes.string).isRequired,
      }).isRequired,
    }).isRequired,
  };

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
              <div>
                <div className="notification is-warning mb-4">
                  <p>
                    <strong>Target:</strong> {currentServer.hostname}
                  </p>
                  <p>
                    This action will{" "}
                    {currentAction === "restart" ? "restart" : "shutdown"} the
                    entire host system.
                  </p>
                  <p>
                    <strong>Warning:</strong> This will interrupt all system
                    services and user sessions.
                  </p>
                </div>

                {currentAction === "restart" && (
                  <HostRestartOptions
                    hostActionOptions={hostActionOptions}
                    setHostActionOptions={setHostActionOptions}
                  />
                )}

                {currentAction === "shutdown" && (
                  <HostShutdownOptions
                    hostActionOptions={hostActionOptions}
                    setHostActionOptions={setHostActionOptions}
                  />
                )}
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
        {recoveryFailed && (
          <div className="notification is-warning">
            <button
              className="delete"
              onClick={() => setRecoveryFailed(false)}
              type="button"
            />
            Host restart is taking longer than expected. Please refresh the page
            manually to check if the server is back online.
          </div>
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
                  allServers.map((server) => (
                    <button
                      key={server.hostname}
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
                  className={`icon is-small ml-2 ${getStatusDotColor(getZoneStatus(zones, currentZone))}`}
                  title={`Status: ${getZoneStatus(zones, currentZone)}`}
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
