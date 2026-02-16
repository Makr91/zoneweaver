import PropTypes from "prop-types";
import { createContext, useState } from "react";

const ServerSettings = createContext();

const ServerSettingsProvider = ({ children }) => {
  const [currentServer, setCurrentServer] = useState(0);
  const [backendURL, setBackendURL] = useState(null);
  const [currentHost, setCurrentHost] = useState(null);
  const [hosts, setHosts] = useState(null);

  return (
    <ServerSettings.Provider
      value={{
        currentServer,
        backendURL,
        currentHost,
        hosts,
        setCurrentServer,
        setBackendURL,
        setCurrentHost,
        setHosts,
      }}
    >
      {children}
    </ServerSettings.Provider>
  );
};

ServerSettingsProvider.propTypes = {
  children: PropTypes.node,
};

export { ServerSettings, ServerSettingsProvider };
