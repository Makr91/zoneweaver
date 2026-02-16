import React, { useState, useRef } from "react";

import { useServers } from "../../../../../contexts/ServerContext";
import FormModal from "../../../../common/FormModal";

const ArtifactUploadModal = ({
  server,
  storagePaths,
  onClose,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState({
    storage_path_id: "",
    checksum: "",
    checksum_algorithm: "sha256",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const { makeZoneweaverAPIRequest } = useServers();

  const enabledStoragePaths = storagePaths.filter((path) => path.enabled);

  // Set default storage path if only one is available
  React.useEffect(() => {
    if (enabledStoragePaths.length === 1 && !formData.storage_path_id) {
      setFormData((prev) => ({
        ...prev,
        storage_path_id: enabledStoragePaths[0].id,
      }));
    }
  }, [enabledStoragePaths, formData.storage_path_id]);

  const validateForm = () => {
    const newErrors = {};

    if (selectedFiles.length === 0) {
      newErrors.files = "At least one file is required";
    }

    if (!formData.storage_path_id) {
      newErrors.storage_path_id = "Storage location is required";
    }

    if (formData.checksum.trim() && !formData.checksum_algorithm) {
      newErrors.checksum_algorithm =
        "Checksum algorithm is required when checksum is provided";
    }

    // Validate file types and sizes
    const maxFileSize = 50 * 1024 * 1024 * 1024; // 50GB
    const validExtensions = [
      ".iso",
      ".img",
      ".vmdk",
      ".vhd",
      ".vhdx",
      ".qcow2",
    ];

    for (const file of selectedFiles) {
      if (file.size > maxFileSize) {
        newErrors.files = `File "${file.name}" is too large (max 50GB)`;
        break;
      }

      const extension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));
      if (!validExtensions.includes(extension)) {
        newErrors.files = `File "${file.name}" has an unsupported file type. Supported: ${validExtensions.join(", ")}`;
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);

    if (errors.files) {
      setErrors((prev) => ({
        ...prev,
        files: "",
      }));
    }
  };

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const uploadFile = async (file, onProgress) => {
    try {
      // Step 1: Prepare upload with JSON metadata
      const prepareData = {
        filename: file.name,
        size: file.size,
        storage_path_id: formData.storage_path_id,
        overwrite_existing: false,
      };

      // Only add checksum fields if user actually provides a checksum
      if (formData.checksum.trim()) {
        prepareData.checksum = formData.checksum.trim();
        prepareData.checksum_algorithm = formData.checksum_algorithm;
      }

      const prepareResult = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "artifacts/upload/prepare",
        "POST",
        prepareData
      );

      if (!prepareResult.success || !prepareResult.data?.task_id) {
        throw new Error(
          `Prepare upload failed: ${prepareResult.message || "No task ID received"}`
        );
      }

      const taskId = prepareResult.data.task_id;

      // Step 2: Upload file using task ID
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const uploadResult = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `artifacts/upload/${taskId}`,
        "POST",
        formDataUpload,
        null,
        false,
        onProgress
      );

      return uploadResult;
    } catch (err) {
      throw new Error(`Upload failed: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setUploadProgress({});

      // Upload files sequentially to avoid overwhelming the server
      const results = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: { status: "uploading", progress: 0 },
        }));

        try {
          const result = await uploadFile(file, (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: {
                status: "uploading",
                progress: percent,
                loaded: progressEvent.loaded,
                total: progressEvent.total,
              },
            }));
          });

          if (result.success) {
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: { status: "completed", progress: 100 },
            }));
            results.push({
              file: file.name,
              success: true,
              task_id: result.data?.task_id,
              data: result.data,
            });
          } else {
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: {
                status: "error",
                progress: 0,
                error: result.message,
              },
            }));
            results.push({
              file: file.name,
              success: false,
              error: result.message,
            });
          }
        } catch (err) {
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: { status: "error", progress: 0, error: err.message },
          }));
          results.push({ file: file.name, success: false, error: err.message });
        }
      }

      // Check if any uploads succeeded
      const successfulUploads = results.filter((r) => r.success);
      if (successfulUploads.length > 0) {
        onSuccess(results);
      } else {
        onError("All uploads failed. Please check the files and try again.");
      }
    } catch (err) {
      onError(`Error during upload: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedStoragePath = enabledStoragePaths.find(
    (p) => p.id === formData.storage_path_id
  );

  if (enabledStoragePaths.length === 0) {
    return (
      <FormModal
        isOpen
        onClose={onClose}
        title="Upload Files"
        icon="fas fa-upload"
        submitText="Close"
        submitVariant="is-info"
      >
        <div className="notification is-warning">
          <p>
            <strong>No enabled storage locations available.</strong>
          </p>
          <p>
            You need at least one enabled storage location before you can upload
            artifacts. Please create or enable a storage location first.
          </p>
        </div>
      </FormModal>
    );
  }

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Upload Files"
      icon="fas fa-upload"
      submitText={loading ? "Uploading..." : "Upload Files"}
      submitVariant="is-primary"
      submitIcon="fas fa-upload"
      loading={loading}
      disabled={selectedFiles.length === 0}
      showCancelButton
    >
      <div className="field">
        <label className="label">Storage Location</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              value={formData.storage_path_id}
              onChange={(e) =>
                handleInputChange("storage_path_id", e.target.value)
              }
              disabled={loading}
              className={errors.storage_path_id ? "is-danger" : ""}
            >
              <option value="">Select storage location...</option>
              {enabledStoragePaths.map((path) => (
                <option key={path.id} value={path.id}>
                  {path.name} ({path.type}) - {path.path}
                </option>
              ))}
            </select>
          </div>
        </div>
        {errors.storage_path_id && (
          <p className="help is-danger">{errors.storage_path_id}</p>
        )}
        <p className="help">Where to store the uploaded files</p>
      </div>

      <div className="field">
        <label className="label">Files</label>
        <div
          className={`file is-boxed ${dragOver ? "is-active" : ""} ${errors.files ? "has-background-danger-light" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label className="file-label">
            <input
              ref={fileInputRef}
              className="file-input"
              type="file"
              multiple
              accept=".iso,.img,.vmdk,.vhd,.vhdx,.qcow2"
              onChange={handleFileInputChange}
              disabled={loading}
            />
            <span className="file-cta">
              <span className="file-icon">
                <i className="fas fa-upload" />
              </span>
              <span className="file-label">
                {dragOver ? "Drop files here" : "Choose files or drag and drop"}
              </span>
            </span>
          </label>
        </div>
        {errors.files && <p className="help is-danger">{errors.files}</p>}
        <p className="help">
          Supported formats: ISO, IMG, VMDK, VHD, VHDX, QCOW2 (max 50GB per
          file)
        </p>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="field">
          <label className="label">
            Selected Files ({selectedFiles.length})
          </label>
          <div className="box">
            {selectedFiles.map((file, index) => {
              const progress = uploadProgress[file.name];
              return (
                <div key={index} className="media">
                  <div className="media-content">
                    <div className="content">
                      <div className="level is-mobile">
                        <div className="level-left">
                          <div className="level-item">
                            <div>
                              <strong>{file.name}</strong>
                              <br />
                              <small>{formatFileSize(file.size)}</small>
                            </div>
                          </div>
                        </div>
                        <div className="level-right">
                          <div className="level-item">
                            {!loading && (
                              <button
                                type="button"
                                className="button is-small is-danger"
                                onClick={() => removeFile(index)}
                              >
                                <span className="icon is-small">
                                  <i className="fas fa-times" />
                                </span>
                              </button>
                            )}
                            {progress && (
                              <span
                                className={`tag is-small ml-2 ${
                                  progress.status === "completed"
                                    ? "is-success"
                                    : progress.status === "error"
                                      ? "is-danger"
                                      : "is-info"
                                }`}
                              >
                                {progress.status === "uploading" &&
                                  `${progress.progress}%`}
                                {progress.status === "completed" && "Complete"}
                                {progress.status === "error" && "Error"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {progress && progress.status === "uploading" && (
                        <div className="mt-2">
                          <progress
                            className="progress is-primary is-small"
                            value={progress.progress}
                            max="100"
                          >
                            {progress.progress}%
                          </progress>
                          <div className="is-size-7 has-text-grey">
                            {progress.loaded && progress.total && (
                              <span>
                                {formatFileSize(progress.loaded)} /{" "}
                                {formatFileSize(progress.total)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {progress && progress.status === "error" && (
                        <div className="notification is-danger is-small mt-2">
                          {progress.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="field">
        <label className="label">Checksum (Optional)</label>
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              className="input"
              type="text"
              placeholder="Expected checksum for verification"
              value={formData.checksum}
              onChange={(e) => handleInputChange("checksum", e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="control">
            <div className="select">
              <select
                value={formData.checksum_algorithm}
                onChange={(e) =>
                  handleInputChange("checksum_algorithm", e.target.value)
                }
                disabled={loading || !formData.checksum.trim()}
              >
                <option value="md5">MD5</option>
                <option value="sha1">SHA1</option>
                <option value="sha256">SHA256</option>
              </select>
            </div>
          </div>
        </div>
        <p className="help">
          Optional checksum for file integrity verification (applies to all
          files)
        </p>
      </div>

      {selectedStoragePath && (
        <div className="notification is-info">
          <div className="content">
            <p>
              <strong>Upload Destination:</strong>
            </p>
            <ul>
              <li>
                <strong>Name:</strong> {selectedStoragePath.name}
              </li>
              <li>
                <strong>Path:</strong> {selectedStoragePath.path}
              </li>
              <li>
                <strong>Type:</strong> {selectedStoragePath.type.toUpperCase()}
              </li>
              <li>
                <strong>Current Files:</strong>{" "}
                {selectedStoragePath.file_count || 0}
              </li>
            </ul>
          </div>
        </div>
      )}
    </FormModal>
  );
};

export default ArtifactUploadModal;
