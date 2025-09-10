import { useState, useEffect } from 'react';
import TextFileEditor from './TextFileEditor';
import ArchiveModals from './ArchiveModals';
import FilePropertiesModal from './FilePropertiesModal';
import { isTextFile, isArchiveFile } from './FileManagerTransforms';

/**
 * Custom Actions Component
 * Handles extended file manager functionality including text editing, archives, and properties
 */
const CustomActions = ({
  api,
  currentPath,
  files,
  loadFiles,
  isLoading,
  setIsLoading,
  setError,
  permissions
}) => {
  // Modal states
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textEditorFile, setTextEditorFile] = useState(null);
  const [showCreateArchiveModal, setShowCreateArchiveModal] = useState(false);
  const [showExtractArchiveModal, setShowExtractArchiveModal] = useState(false);
  const [selectedFilesForArchive, setSelectedFilesForArchive] = useState([]);
  const [archiveFileForExtract, setArchiveFileForExtract] = useState(null);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [propertiesFile, setPropertiesFile] = useState(null);

  // Text editor handlers
  const handleEditFile = (file) => {
    if (isTextFile(file)) {
      setTextEditorFile(file);
      setShowTextEditor(true);
    } else {
      setError('This file cannot be edited as text');
    }
  };

  const handleCloseTextEditor = () => {
    setShowTextEditor(false);
    setTextEditorFile(null);
  };

  const handleSaveTextFile = async (content) => {
    if (!textEditorFile) return;
    
    setIsLoading(true);
    try {
      const result = await api.updateFileContent(textEditorFile, content);
      
      if (result.success) {
        setShowTextEditor(false);
        setTextEditorFile(null);
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

  const handleCloseCreateArchive = () => {
    setShowCreateArchiveModal(false);
    setSelectedFilesForArchive([]);
  };

  const handleCloseExtractArchive = () => {
    setShowExtractArchiveModal(false);
    setArchiveFileForExtract(null);
  };

  const handleArchiveSuccess = async (result) => {
    console.log('Archive operation successful:', result);
    
    if (result.isAsync && result.task_id) {
      console.log('Archive task started:', result.task_id);
    }
    
    await loadFiles();
  };

  // Properties handlers
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
    await loadFiles();
  };

  // Listen for custom events from file preview
  useEffect(() => {
    const handleEditFile = (e) => {
      const file = e.detail;
      if (isTextFile(file)) {
        setTextEditorFile(file);
        setShowTextEditor(true);
      } else {
        setError('This file cannot be edited as text');
      }
    };

    const handleExtractArchive = (e) => {
      const file = e.detail;
      if (isArchiveFile(file)) {
        setArchiveFileForExtract(file);
        setShowExtractArchiveModal(true);
      } else {
        setError('This file cannot be extracted');
      }
    };

    const handleShowProperties = (e) => {
      const file = e.detail;
      setPropertiesFile(file);
      setShowPropertiesModal(true);
    };

    document.addEventListener('zoneweaver-edit-file', handleEditFile);
    document.addEventListener('zoneweaver-extract-archive', handleExtractArchive);
    document.addEventListener('zoneweaver-show-properties', handleShowProperties);

    return () => {
      document.removeEventListener('zoneweaver-edit-file', handleEditFile);
      document.removeEventListener('zoneweaver-extract-archive', handleExtractArchive);
      document.removeEventListener('zoneweaver-show-properties', handleShowProperties);
    };
  }, []);

  // Inject custom CSS for context menu integration
  useEffect(() => {
    // Add custom CSS to extend context menu
    const style = document.createElement('style');
    style.textContent = `
      /* Extend cubone context menu with custom items */
      .fm-context-menu .file-context-menu-list ul::after {
        content: '';
        display: block;
      }
      
      /* Custom context menu items */
      .fm-custom-menu-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        cursor: pointer;
        color: var(--bulma-text);
        gap: 8px;
        border-bottom: 1px solid var(--bulma-border-weak);
      }
      
      .fm-custom-menu-item:hover {
        background-color: var(--bulma-scheme-main-bis);
        color: var(--bulma-text-strong);
      }
      
      .fm-custom-menu-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        color: var(--bulma-text-weak);
      }
      
      /* Fix for cubone's context menu dark mode */
      .fm-context-menu {
        background-color: var(--bulma-scheme-main) !important;
        border: 1px solid var(--bulma-border) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      }
      
      [data-theme="dark"] .fm-context-menu {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
      }
      
      .fm-context-menu .file-context-menu-list {
        background-color: transparent !important;
      }
      
      .fm-context-menu .file-context-menu-list ul {
        background-color: transparent !important;
        padding: 4px 0 !important;
      }
      
      .fm-context-menu .file-context-menu-list li {
        color: var(--bulma-text) !important;
        background-color: transparent !important;
        padding: 8px 12px !important;
      }
      
      .fm-context-menu .file-context-menu-list li:hover {
        background-color: var(--bulma-scheme-main-bis) !important;
        color: var(--bulma-text-strong) !important;
      }
      
      .fm-context-menu .divider {
        border-top: 1px solid var(--bulma-border) !important;
        margin: 4px 0 !important;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Inject custom context menu items into cubone's menu
  useEffect(() => {
    const injectContextMenuItems = () => {
      const contextMenu = document.querySelector('.fm-context-menu .file-context-menu-list ul');
      if (!contextMenu) return;

      // Remove any existing custom items to prevent duplicates
      const existingCustomItems = contextMenu.querySelectorAll('.fm-custom-menu-item');
      existingCustomItems.forEach(item => item.remove());

      // Get the last selected file from cubone's internal state
      const selectedItems = document.querySelectorAll('.file-item-container .selection-checkbox:checked');
      if (selectedItems.length === 0) return;

      const lastSelectedElement = selectedItems[selectedItems.length - 1];
      const fileName = lastSelectedElement.getAttribute('name');
      const file = files.find(f => f.name === fileName);
      if (!file) return;

      // Create custom menu items
      const customItems = [];

      // Edit File (for text files)
      if (isTextFile(file) && permissions.edit) {
        customItems.push({
          text: 'Edit File',
          icon: '📝',
          onClick: () => handleEditFile(file),
          className: 'edit-file-item'
        });
      }

      // Extract Archive (for archive files)
      if (isArchiveFile(file) && permissions.archive) {
        customItems.push({
          text: 'Extract Archive',
          icon: '📦',
          onClick: () => handleExtractArchive(file),
          className: 'extract-archive-item'
        });
      }

      // Create Archive (when files selected)
      if (selectedItems.length > 0 && permissions.archive) {
        const selectedFiles = Array.from(selectedItems).map(item => {
          const name = item.getAttribute('name');
          return files.find(f => f.name === name);
        }).filter(Boolean);

        customItems.push({
          text: `Create Archive (${selectedFiles.length})`,
          icon: '🗜️',
          onClick: () => handleCreateArchive(selectedFiles),
          className: 'create-archive-item'
        });
      }

      // Properties (always available for admin)
      if (permissions.properties) {
        customItems.push({
          text: 'Properties',
          icon: '⚙️',
          onClick: () => handleShowProperties(file),
          className: 'properties-item'
        });
      }

      // Add custom items to menu
      if (customItems.length > 0) {
        // Add divider before custom items
        const divider = document.createElement('div');
        divider.className = 'divider';
        contextMenu.appendChild(divider);

        customItems.forEach(item => {
          const li = document.createElement('li');
          li.className = `fm-custom-menu-item ${item.className}`;
          li.innerHTML = `<span class="menu-icon">${item.icon}</span><span>${item.text}</span>`;
          li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            item.onClick();
            // Hide context menu
            const menu = document.querySelector('.fm-context-menu');
            if (menu) {
              menu.style.display = 'none';
            }
          };
          contextMenu.appendChild(li);
        });
      }
    };

    // Watch for context menu appearance
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' && 
            mutation.target.classList.contains('visible')) {
          setTimeout(injectContextMenuItems, 10);
        }
      });
    });

    // Observe context menu for visibility changes
    const contextMenu = document.querySelector('.fm-context-menu');
    if (contextMenu) {
      observer.observe(contextMenu, { attributes: true, attributeFilter: ['class'] });
    }

    return () => {
      observer.disconnect();
    };
  }, [files, permissions]);

  return (
    <>
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
    </>
  );
};

export default CustomActions;
