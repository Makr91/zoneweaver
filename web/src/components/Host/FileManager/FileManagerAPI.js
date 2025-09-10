/**
 * API integration layer for Zoneweaver File Manager
 * Handles all communication with zoneweaver-api filesystem endpoints
 */

import { transformFilesToHierarchy, transformZoneweaverToFile, getPathFromFile } from './FileManagerTransforms';

export class ZoneweaverFileManagerAPI {
  constructor(serverContext) {
    this.serverContext = serverContext;
  }

  /**
   * Get current server from context
   * @returns {Object} Current server object
   */
  getCurrentServer() {
    return this.serverContext.currentServer;
  }

  /**
   * Make API request through ServerContext
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request body data
   * @param {Object} params - URL parameters
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, method = 'GET', data = null, params = null) {
    const server = this.getCurrentServer();
    if (!server) {
      throw new Error('No server selected');
    }

    // Debug logging for proxied requests through zoneweaver nodejs server
    console.log('🌐 PROXY: Making zoneweaver-api request through proxy', {
      endpoint: endpoint,
      method: method,
      server: `${server.protocol}://${server.hostname}:${server.port}`,
      proxyUrl: `/api/zapi/${server.protocol}/${server.hostname}/${server.port}/${endpoint}`,
      data: data,
      params: params,
      timestamp: new Date().toISOString()
    });

    const startTime = performance.now();
    
    try {
      const { makeZoneweaverAPIRequest } = this.serverContext;
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port, 
        server.protocol,
        endpoint,
        method,
        data,
        params
      );
      
      const endTime = performance.now();
      
      console.log('✅ PROXY: Zoneweaver-api request completed', {
        endpoint: endpoint,
        method: method,
        success: result.success,
        status: result.status,
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        responseSize: JSON.stringify(result).length,
        timestamp: new Date().toISOString()
      });
      
      if (!result.success) {
        console.warn('⚠️ PROXY: Request failed', {
          endpoint: endpoint,
          method: method,
          message: result.message,
          status: result.status,
          data: data,
          params: params
        });
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      console.error('❌ PROXY: Zoneweaver-api request error', {
        endpoint: endpoint,
        method: method,
        server: `${server.hostname}:${server.port}`,
        error: error.message,
        stack: error.stack,
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        data: data,
        params: params,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Browse directory and return files in cubone format
   * @param {string} path - Directory path to browse
   * @param {Object} options - Browse options
   * @returns {Promise<Array>} Array of file objects
   */
  async loadFiles(path = '/', options = {}) {
    try {
      const params = {
        path: path,
        show_hidden: options.showHidden || false,
        sort_by: options.sortBy || 'name',
        sort_order: options.sortOrder || 'asc'
      };

      const result = await this.makeRequest('filesystem', 'GET', null, params);
      
      if (result.success && result.data && result.data.items) {
        return transformFilesToHierarchy(result.data.items);
      } else {
        console.error('Failed to load files:', result.message);
        return [];
      }
    } catch (error) {
      console.error('Error loading files:', error);
      return [];
    }
  }

