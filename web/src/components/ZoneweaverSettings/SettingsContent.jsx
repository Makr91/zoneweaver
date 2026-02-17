import PropTypes from "prop-types";
import { useCallback } from "react";

import LoggingSectionRenderer from "./renderers/LoggingSectionRenderer";
import ServerSectionRenderer from "./renderers/ServerSectionRenderer";
import StandardSectionRenderer from "./renderers/StandardSectionRenderer";
import SubsectionRenderer from "./renderers/SubsectionRenderer";

const SettingsContent = ({
  activeTab,
  sections,
  values,
  collapsedSubsections,
  setCollapsedSubsections,
  sslFiles,
  uploadingFiles,
  loading,
  onFieldChange,
  onSslFileUpload,
  resetOidcProviderForm,
  setShowOidcProviderModal,
}) => {
  const toggleSubsection = useCallback(
    (sectionName, subsectionName) => {
      const key = `${sectionName}-${subsectionName}`;
      setCollapsedSubsections((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    },
    [setCollapsedSubsections]
  );

  const isSubsectionCollapsed = useCallback(
    (sectionName, subsectionName) => {
      const key = `${sectionName}-${subsectionName}`;
      return collapsedSubsections[key] || false;
    },
    [collapsedSubsections]
  );

  const shouldShowSubsection = useCallback(
    (subsection) =>
      // Show subsection if it has any fields
      subsection.fields && subsection.fields.length > 0,
    []
  );

  const renderSectionFields = useCallback(
    (sectionName, section) => {
      if (sectionName === "Logging") {
        return (
          <LoggingSectionRenderer
            values={values}
            handleFieldChange={onFieldChange}
            loading={loading}
          />
        );
      }

      if (sectionName === "Server") {
        return (
          <ServerSectionRenderer
            section={section}
            values={values}
            sslFiles={sslFiles}
            uploadingFiles={uploadingFiles}
            loading={loading}
            onFieldChange={onFieldChange}
            onSslFileUpload={onSslFileUpload}
          />
        );
      }

      return (
        <StandardSectionRenderer
          section={section}
          values={values}
          sslFiles={sslFiles}
          uploadingFiles={uploadingFiles}
          loading={loading}
          onFieldChange={onFieldChange}
          onSslFileUpload={onSslFileUpload}
        />
      );
    },
    [values, sslFiles, uploadingFiles, onFieldChange, onSslFileUpload, loading]
  );

  return (
    <>
      {/* Dynamic Configuration Sections */}
      {Object.entries(sections).map(
        ([sectionName, section]) =>
          activeTab === sectionName && (
            <div key={sectionName}>
              {/* Main Section Fields */}
              {section.fields.length > 0 && (
                <div className="box mb-4">
                  <h2 className="title is-5">
                    <span className="icon is-small mr-2">
                      <i className={section.icon} />
                    </span>
                    {section.title} Settings
                    <span className="tag is-light is-small ml-2">
                      {section.fields.length} setting
                      {section.fields.length !== 1 ? "s" : ""}
                    </span>
                  </h2>

                  {/* Section description from config */}
                  {section.description && (
                    <p className="subtitle is-6 has-text-grey mt-2 mb-4">
                      {section.description}
                    </p>
                  )}

                  {renderSectionFields(sectionName, section)}
                </div>
              )}

              {/* Subsections with Collapsible Cards */}
              {Object.entries(section.subsections || {}).map(
                ([subsectionName, subsection]) => {
                  // Skip subsection if none of its fields should be shown
                  if (!shouldShowSubsection(subsection)) {
                    return null;
                  }

                  const isCollapsed = isSubsectionCollapsed(
                    sectionName,
                    subsectionName
                  );

                  return (
                    <SubsectionRenderer
                      key={subsectionName}
                      sectionName={sectionName}
                      subsectionName={subsectionName}
                      subsection={subsection}
                      section={section}
                      isCollapsed={isCollapsed}
                      toggleSubsection={toggleSubsection}
                      values={values}
                      sslFiles={sslFiles}
                      uploadingFiles={uploadingFiles}
                      onFieldChange={onFieldChange}
                      onSslFileUpload={onSslFileUpload}
                      resetOidcProviderForm={resetOidcProviderForm}
                      setShowOidcProviderModal={setShowOidcProviderModal}
                      loading={loading}
                    />
                  );
                }
              )}

              {/* Show default message if section has no fields or subsections */}
              {section.fields.length === 0 &&
                Object.keys(section.subsections || {}).length === 0 && (
                  <div className="box mb-4">
                    <h2 className="title is-5">
                      <span className="icon is-small mr-2">
                        <i className={section.icon} />
                      </span>
                      {section.title} Settings
                    </h2>

                    {section.description && (
                      <p className="subtitle is-6 has-text-grey mb-4">
                        {section.description}
                      </p>
                    )}

                    <div className="notification is-info">
                      <p>No settings available in this section yet.</p>
                    </div>
                  </div>
                )}
            </div>
          )
      )}
    </>
  );
};

SettingsContent.propTypes = {
  activeTab: PropTypes.string.isRequired,
  sections: PropTypes.object.isRequired,
  values: PropTypes.object.isRequired,
  collapsedSubsections: PropTypes.object.isRequired,
  setCollapsedSubsections: PropTypes.func.isRequired,
  sslFiles: PropTypes.object.isRequired,
  uploadingFiles: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSslFileUpload: PropTypes.func.isRequired,
  resetOidcProviderForm: PropTypes.func.isRequired,
  setShowOidcProviderModal: PropTypes.func.isRequired,
};

export default SettingsContent;
