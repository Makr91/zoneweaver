import axios from "axios";
import React, { useState, useEffect } from "react";

const ProvisioningStatus = ({ currentServer }) => {
  console.log("ProvisioningStatus rendered");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!currentServer) {
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(
          `/api/zapi/${currentServer.protocol}/${currentServer.hostname}/${currentServer.port}/provisioning/status`
        );
        setStatus(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load provisioning status");
        setLoading(false);
      }
    };

    fetchStatus();
  }, [currentServer]);

  if (loading) {
    return <p>Loading provisioning status...</p>;
  }

  if (error) {
    return <p className="has-text-danger">{error}</p>;
  }

  return (
    <div className="box">
      <h3 className="title is-5">Provisioning Status</h3>
      <div className="columns is-multiline is-narrow">
        {status &&
          Object.entries(status).map(([pkg, installed]) => (
            <div className="column is-one-quarter" key={pkg}>
              <div className="is-flex is-justify-content-space-between">
                <span>{pkg}</span>
                <span
                  className={`tag ${installed ? "is-success" : "is-danger"}`}
                >
                  {installed ? "Installed" : "Not Installed"}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default React.memo(ProvisioningStatus);
