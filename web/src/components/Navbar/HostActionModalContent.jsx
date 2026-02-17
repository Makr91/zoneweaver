import PropTypes from "prop-types";

const hostActionOptionsPropType = PropTypes.shape({
  restartType: PropTypes.string.isRequired,
  powerType: PropTypes.string.isRequired,
  gracePeriod: PropTypes.number.isRequired,
  message: PropTypes.string.isRequired,
  bootEnvironment: PropTypes.string.isRequired,
}).isRequired;

export const HostRestartOptions = ({
  hostActionOptions,
  setHostActionOptions,
}) => (
  <div className="box">
    <div className="field">
      <label className="label" htmlFor="restart-type">
        Restart Type
      </label>
      <div className="control">
        <div className="select is-fullwidth">
          <select
            id="restart-type"
            value={hostActionOptions.restartType}
            onChange={(e) =>
              setHostActionOptions((prev) => ({
                ...prev,
                restartType: e.target.value,
              }))
            }
          >
            <option value="standard">Standard Restart</option>
            <option value="fast">Fast Reboot (x86 only)</option>
          </select>
        </div>
      </div>
      <p className="help">
        Fast reboot only works on x86 systems and skips firmware initialization
      </p>
    </div>

    {hostActionOptions.restartType === "fast" && (
      <div className="field">
        <label className="label" htmlFor="restart-boot-env">
          Boot Environment (Optional)
        </label>
        <div className="control">
          <input
            id="restart-boot-env"
            className="input"
            type="text"
            placeholder="Leave empty for current BE"
            value={hostActionOptions.bootEnvironment}
            onChange={(e) =>
              setHostActionOptions((prev) => ({
                ...prev,
                bootEnvironment: e.target.value,
              }))
            }
          />
        </div>
        <p className="help">
          Specify boot environment name to use after reboot
        </p>
      </div>
    )}

    {hostActionOptions.restartType === "standard" && (
      <div className="field">
        <label className="label" htmlFor="restart-grace-period">
          Grace Period (seconds)
        </label>
        <div className="control">
          <input
            id="restart-grace-period"
            className="input"
            type="number"
            min="0"
            max="7200"
            value={hostActionOptions.gracePeriod}
            onChange={(e) =>
              setHostActionOptions((prev) => ({
                ...prev,
                gracePeriod: parseInt(e.target.value) || 60,
              }))
            }
          />
        </div>
        <p className="help">Delay before restart (0-7200 seconds)</p>
      </div>
    )}

    <div className="field">
      <label className="label" htmlFor="restart-message">
        Message (Optional)
      </label>
      <div className="control">
        <input
          id="restart-message"
          className="input"
          type="text"
          placeholder="Custom restart message"
          maxLength="200"
          value={hostActionOptions.message}
          onChange={(e) =>
            setHostActionOptions((prev) => ({
              ...prev,
              message: e.target.value,
            }))
          }
        />
      </div>
      <p className="help">
        Optional message for system logs (max 200 characters)
      </p>
    </div>
  </div>
);

HostRestartOptions.propTypes = {
  hostActionOptions: hostActionOptionsPropType,
  setHostActionOptions: PropTypes.func.isRequired,
};

export const HostShutdownOptions = ({
  hostActionOptions,
  setHostActionOptions,
}) => (
  <div className="box">
    <div className="field">
      <label className="label" htmlFor="shutdown-type">
        Shutdown Type
      </label>
      <div className="control">
        <div className="select is-fullwidth">
          <select
            id="shutdown-type"
            value={hostActionOptions.powerType}
            onChange={(e) =>
              setHostActionOptions((prev) => ({
                ...prev,
                powerType: e.target.value,
              }))
            }
          >
            <option value="shutdown">Shutdown (to single-user mode)</option>
            <option value="poweroff">Power Off (complete shutdown)</option>
            <option value="halt">Emergency Halt (immediate)</option>
          </select>
        </div>
      </div>
      <p className="help">
        {hostActionOptions.powerType === "shutdown" &&
          "Graceful shutdown to single-user mode"}
        {hostActionOptions.powerType === "poweroff" &&
          "Complete power off - requires manual restart"}
        {hostActionOptions.powerType === "halt" &&
          "Emergency halt - immediate, no grace period"}
      </p>
    </div>

    {hostActionOptions.powerType !== "halt" && (
      <div className="field">
        <label className="label" htmlFor="shutdown-grace-period">
          Grace Period (seconds)
        </label>
        <div className="control">
          <input
            id="shutdown-grace-period"
            className="input"
            type="number"
            min="0"
            max="7200"
            value={hostActionOptions.gracePeriod}
            onChange={(e) =>
              setHostActionOptions((prev) => ({
                ...prev,
                gracePeriod: parseInt(e.target.value) || 60,
              }))
            }
          />
        </div>
        <p className="help">Delay before shutdown (0-7200 seconds)</p>
      </div>
    )}

    {hostActionOptions.powerType !== "halt" && (
      <div className="field">
        <label className="label" htmlFor="shutdown-message">
          Message (Optional)
        </label>
        <div className="control">
          <input
            id="shutdown-message"
            className="input"
            type="text"
            placeholder="Custom shutdown message"
            maxLength="200"
            value={hostActionOptions.message}
            onChange={(e) =>
              setHostActionOptions((prev) => ({
                ...prev,
                message: e.target.value,
              }))
            }
          />
        </div>
        <p className="help">
          Optional message for system logs (max 200 characters)
        </p>
      </div>
    )}
  </div>
);

HostShutdownOptions.propTypes = {
  hostActionOptions: hostActionOptionsPropType,
  setHostActionOptions: PropTypes.func.isRequired,
};
