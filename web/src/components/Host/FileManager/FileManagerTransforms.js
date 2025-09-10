/**
 * Data transformation utilities for converting between Zoneweaver API format and Cubone file manager format
 */

/**
 * Extract parent path from a file path
 * @param {string} path - File path
 * @returns {string} Parent path
 */
const getParentPath = (path) => {
  if (!path || path === '/') return '';
  const parts = path.split('/');
  parts.pop(); // Remove the last part (filename)
  return parts.join('/') || '/';
};

/**
 * Generate synthetic ID from path for cubone compatibility
 * @param {string} path - File path
 * @returns {string} Synthetic ID
 */
const generateIdFromPath = (path) => {
  return btoa(path).replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Get parent ID from path for tree building
 * @param {string} path - File path
 * @returns {string|null} Parent ID or null for root items
 */
const getParentId = (path) => {
  const parentPath = getParentPath(path);
  return parentPath && parentPath !== '/' ? generateIdFromPath(parentPath) : null;
};

/**
 * Transform zoneweaver API file object to cubone format
 * @param {Object} zwItem - Zoneweaver API file item
 * @param {string} currentPath - Current directory being browsed
 * @returns {Object} Cubone compatible file object
 */
export const transformZoneweaverToFile = (zwItem, currentPath = '/') => {
  // Ensure proper path format for cubone navigation
  // Cubone expects: currentPath + "/" + file.name === file.path
  const normalizedCurrentPath = currentPath === '/' ? '' : currentPath;
  const expectedPath = normalizedCurrentPath + '/' + zwItem.name;
  
  return {
    name: zwItem.name,
    path: expectedPath, // Use expected path format for cubone
    isDirectory: zwItem.isDirectory,
    updatedAt: zwItem.mtime || zwItem.atime || new Date().toISOString(),
    size: zwItem.size || 0,
    // Additional metadata for internal use
    _zwMetadata: {
      originalPath: zwItem.path, // Keep original path for API calls
      permissions: zwItem.permissions,
      uid: zwItem.uid,
      gid: zwItem.gid,
      mimeType: zwItem.mimeType,
      isBinary: zwItem.isBinary,
      syntax: zwItem.syntax
    }
  };
};

/**
 * Transform array of zoneweaver files to cubone hierarchy format
 * @param {Array} zwFiles - Array of zoneweaver API file objects
 * @returns {Array} Array of cubone compatible file objects
 */
export const transformFilesToHierarchy = (zwFiles) => {
  if (!Array.isArray(zwFiles)) return [];
  
  return zwFiles.map(file => transformZoneweaverToFile(file));
};

/**
 * Extract path from cubone file object for API calls
 * @param {Object} file - Cubone file object
 * @returns {string} File path (uses original zoneweaver path if available)
 */
export const getPathFromFile = (file) => {
  // Use original zoneweaver path for API calls if available
  return file._zwMetadata?.originalPath || file.path || '/';
};

/**
 * Build file tree structure for navigation
 * @param {Array} files - Array of file objects
 * @returns {Array} Tree structure for navigation
 */
export const buildFileTree = (files) => {
  const directories = files.filter(file => file.isDirectory);
  const tree = [];
  
  // Group directories by parent path
  const grouped = directories.reduce((acc, dir) => {
    const parentPath = getParentPath(dir.path);
    if (!acc[parentPath]) acc[parentPath] = [];
    acc[parentPath].push(dir);
    return acc;
  }, {});
  
  // Build tree recursively
  const buildNode = (path = '') => {
    if (!grouped[path]) return [];
    
    return grouped[path].map(dir => ({
      ...dir,
      children: buildNode(dir.path)
    }));
  };
  
  return buildNode('');
};

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension (without dot)
 */
export const getFileExtension = (filename) => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

/**
 * Check if file is likely a text file based on extension and metadata
 * @param {Object} file - File object
 * @returns {boolean} True if likely a text file
 */
export const isTextFile = (file) => {
  if (file.isDirectory) return false;
  
  const textExtensions = [
    'txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'html', 'htm',
    'xml', 'yaml', 'yml', 'ini', 'conf', 'cfg', 'log', 'sh', 'bash', 'py', 'php',
    'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp', 'sql', 'csv'
  ];
  
  const extension = getFileExtension(file.name);
  const hasTextExtension = textExtensions.includes(extension);
  const isNotBinary = file._zwMetadata && !file._zwMetadata.isBinary;
  const hasTextMime = file._zwMetadata && 
    file._zwMetadata.mimeType && 
    file._zwMetadata.mimeType.startsWith('text/');
  
  return hasTextExtension || isNotBinary || hasTextMime;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Sort files with directories first, then by name
 * @param {Array} files - Array of files to sort
 * @returns {Array} Sorted array
 */
export const sortFiles = (files) => {
  return [...files].sort((a, b) => {
    // Directories first
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    
    // Then alphabetical by name
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
};
