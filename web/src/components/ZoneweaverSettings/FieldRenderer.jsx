const FieldRenderer = ({
  field,
  sectionName,
  subsectionName,
  values,
  sslFiles,
  uploadingFiles,
  loading,
  onFieldChange,
  onSslFileUpload,
  onSetMsg,
}) => {
  // Check if field should be shown based on conditional logic
  const shouldShowField = (fieldToCheck) => {
    if (!fieldToCheck.conditional) {
      return true;
    }

    const { field: dependsOn, value: showWhen } = fieldToCheck.conditional;
    const dependentValue = values[dependsOn];

    if (Array.isArray(showWhen)) {
      return showWhen.includes(dependentValue);
    }

    return dependentValue === showWhen;
  };

  // SSL file field renderer for certificate, key, and CA files
  const renderSSLFileField = (sslField) => {
    // Skip field if conditional logic says to hide it
    if (!shouldShowField(sslField)) {
      return null;
    }

    const currentValue =
      values[sslField.path] !== undefined
        ? values[sslField.path]
        : sslField.value;
    const isUploading = uploadingFiles[sslField.path];
    const uploadedFile = sslFiles[sslField.path];

    // Determine SSL file type and appropriate settings
    const getSSLFileConfig = (path) => {
      if (path.includes("ssl_key_path")) {
        return {
          type: "Private Key",
          icon: "fas fa-key",
          color: "is-danger",
          accept: ".key,.pem",
          description: "Private key file (.key or .pem format)",
        };
      } else if (path.includes("ssl_cert_path")) {
        return {
          type: "Certificate",
          icon: "fas fa-certificate",
          color: "is-success",
          accept: ".crt,.pem,.cer",
          description: "SSL certificate file (.crt, .pem, or .cer format)",
        };
      } else if (
        path.includes("ssl_ca_path") ||
        path.includes("ca_cert") ||
        path.includes("ca_certificate")
      ) {
        return {
          type: "CA Certificate",
          icon: "fas fa-shield-alt",
          color: "is-info",
          accept: ".ca,.crt,.pem,.cer",
          description:
            "Certificate Authority file (.ca, .crt, .pem, or .cer format)",
        };
      }
      return {
        type: "SSL File",
        icon: "fas fa-file",
        color: "is-primary",
        accept: ".pem,.crt,.key,.cer,.ca",
        description: "SSL certificate file",
      };
    };

    const config = getSSLFileConfig(sslField.path);

    const handleFileInputChange = (e) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        onSslFileUpload(sslField.path, selectedFile);
      }
    };

    return (
      <div className="field" key={sslField.path}>
        <label className="label" htmlFor={sslField.path}>
          <span className="icon is-small mr-2">
            <i className={config.icon} />
          </span>
          {sslField.label}
        </label>

        {/* File path input - always visible */}
        <div className="field">
          <label className="label is-small" htmlFor={`${sslField.path}-input`}>
            File Path:
          </label>
          <div className="control">
            <input
              id={`${sslField.path}-input`}
              className="input is-small"
              type="text"
              value={currentValue || ""}
              onChange={(e) => onFieldChange(sslField.path, e.target.value)}
              placeholder={sslField.placeholder || "Enter file path..."}
              disabled={loading}
            />
          </div>
          <p className="help is-size-7">
            Specify where the uploaded file should be saved. The upload will
            update this path automatically.
          </p>
        </div>

        {/* File upload component */}
        <div
          className={`file has-name ${config.color} ${isUploading ? "is-loading" : ""}`}
        >
          <label className="file-label" htmlFor={`${sslField.path}-file`}>
            <input
              id={`${sslField.path}-file`}
              className="file-input"
              type="file"
              accept={config.accept}
              onChange={handleFileInputChange}
              disabled={loading || isUploading}
            />
            <span className="file-cta">
              <span className="file-icon">
                <i
                  className={
                    isUploading ? "fas fa-spinner fa-pulse" : config.icon
                  }
                />
              </span>
              <span className="file-label">
                {isUploading ? "Uploading..." : `Upload ${config.type}`}
              </span>
            </span>
            <span className="file-name">
              {uploadedFile ? uploadedFile.name : "No file selected"}
            </span>
          </label>
        </div>

        {/* File status and info */}
        {uploadedFile && (
          <div className="notification is-success is-small mt-2">
            <div className="columns is-mobile is-vcentered">
              <div className="column">
                <p className="is-size-7">
                  <strong>{uploadedFile.name}</strong> (
                  {(uploadedFile.size / 1024).toFixed(1)} KB)
                </p>
                <p className="is-size-7 has-text-grey">
                  Uploaded to:{" "}
                  <code className="is-size-7">{uploadedFile.uploadedPath}</code>
                </p>
              </div>
              <div className="column is-narrow">
                <span className="icon has-text-success">
                  <i className="fas fa-check-circle" />
                </span>
              </div>
            </div>
          </div>
        )}

        {sslField.description && (
          <p className="help has-text-grey">
            {sslField.description}
            <br />
            <small>
              <strong>Supported formats:</strong>{" "}
              {config.accept.replace(/\./g, "").toUpperCase()}
            </small>
          </p>
        )}
      </div>
    );
  };

  // Dynamic field renderer based on metadata type
  const renderField = (fieldToRender) => {
    // Skip field if conditional logic says to hide it
    if (!shouldShowField(fieldToRender)) {
      return null;
    }

    const currentValue =
      values[fieldToRender.path] !== undefined
        ? values[fieldToRender.path]
        : fieldToRender.value;

    const handleInputChange = (e) => {
      const inputValue =
        fieldToRender.type === "boolean" ? e.target.checked : e.target.value;
      onFieldChange(fieldToRender.path, inputValue);
    };

    const fieldProps = {
      key: fieldToRender.path,
      id: fieldToRender.path,
      value: currentValue || "",
      onChange: handleInputChange,
      placeholder: fieldToRender.placeholder,
      required: fieldToRender.required,
      disabled: loading,
    };

    let inputElement;

    if (fieldToRender.type === "boolean") {
      inputElement = (
        <label className="switch is-medium" htmlFor={fieldToRender.path}>
          <input
            id={fieldToRender.path}
            type="checkbox"
            checked={!!currentValue}
            onChange={fieldProps.onChange}
            disabled={fieldProps.disabled}
          />
          <span className="check" />
          <span className="control-label">{fieldToRender.label}</span>
        </label>
      );
    } else if (fieldToRender.type === "integer") {
      inputElement = (
        <input
          className="input"
          type="number"
          {...fieldProps}
          min={fieldToRender.validation?.min}
          max={fieldToRender.validation?.max}
        />
      );
    } else if (fieldToRender.type === "password") {
      inputElement = (
        <input className="input" type="password" {...fieldProps} />
      );
    } else if (fieldToRender.type === "email") {
      inputElement = <input className="input" type="email" {...fieldProps} />;
    } else if (fieldToRender.type === "select") {
      inputElement = (
        <div className="select is-fullwidth">
          <select {...fieldProps}>
            {fieldToRender.options &&
              fieldToRender.options
                .map((option) => {
                  // Handle both string and object options
                  const optionValue =
                    typeof option === "object" ? option.value : option;
                  let optionLabel =
                    typeof option === "object" ? option.label : option;

                  // Skip empty/null values unless they're intentionally empty strings
                  if (optionValue === null || optionValue === undefined) {
                    return null;
                  }

                  // Special handling for CORS allow_origin field
                  if (fieldToRender.path === "security.cors.allow_origin") {
                    if (optionValue === true) {
                      optionLabel = "Allow all origins in whitelist";
                    } else if (optionValue === false) {
                      optionLabel = "Deny all origins";
                    } else if (optionValue === "specific") {
                      optionLabel = "Use exact whitelist matching";
                    }
                  }

                  // Use a combination of value and label for unique key
                  const uniqueKey = `${optionValue}-${optionLabel}`;

                  return (
                    <option key={uniqueKey} value={optionValue}>
                      {optionLabel}
                    </option>
                  );
                })
                .filter(Boolean)}
          </select>
        </div>
      );
    } else if (fieldToRender.type === "textarea") {
      inputElement = (
        <textarea
          className="textarea"
          {...fieldProps}
          rows={fieldToRender.validation?.rows || 3}
        />
      );
    } else if (fieldToRender.type === "array") {
      const arrayValue = Array.isArray(currentValue)
        ? currentValue.join("\n")
        : currentValue || "";

      const handleArrayChange = (e) => {
        onFieldChange(fieldToRender.path, e.target.value.split("\n"));
      };

      inputElement = (
        <textarea
          id={fieldToRender.path}
          className="textarea"
          value={arrayValue}
          onChange={handleArrayChange}
          placeholder={fieldToRender.placeholder || "One item per line"}
          disabled={fieldProps.disabled}
          rows={fieldToRender.validation?.rows || 4}
        />
      );
    } else {
      // default: 'string', 'host', etc.
      inputElement = <input className="input" type="text" {...fieldProps} />;
    }

    return (
      <div className="field" key={fieldToRender.path}>
        {fieldToRender.type !== "boolean" && (
          <label className="label" htmlFor={fieldToRender.path}>
            {fieldToRender.label}
          </label>
        )}
        <div className="control">{inputElement}</div>
        {fieldToRender.description && (
          <p className="help has-text-grey">{fieldToRender.description}</p>
        )}
      </div>
    );
  };

  // Check if field is SSL type
  if (field.type === "ssl") {
    return renderSSLFileField(field);
  }

  return renderField(field);
};

export default FieldRenderer;
