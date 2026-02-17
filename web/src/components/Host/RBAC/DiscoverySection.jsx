import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import { useServers } from "../../../contexts/ServerContext";
import { useDebounce } from "../../../utils/debounce";

import AuthorizationsTab from "./AuthorizationsTab";
import ProfilesTab from "./ProfilesTab";
import RolesTab from "./RolesTab";

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

  const loadAuthorizations = useCallback(async () => {
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
  }, [
    server,
    makeZoneweaverAPIRequest,
    debouncedAuthFilter,
    filters.limit,
    onError,
  ]);

  const loadProfiles = useCallback(async () => {
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
  }, [
    server,
    makeZoneweaverAPIRequest,
    debouncedProfileFilter,
    filters.limit,
    onError,
  ]);

  const loadRoles = useCallback(async () => {
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
  }, [server, makeZoneweaverAPIRequest, onError]);

  useEffect(() => {
    if (activeTab === "authorizations") {
      loadAuthorizations();
    } else if (activeTab === "profiles") {
      loadProfiles();
    } else if (activeTab === "roles") {
      loadRoles();
    }
  }, [activeTab, loadAuthorizations, loadProfiles, loadRoles]);

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

  const handleRefresh = () => {
    if (activeTab === "authorizations") {
      loadAuthorizations();
    } else if (activeTab === "profiles") {
      loadProfiles();
    } else {
      loadRoles();
    }
  };

  const tabs = [
    { key: "authorizations", label: "Authorizations", icon: "fa-shield-alt" },
    { key: "profiles", label: "Profiles", icon: "fa-id-card" },
    { key: "roles", label: "Roles", icon: "fa-user-shield" },
  ];

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
      <div className="tabs is-boxed mb-0">
        <ul>
          {tabs.map((tab) => (
            <li
              key={tab.key}
              className={activeTab === tab.key ? "is-active" : ""}
            >
              <button
                className="button is-text"
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="icon is-small">
                  <i className={`fas ${tab.icon}`} />
                </span>
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Filters */}
      <div className="box mb-4">
        <div className="columns">
          {activeTab !== "roles" && (
            <div className="column">
              <div className="field">
                <label className="label" htmlFor="rbac-filter">
                  Filter{" "}
                  {activeTab === "authorizations"
                    ? "Authorizations"
                    : "Profiles"}
                </label>
                <div className="control">
                  <input
                    id="rbac-filter"
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
                <label className="label" htmlFor="rbac-limit">
                  Limit Results
                </label>
                <div className="control">
                  <div className="select">
                    <select
                      id="rbac-limit"
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
              <label className="label" htmlFor="rbac-refresh">
                Refresh
              </label>
              <div className="control">
                <button
                  id="rbac-refresh"
                  className="button is-info"
                  onClick={handleRefresh}
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
                <label className="label" htmlFor="rbac-clear">
                  Clear
                </label>
                <div className="control">
                  <button
                    id="rbac-clear"
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

            <AuthorizationsTab
              authorizations={authorizations}
              loading={loading}
              copyToClipboard={copyToClipboard}
            />
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

            <ProfilesTab
              profiles={profiles}
              loading={loading}
              copyToClipboard={copyToClipboard}
            />
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

            <RolesTab
              roles={roles}
              loading={loading}
              copyToClipboard={copyToClipboard}
            />
          </div>
        )}
      </div>

      {/* Help Information */}
      <div className="notification is-info">
        <p>
          <strong>Tip:</strong> Use the copy button next to each item to copy
          its name to your clipboard. You can then paste it when creating or
          editing users and roles.
        </p>
        {activeTab === "authorizations" && (
          <p className="mt-2">
            <strong>Authorization Wildcards:</strong> Many authorizations
            support wildcards (*). For example, &quot;solaris.admin.*&quot;
            grants all admin-related authorizations.
          </p>
        )}
      </div>
    </div>
  );
};

RBACDiscoverySection.propTypes = {
  server: PropTypes.object.isRequired,
  onError: PropTypes.func.isRequired,
};

export default RBACDiscoverySection;
