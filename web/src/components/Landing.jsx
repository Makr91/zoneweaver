import { Helmet } from "@dr.pogodin/react-helmet";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

/**
 * Landing component that handles first-time setup flow
 * @returns {JSX.Element} Landing component
 */
const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [setupStatus, setSetupStatus] = useState(null);
  const [checkingSetup, setCheckingSetup] = useState(true);

  /**
   * Check if system needs initial setup
   */
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await axios.get("/api/auth/setup-status");
        setSetupStatus(response.data);

        if (response.data.needsSetup) {
          // System needs setup - redirect to registration
          navigate("/register");
        } else if (isAuthenticated) {
          // User is logged in - go to dashboard
          navigate("/ui");
        } else {
          // System is set up but user not logged in - go to login
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking setup status:", error);
        // If we can't check setup status, assume we need to register
        navigate("/register");
      } finally {
        setCheckingSetup(false);
      }
    };

    if (!loading) {
      checkSetupStatus();
    }
  }, [navigate, isAuthenticated, loading]);

  // Show loading while checking authentication and setup status
  if (loading || checkingSetup) {
    return (
      <section className="hero is-fullheight is-fullwidth">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Zoneweaver - Loading</title>
          <link rel="canonical" href={window.location.origin} />
        </Helmet>
        <div className="hero-body">
          <div className="container has-text-centered">
            <div className="is-size-3">
              <i className="fas fa-spinner fa-spin" />
            </div>
            <p className="mt-3">Checking system status...</p>
          </div>
        </div>
      </section>
    );
  }

  // This should rarely be shown as we redirect based on setup status
  return (
    <section className="hero is-fullheight is-fullwidth">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Zoneweaver</title>
        <link rel="canonical" href={window.location.origin} />
      </Helmet>
      <div className="hero-body">
        <div className="container has-text-centered">
          <h1 className="title is-1">Welcome to Zoneweaver</h1>
          <p className="subtitle">Zone Management Made Simple</p>

          {setupStatus && (
            <div className="content mt-5">
              {setupStatus.needsSetup ? (
                <div>
                  <p>System needs initial setup.</p>
                  <a
                    href="/register"
                    className="button is-primary is-large mt-3"
                  >
                    Get Started
                  </a>
                </div>
              ) : (
                <div>
                  <p>
                    System is configured with {setupStatus.userCount} user(s).
                  </p>
                  <a href="/login" className="button is-primary is-large mt-3">
                    Login
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Landing;
