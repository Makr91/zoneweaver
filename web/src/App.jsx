import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { HelmetProvider } from "@dr.pogodin/react-helmet";

import Landing from "./components/Landing";
import Register from "./components/Register";
import Login from "./components/Login";
import AuthCallback from "./components/AuthCallback";
import Layout from "./components/Layout";
import ServerSetup from "./components/ServerSetup";

import { AuthProvider } from "./contexts/AuthContext";
import { ServerProvider } from "./contexts/ServerContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserSettingsProvider } from "./contexts/UserSettingsContext";
import { ZoneTerminalProvider } from "./contexts/ZoneTerminalContext";

/**
 * Main App component with authentication and routing
 * @returns {JSX.Element} App component
 */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ServerProvider>
          <UserSettingsProvider>
            <ZoneTerminalProvider>
              <HelmetProvider>
                <BrowserRouter>
                  <Routes>
                    <Route exact path="/" element={<Landing />} />
                    <Route exact path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/setup" element={<ServerSetup />} />
                    <Route path="/ui/auth/callback" element={<AuthCallback />} />
                    <Route
                      path="/ui/settings"
                      element={<Navigate to="/ui/settings/zoneweaver" />}
                    />
                    <Route path="/ui/*" element={<Layout />} />
                  </Routes>
                </BrowserRouter>
              </HelmetProvider>
            </ZoneTerminalProvider>
          </UserSettingsProvider>
        </ServerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
