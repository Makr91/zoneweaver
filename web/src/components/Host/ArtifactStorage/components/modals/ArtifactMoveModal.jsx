import React, { useState } from "react";

import { useServers } from "../../../../../contexts/ServerContext";
import FormModal from "../../../../common/FormModal";

const ArtifactMoveModal = ({ server, artifact, storagePaths, onClose, onSuccess, onError }) => {
  const [destinationStoragePathId, setDestinationStoragePathId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { makeZoneweaverAPIRequest } = useServers();

  const availableStoragePaths = storagePaths.filter(path => path.enabled && path.id !== artifact.storage_location.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!destinationStoragePathId) {
      setError("Please select a destination storage location.");
      return;
    }

    try {
      setLoading(true);

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `artifacts/${artifact.id}/move`,
        "POST",
        {
          destination_storage_location_id: destinationStoragePathId
        }
      );

      if (result.success) {
        onSuccess(result);
      } else {
        onError(result.message || "Failed to move artifact");
      }
    } catch (err) {
      onError(`Error moving artifact: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Move Artifact"
      icon="fas fa-truck"
      submitText="Move Artifact"
      submitVariant="is-primary"
      loading={loading}
      showCancelButton={true}
    >
      {error && (
        <div className="notification is-danger">
          <button className="delete" onClick={() => setError("")}></button>
          {error}
        </div>
      )}

      <div className="field">
        <label className="label">Artifact</label>
        <div className="control">
          <input className="input" type="text" value={artifact.filename} readOnly />
        </div>
      </div>

      <div className="field">
        <label className="label">Current Storage Location</label>
        <div className="control">
          <input className="input" type="text" value={`${artifact.storage_location.name} (${artifact.storage_location.path})`} readOnly />
        </div>
      </div>

      <div className="field">
        <label className="label">Destination Storage Location</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              value={destinationStoragePathId}
              onChange={(e) => setDestinationStoragePathId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select a destination</option>
              {availableStoragePaths.map((path) => (
                <option key={path.id} value={path.id}>
                  {path.name} ({path.path})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </FormModal>
  );
};

export default ArtifactMoveModal;
