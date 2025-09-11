import React from "react";

import { useServers } from "../../../../../contexts/ServerContext";
import ContentModal from "../../../../common/ContentModal";

const ArtifactDetailsModal = ({ artifact, details, server, onClose }) => {
  const { makeZoneweaverAPIRequest } = useServers();

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (err) {
      return dateString;
    }
  };

  const getTypeIcon = (fileType, extension) => {
    const type = fileType?.toLowerCase() || extension?.toLowerCase();
    
    if (type === "iso" || extension?.toLowerCase() === ".iso") {
      return "fas fa-compact-disc has-text-info";
    } else if (type === "image" || [".vmdk", ".vhd", ".vhdx", ".qcow2", ".img"].includes(extension?.toLowerCase())) {
      return "fas fa-hdd has-text-warning";
    } else {
      return "fas fa-file has-text-grey";
    }
  };

  const getChecksumStatusIcon = (verified) => {
    if (verified === true) {
      return <i className="fas fa-check-circle has-text-success" />;
    } else if (verified === false) {
      return <i className="fas fa-times-circle has-text-danger" />;
    } else {
      return <i className="fas fa-question-circle has-text-grey" />;
    }
  };

  const getChecksumStatusText = (verified) => {
    if (verified === true) {
      return "Verified";
    } else if (verified === false) {
      return "Mismatch";
    } else {
      return "Not verified";
    }
  };

  const handleDownloadFile = async () => {
    try {
      // Create a link to download the artifact
      const downloadUrl = `${server.protocol}://${server.hostname}:${server.port}/artifacts/${artifact.id}/download`;
      
      // Open download in new window/tab
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = artifact.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  const artifactData = details || artifact;

  return (
    <ContentModal
      isOpen={true}
      onClose={onClose}
      title={artifact.filename}
      icon={getTypeIcon(artifact.file_type, artifact.extension)}
    >
      {/* Main Info Section */}
      <div className="content">
        <div className="columns">
          <div className="column">
            <h4 className="title is-5">File Information</h4>
            
            <table className="table is-fullwidth">
              <tbody>
                <tr>
                  <td><strong>Filename:</strong></td>
                  <td className="is-family-monospace">{artifactData.filename}</td>
                </tr>
                <tr>
                  <td><strong>File Type:</strong></td>
                  <td>
                    <span className={`tag ${
                      artifactData.file_type === 'iso' ? 'is-info' :
                      artifactData.file_type === 'image' ? 'is-warning' :
                      'is-light'
                    }`}>
                      {artifactData.file_type?.toUpperCase() || 'Unknown'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><strong>Extension:</strong></td>
                  <td className="is-family-monospace">{artifactData.extension || 'N/A'}</td>
                </tr>
                <tr>
                  <td><strong>MIME Type:</strong></td>
                  <td className="is-family-monospace">{artifactData.mime_type || 'N/A'}</td>
                </tr>
                <tr>
                  <td><strong>File Size:</strong></td>
                  <td>
                    <strong>{formatSize(artifactData.size)}</strong>
                    <span className="ml-2 has-text-grey is-size-7">
                      ({artifactData.size?.toLocaleString()} bytes)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><strong>Path:</strong></td>
                  <td className="is-family-monospace is-size-7">{artifactData.path}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="column">
            <h4 className="title is-5">Storage Details</h4>
            
            <table className="table is-fullwidth">
              <tbody>
                {artifactData.storage_location && (
                  <>
                    <tr>
                      <td><strong>Storage Name:</strong></td>
                      <td>{artifactData.storage_location.name}</td>
                    </tr>
                    <tr>
                      <td><strong>Storage Path:</strong></td>
                      <td className="is-family-monospace is-size-7">{artifactData.storage_location.path}</td>
                    </tr>
                    <tr>
                      <td><strong>Storage Type:</strong></td>
                      <td>
                        <span className="tag is-light">
                          {artifactData.storage_location.type?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  </>
                )}
                <tr>
                  <td><strong>Discovered:</strong></td>
                  <td>{formatDate(artifactData.discovered_at)}</td>
                </tr>
                {artifactData.source_url && (
                  <tr>
                    <td><strong>Source URL:</strong></td>
                    <td>
                      <a 
                        href={artifactData.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="is-size-7"
                      >
                        {artifactData.source_url}
                        <span className="icon is-small ml-1">
                          <i className="fas fa-external-link-alt" />
                        </span>
                      </a>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Checksum Section */}
      <div className="content">
        <h4 className="title is-5">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-shield-alt" />
            </span>
            <span>Checksum Information</span>
          </span>
        </h4>

        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label">Calculated Checksum</label>
              <div className="control">
                <input
                  className="input is-family-monospace is-size-7"
                  type="text"
                  value={artifactData.calculated_checksum || 'Not calculated'}
                  readOnly
                />
              </div>
            </div>
          </div>
          
          {artifactData.user_provided_checksum && (
            <div className="column">
              <div className="field">
                <label className="label">Expected Checksum</label>
                <div className="control">
                  <input
                    className="input is-family-monospace is-size-7"
                    type="text"
                    value={artifactData.user_provided_checksum}
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="columns">
          <div className="column is-narrow">
            <div className="field">
              <label className="label">Algorithm</label>
              <div className="control">
                <span className="tag is-info">
                  {artifactData.checksum_algorithm?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="column is-narrow">
            <div className="field">
              <label className="label">Verification Status</label>
              <div className="control">
                <span className="icon-text">
                  <span className="icon">
                    {getChecksumStatusIcon(artifactData.checksum_verified)}
                  </span>
                  <span className={`has-text-weight-semibold ${
                    artifactData.checksum_verified === true ? 'has-text-success' :
                    artifactData.checksum_verified === false ? 'has-text-danger' :
                    'has-text-grey'
                  }`}>
                    {getChecksumStatusText(artifactData.checksum_verified)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {artifactData.checksum_verified === false && (
          <div className="notification is-warning">
            <p>
              <strong>Checksum Mismatch Warning:</strong> The calculated checksum does not match the expected checksum. 
              This could indicate file corruption or an incorrect expected checksum value.
            </p>
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="content">
        <h4 className="title is-5">Actions</h4>
        <div className="field is-grouped">
          <p className="control">
            <button
              className="button is-primary"
              onClick={handleDownloadFile}
            >
              <span className="icon">
                <i className="fas fa-download" />
              </span>
              <span>Download File</span>
            </button>
          </p>
        </div>
      </div>

      {/* Technical Details */}
      <div className="content">
        <h4 className="title is-5">Technical Details</h4>
        <div className="notification is-light">
          <div className="columns is-mobile">
            <div className="column">
              <p className="heading">Artifact ID</p>
              <p className="is-family-monospace is-size-7">{artifactData.id}</p>
            </div>
            {artifactData.storage_location && (
              <div className="column">
                <p className="heading">Storage Location ID</p>
                <p className="is-family-monospace is-size-7">{artifactData.storage_location.id}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Type Specific Information */}
      {(artifactData.file_type === 'iso' || artifactData.extension === '.iso') && (
        <div className="content">
          <h4 className="title is-5">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-compact-disc" />
              </span>
              <span>ISO Information</span>
            </span>
          </h4>
          <div className="notification is-info">
            <p>
              This is an ISO 9660 disc image file, commonly used for distributing operating systems, 
              software, and other bootable media. ISO files can be mounted as virtual drives or 
              burned to physical media.
            </p>
          </div>
        </div>
      )}

      {(artifactData.file_type === 'image' && ['.vmdk', '.vhd', '.vhdx', '.qcow2'].includes(artifactData.extension)) && (
        <div className="content">
          <h4 className="title is-5">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-hdd" />
              </span>
              <span>VM Image Information</span>
            </span>
          </h4>
          <div className="notification is-warning">
            <p>
              This is a virtual machine disk image file. These files contain complete virtual machine 
              hard drives and can be used with hypervisors such as VMware, VirtualBox, KVM, or Hyper-V.
            </p>
          </div>
        </div>
      )}
    </ContentModal>
  );
};

export default ArtifactDetailsModal;
