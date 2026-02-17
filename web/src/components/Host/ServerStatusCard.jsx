const ServerStatusCard = ({ testResult, useExistingApiKey }) => {
  if (!testResult) {
    return null;
  }

  return (
    <div className="box">
      <h2 className="title is-6">Connection Status</h2>
      <div className="content">
        {testResult === "success" && (
          <div className="notification is-success">
            <p>
              <strong>✓ Connection Successful</strong>
            </p>
            <p>
              Server is reachable and ready for{" "}
              {useExistingApiKey ? "setup" : "bootstrap"}.
            </p>
          </div>
        )}
        {testResult === "error" && (
          <div className="notification is-danger">
            <p>
              <strong>✗ Connection Failed</strong>
            </p>
            <p>Please check your server details and try again.</p>
          </div>
        )}
        {testResult === "warning" && (
          <div className="notification is-warning">
            <p>
              <strong>⚠ Partial Success</strong>
            </p>
            <p>Server added but connection test failed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerStatusCard;
