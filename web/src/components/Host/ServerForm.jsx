import PropTypes from "prop-types";

const ServerForm = ({
  hostname,
  setHostname,
  port,
  setPort,
  protocol,
  setProtocol,
  entityName,
  setEntityName,
  apiKey,
  setApiKey,
  useExistingApiKey,
  setUseExistingApiKey,
  loading,
}) => (
  <div className="box">
    <h2 className="title is-5 mb-4">Server Configuration</h2>

    <div className="columns">
      <div className="column is-3">
        <div className="field">
          <label className="label" htmlFor="server-protocol">
            Protocol
          </label>
          <div className="control">
            <div className="select is-fullwidth">
              <select
                id="server-protocol"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                disabled={loading}
              >
                <option value="https">HTTPS</option>
                <option value="http">HTTP</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="column is-6">
        <div className="field">
          <label className="label" htmlFor="server-hostname">
            Server Hostname
          </label>
          <div className="control">
            <input
              type="text"
              id="server-hostname"
              className="input"
              placeholder="zoneweaver-api.example.com"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>
      </div>
      <div className="column is-3">
        <div className="field">
          <label className="label" htmlFor="server-port">
            Port
          </label>
          <div className="control">
            <input
              type="number"
              id="server-port"
              className="input"
              placeholder="5001"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>
      </div>
    </div>

    <div className="field">
      <div className="control">
        <label className="checkbox" htmlFor="use-existing-api-key-checkbox">
          <input
            type="checkbox"
            checked={useExistingApiKey}
            onChange={(e) => setUseExistingApiKey(e.target.checked)}
            disabled={loading}
          />
          <span className="ml-2">I have an existing API key</span>
        </label>
      </div>
      <p className="help has-text-grey">
        Check this if you already have an API key and don&apos;t need to
        bootstrap
      </p>
    </div>

    {useExistingApiKey && (
      <div className="field">
        <label className="label" htmlFor="api-key-input">
          API Key
        </label>
        <div className="control">
          <input
            type="password"
            id="api-key-input"
            className="input"
            placeholder="Enter your existing API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <p className="help has-text-grey">
          Enter the API key you received from your Zoneweaver API Server
        </p>
      </div>
    )}

    {!useExistingApiKey && (
      <div className="field">
        <label className="label" htmlFor="entity-name-input">
          Entity Name
        </label>
        <div className="control">
          <input
            type="text"
            id="entity-name-input"
            className="input"
            placeholder="Zoneweaver-Production"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <p className="help has-text-grey">
          This name will identify this Zoneweaver instance on the Zoneweaver API
          Server
        </p>
      </div>
    )}

    <div className="field">
      <label className="label" htmlFor="connection-url-display">
        Connection URL
      </label>
      <div className="control">
        <input
          id="connection-url-display"
          type="text"
          className="input is-static"
          value={
            hostname
              ? `${protocol}://${hostname}:${port}`
              : "Enter hostname to see URL"
          }
          readOnly
        />
      </div>
    </div>
  </div>
);

ServerForm.propTypes = {
  hostname: PropTypes.string.isRequired,
  setHostname: PropTypes.func.isRequired,
  port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setPort: PropTypes.func.isRequired,
  protocol: PropTypes.string.isRequired,
  setProtocol: PropTypes.func.isRequired,
  entityName: PropTypes.string.isRequired,
  setEntityName: PropTypes.func.isRequired,
  apiKey: PropTypes.string.isRequired,
  setApiKey: PropTypes.func.isRequired,
  useExistingApiKey: PropTypes.bool.isRequired,
  setUseExistingApiKey: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default ServerForm;
