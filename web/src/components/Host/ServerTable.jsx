import React from 'react';

const ServerTable = ({ servers, onEdit, onDelete, loading }) => {
  if (servers.length === 0) {
    return (
      <div className='has-text-centered p-6'>
        <div className='icon is-large mb-3 has-text-grey'>
          <i className='fas fa-server fa-3x'></i>
        </div>
        <h3 className='title is-4 has-text-grey'>No Servers Configured</h3>
        <p className='has-text-grey mb-4'>
          You haven't added any Zoneweaver API Servers yet. Add a server to start managing zones.
        </p>
      </div>
    );
  }

  return (
    <div className='table-container'>
      <table className='table is-fullwidth is-striped is-hoverable'>
        <thead>
          <tr>
            <th>No</th>
            <th>Hostname</th>
            <th>Protocol</th>
            <th>Port</th>
            <th>Entity Name</th>
            <th>Last Used</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {servers.map((server, index) => (
            <tr key={`${server.hostname}:${server.port}`}>
              <td>{index + 1}</td>
              <td>
                <strong>{server.hostname || server.serverHostname || 'No hostname'}</strong>
                {(!server.hostname && !server.serverHostname) && (
                  <small className='has-text-danger is-block'>
                    Missing hostname data - Check console
                  </small>
                )}
              </td>
              <td>{server.protocol}</td>
              <td>{server.port}</td>
              <td>{server.entityName}</td>
              <td>
                {server.lastUsed
                  ? new Date(server.lastUsed).toLocaleDateString()
                  : 'Never'
                }
              </td>
              <td>
                <div className='buttons are-small'>
                  <button
                    className='button is-small is-warning'
                    onClick={() => onEdit(server.hostname)}
                    disabled={loading}
                    title='Edit Server'
                  >
                    <span className='icon'>
                      <i className='fas fa-edit'></i>
                    </span>
                  </button>
                  <button
                    className='button is-small is-danger'
                    onClick={() => onDelete(server.id)}
                    disabled={loading}
                    title='Remove Server'
                  >
                    <span className='icon'>
                      <i className='fas fa-trash'></i>
                    </span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ServerTable;
