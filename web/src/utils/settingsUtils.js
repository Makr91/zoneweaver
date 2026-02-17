/**
 * Settings utility functions for processing and organizing configuration metadata
 */

/**
 * Maps configuration path to section name
 * @param {string} path - Configuration path (e.g., "frontend.theme")
 * @returns {string|undefined} Section name
 */
export const inferSection = (path) => {
  const sectionMap = {
    frontend: "Frontend",
    server: "Server",
    database: "Database",
    mail: "Mail",
    authentication: "Authentication",
    cors: "Security",
    logging: "Logging",
    limits: "Performance",
    environment: "Environment",
    integrations: "Integrations",
    gravatar: "Integrations", // Map gravatar to Integrations
  };

  const pathParts = path.split(".");
  return sectionMap[pathParts[0]];
};

/**
 * Extracts subsection name from configuration path
 * @param {string} path - Configuration path
 * @param {string} section - Parent section name
 * @returns {string|null} Subsection name or null
 */
export const inferSubsection = (path, section) => {
  if (section === "Integrations") {
    const pathParts = path.split(".");
    if (pathParts[0] === "integrations" && pathParts[1]) {
      // Convert subsection name to title case
      return pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1);
    }
    if (pathParts[0] === "gravatar") {
      return "Gravatar";
    }
  }
  return null;
};

/**
 * Converts snake_case field name to Title Case label
 * @param {string} fieldName - Field name in snake_case
 * @returns {string} Title Case label
 */
export const generateLabel = (fieldName) =>
  fieldName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/**
 * Returns FontAwesome icon class for section
 * @param {string} section - Section name
 * @returns {string} FontAwesome icon class
 */
export const getSectionIcon = (section) => {
  const iconMap = {
    Application: "fas fa-cogs",
    Server: "fas fa-server",
    Frontend: "fas fa-desktop",
    Database: "fas fa-database",
    Mail: "fas fa-envelope",
    Authentication: "fas fa-shield-alt",
    Security: "fas fa-lock",
    Logging: "fas fa-file-alt",
    Performance: "fas fa-tachometer-alt",
    Environment: "fas fa-globe",
    Integrations: "fas fa-puzzle-piece",
  };
  return iconMap[section] || "fas fa-cog";
};

/**
 * Processes raw configuration into organized structure with sections, subsections, and fields
 * @param {object} config - Raw configuration object with metadata
 * @returns {{extractedValues: object, organizedSections: object}} Processed configuration
 */
export const processConfig = (config) => {
  const extractedValues = {};
  const organizedSections = {};
  const sectionMetadata = config._sections || {};

  const processObject = (obj, path = "", sectionName = "General") => {
    for (const [key, value] of Object.entries(obj || {})) {
      // Skip metadata sections
      if (key === "_sections") {
        continue;
      }

      const fullPath = path ? `${path}.${key}` : key;

      if (
        value &&
        typeof value === "object" &&
        value.type &&
        Object.hasOwn(value, "value")
      ) {
        // This is a metadata field
        extractedValues[fullPath] = value.value;

        // Determine section from metadata or infer from path
        const section = value.section || inferSection(fullPath) || sectionName;
        const subsection =
          value.subsection || inferSubsection(fullPath, section);

        if (!organizedSections[section]) {
          const metadata = sectionMetadata[section] || {};
          organizedSections[section] = {
            title: section,
            icon: metadata.icon || getSectionIcon(section),
            description: metadata.description || "",
            fields: [],
            subsections: {},
          };
        }

        const fieldData = {
          key: fullPath,
          path: fullPath,
          type: value.type,
          label: value.label || generateLabel(key),
          description: value.description || "",
          placeholder: value.placeholder || "",
          required: value.required || false,
          options: value.options || null,
          validation: value.validation || {},
          conditional: value.conditional || null,
          order: value.order || 0,
          value: value.value,
        };

        // Special handling for object-type fields
        if (
          value.type === "object" &&
          value.value &&
          typeof value.value === "object"
        ) {
          // Create the parent subsection but don't add the object as a field
          if (subsection) {
            if (!organizedSections[section].subsections[subsection]) {
              organizedSections[section].subsections[subsection] = {
                title: subsection,
                fields: [],
              };
            }
            // Don't add the object field itself, just ensure the subsection exists
          }

          // Recurse into their value to process nested fields
          processObject(value.value, fullPath, section);
        } else {
          // Regular field processing for non-object fields
          if (subsection) {
            // Organize into subsections
            if (!organizedSections[section].subsections[subsection]) {
              organizedSections[section].subsections[subsection] = {
                title: subsection,
                fields: [],
              };
            }
            organizedSections[section].subsections[subsection].fields.push(
              fieldData
            );
          } else {
            // Add to main section
            organizedSections[section].fields.push(fieldData);
          }
        }
      } else if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !Object.hasOwn(value, "type")
      ) {
        // This is a nested object, recurse with section inference
        const inferredSection = inferSection(fullPath) || sectionName;
        processObject(value, fullPath, inferredSection);
      } else if (Array.isArray(value) || typeof value !== "object") {
        // This is a direct value (backward compatibility)
        extractedValues[fullPath] = value;
      }
    }
  };

  processObject(config);

  // Sort fields within each section and subsection by order
  Object.values(organizedSections).forEach((section) => {
    section.fields.sort((a, b) => (a.order || 0) - (b.order || 0));
    Object.values(section.subsections).forEach((subsection) => {
      subsection.fields.sort((a, b) => (a.order || 0) - (b.order || 0));
    });
  });

  return { extractedValues, organizedSections };
};
