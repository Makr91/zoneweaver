import { FileManager } from "@cubone/react-file-manager";
import PropTypes from "prop-types";
import { useState, useEffect, useCallback, useMemo } from "react";
import "@cubone/react-file-manager/dist/style.css";

import { useAuth } from "../../../contexts/AuthContext";
import { useServers } from "../../../contexts/ServerContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { canManageHosts, canViewHosts } from "../../../utils/permissions";

import CustomActions from "./CustomActions";
import { ZoneweaverFileManagerAPI } from "./FileManagerAPI";
import {
  transformZoneweaverToFile,
  isTextFile,
  isArchiveFile,
} from "./FileManagerTransforms";
import "./HostFileManager.scss";

/**
 * Extended File Manager Component
 * Properly integrates with cubone's internal systems for context menu and actions
 */
const ExtendedFileManager = ({ server }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");
  const [error, setError] = useState("");
  const [directoryCache, setDirectoryCache] = useState(new Map());

  const { user } = useAuth();
  const { theme } = useTheme();
  const serverContext = useServers();

  // Initialize API instance
  const api = useMemo(
    () => new ZoneweaverFileManagerAPI(serverContext),
    [serverContext]
  );

  // Load files with navigation support
  const loadFiles = useCallback(
    async (path = currentPath) => {
      if (!server) {
        setFiles([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        console.log("Loading files for path:", path);

        // Load current directory files
        const currentFiles = await api.loadFiles(path);

        // Maintain root directories for navigation
        let cachedDirectories = directoryCache.get("/") || [];

        if (cachedDirectories.length === 0) {
          try {
            const rootFiles = await api.loadFiles("/");
            cachedDirectories = rootFiles.filter((file) => file.isDirectory);
            setDirectoryCache((prev) =>
              new Map(prev).set("/", cachedDirectories)
            );
          } catch (err) {
            console.log("Could not load root directories for navigation");
          }
        }

        // Build comprehensive file list for cubone navigation
        const combinedFiles = [...currentFiles];

        // Add cached root directories if not at root
        if (path !== "/") {
          cachedDirectories.forEach((dir) => {
            if (!combinedFiles.some((f) => f.path === dir.path)) {
              combinedFiles.push(dir);
            }
          });
        }

        // Add parent directories for subdirectory navigation
        if (path !== "/") {
          const pathParts = path.split("/").filter(Boolean);
          let currentSearchPath = "";

          for (let i = 0; i < pathParts.length - 1; i++) {
            currentSearchPath += `/${pathParts[i]}`;

            let parentDirs = directoryCache.get(currentSearchPath);
            if (!parentDirs) {
              try {
                const parentFiles = await api.loadFiles(currentSearchPath);
                parentDirs = parentFiles.filter((file) => file.isDirectory);
                setDirectoryCache((prev) =>
                  new Map(prev).set(currentSearchPath, parentDirs)
                );
              } catch (err) {
                continue;
              }
            }

            parentDirs.forEach((dir) => {
              if (!combinedFiles.some((f) => f.path === dir.path)) {
                combinedFiles.push(dir);
              }
            });
          }
        }

        console.log(
          "Combined files for cubone:",
          combinedFiles.length,
          "files"
        );
        setFiles(combinedFiles);
      } catch (error) {
        console.error("Error loading files:", error);
        setError(`Failed to load files: ${error.message}`);
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    },
    [server, currentPath, api, directoryCache]
  );

  // Load files when component mounts or dependencies change
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Permission configuration based on user role
  const permissions = useMemo(
    () => ({
      create: canManageHosts(user?.role),
      upload: canManageHosts(user?.role),
      move: canManageHosts(user?.role),
      copy: canManageHosts(user?.role),
      rename: canManageHosts(user?.role),
      download: canViewHosts(user?.role),
      delete: canManageHosts(user?.role),
      // Custom permissions for extended features
      edit: canManageHosts(user?.role),
      archive: canManageHosts(user?.role),
      properties: canManageHosts(user?.role),
    }),
    [user?.role]
  );

  // Upload configuration
  const fileUploadConfig = useMemo(() => {
    if (!server) {
      return null;
    }

    return {
      url: `/api/zapi/${server.protocol}/${server.hostname}/${server.port}/filesystem/upload`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    };
  }, [server]);

  // Theme integration
  const themeConfig = useMemo(() => {
    const primaryColor = "#ff6600"; // Orange from Bulma theme
    const fontFamily = "Nunito Sans, sans-serif"; // Match zoneweaver

    return { primaryColor, fontFamily };
  }, [theme]);

  // Standard cubone handlers
  const handleCreateFolder = async (name, parentFolder) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await api.createFolder(name, parentFolder, currentPath);

      if (result.success) {
        setFiles((prevFiles) => [...prevFiles, result.file]);
        setTimeout(() => loadFiles(), 500);
      } else {
        setError(result.message || "Failed to create folder");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      setError(`Failed to create folder: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUploading = (file, parentFolder) => {
    const uploadPath = parentFolder?.path || currentPath || "/";

    const formData = {
      uploadPath,
      overwrite: false,
      mode: "644",
      uid: 1000,
      gid: 1000,
    };

    console.log("🔄 UPLOAD: Starting file upload", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadPath,
      formData,
      parentFolder: parentFolder?.name || "None",
      currentPath,
      server: `${server.hostname}:${server.port}`,
      timestamp: new Date().toISOString(),
    });

    return formData;
  };

  const handleFileUploaded = (response) => {
    console.log("✅ UPLOAD: Upload completed, processing response", {
      response,
      timestamp: new Date().toISOString(),
    });

    try {
      const uploadedFile = JSON.parse(response);

      console.log("✅ UPLOAD: File uploaded successfully", {
        fileName: uploadedFile.name || "Unknown",
        filePath: uploadedFile.path || "Unknown",
        fileSize: uploadedFile.size || "Unknown",
      });

      // Refresh the entire file list instead of manual state updates
      // This ensures proper navigation panel updates and consistency with backend
      console.log("🔄 UPLOAD: Refreshing file list to show uploaded file");
      loadFiles();
    } catch (error) {
      console.error("❌ UPLOAD: Error processing uploaded file response", {
        error: error.message,
        response,
        stack: error.stack,
      });

      // Refresh files as fallback
      console.log("🔄 UPLOAD: Refreshing files due to processing error");
      loadFiles();
    }
  };

  const handleRename = async (file, newName) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await api.renameFile(file, newName);

      if (result.success) {
        await loadFiles();
      } else {
        setError(result.message || "Failed to rename file");
      }
    } catch (error) {
      console.error("Error renaming file:", error);
      setError(`Failed to rename file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (filesToDelete) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await api.deleteFiles(filesToDelete);

      if (result.success) {
        console.log(
          "✅ DELETE: Files deleted successfully, refreshing file list"
        );
        // Refresh the entire file list instead of manual filtering
        // This ensures proper navigation panel updates and consistency
        await loadFiles();
      } else {
        setError(result.message || "Failed to delete files");
      }
    } catch (error) {
      console.error("Error deleting files:", error);
      setError(`Failed to delete files: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async (copiedItems, destinationFolder, operationType) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await api.copyMoveFiles(
        copiedItems,
        destinationFolder,
        operationType
      );

      if (result.success) {
        await loadFiles();

        if (result.isAsync && result.taskIds && result.taskIds.length > 0) {
          console.log(
            `${operationType} operation started. Task IDs:`,
            result.taskIds
          );
        }
      } else {
        setError(result.message || `Failed to ${operationType} files`);
      }
    } catch (error) {
      console.error(`Error ${operationType} files:`, error);
      setError(`Failed to ${operationType} files: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (filesToDownload) => {
    try {
      const server = serverContext.currentServer;
      if (!server) {
        console.error("❌ DOWNLOAD: No server selected");
        setError("No server selected");
        return;
      }

      console.log("🔽 DOWNLOAD: Starting download operation", {
        fileCount: filesToDownload.length,
        files: filesToDownload.map((f) => ({
          name: f.name,
          path: f.path,
          size: f.size,
        })),
        server: `${server.hostname}:${server.port}`,
        timestamp: new Date().toISOString(),
      });

      for (const file of filesToDownload) {
        if (!file.isDirectory) {
          const path = encodeURIComponent(file.path);
          const downloadUrl = `/api/zapi/${server.protocol}/${server.hostname}/${server.port}/filesystem/download?path=${path}`;

          console.log(`🔽 DOWNLOAD: Processing file ${file.name}`, {
            originalPath: file.path,
            encodedPath: path,
            downloadUrl,
            fileSize: file.size,
            mimeType: file._zwMetadata?.mimeType || "Unknown",
          });

          try {
            const startTime = performance.now();

            console.log(`🔽 DOWNLOAD: Making fetch request for ${file.name}`, {
              url: downloadUrl,
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken") ? "present" : "missing"}`,
              },
            });

            const response = await fetch(downloadUrl, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            });

            const endTime = performance.now();

            console.log(`🔽 DOWNLOAD: Response received for ${file.name}`, {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              duration: `${(endTime - startTime).toFixed(2)}ms`,
            });

            if (response.ok) {
              console.log(`✅ DOWNLOAD: Successfully downloaded ${file.name}`);

              const blob = await response.blob();
              console.log(`🔽 DOWNLOAD: Blob created for ${file.name}`, {
                blobSize: blob.size,
                blobType: blob.type,
              });

              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = file.name;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);

              console.log(
                `✅ DOWNLOAD: File ${file.name} download triggered successfully`
              );
            } else {
              console.error(`❌ DOWNLOAD: Failed to download ${file.name}`, {
                status: response.status,
                statusText: response.statusText,
                url: downloadUrl,
              });
              setError(
                `Failed to download ${file.name}: ${response.statusText}`
              );
            }
          } catch (fetchError) {
            console.error(
              `❌ DOWNLOAD: Network error downloading ${file.name}`,
              {
                error: fetchError.message,
                stack: fetchError.stack,
                url: downloadUrl,
              }
            );
            setError(`Error downloading ${file.name}: ${fetchError.message}`);
          }
        } else {
          console.log(`⚠️ DOWNLOAD: Skipping directory ${file.name}`);
        }
      }

      console.log("✅ DOWNLOAD: Download operation completed");
    } catch (error) {
      console.error("❌ DOWNLOAD: General download error", {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      setError(`Failed to download files: ${error.message}`);
    }
  };

  const handleFileOpen = (file) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
    } else if (isTextFile(file)) {
      // Will trigger custom edit action
      return { action: "editFile", file };
    } else {
      handleDownload([file]);
    }
  };

  const handleFolderChange = (path) => {
    const safePath = path || "/";
    console.log("Folder change:", path, "->", safePath);
    setCurrentPath(safePath);
  };

  const handleRefresh = () => {
    loadFiles();
  };

  const handleSelect = (selectedFiles) => {
    console.log("Selected files:", selectedFiles);
  };

  const handleError = (error, file) => {
    console.error("File manager error:", error, file);
    setError(error.message || "An error occurred");
  };

  const handleCut = (files) => {
    console.log("Files cut:", files);
  };

  const handleCopy = (files) => {
    console.log("Files copied:", files);
  };

  const handleLayoutChange = (layout) => {
    console.log("Layout changed to:", layout);
  };

  // Don't render if no server is selected
  if (!server) {
    return (
      <div className="notification is-info">
        <p>
          Please select a server from the navbar to access the file manager.
        </p>
      </div>
    );
  }

  return (
    <div className="host-file-manager extended">
      {/* Error notification */}
      {error && (
        <div className="notification is-danger mb-4">
          <button className="delete" onClick={() => setError("")} />
          <p>{error}</p>
        </div>
      )}

      {/* Extended File Manager with Custom Actions */}
      <FileManager
        files={files}
        fileUploadConfig={fileUploadConfig}
        isLoading={isLoading}
        onCreateFolder={handleCreateFolder}
        onFileUploading={handleFileUploading}
        onFileUploaded={handleFileUploaded}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onRename={handleRename}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onLayoutChange={handleLayoutChange}
        onRefresh={handleRefresh}
        onFileOpen={handleFileOpen}
        onFolderChange={handleFolderChange}
        onSelect={handleSelect}
        onError={handleError}
        layout="grid"
        enableFilePreview
        filePreviewComponent={(file) => (
          <div className="zoneweaver-file-preview">
            <div className="preview-header">
              <h4 className="title is-6">{file.name}</h4>
              <div className="preview-info">
                <span className="tag is-light">
                  {file.isDirectory
                    ? "Directory"
                    : file.size
                      ? `${Math.round(file.size / 1024)} KB`
                      : "Unknown size"}
                </span>
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
              {file.isDirectory ? (
                <div className="has-text-centered p-4">
                  <span className="icon is-large">
                    <i className="fas fa-folder fa-3x" />
                  </span>
                  <p className="mt-2">Directory</p>
                  <p className="help">Double-click to open</p>
                </div>
              ) : isTextFile(file) ? (
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
                        // Trigger edit action from CustomActions
                        const editEvent = new CustomEvent(
                          "zoneweaver-edit-file",
                          { detail: file }
                        );
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
              ) : isArchiveFile(file) ? (
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
                        // Trigger extract action from CustomActions
                        const extractEvent = new CustomEvent(
                          "zoneweaver-extract-archive",
                          { detail: file }
                        );
                        document.dispatchEvent(extractEvent);
                      }}
                      disabled={!canManageHosts(user?.role)}
                    >
                      <span className="icon is-small">
                        <i className="fas fa-expand-arrows-alt" />
                      </span>
                      <span>Extract</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="has-text-centered p-4">
                  <span className="icon is-large">
                    <i className="fas fa-file fa-3x" />
                  </span>
                  <p className="mt-2">File</p>
                  <p className="help">Double-click to download</p>
                </div>
              )}
            </div>

            {/* Action buttons for all files */}
            {canManageHosts(user?.role) && (
              <div className="preview-actions">
                <div className="buttons is-centered">
                  <button
                    className="button is-link is-small is-outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Trigger properties action from CustomActions
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
        )}
        maxFileSize={50 * 1024 * 1024 * 1024}
        height="calc(100vh - 200px)"
        width="100%"
        initialPath={currentPath}
        primaryColor={themeConfig.primaryColor}
        fontFamily={themeConfig.fontFamily}
        permissions={permissions}
        collapsibleNav
        defaultNavExpanded
        language="en"
      />

      {/* Custom Actions Integration */}
      <CustomActions
        api={api}
        currentPath={currentPath}
        files={files}
        loadFiles={loadFiles}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        setError={setError}
        permissions={permissions}
      />
    </div>
  );
};

ExtendedFileManager.propTypes = {
  server: PropTypes.object,
};

export default ExtendedFileManager;
