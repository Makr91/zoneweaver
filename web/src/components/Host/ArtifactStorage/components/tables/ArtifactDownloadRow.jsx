import PropTypes from "prop-types";

import {
  formatSize,
  formatDate,
  getDownloadStatusIcon,
  getDownloadStatusText,
  getDownloadStatusTag,
} from "./artifactTableUtils";

/**
 * Renders the download size/progress cell content for an active download.
 */
const DownloadSizeCell = ({ download }) => {
  if (download.progress_info?.total_mb) {
    return (
      <div>
        <div className="has-text-weight-semibold">
          {formatSize(download.progress_info.downloaded_mb * 1024 * 1024)} /{" "}
          {formatSize(download.progress_info.total_mb * 1024 * 1024)}
        </div>
        {download.progress_info.speed_kbps && (
          <div className="is-size-7 has-text-grey">
            {Math.round(download.progress_info.speed_kbps / 1024)} MB/s
          </div>
        )}
      </div>
    );
  }

  if (download.progress_info?.file_size_mb) {
    return (
      <div className="has-text-weight-semibold">
        {formatSize(download.progress_info.file_size_mb * 1024 * 1024)}
      </div>
    );
  }

  return (
    <span className="has-text-grey">
      {download.status === "running" ? "Processing..." : "Pending"}
    </span>
  );
};

DownloadSizeCell.propTypes = {
  download: PropTypes.object.isRequired,
};

/**
 * A single active download placeholder row in the artifact table.
 */
const ArtifactDownloadRow = ({ download, onCancelDownload }) => (
  <tr className="has-background-light">
    <td>
      <span className="icon has-text-grey">
        <i className="fas fa-clock" />
      </span>
    </td>
    <td>
      <div className="is-flex is-align-items-center">
        <span className="icon mr-2">
          {getDownloadStatusIcon(download.status)}
        </span>
        <div>
          <div className="has-text-weight-semibold has-text-grey">
            {download.filename || "Downloading..."}
          </div>
          <div className="is-size-7 has-text-grey">
            <i className="fas fa-download mr-1" />
            {download.url && (
              <span title={download.url}>
                {download.url.length > 50
                  ? `${download.url.substring(0, 47)}...`
                  : download.url}
              </span>
            )}
          </div>
        </div>
      </div>
    </td>
    <td>{getDownloadStatusTag(download.status)}</td>
    <td>
      <DownloadSizeCell download={download} />
    </td>
    <td>
      <span className="icon has-text-grey" title="Download in progress">
        <i className="fas fa-clock" />
      </span>
    </td>
    <td>
      {download.storage_location && (
        <div>
          <div className="has-text-weight-semibold is-size-7 has-text-grey">
            {download.storage_location.name}
          </div>
          <div className="is-size-7 has-text-grey">
            {download.storage_location.path}
          </div>
        </div>
      )}
    </td>
    <td>
      <span className="is-size-7 has-text-grey">
        {formatDate(download.created_at)}
      </span>
    </td>
    <td>
      <div className="buttons are-small">
        {download.status === "failed" && download.error_message && (
          <button
            className="button is-danger is-small"
            title={`Download failed: ${download.error_message}`}
            disabled
          >
            <span className="icon is-small">
              <i className="fas fa-exclamation-circle" />
            </span>
          </button>
        )}

        {["queued", "running"].includes(download.status) &&
          onCancelDownload && (
            <button
              className="button is-warning is-small"
              onClick={() => onCancelDownload(download.taskId)}
              title="Cancel download"
            >
              <span className="icon is-small">
                <i className="fas fa-times" />
              </span>
            </button>
          )}

        <span className="tag is-small has-text-grey">
          {getDownloadStatusText(download.status)}
        </span>
      </div>
    </td>
  </tr>
);

ArtifactDownloadRow.propTypes = {
  download: PropTypes.object.isRequired,
  onCancelDownload: PropTypes.func,
};

export default ArtifactDownloadRow;
