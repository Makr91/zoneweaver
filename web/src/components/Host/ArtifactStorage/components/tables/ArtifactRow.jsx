import PropTypes from "prop-types";

import {
  formatSize,
  formatDate,
  getTypeIcon,
  getTypeTag,
  getChecksumStatus,
} from "./artifactTableUtils";

/**
 * A single artifact row in the artifact table.
 */
const ArtifactRow = ({
  artifact,
  selected,
  loading,
  onSelect,
  onDetails,
  onDelete,
  onMove,
  onCopy,
}) => (
  <tr>
    <td>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(artifact.id)}
        />
        <span className="is-sr-only">Select {artifact.filename}</span>
      </label>
    </td>
    <td>
      <div className="is-flex is-align-items-center">
        <span className="icon mr-2">
          {getTypeIcon(artifact.file_type, artifact.extension)}
        </span>
        <div>
          <div className="has-text-weight-semibold">{artifact.filename}</div>
          {artifact.source_url && (
            <div className="is-size-7 has-text-grey">
              <i className="fas fa-download mr-1" />
              Downloaded from URL
            </div>
          )}
        </div>
      </div>
    </td>
    <td>{getTypeTag(artifact.file_type, artifact.extension)}</td>
    <td>
      <span className="has-text-weight-semibold">
        {formatSize(artifact.size)}
      </span>
    </td>
    <td>
      <div className="is-flex is-align-items-center">
        {getChecksumStatus(artifact)}
        {artifact.checksum_algorithm && (
          <span className="tag is-small is-light ml-1">
            {artifact.checksum_algorithm.toUpperCase()}
          </span>
        )}
      </div>
    </td>
    <td>
      {artifact.storage_location && (
        <div>
          <div className="has-text-weight-semibold is-size-7">
            {artifact.storage_location.name}
          </div>
          <div className="is-size-7 has-text-grey">
            {artifact.storage_location.path}
          </div>
        </div>
      )}
    </td>
    <td>
      <span className="is-size-7">{formatDate(artifact.discovered_at)}</span>
    </td>
    <td>
      <div className="buttons are-small">
        <button
          className="button"
          onClick={() => onDetails(artifact)}
          disabled={loading}
          title="View details"
        >
          <span className="icon is-small">
            <i className="fas fa-info-circle" />
          </span>
        </button>

        <button
          className="button is-danger"
          onClick={() => onDelete([artifact.id])}
          disabled={loading}
          title="Delete artifact"
        >
          <span className="icon is-small">
            <i className="fas fa-trash" />
          </span>
        </button>

        <div className="dropdown is-hoverable is-right">
          <div className="dropdown-trigger">
            <button
              className="button"
              aria-haspopup="true"
              aria-controls="dropdown-menu"
            >
              <span className="icon is-small">
                <i className="fas fa-ellipsis-h" aria-hidden="true" />
              </span>
            </button>
          </div>
          <div className="dropdown-menu" id="dropdown-menu" role="menu">
            <div className="dropdown-content">
              <button
                type="button"
                className="dropdown-item button is-ghost"
                onClick={() => onMove(artifact)}
              >
                <span className="icon-text">
                  <span className="icon">
                    <i className="fas fa-truck" />
                  </span>
                  <span>Move</span>
                </span>
              </button>
              <button
                type="button"
                className="dropdown-item button is-ghost"
                onClick={() => onCopy(artifact)}
              >
                <span className="icon-text">
                  <span className="icon">
                    <i className="fas fa-copy" />
                  </span>
                  <span>Copy</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </td>
  </tr>
);

ArtifactRow.propTypes = {
  artifact: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDetails: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onCopy: PropTypes.func.isRequired,
};

export default ArtifactRow;
