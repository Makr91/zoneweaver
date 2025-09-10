export const formatBytes = (bytes) => {
  // Handle various invalid inputs
  if (
    bytes === null ||
    bytes === undefined ||
    bytes === "" ||
    isNaN(bytes) ||
    bytes < 0
  ) {
    return "0 B";
  }

  // Convert to number if it's a string
  const numBytes = typeof bytes === "string" ? parseFloat(bytes) : bytes;
  if (isNaN(numBytes) || numBytes === 0) {
    return "0 B";
  }

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));

  // Ensure i is within valid range
  const sizeIndex = Math.max(0, Math.min(i, sizes.length - 1));
  const value = numBytes / k ** sizeIndex;

  return `${parseFloat(value.toFixed(2))} ${sizes[sizeIndex]}`;
};

export const formatPercentage = (used, total) => {
  if (!used || !total || total === 0) {
    return "0%";
  }
  return `${((used / total) * 100).toFixed(1)}%`;
};

export const getHealthColor = (health) => {
  switch (health?.toLowerCase()) {
    case "online":
    case "healthy":
    case "optimal":
      return "is-success";
    case "degraded":
    case "warning":
      return "is-warning";
    case "faulted":
    case "offline":
    case "error":
      return "is-danger";
    default:
      return "is-info";
  }
};

// Parse size strings like "176G", "1.72T" etc to bytes
export const parseSize = (sizeStr) => {
  // Handle null, undefined, empty string, or special values
  if (!sizeStr || sizeStr === "-" || sizeStr === "none" || sizeStr === "N/A") {
    return 0;
  }

  // If it's already a number, return it
  if (typeof sizeStr === "number") {
    return isNaN(sizeStr) ? 0 : Math.floor(sizeStr);
  }

  // Convert to string and clean it
  const cleanStr = String(sizeStr).trim();
  if (!cleanStr) {
    return 0;
  }

  // Match numbers with optional unit suffix (case insensitive)
  const match = cleanStr.match(/^([0-9.]+)\s*([KMGTPEZB]?)/i);
  if (!match) {
    return 0;
  }

  const value = parseFloat(match[1]);
  if (isNaN(value)) {
    return 0;
  }

  const unit = (match[2] || "").toUpperCase();

  const multipliers = {
    "": 1,
    B: 1, // Bytes
    K: 1024, // Kilobytes
    M: 1024 * 1024, // Megabytes
    G: 1024 * 1024 * 1024, // Gigabytes
    T: 1024 * 1024 * 1024 * 1024, // Terabytes
    P: 1024 * 1024 * 1024 * 1024 * 1024, // Petabytes
    E: 1024 * 1024 * 1024 * 1024 * 1024 * 1024, // Exabytes
    Z: 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024, // Zettabytes
  };

  const multiplier = multipliers[unit] || 1;
  const result = value * multiplier;

  // Return 0 if result is invalid
  return isNaN(result) || result < 0 ? 0 : Math.floor(result);
};
