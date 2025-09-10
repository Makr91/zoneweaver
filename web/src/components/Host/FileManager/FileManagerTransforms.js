/**
 * Data transformation utilities for converting between Zoneweaver API format and Cubone file manager format
 */

/**
 * Extract parent path from a file path
 * @param {string} path - File path
 * @returns {string} Parent path
 */
const getParentPath = (path) => {
  if (!path || path === "/") {
    return "";
  }
  const parts = path.split("/");
  parts.pop(); // Remove the last part (filename)
  return parts.join("/") || "/";
};

/**
 * Generate synthetic ID from path for cubone compatibility
 * @param {string} path - File path
 * @returns {string} Synthetic ID
 */
const generateIdFromPath = (path) => btoa(path).replace(/[^a-zA-Z0-9]/g, "");

/**
 * Get parent ID from path for tree building
 * @param {string} path - File path
 * @returns {string|null} Parent ID or null for root items
 */
const getParentId = (path) => {
  const parentPath = getParentPath(path);
  return parentPath && parentPath !== "/"
    ? generateIdFromPath(parentPath)
    : null;
};

/**
 * Transform zoneweaver API file object to cubone format
 * @param {Object} zwItem - Zoneweaver API file item
 * @returns {Object} Cubone compatible file object
 */
export const transformZoneweaverToFile = (zwItem) => ({
  name: zwItem.name,
  path: zwItem.path, // Use zoneweaver API paths exactly as provided
  isDirectory: zwItem.isDirectory,
  updatedAt: zwItem.mtime || zwItem.atime || new Date().toISOString(),
  size: zwItem.size || 0,
  // Additional metadata for internal use
  _zwMetadata: {
    permissions: zwItem.permissions,
    uid: zwItem.uid,
    gid: zwItem.gid,
    mimeType: zwItem.mimeType,
    isBinary: zwItem.isBinary,
    syntax: zwItem.syntax,
  },
});

/**
 * Transform array of zoneweaver files to cubone hierarchy format
 * @param {Array} zwFiles - Array of zoneweaver API file objects
 * @returns {Array} Array of cubone compatible file objects
 */
export const transformFilesToHierarchy = (zwFiles) => {
  if (!Array.isArray(zwFiles)) {
    return [];
  }

  return zwFiles.map((file) => transformZoneweaverToFile(file));
};

/**
 * Extract path from cubone file object for API calls
 * @param {Object} file - Cubone file object
 * @returns {string} File path
 */
export const getPathFromFile = (file) => file.path || "/";

/**
 * Build file tree structure for navigation
 * @param {Array} files - Array of file objects
 * @returns {Array} Tree structure for navigation
 */
export const buildFileTree = (files) => {
  const directories = files.filter((file) => file.isDirectory);
  const tree = [];

  // Group directories by parent path
  const grouped = directories.reduce((acc, dir) => {
    const parentPath = getParentPath(dir.path);
    if (!acc[parentPath]) {
      acc[parentPath] = [];
    }
    acc[parentPath].push(dir);
    return acc;
  }, {});

  // Build tree recursively
  const buildNode = (path = "") => {
    if (!grouped[path]) {
      return [];
    }

    return grouped[path].map((dir) => ({
      ...dir,
      children: buildNode(dir.path),
    }));
  };

  return buildNode("");
};

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension (without dot)
 */
export const getFileExtension = (filename) => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

/**
 * Check if file is likely a text file based on backend metadata
 * @param {Object} file - File object
 * @returns {boolean} True if likely a text file
 */
export const isTextFile = (file) => {
  if (file.isDirectory) {
    return false;
  }

  // Primary: Use backend's binary analysis (most reliable)
  if (file._zwMetadata && file._zwMetadata.isBinary === false) {
    return true;
  }

  // Secondary: Check MIME type from backend
  if (file._zwMetadata && file._zwMetadata.mimeType) {
    if (file._zwMetadata.mimeType.startsWith("text/")) {
      return true;
    }
    // Additional MIME types that are text-editable
    const textMimeTypes = [
      "application/json",
      "application/javascript",
      "application/xml",
      "application/yaml",
      "application/x-yaml",
      "application/x-sh",
      "application/x-shellscript",
    ];
    if (textMimeTypes.includes(file._zwMetadata.mimeType)) {
      return true;
    }
  }

  // Tertiary: Check if backend detected syntax highlighting
  if (file._zwMetadata && file._zwMetadata.syntax) {
    return true;
  }

  // Fallback: Check for obvious text extensions (minimal list)
  const obviousTextExtensions = ["txt", "md", "log"];
  const extension = getFileExtension(file.name);
  if (obviousTextExtensions.includes(extension)) {
    return true;
  }

  // Special case: Shell/config files without extensions but with known patterns
  const textFilePatterns = [
    /^\.(bashrc|zshrc|kshrc|profile|bash_profile|zprofile)$/,
    /^(bashrc|zshrc|kshrc|profile)$/,
    /^\.(vimrc|gitconfig|gitignore)$/,
    /^(Dockerfile|Makefile|Rakefile)$/i,
  ];

  if (textFilePatterns.some((pattern) => pattern.test(file.name))) {
    return true;
  }

  return false;
};

/**
 * Check if file is an archive that can be extracted
 * @param {Object} file - File object
 * @returns {boolean} True if file is an archive
 */
export const isArchiveFile = (file) => {
  if (file.isDirectory) {
    return false;
  }

  const archiveExtensions = ["zip", "tar", "gz", "bz2", "xz", "rar", "7z"];

  const filename = file.name.toLowerCase();

  // Check for compound extensions like .tar.gz, .tar.bz2
  if (filename.includes(".tar.")) {
    return true;
  }

  // Check single extensions
  const extension = getFileExtension(file.name);
  return archiveExtensions.includes(extension);
};

/**
 * Get archive format from filename for API calls
 * @param {string} filename - Archive filename
 * @returns {string} Archive format for zoneweaver-api
 */
export const getArchiveFormat = (filename) => {
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith(".tar.gz") || lowerName.endsWith(".tgz")) {
    return "tar.gz";
  } else if (lowerName.endsWith(".tar.bz2")) {
    return "tar.bz2";
  } else if (lowerName.endsWith(".tar")) {
    return "tar";
  } else if (lowerName.endsWith(".zip")) {
    return "zip";
  } else if (lowerName.endsWith(".gz")) {
    return "gz";
  }

  return "zip"; // Default fallback
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) {
    return "0 B";
  }

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${Math.round((bytes / 1024 ** i) * 100) / 100} ${sizes[i]}`;
};

/**
 * Sort files with directories first, then by name
 * @param {Array} files - Array of files to sort
 * @returns {Array} Sorted array
 */
export const sortFiles = (files) =>
  [...files].sort((a, b) => {
    // Directories first
    if (a.isDirectory && !b.isDirectory) {
      return -1;
    }
    if (!a.isDirectory && b.isDirectory) {
      return 1;
    }

    // Then alphabetical by name
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
