import React, { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";
import { useDebounce } from "../../utils/debounce";

const RBACDiscoverySection = ({ server, onError }) => {
  const [activeTab, setActiveTab] = useState("authorizations");
  const [authorizations, setAuthorizations] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    authorizationFilter: "",
    profileFilter: "",
    limit: 100,
  });

  const { makeZoneweaverAPIRequest } = useServers();

  // Debounce the filters to avoid excessive API calls
  const debouncedAuthFilter = useDebounce(filters.authorizationFilter, 500);
  const debouncedProfileFilter = useDebounce(filters.profileFilter, 500);

  useEffect(() => {
    if (activeTab === "authorizations") {
      loadAuthorizations();
    } else if (activeTab === "profiles") {
      loadProfiles();
    } else if (activeTab === "roles") {
      loadRoles();
    }
  }, [server, activeTab, debouncedAuthFilter, debouncedProfileFilter, filters.limit]);

  const loadAuthorizations = async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const params = {};
      if (debouncedAuthFilter) {
        params.filter = debouncedAuthFilter;
      }
      if (filters.limit) {
        params.limit = filters.limit;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/rbac/authorizations",
        "GET",
        null,
        params
      );

      if (result.success) {
        setAuthorizations(result.data?.authorizations || []);
      } else {
        onError(result.message || "Failed to load authorizations");
        setAuthorizations([]);
      }
    } catch (err) {
      onError(`Error loading authorizations: ${err.message}`);
      setAuthorizations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const params = {};
      if (debouncedProfileFilter) {
        params.filter = debouncedProfileFilter;
      }
      if (filters.limit) {
        params.limit = filters.limit;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/rbac/profiles",
        "GET",
        null,
        params
      );

      if (result.success) {
        setProfiles(result.data?.profiles || []);
      } else {
        onError(result.message || "Failed to load profiles");
        setProfiles([]);
      }
    } catch (err) {
      onError(`Error loading profiles: ${err.message}`);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/rbac/roles",
        "GET"
      );

      if (result.success) {
        setRoles(result.data?.roles || []);
      } else {
        onError(result.message || "Failed to load roles");
        setRoles([]);
      }
    } catch (err) {
      onError(`Error loading roles: ${err.message}`);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      authorizationFilter: "",
      profileFilter: "",
      limit: 100,
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log("Copied to clipboard:", text);
    });
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="title is-5">RBAC Discovery</h2>
        <p className="content">
          Browse available authorizations, profiles, and roles on{" "}
          <strong>{server.hostname}</strong>. Use this to discover what RBAC
          components are available for user and role configuration.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs is-boxed">
        <ul>
          <li className={activeTab === "authorizations" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("authorizations")}>
              <span className="icon is-small">
                <i className="fas fa-shield-alt" />
              </span>
              <span>Authorizations</span>
            </a>
          </li>
          <li className={activeTab === "profiles" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("profiles")}>
              <span className="icon is-small">
                <i className="fas fa-id-card" />
              </span>
              <span>Profiles</span>
            </a>
          </li>
          <li className={activeTab === "roles" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("roles")}>
              <span className="icon is-small">
                <i className="fas fa-user-shield" />
              </span>
              <span>Roles</span>
            </a>
          </li>
        </ul>
      </div>

      {/* Filters */}
      <div className="box mb-4">
        <div className="columns">
          {activeTab !== "roles" && (
            <div className="column">
              <div className="field">
                <label className="label">
                  Filter {activeTab === "authorizations" ? "Authorizations" : "Profiles"}
                </label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder={
                      activeTab === "authorizations"
                        ? "Enter authorization pattern (e.g., solaris.admin)"
                        : "Enter profile pattern (e.g., admin)"
                    }
                    value={
                      activeTab === "authorizations"
                        ? filters.authorizationFilter
                        : filters.profileFilter
                    }
                    onChange={(e) =>
                      handleFilterChange(
                        activeTab === "authorizations"
                          ? "authorizationFilter"
                          : "profileFilter",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab !== "roles" && (
            <div className="column is-narrow">
              <div className="field">
                <label className="label">Limit Results</label>
                <div className="control">
                  <div className="select">
                    <select
                      value={filters.limit}
                      onChange={(e) =>
                        handleFilterChange("limit", parseInt(e.target.value))
                      }
                    >
                      <option value={50}>50 Results</option>
                      <option value={100}>100 Results</option>
                      <option value={200}>200 Results</option>
                      <option value={500}>500 Results</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="column is-narrow">
            <div className="field">
              <label className="label">&nbsp;</label>
              <div className="control">
                <button
                  className="button is-info"
                  onClick={() => {
                    if (activeTab === "authorizations") {
                      loadAuthorizations();
                    } else if (activeTab === "profiles") {
                      loadProfiles();
                    } else {
                      loadRoles();
                    }
                  }}
                  disabled={loading}
                >
                  <span className="icon">
                    <i className="fas fa-sync-alt" />
                  </span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {activeTab !== "roles" && (
            <div className="column is-narrow">
              <div className="field">
                <label className="label">&nbsp;</label>
                <div className="control">
                  <button
                    className="button"
                    onClick={clearFilters}
                    disabled={loading}
                  >
                    <span className="icon">
                      <i className="fas fa-times" />
                    </span>
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="box">
        {/* Authorizations Tab */}
        {activeTab === "authorizations" && (
          <div>
            <div className="level is-mobile mb-4">
              <div className="level-left">
                <h3 className="title is-6">
                  Authorizations ({authorizations.length})
                  {loading && (
                    <span className="ml-2">
                      <i className="fas fa-spinner fa-spin" />
                    </span>
                  )}
                </h3>
              </div>
            </div>

            {loading && authorizations.length === 0 ? (
              <div className="has-text-centered p-4">
                <span className="icon is-large">
                  <i className="fas fa-spinner fa-spin fa-2x" />
                </span>
                <p className="mt-2">Loading authorizations...</p>
              </div>
            ) : authorizations.length === 0 ? (
              <div className="has-text-centered p-4">
                <span className="icon is-large has-text-grey">
                  <i className="fas fa-shield-alt fa-2x" />
                </span>
                <p className="mt-2 has-text-grey">No authorizations found</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table is-fullwidth is-hoverable">
                  <thead>
                    <tr>
                      <th>Authorization</th>
                      <th>Short Description</th>
                      <th>Long Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {authorizations.map((auth, index) => (
                      <tr key={index}>
                        <td>
                          <code className="is-size-7">{auth.name}</code>
                        </td>
                        <td className="is-size-7">{auth.short_description || "N/A"}</td>
                        <td className="is-size-7" title={auth.long_description}>
                          {auth.long_description ? 
                            (auth.long_description.length > 50 ? 
                              `${auth.long_description.substring(0, 50)}...` : 
                              auth.long_description
                            ) : "N/A"
                          }
                        </td>
                        <td>
                          <button
                            className="button is-small"
                            onClick={() => copyToClipboard(auth.name)}
                            title="Copy to clipboard"
                          >
                            <span className="icon is-small">
                              <i className="fas fa-copy" />
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Profiles Tab */}
        {activeTab === "profiles" && (
          <div>
            <div className="level is-mobile mb-4">
              <div className="level-left">
                <h3 className="title is-6">
                  Profiles ({profiles.length})
                  {loading && (
                    <span className="ml-2">
                      <i className="fas fa-spinner fa-spin" />
                    </span>
                  )}
                </h3>
              </div>
            </div>

            {loading && profiles.length === 0 ? (
              <div className="has-text-centered p-4">
                <span className="icon is-large">
                  <i className="fas fa-spinner fa-spin fa-2x" />
                </span>
                <p className="mt-2">Loading profiles...</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="has-text-centered p-4">
                <span className="icon is-large has-text-grey">
                  <i className="fas fa-id-card fa-2x" />
                </span>
                <p className="mt-2 has-text-grey">No profiles found</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table is-fullwidth is-hoverable">
                  <thead>
                    <tr>
                      <th>Profile Name</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((profile, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{profile.name}</strong>
                        </td>
                        <td className="is-size-7" title={profile.description}>
                          {profile.description || "N/A"}
                        </td>
                        <td>
                          <button
                            className="button is-small"
                            onClick={() => copyToClipboard(profile.name)}
                            title="Copy to clipboard"
                          >
                            <span className="icon is-small">
                              <i className="fas fa-copy" />
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === "roles" && (
          <div>
            <div className="level is-mobile mb-4">
              <div className="level-left">
                <h3 className="title is-6">
                  Available Roles ({roles.length})
                  {loading && (
                    <span className="ml-2">
                      <i className="fas fa-spinner fa-spin" />
                    </span>
                  )}
                </h3>
              </div>
            </div>

            {loading && roles.length === 0 ? (
              <div className="has-text-centered p-4">
                <span className="icon is-large">
                  <i className="fas fa-spinner fa-spin fa-2x" />
                </span>
                <p className="mt-2">Loading roles...</p>
              </div>
            ) : roles.length === 0 ? (
              <div className="has-text-centered p-4">
                <span className="icon is-large has-text-grey">
                  <i className="fas fa-user-shield fa-2x" />
                </span>
                <p className="mt-2 has-text-grey">No roles found</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table is-fullwidth is-hoverable">
                  <thead>
                    <tr>
                      <th>Role Name</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role, index) => (
                      <tr key={index}>
                        <td>
                          <div className="is-flex is-align-items-center">
                            <span className="icon has-text-warning">
                              <i className="fas fa-user-shield" />
                            </span>
                            <span className="ml-2">
                              <strong>{role.name}</strong>
                            </span>
                          </div>
                        </td>
                        <td className="is-size-7" title={role.description}>
                          {role.description || "N/A"}
                        </td>
                        <td>
                          <button
                            className="button is-small"
                            onClick={() => copyToClipboard(role.name)}
                            title="Copy to clipboard"
                          >
                            <span className="icon is-small">
                              <i className="fas fa-copy" />
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help Information */}
      <div className="notification is-info">
        <p>
          <strong>Tip:</strong> Use the copy button next to each item to copy its name
          to your clipboard. You can then paste it when creating or editing users and roles.
        </p>
        {activeTab === "authorizations" && (
          <p className="mt-2">
            <strong>Authorization Wildcards:</strong> Many authorizations support wildcards (*).
            For example, "solaris.admin.*" grants all admin-related authorizations.
          </p>
        )}
      </div>
    </div>
  );
};

export default RBACDiscoverySection;
