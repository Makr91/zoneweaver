import { useEffect } from 'react';
import { isTextFile, isArchiveFile } from './FileManagerTransforms';

/**
 * Cubone Extensions - Monkey patches cubone to add custom actions
 * Implements the pending PR's functionality locally
 */
export const useCuboneExtensions = (files, permissions, customActionHandlers) => {
  useEffect(() => {
    // Monkey patch cubone's useFileList to add custom context menu items
    const extendContextMenu = () => {
      // Wait for cubone to render
      setTimeout(() => {
        // Find all context menu lists and extend them
        const contextMenus = document.querySelectorAll('.fm-context-menu .file-context-menu-list ul');
        
        contextMenus.forEach(menu => {
          // Skip if already extended
          if (menu.querySelector('.zw-custom-item')) return;
          
          // Get selected file from context
          const selectedCheckboxes = document.querySelectorAll('.file-item-container .selection-checkbox:checked');
          if (selectedCheckboxes.length === 0) return;
          
          const fileName = selectedCheckboxes[selectedCheckboxes.length - 1]?.getAttribute('name');
          const selectedFile = files.find(f => f.name === fileName);
          if (!selectedFile) return;

          // Create custom menu items
          const customItems = [];

          // Edit File for text files
          if (isTextFile(selectedFile) && permissions.edit) {
            customItems.push({
              icon: '📝',
              text: 'Edit File',
              action: () => customActionHandlers.handleEditFile(selectedFile)
            });
          }

          // Extract Archive for archive files
          if (isArchiveFile(selectedFile) && permissions.archive) {
            customItems.push({
              icon: '📦', 
              text: 'Extract Archive',
              action: () => customActionHandlers.handleExtractArchive(selectedFile)
            });
          }

          // Create Archive for multiple selection
          if (selectedCheckboxes.length > 0 && permissions.archive) {
            const selectedFiles = Array.from(selectedCheckboxes).map(checkbox => {
              const name = checkbox.getAttribute('name');
              return files.find(f => f.name === name);
            }).filter(Boolean);

            customItems.push({
              icon: '🗜️',
              text: `Create Archive (${selectedFiles.length})`,
              action: () => customActionHandlers.handleCreateArchive(selectedFiles)
            });
          }

          // Properties for all files
          if (permissions.properties) {
            customItems.push({
              icon: '⚙️',
              text: 'Properties',
              action: () => customActionHandlers.handleShowProperties(selectedFile)
            });
          }

          // Add custom items to context menu
          if (customItems.length > 0) {
            // Add separator
            const separator = document.createElement('div');
            separator.className = 'divider zw-custom-item';
            menu.appendChild(separator);

            customItems.forEach(item => {
              const li = document.createElement('li');
              li.className = 'zw-custom-item';
              li.style.cssText = `
                display: flex;
                align-items: center;
                padding: 3px 13px;
                gap: 9px;
                border-radius: 4px;
                cursor: pointer;
                color: var(--bulma-text);
              `;
              
              li.innerHTML = `<span>${item.icon}</span><span>${item.text}</span>`;
              
              li.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
                // Hide context menu
                const contextMenu = e.target.closest('.fm-context-menu');
                if (contextMenu) {
                  contextMenu.classList.remove('visible');
                  contextMenu.classList.add('hidden');
                }
              });

              li.addEventListener('mouseenter', () => {
                li.style.backgroundColor = 'var(--bulma-scheme-main-bis)';
              });

              li.addEventListener('mouseleave', () => {
                li.style.backgroundColor = 'transparent';
              });

              menu.appendChild(li);
            });
          }
        });
      }, 100);
    };

    // Extend toolbar with custom buttons
    const extendToolbar = () => {
      setTimeout(() => {
        // Find toolbar and add custom archive button
        const toolbar = document.querySelector('.toolbar .fm-toolbar > div:first-child');
        if (!toolbar) return;

        // Skip if already extended
        if (toolbar.querySelector('.zw-toolbar-item')) return;

        // Get selected files from checkboxes
        const selectedCheckboxes = document.querySelectorAll('.file-item-container .selection-checkbox:checked');
        
        // Only show toolbar items when files are selected
        if (selectedCheckboxes.length > 0 && permissions.archive) {
          const selectedFiles = Array.from(selectedCheckboxes).map(checkbox => {
            const name = checkbox.getAttribute('name');
            return files.find(f => f.name === name);
          }).filter(Boolean);

          // Create archive button for toolbar
          const archiveButton = document.createElement('button');
          archiveButton.className = 'item-action zw-toolbar-item';
          archiveButton.style.cssText = `
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 0.4rem 0.8rem;
            background: var(--bulma-info);
            color: var(--bulma-info-invert);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
          `;
          
          archiveButton.innerHTML = `
            <span style="font-size: 16px;">🗜️</span>
            <span>Archive (${selectedFiles.length})</span>
          `;
          
          archiveButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            customActionHandlers.handleCreateArchive(selectedFiles);
          });

          toolbar.appendChild(archiveButton);
        } else {
          // Remove custom toolbar items when nothing selected
          const existingItems = toolbar.querySelectorAll('.zw-toolbar-item');
          existingItems.forEach(item => item.remove());
        }
      }, 100);
    };

    // Set up observers for dynamic content
    const setupObservers = () => {
      // Watch for context menu changes
      const contextMenuObserver = new MutationObserver(() => {
        extendContextMenu();
      });

      // Watch for toolbar changes (file selection)
      const toolbarObserver = new MutationObserver(() => {
        extendToolbar();
      });

      // Observe context menu
      const contextMenu = document.querySelector('.fm-context-menu');
      if (contextMenu) {
        contextMenuObserver.observe(contextMenu, {
          attributes: true,
          attributeFilter: ['class'],
          childList: true,
          subtree: true
        });
      }

      // Observe file container for selection changes
      const filesContainer = document.querySelector('.files');
      if (filesContainer) {
        toolbarObserver.observe(filesContainer, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class']
        });
      }

      return () => {
        contextMenuObserver.disconnect();
        toolbarObserver.disconnect();
      };
    };

    // Initial setup
    extendContextMenu();
    extendToolbar();
    const cleanup = setupObservers();

    return cleanup;
  }, [files, permissions, customActionHandlers]);
};

export default useCuboneExtensions;
