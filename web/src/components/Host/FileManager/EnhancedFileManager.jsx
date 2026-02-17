import { FileManager } from "@cubone/react-file-manager";
import { useState, useEffect, useCallback, useMemo } from "react";
import "@cubone/react-file-manager/dist/style.css";
import PropTypes from "prop-types";

import { useAuth } from "../../../contexts/AuthContext";
import { useServers } from "../../../contexts/ServerContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { canManageHosts, canViewHosts } from "../../../utils/permissions";

import ArchiveModals from "./ArchiveModals";
import { useCuboneExtensions } from "./CuboneExtensions";
import { ZoneweaverFileManagerAPI } from "./FileManagerAPI";
import {
  transformZoneweaverToFile,
  isTextFile,
  isArchiveFile,
} from "./FileManagerTransforms";
import FilePropertiesModal from "./FilePropertiesModal";
import TextFileEditor from "./TextFileEditor";
import "./HostFileManager.scss";

/**
 * Enhanced File Manager Component
 * Implements the PR's custom actions functionality locally
 */
const EnhancedFileManager = ({ server }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");
  const [error, setError] = useState("");
  const [directoryCache, setDirectoryCache] = useState(new Map());

  // Modal states for custom actions
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textEditorFile, setTextEditorFile] = useState(null);
  const [showCreateArchiveModal, setShowCreateArchiveModal] = useState(false);
  const [showExtractArchiveModal, setShowExtractArchiveModal] = useState(false);
  const [selectedFilesForArchive, setSelectedFilesForArchive] = useState([]);
  const [archiveFileForExtract, setArchiveFileForExtract] = useState(null);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [propertiesFile, setPropertiesFile] = useState(null);

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

  // Custom action handlers for the config.actions system
  const handleEditFile = useCallback((file) => {
    console.log("Edit file action:", file);
    if (isTextFile(file)) {
      setTextEditorFile(file);
      setShowTextEditor(true);
    } else {
      setError("This file cannot be edited as text");
    }
  }, []);

  const handleCreateArchive = useCallback((selectedFiles) => {
    console.log("Create archive action:", selectedFiles);
    setSelectedFilesForArchive(
      Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles]
    );
    setShowCreateArchiveModal(true);
  }, []);

  const handleExtractArchive = useCallback((file) => {
    console.log("Extract archive action:", file);
    if (isArchiveFile(file)) {
      setArchiveFileForExtract(file);
      setShowExtractArchiveModal(true);
    } else {
      setError("This file cannot be extracted");
    }
  }, []);

  const handleShowProperties = useCallback((file) => {
    console.log("Show properties action:", file);
    setPropertiesFile(file);
    setShowPropertiesModal(true);
  }, []);

  // Custom actions configuration following the PR pattern
  const customActions = useMemo(
    () => [
      // Default cubone actions that we override
      {
        title: "Open",
        key: "open",
        onClick: (file) => {
          if (file.isDirectory) {
            setCurrentPath(file.path);
          } else if (isTextFile(file)) {
            handleEditFile(file);
          } else {
            // Download file - will use cubone's default download
          }
        },
        showToolbar: false,
        showMenu: true,
        icon: null,
      },
      {
        title: "Edit File",
        key: "edit",
        onClick: handleEditFile,
        showToolbar: false,
        showMenu: true,
        multiple: false,
        icon: <i className="fas fa-edit" />,
        hidden: false,
      },
      {
        title: "Create Archive",
        key: "createArchive",
        onClick: handleCreateArchive,
        showToolbar: true,
        showMenu: true,
        multiple: true,
        icon: <i className="fas fa-file-archive" />,
        hidden: false,
      },
      {
        title: "Extract Archive",
        key: "extractArchive",
        onClick: handleExtractArchive,
        showToolbar: false,
        showMenu: true,
        multiple: false,
        icon: <i className="fas fa-expand-arrows-alt" />,
        hidden: false,
      },
      {
        title: "Properties",
        key: "properties",
        onClick: handleShowProperties,
        showToolbar: false,
        showMenu: true,
        multiple: false,
        icon: <i className="fas fa-cog" />,
        hidden: false,
      },
    ],
    [
      handleEditFile,
      handleCreateArchive,
      handleExtractArchive,
      handleShowProperties,
    ]
  );

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

    return {
      uploadPath,
      overwrite: false,
      mode: "644",
      uid: 1000,
      gid: 1000,
    };
  };

  const handleFileUploaded = (response) => {
    console.log("✅ UPLOAD: Upload completed, refreshing file list");

    try {
      const uploadedFile = JSON.parse(response);
      console.log("✅ UPLOAD: File uploaded successfully:", uploadedFile.name);
      loadFiles(); // Refresh entire file list
    } catch (error) {
      console.error(
        "❌ UPLOAD: Error processing uploaded file response:",
        error
      );
      loadFiles(); // Refresh as fallback
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
        setError("No server selected");
        return;
      }

      for (const file of filesToDownload) {
        if (!file.isDirectory) {
          const path = encodeURIComponent(file.path);
          const downloadUrl = `/api/zapi/${server.protocol}/${server.hostname}/${server.port}/filesystem/download?path=${path}`;

          try {
            const response = await fetch(downloadUrl, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            });

            if (response.ok) {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = file.name;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            } else {
              setError(
                `Failed to download ${file.name}: ${response.statusText}`
              );
            }
          } catch (fetchError) {
            setError(`Error downloading ${file.name}: ${fetchError.message}`);
          }
        }
      }
    } catch (error) {
      setError(`Failed to download files: ${error.message}`);
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

  // Modal close handlers
  const handleCloseTextEditor = () => {
    setShowTextEditor(false);
    setTextEditorFile(null);
  };

  const handleSaveTextFile = async (content) => {
    if (!textEditorFile) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.updateFileContent(textEditorFile, content);

      if (result.success) {
        setShowTextEditor(false);
        setTextEditorFile(null);
        await loadFiles();
      } else {
        setError(result.message || "Failed to save file");
      }
    } catch (error) {
      console.error("Error saving file:", error);
      setError(`Failed to save file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveSuccess = async (result) => {
    console.log("Archive operation successful:", result);
    await loadFiles();
  };

  const handleCloseCreateArchive = () => {
    setShowCreateArchiveModal(false);
    setSelectedFilesForArchive([]);
  };

  const handleCloseExtractArchive = () => {
    setShowExtractArchiveModal(false);
    setArchiveFileForExtract(null);
  };

  const handleCloseProperties = () => {
    setShowPropertiesModal(false);
    setPropertiesFile(null);
  };

  const handlePropertiesSuccess = async (result) => {
    console.log("Properties updated successfully:", result);
    await loadFiles();
  };

  // Custom action handlers for cubone extensions
  const customActionHandlers = useMemo(
    () => ({
      handleEditFile,
      handleCreateArchive,
      handleExtractArchive,
      handleShowProperties,
    }),
    [
      handleEditFile,
      handleCreateArchive,
      handleExtractArchive,
      handleShowProperties,
    ]
  );

  // Extended permissions for custom actions
  const extendedPermissions = useMemo(
    () => ({
      ...permissions,
      edit: canManageHosts(user?.role),
      archive: canManageHosts(user?.role),
      properties: canManageHosts(user?.role),
    }),
    [permissions, user?.role]
  );

  // Use cubone extensions to add context menu and toolbar functionality
  useCuboneExtensions(files, extendedPermissions, customActionHandlers);

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
    <div className="host-file-manager enhanced">
      {/* Error notification */}
      {error && (
        <div className="notification is-danger mb-4">
          <button className="delete" onClick={() => setError("")} />
          <p>{error}</p>
        </div>
      )}

      {/* File Manager with Config Actions */}
      <FileManager
        files={files}
        fileUploadConfig={fileUploadConfig}
        isLoading={isLoading}
        config={{
          actions: customActions,
        }}
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
        onFolderChange={handleFolderChange}
        onSelect={handleSelect}
        onError={handleError}
        layout="grid"
        enableFilePreview
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

      {/* Custom Action Modals */}
      {showTextEditor && textEditorFile && (
        <TextFileEditor
          file={textEditorFile}
          api={api}
          onClose={handleCloseTextEditor}
          onSave={handleSaveTextFile}
        />
      )}

      <ArchiveModals
        showCreateModal={showCreateArchiveModal}
        showExtractModal={showExtractArchiveModal}
        onCloseCreate={handleCloseCreateArchive}
        onCloseExtract={handleCloseExtractArchive}
        selectedFiles={selectedFilesForArchive}
        archiveFile={archiveFileForExtract}
        currentPath={currentPath}
        api={api}
        onArchiveSuccess={handleArchiveSuccess}
      />

      {showPropertiesModal && propertiesFile && (
        <FilePropertiesModal
          isOpen={showPropertiesModal}
          onClose={handleCloseProperties}
          file={propertiesFile}
          api={api}
          onSuccess={handlePropertiesSuccess}
        />
      )}
    </div>
  );
};

EnhancedFileManager.propTypes = {
  server: PropTypes.object,
};

export default EnhancedFileManager;
