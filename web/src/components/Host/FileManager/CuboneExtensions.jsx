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
      // Wait for cubone to render and find context menu
      setTimeout(() => {
        console.log('🔍 CONTEXT: Checking for context menu...');
        
        const contextMenu = document.querySelector('.fm-context-menu.visible');
        if (!contextMenu) {
          console.log('❌ CONTEXT: No visible context menu found');
          return;
        }
        
        const menuList = contextMenu.querySelector('.file-context-menu-list ul');
        if (!menuList) {
          console.log('❌ CONTEXT: No menu list found');
          return;
        }

        // Skip if already extended
        if (menuList.querySelector('.zw-custom-item')) {
          console.log('⚠️ CONTEXT: Already extended, skipping');
          return;
        }
          
        // Get selected file from context
        const selectedCheckboxes = document.querySelectorAll('.file-item-container .selection-checkbox:checked');
        console.log('🔍 CONTEXT: Found selected checkboxes:', selectedCheckboxes.length);
        
        if (selectedCheckboxes.length === 0) {
          console.log('❌ CONTEXT: No selected files');
          return;
        }
          
        const fileName = selectedCheckboxes[selectedCheckboxes.length - 1]?.getAttribute('name');
        console.log('🔍 CONTEXT: Selected file name:', fileName);
        
        const selectedFile = files.find(f => f.name === fileName);
        if (!selectedFile) {
          console.log('❌ CONTEXT: File not found in files array:', fileName);
          console.log('📁 CONTEXT: Available files:', files.map(f => f.name));
          return;
        }

        console.log('✅ CONTEXT: Found selected file:', selectedFile);
        console.log('🔍 CONTEXT: File type checks:', {
          isText: isTextFile(selectedFile),
          isArchive: isArchiveFile(selectedFile),
          hasMetadata: !!selectedFile._zwMetadata,
          isBinary: selectedFile._zwMetadata?.isBinary,
          mimeType: selectedFile._zwMetadata?.mimeType
        });

        // Create custom menu items
        const customItems = [];

        // Edit File for text files
        if (isTextFile(selectedFile) && permissions.edit) {
          console.log('✅ CONTEXT: Adding Edit File option');
          customItems.push({
            icon: '📝',
            text: 'Edit File',
            action: () => customActionHandlers.handleEditFile(selectedFile)
          });
        }

        // Extract Archive for archive files
        if (isArchiveFile(selectedFile) && permissions.archive) {
          console.log('✅ CONTEXT: Adding Extract Archive option');
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

          console.log('✅ CONTEXT: Adding Create Archive option for', selectedFiles.length, 'files');
          customItems.push({
            icon: '🗜️',
            text: `Create Archive (${selectedFiles.length})`,
            action: () => customActionHandlers.handleCreateArchive(selectedFiles)
          });
        }

        // Properties for all files
        if (permissions.properties) {
          console.log('✅ CONTEXT: Adding Properties option');
          customItems.push({
            icon: '⚙️',
            text: 'Properties',
            action: () => customActionHandlers.handleShowProperties(selectedFile)
          });
        }

        console.log('📝 CONTEXT: Created custom items:', customItems.length);

        // Add custom items to context menu
        if (customItems.length > 0) {
          console.log('📝 CONTEXT: Adding items to menu');
          
          // Add separator
          const separator = document.createElement('div');
          separator.className = 'divider zw-custom-item';
          menuList.appendChild(separator);

          customItems.forEach((item, index) => {
            console.log(`📝 CONTEXT: Adding item ${index + 1}: ${item.text}`);
            
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
              console.log('🖱️ CONTEXT: Clicked custom item:', item.text);
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

            menuList.appendChild(li);
          });
          
          console.log('✅ CONTEXT: Successfully added', customItems.length, 'custom items to context menu');
        }
      }, 50); // Reduced timeout for faster response
    };

    // Extend toolbar with custom buttons
    const extendToolbar = () => {
      setTimeout(() => {
        console.log('🔧 TOOLBAR: Checking for toolbar...');
        
        // Find toolbar - handle both normal and file-selected states
        let toolbar = document.querySelector('.toolbar .fm-toolbar > div:first-child');
        if (!toolbar) {
          // Try file-selected toolbar structure
          toolbar = document.querySelector('.toolbar.file-selected .file-action-container > div:first-child');
        }
        
        if (!toolbar) {
          console.log('❌ TOOLBAR: Toolbar not found (tried both selectors)');
          return;
        }
        
        console.log('✅ TOOLBAR: Found toolbar');

        // Remove existing custom toolbar items first
        const existingItems = toolbar.querySelectorAll('.zw-toolbar-item');
        existingItems.forEach(item => item.remove());

        // Get selected files from checkboxes
        const selectedCheckboxes = document.querySelectorAll('.file-item-container .selection-checkbox:checked');
        console.log('🔧 TOOLBAR: Found selected checkboxes:', selectedCheckboxes.length);
        
        // Only show toolbar items when files are selected
        if (selectedCheckboxes.length > 0 && permissions.archive) {
          const selectedFiles = Array.from(selectedCheckboxes).map(checkbox => {
            const name = checkbox.getAttribute('name');
            return files.find(f => f.name === name);
          }).filter(Boolean);

          console.log('🔧 TOOLBAR: Creating archive button for', selectedFiles.length, 'files');

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
            console.log('🖱️ TOOLBAR: Archive button clicked');
            customActionHandlers.handleCreateArchive(selectedFiles);
          });

          toolbar.appendChild(archiveButton);
          console.log('✅ TOOLBAR: Archive button added');
        } else {
          console.log('⚠️ TOOLBAR: No files selected or no archive permission');
        }
      }, 50);
    };

    // Set up observers for dynamic content
    const setupObservers = () => {
      // Watch for context menu changes
      const contextMenuObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'class' && 
              mutation.target.classList.contains('visible')) {
            console.log('🔍 CONTEXT: Context menu became visible, extending...');
            extendContextMenu();
          }
        });
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
        console.log('👀 CONTEXT: Observing context menu for changes');
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
        console.log('👀 TOOLBAR: Observing file container for selection changes');
      }

      return () => {
        contextMenuObserver.disconnect();
        toolbarObserver.disconnect();
      };
    };

    // Initial setup
    console.log('🚀 CUBONE EXT: Initializing extensions...');
    extendContextMenu();
    extendToolbar();
    const cleanup = setupObservers();

    return cleanup;
  }, [files, permissions, customActionHandlers]);
};

export default useCuboneExtensions;
