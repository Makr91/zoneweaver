import { Helmet } from "@dr.pogodin/react-helmet";
import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

/**
 * Register component for Zoneweaver user registration with organization support
 * @returns {JSX.Element} Register component
 */
const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [invitation, setInvitation] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isAuthenticated } = useAuth();

  /**
   * Redirect to dashboard if already authenticated
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/ui");
    }
  }, [isAuthenticated, navigate]);

  /**
   * Validate invitation code
   */
  const validateInvitation = async (code) => {
    try {
      const response = await axios.get(`/api/invitations/${code}/validate`);
      if (response.data.success && response.data.valid) {
        setInvitation(response.data.invitation);
        setEmail(response.data.invitation.email); // Pre-fill email
        setMsg(
          `You've been invited to join ${response.data.invitation.organizationName}!`
        );
      } else {
        setMsg(`Invalid invitation: ${response.data.reason}`);
      }
    } catch (validateErr) {
      console.error("Error validating invitation:", validateErr);
      setMsg("Error validating invitation code");
    }
  };

  /**
   * Check setup status and invitation on component mount
   */
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await axios.get("/api/auth/setup-status");
        if (response.data.success) {
          setNeedsSetup(response.data.needsSetup);
        }
      } catch (setupErr) {
        console.error("Error checking setup status:", setupErr);
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetupStatus();

    // Check for invitation code in URL
    const inviteParam = searchParams.get("invite");
    if (inviteParam) {
      setInviteCode(inviteParam);
      validateInvitation(inviteParam);
    }
  }, [searchParams]);

  /**
   * Handle registration form submission
   * @param {Event} e - Form submit event
   */
  const handleRegister = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
      setMsg("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setMsg("Password must be at least 8 characters long");
      return;
    }

    // Organization validation for non-first users
    if (!needsSetup && !inviteCode && !organizationName) {
      setMsg("Organization name is required");
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      const registrationData = {
        username,
        email,
        password,
        confirmPassword,
      };

      // Add organization data if not first user
      if (!needsSetup) {
        if (inviteCode) {
          registrationData.inviteCode = inviteCode;
        } else if (organizationName) {
          registrationData.organizationName = organizationName;
        }
      }

      const result = await register(registrationData);

      if (result.success) {
        setMsg("Registration successful! Please login with your credentials.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMsg(result.message);
      }
    } catch (registerErr) {
      console.error("Registration error:", registerErr);
      setMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPageTitle = () => {
    if (needsSetup) {
      return "Setup Super Admin Account";
    }
    if (invitation) {
      return `Join ${invitation.organizationName}`;
    }
    return "Create Account";
  };

  const getSubmitButtonText = () => {
    if (needsSetup) {
      return "Create Super Admin Account";
    }
    if (invitation) {
      return `Join ${invitation.organizationName}`;
    }
    return "Create Account & Organization";
  };

  const getNotificationClass = () => {
    if (msg.includes("successful") || msg.includes("invited")) {
      return "is-success";
    }
    if (
      msg.includes("error") ||
      msg.includes("failed") ||
      msg.includes("Invalid")
    ) {
      return "is-danger";
    }
    return "is-warning";
  };

  const renderHelpContent = () => {
    if (needsSetup) {
      return (
        <>
          <p>
            <strong>Setting up Zoneweaver:</strong>
          </p>
          <ul>
            <li>This is the initial system setup</li>
            <li>Your account will have super admin privileges</li>
            <li>You can manage all organizations and users</li>
            <li>Additional users will need to create or join organizations</li>
          </ul>
        </>
      );
    }
    if (invitation) {
      return (
        <>
          <p>
            <strong>Joining an organization:</strong>
          </p>
          <ul>
            <li>
              You&apos;ve been invited to join {invitation.organizationName}
            </li>
            <li>Complete the form to accept the invitation</li>
            <li>You&apos;ll become a member of the organization</li>
            <li>Contact the person who invited you if you have questions</li>
          </ul>
        </>
      );
    }
    return (
      <>
        <p>
          <strong>Creating a new organization:</strong>
        </p>
        <ul>
          <li>Enter a unique organization name</li>
          <li>You&apos;ll become the admin of this new organization</li>
          <li>You can invite other users to join your organization</li>
          <li>If the organization already exists, ask for an invitation</li>
        </ul>
      </>
    );
  };

  if (checkingSetup) {
    return (
      <section className="hero is-fullheight is-fullwidth">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Register - Zoneweaver</title>
          <link rel="canonical" href={window.location.origin} />
        </Helmet>
        <div className="hero-body">
          <div className="container">
            <div className="columns is-centered">
              <div className="column is-4-desktop">
                <div className="box has-text-centered">
                  <div className="button is-loading is-large is-ghost" />
                  <p className="mt-2">Checking system status...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero is-fullheight is-fullwidth">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Register - Zoneweaver</title>
        <link rel="canonical" href={window.location.origin} />
      </Helmet>
      <div className="hero-body">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-4-desktop">
              <form onSubmit={handleRegister} className="box">
                <h1 className="title has-text-centered">{getPageTitle()}</h1>

                {/* Invitation Info */}
                {invitation && (
                  <div className="notification is-info mb-4">
                    <p>
                      <strong>🎉 You&apos;re invited!</strong>
                      <br />
                      You&apos;ve been invited to join{" "}
                      <strong>{invitation.organizationName}</strong>
                    </p>
                  </div>
                )}

                {/* Super Admin Notice */}
                {needsSetup && (
                  <div className="notification is-warning mb-4">
                    <p>
                      <strong>⚡ System Setup</strong>
                      <br />
                      You&apos;re creating the first user account. This will be
                      the super admin account with full system access.
                    </p>
                  </div>
                )}

                {msg && (
                  <div className={`notification ${getNotificationClass()}`}>
                    <p>{msg}</p>
                  </div>
                )}

                <div className="field mt-5">
                  <label className="label" htmlFor="username">
                    Username
                  </label>
                  <div className="controls">
                    <input
                      id="username"
                      type="text"
                      className="input"
                      autoComplete="username"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="field mt-5">
                  <label className="label" htmlFor="email">
                    Email
                  </label>
                  <div className="controls">
                    <input
                      id="email"
                      type="email"
                      className="input"
                      autoComplete="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading || !!invitation}
                      required
                    />
                  </div>
                  {invitation && (
                    <p className="help">
                      Email is pre-filled from your invitation
                    </p>
                  )}
                </div>

                {/* Organization field - only show if not first user and no invitation */}
                {!needsSetup && !invitation && (
                  <div className="field mt-5">
                    <label className="label" htmlFor="organizationName">
                      Organization Name
                    </label>
                    <div className="controls">
                      <input
                        id="organizationName"
                        type="text"
                        className="input"
                        placeholder="Enter organization name"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                    <p className="help">
                      Enter a new organization name to create, or get an
                      invitation to join an existing one.
                    </p>
                  </div>
                )}

                <div className="field mt-5">
                  <label className="label" htmlFor="password">
                    Password
                  </label>
                  <div className="controls">
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      className="input"
                      placeholder="Password (min 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="field mt-5">
                  <label className="label" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="controls">
                    <input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      className="input"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="field mt-5">
                  <button
                    type="submit"
                    className={`button is-success is-fullwidth ${loading ? "is-loading" : ""}`}
                    disabled={loading}
                  >
                    {getSubmitButtonText()}
                  </button>
                </div>

                <div className="has-text-centered mt-3">
                  <p>
                    Already have an account?{" "}
                    <a href="/login" className="has-text-link">
                      Login here
                    </a>
                  </p>
                </div>

                {/* Help section */}
                <div className="has-text-centered mt-4">
                  <details className="details">
                    <summary className="has-text-grey is-size-7 is-clickable">
                      Need help? Click here
                    </summary>
                    <div className="content is-size-7 has-text-left mt-2 p-3 ">
                      {renderHelpContent()}
                    </div>
                  </details>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
