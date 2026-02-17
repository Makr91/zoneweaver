import PropTypes from "prop-types";
import { useCallback } from "react";

import FieldRenderer from "../FieldRenderer";

const SubsectionRenderer = ({
  sectionName,
  subsectionName,
  subsection,
  section,
  isCollapsed,
  toggleSubsection,
  values,
  sslFiles,
  uploadingFiles,
  onFieldChange,
  onSslFileUpload,
  resetOidcProviderForm,
  setShowOidcProviderModal,
  loading,
}) => {
  const handleToggle = useCallback(() => {
    toggleSubsection(sectionName, subsectionName);
  }, [sectionName, subsectionName, toggleSubsection]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  // Special handling for OIDC Providers subsection
  if (subsectionName === "OIDC Providers") {
    return (
      <div className="box mb-4">
        <div
          className="is-clickable pb-2"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-expanded={!isCollapsed}
        >
          <h3 className="title is-6 mb-2">
            <span className="icon is-small mr-2">
              <i
                className={`fas ${isCollapsed ? "fa-chevron-right" : "fa-chevron-down"}`}
              />
            </span>
            <span className="icon is-small mr-2">
              <i className="fab fa-openid" />
            </span>
            {subsection.title}
            <span className="tag is-light is-small ml-2">
              {
                Object.entries(section.subsections || {}).filter(
                  ([name]) =>
                    name.toLowerCase().includes("oidc") &&
                    name !== "OIDC Providers"
                ).length
              }{" "}
              provider
              {Object.entries(section.subsections || {}).filter(
                ([name]) =>
                  name.toLowerCase().includes("oidc") &&
                  name !== "OIDC Providers"
              ).length !== 1
                ? "s"
                : ""}
            </span>
          </h3>
        </div>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="mt-3">
            {/* OIDC Provider Management */}
            <div className="level is-mobile mb-4">
              <div className="level-left">
                <div className="content">
                  <p className="has-text-grey is-size-7 mb-0">
                    Manage OpenID Connect authentication providers for single
                    sign-on integration.
                  </p>
                </div>
              </div>
              <div className="level-right">
                <button
                  className="button is-primary is-small"
                  onClick={() => {
                    resetOidcProviderForm();
                    setShowOidcProviderModal(true);
                  }}
                  disabled={loading}
                >
                  <span className="icon is-small">
                    <i className="fas fa-plus" />
                  </span>
                  <span>Add OIDC Provider</span>
                </button>
              </div>
            </div>

            {/* Show existing providers status */}
            {Object.entries(section.subsections || {}).filter(
              ([name]) =>
                name.toLowerCase().includes("oidc") && name !== "OIDC Providers"
            ).length > 0 ? (
              <div className="notification is-info is-light mb-4">
                <p className="is-size-7">
                  <strong>
                    {
                      Object.entries(section.subsections || {}).filter(
                        ([name]) =>
                          name.toLowerCase().includes("oidc") &&
                          name !== "OIDC Providers"
                      ).length
                    }
                  </strong>{" "}
                  OIDC provider(s) configured. Individual providers are shown as
                  expandable sections below.
                </p>
              </div>
            ) : (
              <div className="notification is-warning is-light mb-4">
                <p className="is-size-7">
                  No OIDC providers configured yet. Click &quot;Add OIDC
                  Provider&quot; to set up authentication with providers like
                  Google, Microsoft, GitHub, etc.
                </p>
              </div>
            )}

            {/* Render any fields if they exist */}
            {subsection.fields.length > 0 && (
              <div className="columns is-multiline">
                {subsection.fields.map((field) => (
                  <div
                    key={field.path}
                    className={
                      field.type === "textarea" || field.type === "array"
                        ? "column is-full"
                        : "column is-half"
                    }
                  >
                    <FieldRenderer
                      field={field}
                      values={values}
                      sslFiles={sslFiles}
                      uploadingFiles={uploadingFiles}
                      loading={loading}
                      onFieldChange={onFieldChange}
                      onSslFileUpload={onSslFileUpload}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Regular subsection rendering
  return (
    <div className="box mb-4">
      <div
        className="is-clickable pb-2"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
      >
        <h3 className="title is-6 mb-2">
          <span className="icon is-small mr-2">
            <i
              className={`fas ${isCollapsed ? "fa-chevron-right" : "fa-chevron-down"}`}
            />
          </span>
          <span className="icon is-small mr-2">
            <i className={section.icon} />
          </span>
          {subsection.title}
          <span className="tag is-light is-small ml-2">
            {subsection.fields.length} setting
            {subsection.fields.length !== 1 ? "s" : ""}
          </span>
        </h3>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="mt-3">
          <div className="columns is-multiline">
            {subsection.fields.map((field) => (
              <div
                key={field.path}
                className={
                  field.type === "textarea" || field.type === "array"
                    ? "column is-full"
                    : "column is-half"
                }
              >
                <FieldRenderer
                  field={field}
                  values={values}
                  sslFiles={sslFiles}
                  uploadingFiles={uploadingFiles}
                  loading={loading}
                  onFieldChange={onFieldChange}
                  onSslFileUpload={onSslFileUpload}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

SubsectionRenderer.propTypes = {
  sectionName: PropTypes.string.isRequired,
  subsectionName: PropTypes.string.isRequired,
  subsection: PropTypes.object.isRequired,
  section: PropTypes.object.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
  toggleSubsection: PropTypes.func.isRequired,
  values: PropTypes.object.isRequired,
  sslFiles: PropTypes.object.isRequired,
  uploadingFiles: PropTypes.object.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSslFileUpload: PropTypes.func.isRequired,
  resetOidcProviderForm: PropTypes.func.isRequired,
  setShowOidcProviderModal: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default SubsectionRenderer;
