import PropTypes from "prop-types";

import { canManageHosts } from "../../../utils/permissions";

import { isTextFile, isArchiveFile } from "./FileManagerTransforms";

/**
 * Get file size display label
 * @param {Object} file - File object
 * @returns {string} Size label
 */
const getFileSizeLabel = (file) => {
  if (file.isDirectory) {
    return "Directory";
  }
  if (file.size) {
    return `${Math.round(file.size / 1024)} KB`;
  }
  return "Unknown size";
};

/**
 * Get preview content based on file type
 * Uses early returns to avoid nested ternaries
 * @param {Object} file - File object
 * @param {string} userRole - Current user role
 * @returns {JSX.Element} Preview content
 */
const getPreviewContent = (file, userRole) => {
  if (file.isDirectory) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-folder fa-3x" />
        </span>
        <p className="mt-2">Directory</p>
        <p className="help">Double-click to open</p>
      </div>
    );
  }

  if (isTextFile(file)) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-file-alt fa-3x" />
        </span>
        <p className="mt-2">Text File</p>
        <div className="buttons is-centered mt-3">
          <button
            className="button is-primary is-small"
            onClick={(e) => {
              e.stopPropagation();
              const editEvent = new CustomEvent("zoneweaver-edit-file", {
                detail: file,
              });
              document.dispatchEvent(editEvent);
            }}
          >
            <span className="icon is-small">
              <i className="fas fa-edit" />
            </span>
            <span>Edit File</span>
          </button>
        </div>
      </div>
    );
  }

  if (isArchiveFile(file)) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-file-archive fa-3x" />
        </span>
        <p className="mt-2">Archive File</p>
        <div className="buttons is-centered mt-3">
          <button
            className="button is-success is-small"
            onClick={(e) => {
              e.stopPropagation();
              const extractEvent = new CustomEvent(
                "zoneweaver-extract-archive",
                { detail: file }
              );
              document.dispatchEvent(extractEvent);
            }}
            disabled={!canManageHosts(userRole)}
          >
            <span className="icon is-small">
              <i className="fas fa-expand-arrows-alt" />
            </span>
            <span>Extract</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="has-text-centered p-4">
      <span className="icon is-large">
        <i className="fas fa-file fa-3x" />
      </span>
      <p className="mt-2">File</p>
      <p className="help">Double-click to download</p>
    </div>
  );
};

/**
 * File Preview Panel Component
 * Renders file preview content in the cubone FileManager preview area
 */
const FilePreviewPanel = ({ file, userRole }) => (
  <div className="zoneweaver-file-preview">
    <div className="preview-header">
      <h4 className="title is-6">{file.name}</h4>
      <div className="preview-info">
        <span className="tag is-light">{getFileSizeLabel(file)}</span>
        {file._zwMetadata?.mimeType && (
          <span className="tag is-info is-light">
            {file._zwMetadata.mimeType}
          </span>
        )}
        {file._zwMetadata?.permissions && (
          <span className="tag is-dark">
            {file._zwMetadata.permissions.octal || "Unknown"}
          </span>
        )}
      </div>
    </div>

    <div className="preview-content">
      {getPreviewContent(file, userRole)}
    </div>

    {/* Action buttons for all files */}
    {canManageHosts(userRole) && (
      <div className="preview-actions">
        <div className="buttons is-centered">
          <button
            className="button is-link is-small is-outlined"
            onClick={(e) => {
              e.stopPropagation();
              const propsEvent = new CustomEvent(
                "zoneweaver-show-properties",
                { detail: file }
              );
              document.dispatchEvent(propsEvent);
            }}
          >
            <span className="icon is-small">
              <i className="fas fa-cog" />
            </span>
            <span>Properties</span>
          </button>
        </div>
      </div>
    )}

    {/* File metadata */}
    <div className="preview-metadata">
      <div className="field is-grouped is-grouped-multiline">
        <div className="control">
          <div className="tags has-addons">
            <span className="tag is-dark">Modified</span>
            <span className="tag is-light">
              {file.updatedAt
                ? new Date(file.updatedAt).toLocaleDateString()
                : "Unknown"}
            </span>
          </div>
        </div>
        {file._zwMetadata && (
          <div className="control">
            <div className="tags has-addons">
              <span className="tag is-dark">Owner</span>
              <span className="tag is-light">
                {file._zwMetadata.uid || "Unknown"}:
                {file._zwMetadata.gid || "Unknown"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

FilePreviewPanel.propTypes = {
  file: PropTypes.object.isRequired,
  userRole: PropTypes.string,
};

export default FilePreviewPanel;
