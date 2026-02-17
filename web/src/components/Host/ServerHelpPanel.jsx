const ServerHelpPanel = ({ useExistingApiKey }) => (
  <div className="box">
    <h2 className="title is-6">Setup Guide</h2>
    <div className="content is-size-7">
      <p>
        <strong>Steps:</strong>
      </p>
      <ol>
        <li>Enter your Zoneweaver API Server details</li>
        <li>Choose bootstrap or existing API key</li>
        <li>Click "Test Connection" to verify connectivity</li>
        <li>
          Click "{useExistingApiKey ? "Add Server" : "Bootstrap Server"}" to
          complete setup
        </li>
        <li>Start managing zones!</li>
      </ol>

      <p className="mt-4">
        <strong>Requirements:</strong>
      </p>
      <ul>
        <li>Zoneweaver API Server must be running</li>
        {!useExistingApiKey && <li>Bootstrap endpoint must be enabled</li>}
        <li>Network connectivity to server</li>
        {useExistingApiKey && <li>Valid API key from Zoneweaver API Server</li>}
      </ul>

      <p className="mt-4">
        <strong>Security:</strong>
      </p>
      <ul>
        <li>API keys are securely stored</li>
        {!useExistingApiKey && (
          <li>Bootstrap endpoint auto-disables after first use</li>
        )}
        <li>All communications are authenticated</li>
      </ul>
    </div>
  </div>
);

export default ServerHelpPanel;
