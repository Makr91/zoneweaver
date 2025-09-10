import { useState, useEffect, useCallback, useMemo } from 'react';
import { FileManager } from '@cubone/react-file-manager';
import '@cubone/react-file-manager/dist/style.css';

import { useServers } from '../../../contexts/ServerContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { canManageHosts, canViewHosts } from '../../../utils/permissions';
import { ZoneweaverFileManagerAPI } from './FileManagerAPI';
import { transformZoneweaverToFile, isTextFile, isArchiveFile } from './FileManagerTransforms';
import TextFileEditor from './TextFileEditor';
import ArchiveModals from './ArchiveModals';
import FilePropertiesModal from './FilePropertiesModal';
import './HostFileManager.scss';

/**
 * Host File Manager Component
 * Integrates cubone react-file-manager with Zoneweaver's architecture
 */
const HostFileManager = ({ server }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [error, setError] = useState('');
  const [textEditorFile, setTextEditorFile] = useState(null);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [directoryCache, setDirectoryCache] = useState(new Map()); // Cache for directory contents
  const [showCreateArchiveModal, setShowCreateArchiveModal] = useState(false);
  const [showExtractArchiveModal, setShowExtractArchiveModal] = useState(false);
  const [selectedFilesForArchive, setSelectedFilesForArchive] = useState([]);
  const [archiveFileForExtract, setArchiveFileForExtract] = useState(null);
  const [currentlySelectedFiles, setCurrentlySelectedFiles] = useState([]);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [propertiesFile, setPropertiesFile] = useState(null);

  const { user } = useAuth();
  const { theme } = useTheme();
  const serverContext = useServers();

  // Initialize API instance
  const api = useMemo(() => {
    return new ZoneweaverFileManagerAPI(serverContext);
  }, [serverContext]);

  // Load files when path or server changes
  const loadFiles = useCallback(async (path = currentPath) => {
    if (!server) {
      setFiles([]);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Loading files for path:', path);
      
      // Load current directory files
      const currentFiles = await api.loadFiles(path);
      
      // Always maintain root directories for navigation
      let cachedDirectories = directoryCache.get('/') || [];
      
      // Load root directories if not cached
      if (cachedDirectories.length === 0) {
        try {
          const rootFiles = await api.loadFiles('/');
          cachedDirectories = rootFiles.filter(file => file.isDirectory);
          setDirectoryCache(prev => new Map(prev).set('/', cachedDirectories));
        } catch (err) {
          console.log('Could not load root directories for navigation');
        }
      }
      
      // Build comprehensive file list for cubone navigation
      const combinedFiles = [...currentFiles];
      
      // Add cached root directories if we're not at root
      if (path !== '/') {
        cachedDirectories.forEach(dir => {
          if (!combinedFiles.some(f => f.path === dir.path)) {
            combinedFiles.push(dir);
          }
        });
      }
      
      // If we're in a subdirectory, ensure parent directories are included
      if (path !== '/') {
        const pathParts = path.split('/').filter(Boolean);
        let currentSearchPath = '';
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          currentSearchPath += '/' + pathParts[i];
          
          // Check cache first
          let parentDirs = directoryCache.get(currentSearchPath);
          if (!parentDirs) {
            try {
              const parentFiles = await api.loadFiles(currentSearchPath);
              parentDirs = parentFiles.filter(file => file.isDirectory);
              setDirectoryCache(prev => new Map(prev).set(currentSearchPath, parentDirs));
            } catch (err) {
              console.log('Could not load parent directory:', currentSearchPath);
              continue;
            }
          }
          
          // Add parent directories to combined files
          parentDirs.forEach(dir => {
            if (!combinedFiles.some(f => f.path === dir.path)) {
              combinedFiles.push(dir);
            }
          });
        }
      }
      
      console.log('Combined files for cubone:', combinedFiles.length, 'files');
      setFiles(combinedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      setError('Failed to load files: ' + error.message);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [server, currentPath, api, directoryCache]);

  // Load files when component mounts or dependencies change
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Permission configuration based on user role
  const permissions = useMemo(() => ({
    create: canManageHosts(user?.role),
    upload: canManageHosts(user?.role),
    move: canManageHosts(user?.role),
    copy: canManageHosts(user?.role),
    rename: canManageHosts(user?.role),
    download: canViewHosts(user?.role),
    delete: canManageHosts(user?.role)
  }), [user?.role]);

  // Upload configuration
  const fileUploadConfig = useMemo(() => {
    if (!server) return null;
    
    return {
      url: `/api/zapi/${server.protocol}/${server.hostname}/${server.port}/filesystem/upload`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    };
  }, [server]);

  // Theme integration
  const themeConfig = useMemo(() => {
    const primaryColor = '#ff6600'; // Orange from Bulma theme
    const fontFamily = 'Nunito Sans, sans-serif'; // Match zoneweaver
    
    return { primaryColor, fontFamily };
  }, [theme]);

  // Create folder handler
  const handleCreateFolder = async (name, parentFolder) => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await api.createFolder(name, parentFolder, currentPath);
      
      if (result.success) {
        // Add new folder to current files list and refresh to update navigation
        setFiles(prevFiles => [...prevFiles, result.file]);
        // Refresh files to ensure navigation pane updates
        setTimeout(() => loadFiles(), 500);
      } else {
        setError(result.message || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('Failed to create folder: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // File upload handlers
  const handleFileUploading = (file, parentFolder) => {
    // Use current path or parent folder path, ensure it's never empty
    const uploadPath = parentFolder?.path || currentPath || '/';
    
    console.log('File uploading:', { 
      fileName: file.name, 
      uploadPath, 
      parentFolder: parentFolder?.name, 
      currentPath 
    });
    
    // Return form data that will be appended to the multipart upload
    // Follow official API spec with proper types
    return {
      uploadPath: uploadPath,
      overwrite: false,    // Boolean per API spec
      mode: '644',         // String octal format per API spec
      uid: 1000,           // Integer per API spec
      gid: 1000            // Integer per API spec
    };
  };

  const handleFileUploaded = (response) => {
    try {
      const uploadedFile = JSON.parse(response);
      const transformedFile = transformZoneweaverToFile(uploadedFile);
      
      setFiles(prevFiles => [...prevFiles, transformedFile]);
    } catch (error) {
      console.error('Error processing uploaded file:', error);
      // Refresh files as fallback
      loadFiles();
    }
  };

  // Rename handler
  const handleRename = async (file, newName) => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await api.renameFile(file, newName);
      
      if (result.success) {
        // Instead of trying to update the specific file, just refresh the file list
        // This ensures we get the correct data from the server
        await loadFiles();
      } else {
        setError(result.message || 'Failed to rename file');
      }
    } catch (error) {
      console.error('Error renaming file:', error);
      setError('Failed to rename file: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async (filesToDelete) => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await api.deleteFiles(filesToDelete);
      
      if (result.success) {
        // Remove deleted files from current list
        const deletedIds = filesToDelete.map(f => f._id);
        setFiles(prevFiles => prevFiles.filter(f => !deletedIds.includes(f._id)));
      } else {
        setError(result.message || 'Failed to delete files');
      }
    } catch (error) {
      console.error('Error deleting files:', error);
      setError('Failed to delete files: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy/Move handler
  const handlePaste = async (copiedItems, destinationFolder, operationType) => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await api.copyMoveFiles(copiedItems, destinationFolder, operationType);
      
      if (result.success) {
        // Refresh files to show changes
        await loadFiles();
        
        // Show success message for async operations
        if (result.isAsync && result.taskIds && result.taskIds.length > 0) {
          console.log(`${operationType} operation started. Task IDs:`, result.taskIds);
        }
      } else {
        setError(result.message || `Failed to ${operationType} files`);
      }
    } catch (error) {
      console.error(`Error ${operationType} files:`, error);
      setError(`Failed to ${operationType} files: ` + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Download handler with authentication
  const handleDownload = async (filesToDownload) => {
    try {
      const server = serverContext.currentServer;
      if (!server) {
        setError('No server selected');
        return;
      }

      // Download files using authenticated requests
      for (const file of filesToDownload) {
        if (!file.isDirectory) {
          const path = encodeURIComponent(file.path);
          const downloadUrl = `/api/zapi/${server.protocol}/${server.hostname}/${server.port}/filesystem/download?path=${path}`;
          
          try {
            // Use authenticated fetch to get the file
            const response = await fetch(downloadUrl, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            });
            
            if (response.ok) {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.name;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            } else {
              console.error(`Failed to download ${file.name}:`, response.statusText);
              setError(`Failed to download ${file.name}: ${response.statusText}`);
            }
          } catch (fetchError) {
            console.error(`Error downloading ${file.name}:`, fetchError);
            setError(`Error downloading ${file.name}: ${fetchError.message}`);
          }
        }
      }
    } catch (error) {
      console.error('Error downloading files:', error);
      setError('Failed to download files: ' + error.message);
    }
  };

  // File open handler (for double-click)
  const handleFileOpen = (file) => {
    if (file.isDirectory) {
      // Navigate to directory
      setCurrentPath(file.path);
    } else if (isTextFile(file)) {
      // Open text file editor
      setTextEditorFile(file);
      setShowTextEditor(true);
    } else {
      // Download file
      handleDownload([file]);
    }
  };

  // Folder change handler
  const handleFolderChange = (path) => {
    // Ensure path is never empty, default to root
    const safePath = path || '/';
    console.log('Folder change:', path, '->', safePath);
    setCurrentPath(safePath);
  };

  // Refresh handler
  const handleRefresh = () => {
    loadFiles();
  };

  // Selection handler
  const handleSelect = (selectedFiles) => {
    console.log('Selected files:', selectedFiles);
    setCurrentlySelectedFiles(selectedFiles);
  };

  // Error handler
  const handleError = (error, file) => {
    console.error('File manager error:', error, file);
    setError(error.message || 'An error occurred');
  };

  // Cut/Copy handlers (optional callbacks)
  const handleCut = (files) => {
    console.log('Files cut:', files);
  };

  const handleCopy = (files) => {
    console.log('Files copied:', files);
  };

  // Layout change handler
  const handleLayoutChange = (layout) => {
    console.log('Layout changed to:', layout);
  };

  // Close text editor
  const handleCloseTextEditor = () => {
    setShowTextEditor(false);
    setTextEditorFile(null);
  };

  // Save text file
  const handleSaveTextFile = async (content) => {
    if (!textEditorFile) return;
    
    setIsLoading(true);
    try {
      const result = await api.updateFileContent(textEditorFile, content);
      
      if (result.success) {
        setShowTextEditor(false);
        setTextEditorFile(null);
        // Refresh files to show updated modification time
        await loadFiles();
      } else {
        setError(result.message || 'Failed to save file');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      setError('Failed to save file: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Archive handlers
  const handleCreateArchive = (selectedFiles) => {
    setSelectedFilesForArchive(selectedFiles);
    setShowCreateArchiveModal(true);
  };

  const handleExtractArchive = (archiveFile) => {
    setArchiveFileForExtract(archiveFile);
    setShowExtractArchiveModal(true);
  };

  const handleArchiveSuccess = async (result) => {
    console.log('Archive operation successful:', result);
    
    if (result.isAsync && result.task_id) {
      console.log('Archive task started:', result.task_id);
      // Show success message for async operation
      setError(''); // Clear any previous errors
    }
    
    // Refresh files to show new archive or extracted files
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

  // Properties modal handlers
  const handleShowProperties = (file) => {
    setPropertiesFile(file);
    setShowPropertiesModal(true);
  };

  const handleCloseProperties = () => {
    setShowPropertiesModal(false);
    setPropertiesFile(null);
  };

  const handlePropertiesSuccess = async (result) => {
    console.log('Properties updated successfully:', result);
    // Refresh files to show updated permissions
    await loadFiles();
  };

  // Don't render if no server is selected
  if (!server) {
    return (
      <div className="notification is-info">
        <p>Please select a server from the navbar to access the file manager.</p>
      </div>
    );
  }

  return (
    <div className="host-file-manager">
      {/* Error notification */}
      {error && (
        <div className="notification is-danger mb-4">
          <button className="delete" onClick={() => setError('')}></button>
          <p>{error}</p>
        </div>
      )}

      {/* Custom Action Bar */}
      {canManageHosts(user?.role) && (
        <div className="box mb-4">
          <div className="level is-mobile">
            <div className="level-left">
              <div className="level-item">
                <span className="tag is-info is-light">
                  <span className="icon is-small">
                    <i className="fas fa-folder"></i>
                  </span>
                  <span>Current: {currentPath}</span>
                </span>
              </div>
            </div>
            
            <div className="level-right">
              <div className="level-item">
                <div className="buttons">
                  {/* Create Archive Button */}
                  <button
                    className={`button is-info is-small ${currentlySelectedFiles.length === 0 ? 'is-outlined' : ''}`}
                    onClick={() => {
                      if (currentlySelectedFiles.length > 0) {
                        handleCreateArchive(currentlySelectedFiles);
                      } else {
                        setError('Please select files or folders to create an archive');
                      }
                    }}
                    disabled={currentlySelectedFiles.length === 0}
                    title={currentlySelectedFiles.length > 0 
                      ? `Create archive from ${currentlySelectedFiles.length} selected item(s)` 
                      : 'Select files or folders to create an archive'}
                  >
                    <span className="icon is-small">
                      <i className="fas fa-file-archive"></i>
                    </span>
                    <span>
                      {currentlySelectedFiles.length > 0 
                        ? `Archive (${currentlySelectedFiles.length})` 
                        : 'Archive'}
                    </span>
                  </button>

                  {/* Archive Directory Button */}
                  <button
                    className="button is-success is-small is-outlined"
                    onClick={() => {
                      // Archive entire current directory
                      const currentDirFiles = files.filter(f => {
                        const filePath = f.path.startsWith('/') ? f.path.substring(1) : f.path;
                        const currentPathNormalized = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
                        
                        // Check if file is in current directory (not subdirectory)
                        const relativePath = filePath.replace(currentPathNormalized + '/', '');
                        return !relativePath.includes('/') && filePath.startsWith(currentPathNormalized);
                      });
                      
                      if (currentDirFiles.length > 0) {
                        handleCreateArchive(currentDirFiles);
                      } else {
                        setError('Current directory is empty');
                      }
                    }}
                    title="Create archive of entire current directory"
                  >
                    <span className="icon is-small">
                      <i className="fas fa-archive"></i>
                    </span>
                    <span>Archive Directory</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Manager */}
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
        enableFilePreview={true}
        filePreviewComponent={(file) => (
          <div className="file-preview-container">
            <div className="preview-header">
              <h4 className="title is-6">{file.name}</h4>
              <div className="preview-info">
                <span className="tag is-light">
                  {file.isDirectory ? 'Directory' : 
                   file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'}
                </span>
                {file._zwMetadata?.mimeType && (
                  <span className="tag is-info is-light">
                    {file._zwMetadata.mimeType}
                  </span>
                )}
              </div>
            </div>
            
            <div className="preview-content">
              {file.isDirectory ? (
                <div className="has-text-centered p-4">
                  <span className="icon is-large">
                    <i className="fas fa-folder fa-3x"></i>
                  </span>
                  <p className="mt-2">Directory</p>
                  <p className="help">Double-click to open</p>
                </div>
              ) : isTextFile(file) ? (
                <div className="has-text-centered p-4">
                  <span className="icon is-large">
                    <i className="fas fa-file-alt fa-3x"></i>
                  </span>
                  <p className="mt-2">Text File</p>
                  <div className="buttons is-centered mt-3">
                    <button 
                      className="button is-primary is-small"
                      onClick={() => {
                        setTextEditorFile(file);
                        setShowTextEditor(true);
                      }}
                    >
                      <span className="icon is-small">
                        <i className="fas fa-edit"></i>
                      </span>
                      <span>Edit File</span>
                    </button>
                  </div>
                </div>
              ) : isArchiveFile(file) ? (
                <div className="has-text-centered p-4">
                  <span className="icon is-large">
                    <i className="fas fa-file-archive fa-3x"></i>
                  </span>
                  <p className="mt-2">Archive File</p>
                  <div className="buttons is-centered mt-3">
                    <button 
                      className="button is-success is-small"
                      onClick={() => handleExtractArchive(file)}
                      disabled={!canManageHosts(user?.role)}
                    >
                      <span className="icon is-small">
                        <i className="fas fa-expand-arrows-alt"></i>
                      </span>
                      <span>Extract</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="has-text-centered p-4">
                  <span className="icon is-large">
                    <i className="fas fa-file fa-3x"></i>
                  </span>
                  <p className="mt-2">File</p>
                  <p className="help">Double-click to download</p>
                </div>
              )}
            </div>
            
            {/* File metadata */}
            <div className="preview-metadata">
              <div className="field is-grouped is-grouped-multiline">
                <div className="control">
                  <div className="tags has-addons">
                    <span className="tag is-dark">Modified</span>
                    <span className="tag is-light">
                      {file.updatedAt ? new Date(file.updatedAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
                {file._zwMetadata?.permissions && (
                  <div className="control">
                    <div className="tags has-addons">
                      <span className="tag is-dark">Permissions</span>
                      <span className="tag is-light">
                        {file._zwMetadata.permissions.octal || 'Unknown'}
                      </span>
                    </div>
                  </div>
                )}
                {file._zwMetadata && (
                  <div className="control">
                    <div className="tags has-addons">
                      <span className="tag is-dark">Owner</span>
                      <span className="tag is-light">
                        {file._zwMetadata.uid || 'Unknown'}:{file._zwMetadata.gid || 'Unknown'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Properties button */}
              {canManageHosts(user?.role) && (
                <div className="has-text-centered mt-3">
                  <button 
                    className="button is-link is-small is-outlined"
                    onClick={() => handleShowProperties(file)}
                  >
                    <span className="icon is-small">
                      <i className="fas fa-cog"></i>
                    </span>
                    <span>Properties</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        maxFileSize={50 * 1024 * 1024 * 1024} // 50GB limit
        height="calc(100vh - 200px)"
        width="100%"
        initialPath={currentPath}
        primaryColor={themeConfig.primaryColor}
        fontFamily={themeConfig.fontFamily}
        permissions={permissions}
        collapsibleNav={true}
        defaultNavExpanded={true}
        language="en"
      />

      {/* Text File Editor Modal */}
      {showTextEditor && textEditorFile && (
        <TextFileEditor
          file={textEditorFile}
          api={api}
          onClose={handleCloseTextEditor}
          onSave={handleSaveTextFile}
        />
      )}

      {/* Archive Modals */}
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

      {/* File Properties Modal */}
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

export default HostFileManager;
