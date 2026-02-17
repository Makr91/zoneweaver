import { Helmet } from "@dr.pogodin/react-helmet";

import { useAccountsData } from "../../hooks/useAccountsData";

import AccountModals from "./AccountModals";
import { getNotificationClass } from "./accountUtils";
import OrganizationsTab from "./OrganizationsTab";
import UsersTab from "./UsersTab";

/**
 * Accounts component for admin user and organization management
 * @returns {JSX.Element} Accounts component
 */
const Accounts = () => {
  const data = useAccountsData();

  const {
    user,
    activeTab,
    setActiveTab,
    allUsers,
    viewScope,
    organizations,
    msg,
  } = data;

  return (
    <div className="zw-page-content-scrollable">
      <Helmet>
        <meta charSet="utf-8" />
        <title>User Management - Zoneweaver</title>
        <link rel="canonical" href={window.location.origin} />
      </Helmet>
      <div className="container is-fluid p-0">
        <div className="box p-0 is-radiusless">
          <div className="titlebar box active level is-mobile mb-0 p-3">
            <div className="level-left">
              <strong>
                {user?.role === "super-admin"
                  ? "Account Management"
                  : "User Management"}
              </strong>
              {user?.role === "super-admin" && (
                <div className="tabs ml-4">
                  <ul>
                    <li className={activeTab === "users" ? "is-active" : ""}>
                      <button
                        type="button"
                        className="button is-ghost"
                        onClick={() => setActiveTab("users")}
                      >
                        <span className="icon is-small">
                          <i className="fas fa-users" />
                        </span>
                        <span>Users</span>
                      </button>
                    </li>
                    <li
                      className={
                        activeTab === "organizations" ? "is-active" : ""
                      }
                    >
                      <button
                        type="button"
                        className="button is-ghost"
                        onClick={() => setActiveTab("organizations")}
                      >
                        <span className="icon is-small">
                          <i className="fas fa-building" />
                        </span>
                        <span>Organizations</span>
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className="level-right">
              {activeTab === "users" && (
                <span className="tag is-info">
                  {allUsers.length}{" "}
                  {viewScope === "all" ? "Total" : "Organization"} Users
                </span>
              )}
              {activeTab === "organizations" &&
                user?.role === "super-admin" && (
                  <span className="tag is-info">
                    {organizations.length} Organizations
                  </span>
                )}
            </div>
          </div>

          <div className="px-4">
            {msg && (
              <div className={`notification ${getNotificationClass(msg)}`}>
                <p>{msg}</p>
              </div>
            )}

            {activeTab === "users" && <UsersTab {...data} />}

            {activeTab === "organizations" && user?.role === "super-admin" && (
              <OrganizationsTab {...data} />
            )}

            {/* Help Section */}
            <div className="box">
              <h2 className="title is-6">User Management Guide</h2>
              <div className="content is-size-7">
                <div className="columns">
                  <div className="column">
                    <p>
                      <strong>Roles:</strong>
                    </p>
                    <ul>
                      <li>
                        <strong>User:</strong> Basic access to zones and hosts
                      </li>
                      <li>
                        <strong>Admin:</strong> Can manage users and
                        organization settings
                      </li>
                      <li>
                        <strong>Super Admin:</strong> Full system access, can
                        manage all users and organizations
                      </li>
                    </ul>
                  </div>
                  <div className="column">
                    <p>
                      <strong>Visibility:</strong>
                    </p>
                    <ul>
                      <li>
                        <strong>Super Admins:</strong> Can see all users across
                        all organizations
                      </li>
                      <li>
                        <strong>Organization Admins:</strong> Can only see users
                        in their organization
                      </li>
                      <li>
                        <strong>Users:</strong> Cannot access user management
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="columns">
                  <div className="column">
                    <p>
                      <strong>Permissions:</strong>
                    </p>
                    <ul>
                      <li>
                        Super admins can modify any user except other super
                        admins
                      </li>
                      <li>
                        Admins can only modify regular users in their
                        organization
                      </li>
                      <li>
                        No one can modify their own role or deactivate
                        themselves
                      </li>
                    </ul>
                  </div>
                  <div className="column">
                    <p>
                      <strong>Organizations:</strong>
                    </p>
                    <ul>
                      <li>Users belong to organizations for access control</li>
                      <li>
                        Super admins operate at system level (no organization)
                      </li>
                      <li>
                        Organization admins manage users within their scope
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AccountModals {...data} />
    </div>
  );
};

export default Accounts;
