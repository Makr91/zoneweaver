import PropTypes from "prop-types";

const ServerManagement = ({
  serverList,
  newServer,
  setNewServer,
  onAddServer,
  onRemoveServer,
  saving,
}) => (
  <div className="box mb-4">
    <h3 className="title is-6">Server Management</h3>

    {/* Add Server */}
    <div className="field has-addons mb-4">
      <div className="control is-expanded">
        <input
          className="input"
          type="text"
          placeholder="Add NTP server (e.g., 0.pool.ntp.org)"
          value={newServer}
          onChange={(e) => setNewServer(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && onAddServer()}
        />
      </div>
      <div className="control">
        <button
          className="button is-primary"
          onClick={onAddServer}
          disabled={!newServer.trim() || saving}
        >
          <span className="icon">
            <i className="fas fa-plus" />
          </span>
          <span>Add Server</span>
        </button>
      </div>
    </div>

    {/* Current Servers */}
    {serverList.length > 0 && (
      <div>
        <p className="subtitle is-6">Current Servers ({serverList.length})</p>
        <div className="tags">
          {serverList.map((srv) => (
            <span key={srv} className="tag is-medium">
              <span className="icon is-small mr-1">
                <i className="fas fa-server" />
              </span>
              <span className="is-family-monospace">{srv}</span>
              <button
                className="delete is-small ml-1"
                onClick={() => onRemoveServer(srv)}
                disabled={saving}
              />
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

ServerManagement.propTypes = {
  serverList: PropTypes.arrayOf(PropTypes.string).isRequired,
  newServer: PropTypes.string.isRequired,
  setNewServer: PropTypes.func.isRequired,
  onAddServer: PropTypes.func.isRequired,
  onRemoveServer: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
};

export default ServerManagement;