  /**
   * Create a new folder
   * @param {string} name - Folder name
   * @param {Object} parentFolder - Parent folder object (cubone format)
   * @param {string} currentPath - Current directory path from file manager
   * @returns {Promise<Object>} API response
   */
  async createFolder(name, parentFolder = null, currentPath = '/') {
    try {
      // Use current path if no parent folder specified, otherwise use parent folder's path
      const parentPath = parentFolder ? getPathFromFile(parentFolder) : currentPath;
      
      // Follow official API spec with proper types
      const data = {
        path: parentPath,
        name: name,
        mode: '755',    // String octal format per API spec
        uid: 1000,      // Integer per API spec
        gid: 1000       // Integer per API spec
      };

      console.log('Creating folder:', { name, parentPath, data });

      const result = await this.makeRequest('filesystem/folder', 'POST', data);
      
      if (result.success && result.data && result.data.item) {
        return {
          success: true,
          file: transformZoneweaverToFile(result.data.item)
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error creating folder:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Rename a file or folder
   * @param {Object} file - File object (cubone format)
   * @param {string} newName - New name
   * @returns {Promise<Object>} API response
   */
  async renameFile(file, newName) {
    try {
      const data = {
        path: getPathFromFile(file),
        new_name: newName
      };

      const result = await this.makeRequest('filesystem/rename', 'PATCH', data);
      
      if (result.success && result.data && result.data.item) {
        return {
          success: true,
          file: transformZoneweaverToFile(result.data.item)
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error renaming file:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete files or folders
   * @param {Array} files - Array of file objects (cubone format)
   * @returns {Promise<Object>} API response
   */
  async deleteFiles(files) {
    try {
      const results = [];
      
      for (const file of files) {
        const data = {
          path: getPathFromFile(file),
          recursive: file.isDirectory,
          force: false
        };

        const result = await this.makeRequest('filesystem', 'DELETE', data);
        results.push(result);
      }

      const allSuccess = results.every(r => r.success);
      return {
        success: allSuccess,
        results: results,
        message: allSuccess ? 'Files deleted successfully' : 'Some files failed to delete'
      };
    } catch (error) {
      console.error('Error deleting files:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Copy files to destination
   * @param {Array} files - Array of file objects (cubone format)
   * @param {Object} destinationFolder - Destination folder object
   * @returns {Promise<Object>} API response with task information
   */
  async copyFiles(files, destinationFolder) {
    try {
      const destinationPath = destinationFolder ? getPathFromFile(destinationFolder) : '/';
      const results = [];
      
      for (const file of files) {
        const data = {
          source: getPathFromFile(file),
          destination: `${destinationPath}/${file.name}`
        };

        const result = await this.makeRequest('filesystem/copy', 'POST', data);
        results.push(result);
      }

      const allSuccess = results.every(r => r.success);
      return {
        success: allSuccess,
        results: results,
        message: allSuccess ? 'Files copied successfully' : 'Some files failed to copy',
        isAsync: true,
        // API returns 202 with task_id directly in response for async operations
        taskIds: results.filter(r => r.success).map(r => r.data?.task_id || r.task_id).filter(Boolean)
      };
    } catch (error) {
      console.error('Error copying files:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Move files to destination
   * @param {Array} files - Array of file objects (cubone format)
   * @param {Object} destinationFolder - Destination folder object
   * @returns {Promise<Object>} API response with task information
   */
  async moveFiles(files, destinationFolder) {
    try {
      const destinationPath = destinationFolder ? getPathFromFile(destinationFolder) : '/';
      const results = [];
      
      for (const file of files) {
        const data = {
          source: getPathFromFile(file),
          destination: `${destinationPath}/${file.name}`
        };

        const result = await this.makeRequest('filesystem/move', 'PUT', data);
        results.push(result);
      }

      const allSuccess = results.every(r => r.success);
      return {
        success: allSuccess,
        results: results,
        message: allSuccess ? 'Files moved successfully' : 'Some files failed to move',
        isAsync: true,
        // API returns 202 with task_id directly in response for async operations
        taskIds: results.filter(r => r.success).map(r => r.data?.task_id || r.task_id).filter(Boolean)
      };
    } catch (error) {
      console.error('Error moving files:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Handle copy/move operations
   * @param {Array} files - Array of file objects
   * @param {Object} destinationFolder - Destination folder
   * @param {string} operationType - 'copy' or 'move'
   * @returns {Promise<Object>} Operation result
   */
  async copyMoveFiles(files, destinationFolder, operationType) {
    if (operationType === 'copy') {
      return await this.copyFiles(files, destinationFolder);
    } else if (operationType === 'move') {
      return await this.moveFiles(files, destinationFolder);
    } else {
      return { success: false, message: 'Invalid operation type' };
    }
  }

  /**
   * Download files (generates download URLs)
   * @param {Array} files - Array of file objects
   * @returns {Array} Array of download URLs
   */
  getDownloadUrls(files) {
    const server = this.getCurrentServer();
    if (!server) return [];

    return files
      .filter(file => !file.isDirectory) // Only files can be downloaded
      .map(file => {
        const path = encodeURIComponent(getPathFromFile(file));
        return `/api/zapi/${server.protocol}/${server.hostname}/${server.port}/filesystem/download?path=${path}`;
      });
  }

  /**
   * Get file content for text files
   * @param {Object} file - File object
   * @returns {Promise<Object>} File content response
   */
  async getFileContent(file) {
    try {
      if (file.isDirectory) {
        return { success: false, message: 'Cannot read directory content' };
      }

      const params = { path: getPathFromFile(file) };
      const result = await this.makeRequest('filesystem/content', 'GET', null, params);
      
      return result;
    } catch (error) {
      console.error('Error getting file content:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Update file content for text files
   * @param {Object} file - File object
   * @param {string} content - New file content
   * @returns {Promise<Object>} Update response
   */
  async updateFileContent(file, content) {
    try {
      if (file.isDirectory) {
        return { success: false, message: 'Cannot write to directory' };
      }

      // Follow official API spec with proper types
      const data = {
        path: getPathFromFile(file),
        content: content,
        backup: false,  // Boolean per API spec
        uid: 1000,      // Integer per API spec
        gid: 1000,      // Integer per API spec
        mode: '644'     // String octal format per API spec
      };

      const result = await this.makeRequest('filesystem/content', 'PUT', data);
      return result;
    } catch (error) {
      console.error('Error updating file content:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Create archive from files
   * @param {Array} files - Files to archive
   * @param {string} archivePath - Archive destination path
   * @param {string} format - Archive format (zip, tar.gz, etc.)
   * @returns {Promise<Object>} Archive creation response
   */
  async createArchive(files, archivePath, format = 'tar.gz') {
    try {
      const sources = files.map(file => getPathFromFile(file));
      
      const data = {
        sources: sources,
        archive_path: archivePath,
        format: format
      };

      const result = await this.makeRequest('filesystem/archive/create', 'POST', data);
      return result;
    } catch (error) {
      console.error('Error creating archive:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Extract archive
   * @param {Object} archiveFile - Archive file object
   * @param {string} extractPath - Extraction destination path
   * @returns {Promise<Object>} Extraction response
   */
  async extractArchive(archiveFile, extractPath) {
    try {
      const data = {
        archive_path: getPathFromFile(archiveFile),
        extract_path: extractPath
      };

      const result = await this.makeRequest('filesystem/archive/extract', 'POST', data);
      return result;
    } catch (error) {
      console.error('Error extracting archive:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get upload configuration for the current server
   * @param {string} uploadPath - Upload destination path
   * @returns {Object} Upload configuration for cubone
   */
  getUploadConfig(uploadPath = '/') {
    const server = this.getCurrentServer();
    if (!server) return null;

    return {
      url: `/api/zapi/${server.protocol}/${server.hostname}/${server.port}/filesystem/upload`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    };
  }

  /**
   * Check task status for async operations
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Task status
   */
  async getTaskStatus(taskId) {
    try {
      const result = await this.makeRequest(`tasks/${taskId}`, 'GET');
      return result;
    } catch (error) {
      console.error('Error getting task status:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get file manager statistics
   * @param {string} path - Path to get stats for
   * @returns {Promise<Object>} Statistics response
   */
  async getStats(path = '/') {
    try {
      const params = { path };
      const result = await this.makeRequest('filesystem/stats', 'GET', null, params);
      return result;
    } catch (error) {
      console.error('Error getting stats:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get current API user information
   * @returns {Promise<Object>} User info response
   */
  async getUserInfo() {
    try {
      const result = await this.makeRequest('system/user-info', 'GET');
      return result;
    } catch (error) {
      console.error('Error getting user info:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get system users for dropdown selection
   * @returns {Promise<Object>} Users list response
   */
  async getSystemUsers() {
    try {
      const result = await this.makeRequest('system/users', 'GET');
      return result;
    } catch (error) {
      console.error('Error getting system users:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get system groups for dropdown selection
   * @returns {Promise<Object>} Groups list response
   */
  async getSystemGroups() {
    try {
      const result = await this.makeRequest('system/groups', 'GET');
      return result;
    } catch (error) {
      console.error('Error getting system groups:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Update file/directory permissions and ownership
   * @param {Object} file - File object
   * @param {Object} permissions - Permission changes
   * @returns {Promise<Object>} Update response
   */
  async updatePermissions(file, permissions) {
    try {
      const data = {
        path: getPathFromFile(file),
        ...permissions,
        recursive: permissions.recursive || false
      };

      const result = await this.makeRequest('filesystem/permissions', 'PATCH', data);
      
      if (result.success && result.data && result.data.item) {
        return {
          success: true,
          file: transformZoneweaverToFile(result.data.item)
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error updating permissions:', error);
      return { success: false, message: error.message };
    }
  }
}

export default ZoneweaverFileManagerAPI;
