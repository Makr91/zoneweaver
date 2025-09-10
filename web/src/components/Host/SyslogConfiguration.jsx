import React, { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";

const SyslogConfiguration = ({ server }) => {
  const [config, setConfig] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [configContent, setConfigContent] = useState("");
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [activeView, setActiveView] = useState("current"); // current, editor, builder

  // Rule builder state
  const [ruleBuilder, setRuleBuilder] = useState({
    facility: "*",
    level: "info",
    action_type: "file",
    action_target: "/var/log/custom.log",
    // Remote host specific options
    remote_protocol: "udp", // udp or tcp
    remote_port: "",
    // User specific options
    multiple_users: false,
    user_list: "",
  });

  const { makeZoneweaverAPIRequest } = useServers();

  // Load configuration on component mount
  useEffect(() => {
    if (server) {
      loadSyslogConfig();
      loadFacilities();
    }
  }, [server]);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (
      message &&
      (messageType === "is-success" || messageType === "is-warning")
    ) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message, messageType]);

  const loadSyslogConfig = async (clearMessage = true) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      if (clearMessage) {
        setMessage("");
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/syslog/config",
        "GET"
      );

      if (result.success) {
        setConfig(result.data);
        setConfigContent(result.data?.config_content || "");
      } else {
        setMessage(result.message || "Failed to load syslog configuration");
        setMessageType("is-danger");
        setConfig(null);
        setConfigContent("");
      }
    } catch (err) {
      setMessage(`Error loading syslog configuration: ${err.message}`);
      setMessageType("is-danger");
      setConfig(null);
      setConfigContent("");
    } finally {
      setLoading(false);
    }
  };

  const loadFacilities = async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/syslog/facilities",
        "GET"
      );

      if (result.success) {
        setFacilities(result.data);
      }
    } catch (err) {
      console.error("Error loading facilities:", err);
    }
  };

  const validateConfiguration = async () => {
    if (!server || !configContent.trim()) {
      setMessage("Please enter configuration content to validate.");
      setMessageType("is-warning");
      return;
    }

    try {
      setValidationLoading(true);
      setMessage("Validating syslog configuration...");
      setMessageType("is-info");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/syslog/validate",
        "POST",
        { config_content: configContent }
      );

      setValidation(result.data);

      if (result.data?.valid) {
        setMessage("Configuration validation passed! No syntax errors found.");
        setMessageType("is-success");
      } else {
        setMessage(
          `Configuration validation found ${result.data?.errors?.length || 0} error(s) and ${result.data?.warnings?.length || 0} warning(s).`
        );
        setMessageType("is-warning");
      }
    } catch (error) {
      console.error("Error validating syslog configuration:", error);
      setMessage(
        `Validation failed: ${error.response?.data?.message || error.message}`
      );
      setMessageType("is-danger");
      setValidation(null);
    } finally {
      setValidationLoading(false);
    }
  };

  const applyConfiguration = async () => {
    if (!server || !configContent.trim()) {
      setMessage("Please enter configuration content to apply.");
      setMessageType("is-warning");
      return;
    }

    try {
      setLoading(true);
      setMessage("Applying syslog configuration...");
      setMessageType("is-info");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/syslog/config",
        "PUT",
        {
          config_content: configContent,
          backup_existing: true,
          reload_service: true,
        }
      );

      if (result.success) {
        setMessage(
          `Syslog configuration updated successfully! ${result.data?.message || ""}`
        );
        setMessageType("is-success");

        // Reload current configuration without clearing success message
        await loadSyslogConfig(false);
      } else {
        setMessage(`Failed to apply configuration: ${result.message}`);
        setMessageType("is-danger");
      }
    } catch (error) {
      console.error("Error applying syslog configuration:", error);
      setMessage(
        `Failed to apply configuration: ${error.response?.data?.message || error.message}`
      );
      setMessageType("is-danger");
    } finally {
      setLoading(false);
    }
  };

  const reloadSyslog = async () => {
    if (!server) {
      return;
    }

    try {
      setLoading(true);
      setMessage("Reloading syslog service...");
      setMessageType("is-info");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/syslog/reload",
        "POST"
      );

      if (result.success) {
        setMessage(
          `Syslog service reloaded successfully! ${result.data?.message || ""}`
        );
        setMessageType("is-success");

        // Reload configuration to get updated service status
        await loadSyslogConfig(false);
      } else {
        setMessage(`Failed to reload syslog service: ${result.message}`);
        setMessageType("is-danger");
      }
    } catch (error) {
      console.error("Error reloading syslog service:", error);
      setMessage(
        `Failed to reload syslog service: ${error.response?.data?.message || error.message}`
      );
      setMessageType("is-danger");
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    const serviceType = getServiceType(config);

    let action;
    if (ruleBuilder.action_type === "file") {
      action = ruleBuilder.action_target;
    } else if (ruleBuilder.action_type === "remote_host") {
      action = `@${ruleBuilder.action_target}`;
    } else if (ruleBuilder.action_type === "all_users") {
      // Use rsyslog syntax if rsyslog is active
      action = serviceType.name === "rsyslog" ? ":omusrmsg:*" : "*";
    } else if (ruleBuilder.action_type === "user") {
      // Use rsyslog syntax if rsyslog is active
      action =
        serviceType.name === "rsyslog"
          ? `:omusrmsg:${ruleBuilder.action_target}`
          : ruleBuilder.action_target;
    } else {
      action = ruleBuilder.action_target;
    }

    const rule = `${ruleBuilder.facility}.${ruleBuilder.level}\t\t\t${action}`;

    setConfigContent((prev) => `${prev}\n${rule}`);

    // Reset rule builder
    setRuleBuilder({
      facility: "*",
      level: "info",
      action_type: "file",
      action_target: "/var/log/custom.log",
    });
  };

  const handleRuleBuilderChange = (field, value) => {
    setRuleBuilder((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getValidationColor = (errors, warnings) => {
    if (errors && errors.length > 0) {
      return "is-danger";
    }
    if (warnings && warnings.length > 0) {
      return "is-warning";
    }
    return "is-success";
  };

  const getServiceStatusColor = (status) => {
    switch (status?.state?.toLowerCase()) {
      case "online":
        return "is-success";
      case "offline":
        return "is-danger";
      case "maintenance":
        return "is-warning";
      default:
        return "is-light";
    }
  };

  const getServiceType = (config) => {
    if (config?.service_fmri?.includes("rsyslog")) {
      return { name: "rsyslog", display: "rsyslog (Modern)", icon: "fa-cogs" };
    } else if (config?.service_fmri?.includes("system-log")) {
      return {
        name: "syslog",
        display: "syslog (Traditional)",
        icon: "fa-file-alt",
      };
    }
    return { name: "unknown", display: "Unknown", icon: "fa-question" };
  };

  const switchService = async (targetService) => {
    if (!server) {
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to switch to ${targetService}? This will restart the logging service.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setMessage(`Switching to ${targetService}...`);
      setMessageType("is-info");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/syslog/switch",
        "POST",
        { target: targetService }
      );

      if (result.success) {
        setMessage(
          `Successfully switched to ${targetService}! Logging service has been restarted.`
        );
        setMessageType("is-success");

        // Reload configuration to show new service
        await loadSyslogConfig(false);
      } else {
        setMessage(`Failed to switch service: ${result.message}`);
        setMessageType("is-danger");
      }
    } catch (error) {
      console.error("Error switching syslog service:", error);
      setMessage(
        `Failed to switch service: ${error.response?.data?.message || error.message}`
      );
      setMessageType("is-danger");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced rule processing for display - handles both syslog and rsyslog syntax
  const processRuleDisplay = (rule) => {
    const fullLine = rule.full_line || "";

    // Handle rsyslog-specific directives
    if (fullLine.includes("module(load=")) {
      const moduleMatch = fullLine.match(/module\(load="([^"]+)"/);
      const moduleName = moduleMatch ? moduleMatch[1] : "unknown";
      return {
        isValid: true,
        selector: "(rsyslog module)",
        actionType: "rsyslog_module",
        target: moduleName,
        isComplex: false,
        hasConditionals: false,
        isRsyslogDirective: true,
      };
    }

    if (fullLine.includes("global(")) {
      return {
        isValid: true,
        selector: "(rsyslog global)",
        actionType: "rsyslog_global",
        target: "Global configuration",
        isComplex: false,
        hasConditionals: false,
        isRsyslogDirective: true,
      };
    }

    if (fullLine.includes("include(")) {
      const includeMatch = fullLine.match(/include\(file="([^"]+)"/);
      const includePath = includeMatch ? includeMatch[1] : "unknown";
      return {
        isValid: true,
        selector: "(rsyslog include)",
        actionType: "rsyslog_include",
        target: includePath,
        isComplex: false,
        hasConditionals: false,
        isRsyslogDirective: true,
      };
    }

    if (fullLine.includes("input(type=")) {
      const inputMatch = fullLine.match(/input\(type="([^"]+)"/);
      const inputType = inputMatch ? inputMatch[1] : "unknown";
      return {
        isValid: true,
        selector: "(rsyslog input)",
        actionType: "rsyslog_input",
        target: inputType,
        isComplex: false,
        hasConditionals: false,
        isRsyslogDirective: true,
      };
    }

    // Handle traditional syslog m4 macro constructs
    if (fullLine.trim() === ")" || fullLine.trim().startsWith(")")) {
      return {
        isValid: true,
        selector: "(m4 macro close)",
        actionType: "m4_block_end",
        target: "End ifdef block",
        isComplex: true,
        hasConditionals: true,
        isM4Construct: true,
      };
    }

    if (fullLine.includes("ifdef(") && fullLine.includes(", ,")) {
      return {
        isValid: true,
        selector: "(m4 macro start)",
        actionType: "m4_block_start",
        target: "Begin conditional block",
        isComplex: true,
        hasConditionals: true,
        isM4Construct: true,
      };
    }

    // Handle empty or malformed rules
    if (!rule.selector && !rule.action) {
      return {
        isValid: false,
        selector: "(empty)",
        actionType: "malformed",
        target: "(incomplete)",
        isComplex: false,
        hasConditionals: false,
      };
    }

    // Check for m4 conditional statements (traditional syslog)
    const hasConditionals =
      fullLine.includes("ifdef(") ||
      fullLine.includes("`") ||
      rule.action?.includes("ifdef(");

    // Check for multi-selectors
    const isMultiSelector =
      rule.selector?.includes(";") || rule.selector?.includes(",");

    // Better action type detection
    let actionType = rule.parsed?.action_type || "unknown";
    let target = rule.parsed?.action_target || rule.action || "";

    // Handle rsyslog output module syntax
    if (target.startsWith(":omusrmsg:")) {
      const username = target.replace(":omusrmsg:", "");
      return {
        isValid: true,
        selector: rule.selector || "",
        actionType: username === "*" ? "all_users" : "user",
        target: username,
        isComplex: isMultiSelector,
        hasConditionals: false,
        isRsyslogDirective: true,
        originalRule: rule,
      };
    }

    // Handle rsyslog async file syntax (dash prefix)
    if (target.startsWith("-/")) {
      return {
        isValid: true,
        selector: rule.selector || "",
        actionType: "file_async",
        target: target.substring(1), // Remove dash for display
        isComplex: isMultiSelector,
        hasConditionals: false,
        isRsyslogDirective: true,
        originalRule: rule,
      };
    }

    // Special handling for m4 ifdef constructs (traditional syslog)
    if (fullLine.includes("ifdef(") && target.includes(",")) {
      const ifdefMatch = target.match(/ifdef\(`([^']+)', ([^,]+), ([^)]+)\)/);
      if (ifdefMatch) {
        const [, condition, trueAction, falseAction] = ifdefMatch;
        return {
          isValid: true,
          selector: rule.selector || "",
          actionType: "conditional_choice",
          target: `IF ${condition}: ${trueAction.trim()} ELSE: ${falseAction.trim()}`,
          isComplex: true,
          hasConditionals: true,
          isM4Construct: true,
          originalRule: rule,
        };
      }
    }

    // Improved action type detection for complex rules
    if (actionType === "unknown" || actionType === "specific_users") {
      if (target.includes("ifdef(")) {
        actionType = "conditional";
      } else if (target.includes("/")) {
        actionType = "file";
      } else if (target.includes("@")) {
        actionType = "remote_host";
        target = target.replace("@", "");
      } else if (target === "*") {
        actionType = "all_users";
      } else if (target.includes("`") && target.includes(",")) {
        actionType = "multiple_users";
        target = target.replace(/`/g, "").replace(/'/g, "");
      } else if (target.includes(",")) {
        actionType = "multiple_users";
      } else {
        actionType = "user";
      }
    }

    return {
      isValid: true,
      selector: rule.selector || "",
      actionType,
      target,
      isComplex: isMultiSelector || hasConditionals,
      hasConditionals,
      isMultiSelector,
      originalRule: rule,
    };
  };

  const getActionTypeDisplay = (actionType, isComplex) => {
    const baseClass = isComplex ? "is-warning" : "";

    switch (actionType) {
      case "file":
        return { class: `is-info ${baseClass}`, icon: "fa-file", text: "File" };
      case "file_async":
        return { class: `is-info`, icon: "fa-file", text: "Async File" };
      case "remote_host":
        return {
          class: `is-warning ${baseClass}`,
          icon: "fa-server",
          text: "Remote",
        };
      case "all_users":
        return {
          class: `is-danger ${baseClass}`,
          icon: "fa-users",
          text: "All Users",
        };
      case "user":
        return {
          class: `is-primary ${baseClass}`,
          icon: "fa-user",
          text: "User",
        };
      case "multiple_users":
        return {
          class: `is-primary ${baseClass}`,
          icon: "fa-users",
          text: "Multi-User",
        };
      case "conditional":
        return { class: "is-warning", icon: "fa-code", text: "Conditional" };
      case "conditional_choice":
        return { class: "is-warning", icon: "fa-code-branch", text: "If/Else" };
      case "m4_block_start":
        return { class: "is-info", icon: "fa-play", text: "Block Start" };
      case "m4_block_end":
        return { class: "is-info", icon: "fa-stop", text: "Block End" };
      case "rsyslog_module":
        return { class: "is-success", icon: "fa-puzzle-piece", text: "Module" };
      case "rsyslog_global":
        return { class: "is-success", icon: "fa-cogs", text: "Global" };
      case "rsyslog_include":
        return { class: "is-success", icon: "fa-folder-open", text: "Include" };
      case "rsyslog_input":
        return { class: "is-success", icon: "fa-sign-in-alt", text: "Input" };
      case "malformed":
        return { class: "is-grey", icon: "fa-question", text: "Malformed" };
      default:
        return {
          class: "is-light",
          icon: "fa-question",
          text: actionType || "Unknown",
        };
    }
  };

  if (loading && !config) {
    return (
      <div className="box">
        <div className="has-text-centered">
          <div className="loader" />
          <p className="mt-3">Loading syslog configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Status Messages */}
      {message && (
        <div className={`notification ${messageType} mb-4`}>
          <button className="delete" onClick={() => setMessage("")} />
          <p>{message}</p>
        </div>
      )}

      {/* Configuration Overview */}
      {config && (
        <div className="box mb-4">
          <h4 className="title is-6 mb-3">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-info-circle" />
              </span>
              <span>Configuration Status</span>
            </span>
          </h4>

          <div className="columns">
            <div className="column">
              <div className="field">
                <label className="label is-small">Service Type</label>
                <p className="control">
                  <span className="tag is-primary">
                    <span className="icon is-small">
                      <i className={`fas ${getServiceType(config).icon}`} />
                    </span>
                    <span>{getServiceType(config).display}</span>
                  </span>
                </p>
              </div>
            </div>
            <div className="column">
              <div className="field">
                <label className="label is-small">Service Status</label>
                <p className="control">
                  <span
                    className={`tag ${getServiceStatusColor(config.service_status)}`}
                  >
                    <span className="icon is-small">
                      <i
                        className={`fas ${config.service_status?.state === "online" ? "fa-check-circle" : "fa-times-circle"}`}
                      />
                    </span>
                    <span>{config.service_status?.state || "Unknown"}</span>
                  </span>
                </p>
              </div>
            </div>
            <div className="column">
              <div className="field">
                <label className="label is-small">Configuration File</label>
                <p className="control">
                  <span className="tag is-info is-small">
                    {config.config_file || "/etc/syslog.conf"}
                  </span>
                </p>
              </div>
            </div>
            <div className="column">
              <div className="field">
                <label className="label is-small">Active Rules</label>
                <p className="control">
                  <span className="tag is-light">
                    {config.parsed_rules?.length || 0} rules
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Service Switching Controls */}
          <div className="level is-mobile mt-4">
            <div className="level-left">
              <div className="level-item">
                <p className="is-size-7 has-text-grey">
                  Switch between traditional syslog and modern rsyslog service
                </p>
              </div>
            </div>
            <div className="level-right">
              <div className="level-item">
                <div className="field has-addons">
                  <div className="control">
                    <button
                      className={`button is-small ${getServiceType(config).name === "syslog" ? "is-primary" : ""}`}
                      onClick={() => switchService("syslog")}
                      disabled={
                        loading || getServiceType(config).name === "syslog"
                      }
                    >
                      <span className="icon is-small">
                        <i className="fas fa-file-alt" />
                      </span>
                      <span>Traditional Syslog</span>
                    </button>
                  </div>
                  <div className="control">
                    <button
                      className={`button is-small ${getServiceType(config).name === "rsyslog" ? "is-primary" : ""}`}
                      onClick={() => switchService("rsyslog")}
                      disabled={
                        loading || getServiceType(config).name === "rsyslog"
                      }
                    >
                      <span className="icon is-small">
                        <i className="fas fa-cogs" />
                      </span>
                      <span>Modern Rsyslog</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="tabs is-toggle is-small mb-4">
        <ul>
          <li className={activeView === "current" ? "is-active" : ""}>
            <a onClick={() => setActiveView("current")}>
              <span className="icon is-small">
                <i className="fas fa-list" />
              </span>
              <span>Current Rules</span>
            </a>
          </li>
          <li className={activeView === "editor" ? "is-active" : ""}>
            <a onClick={() => setActiveView("editor")}>
              <span className="icon is-small">
                <i className="fas fa-edit" />
              </span>
              <span>Config Editor</span>
            </a>
          </li>
          <li className={activeView === "builder" ? "is-active" : ""}>
            <a onClick={() => setActiveView("builder")}>
              <span className="icon is-small">
                <i className="fas fa-plus" />
              </span>
              <span>Rule Builder</span>
            </a>
          </li>
        </ul>
      </div>

      {/* Current Rules View */}
      {activeView === "current" && (
        <div className="box">
          <h4 className="title is-6 mb-4">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-list" />
              </span>
              <span>Current Syslog Rules</span>
            </span>
          </h4>

          {config?.parsed_rules && config.parsed_rules.length > 0 ? (
            <div className="table-container">
              <table className="table is-fullwidth is-hoverable">
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Facility.Level</th>
                    <th>Action Type</th>
                    <th>Target</th>
                    <th>Full Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {config.parsed_rules.map((rule, index) => {
                    const processed = processRuleDisplay(rule);
                    const actionDisplay = getActionTypeDisplay(
                      processed.actionType,
                      processed.isComplex
                    );

                    return (
                      <tr
                        key={index}
                        className={
                          !processed.isValid ? "has-background-light" : ""
                        }
                      >
                        <td>
                          <span className="tag is-light is-small">
                            {rule.line_number || "?"}
                          </span>
                        </td>
                        <td>
                          <div className="is-flex is-align-items-center">
                            <span
                              className={`is-family-monospace has-text-weight-semibold ${
                                processed.isMultiSelector ? "has-text-info" : ""
                              }`}
                            >
                              {processed.selector || "(empty)"}
                            </span>
                            {processed.isMultiSelector && (
                              <span className="tag is-info is-small ml-2">
                                <span className="icon is-small">
                                  <i className="fas fa-sitemap" />
                                </span>
                                <span>Multi</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`tag is-small ${actionDisplay.class}`}
                          >
                            <span className="icon is-small">
                              <i className={`fas ${actionDisplay.icon}`} />
                            </span>
                            <span>{actionDisplay.text}</span>
                          </span>
                          {processed.hasConditionals && (
                            <span className="tag is-warning is-small ml-1">
                              <span className="icon is-small">
                                <i className="fas fa-code" />
                              </span>
                              <span>Conditional</span>
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`is-family-monospace is-size-7 ${
                              processed.hasConditionals
                                ? "has-text-warning"
                                : ""
                            }`}
                          >
                            {processed.target.length > 50
                              ? `${processed.target.substring(0, 50)}...`
                              : processed.target}
                          </span>
                          {processed.target.length > 50 && (
                            <span
                              className="is-size-7 has-text-grey ml-1"
                              title={processed.target}
                            >
                              (truncated)
                            </span>
                          )}
                        </td>
                        <td>
                          <code
                            className={`is-size-7 ${
                              processed.hasConditionals
                                ? "has-text-warning"
                                : ""
                            }`}
                          >
                            {rule.full_line?.length > 80
                              ? `${rule.full_line.substring(0, 80)}...`
                              : rule.full_line || "(incomplete rule)"}
                          </code>
                          {rule.full_line?.length > 80 && (
                            <span
                              className="is-size-7 has-text-grey ml-1"
                              title={rule.full_line}
                            >
                              (truncated)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="has-text-centered p-4">
              <span className="icon is-large has-text-grey">
                <i className="fas fa-list fa-2x" />
              </span>
              <p className="mt-2 has-text-grey">No syslog rules configured</p>
            </div>
          )}
        </div>
      )}

      {/* Configuration Editor View */}
      {activeView === "editor" && (
        <div className="box">
          <h4 className="title is-6 mb-4">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-edit" />
              </span>
              <span>Configuration Editor</span>
            </span>
          </h4>

          <div className="field">
            <label className="label">Syslog Configuration Content</label>
            <div className="control">
              <textarea
                className="textarea is-family-monospace"
                rows="20"
                value={configContent}
                onChange={(e) => setConfigContent(e.target.value)}
                placeholder="# Enter syslog configuration rules here
# Example:
*.notice			/var/adm/messages
mail.info			/var/log/maillog
kern.err			@loghost
*.emerg				*"
                disabled={loading}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
            <p className="help">
              Edit the complete syslog.conf file content. Use TAB to separate
              selectors from actions.
            </p>
          </div>

          {/* Validation Results */}
          {validation && (
            <div
              className={`notification ${getValidationColor(validation.errors, validation.warnings)} mt-4`}
            >
              <h5 className="title is-6">Validation Results</h5>

              {validation.errors && validation.errors.length > 0 && (
                <div className="content">
                  <p className="has-text-weight-semibold has-text-danger">
                    Errors:
                  </p>
                  <ul>
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings && validation.warnings.length > 0 && (
                <div className="content">
                  <p className="has-text-weight-semibold has-text-warning">
                    Warnings:
                  </p>
                  <ul>
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.parsed_rules &&
                validation.parsed_rules.length > 0 && (
                  <div className="content">
                    <p className="has-text-weight-semibold">Parsed Rules:</p>
                    <div className="notification is-light is-small">
                      <p className="is-size-7">
                        {validation.parsed_rules.length} rule(s) will be active
                        after applying this configuration.
                      </p>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Editor Action Buttons */}
          <div className="field is-grouped mt-4">
            <div className="control">
              <button
                className={`button is-info ${validationLoading ? "is-loading" : ""}`}
                onClick={validateConfiguration}
                disabled={loading || validationLoading}
              >
                <span className="icon">
                  <i className="fas fa-check-circle" />
                </span>
                <span>Validate Configuration</span>
              </button>
            </div>

            <div className="control">
              <button
                className={`button is-primary ${loading ? "is-loading" : ""}`}
                onClick={applyConfiguration}
                disabled={loading || validationLoading}
              >
                <span className="icon">
                  <i className="fas fa-save" />
                </span>
                <span>Apply Configuration</span>
              </button>
            </div>

            <div className="control">
              <button
                className={`button is-warning ${loading ? "is-loading" : ""}`}
                onClick={reloadSyslog}
                disabled={loading || validationLoading}
              >
                <span className="icon">
                  <i className="fas fa-redo" />
                </span>
                <span>Reload Service</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Builder View */}
      {activeView === "builder" && (
        <div className="box">
          <h4 className="title is-6 mb-4">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-plus" />
              </span>
              <span>Syslog Rule Builder</span>
            </span>
          </h4>

          <div className="columns">
            <div className="column is-3">
              <div className="field">
                <label className="label">Facility</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      value={ruleBuilder.facility}
                      onChange={(e) =>
                        handleRuleBuilderChange("facility", e.target.value)
                      }
                    >
                      {facilities?.facilities?.map((facility) => (
                        <option key={facility.name} value={facility.name}>
                          {facility.name} - {facility.description}
                        </option>
                      )) || [
                        <option key="*" value="*">
                          * - All facilities
                        </option>,
                        <option key="kern" value="kern">
                          kern - Kernel messages
                        </option>,
                        <option key="mail" value="mail">
                          mail - Mail system
                        </option>,
                        <option key="auth" value="auth">
                          auth - Authentication
                        </option>,
                        <option key="daemon" value="daemon">
                          daemon - System daemons
                        </option>,
                        <option key="local0" value="local0">
                          local0 - Local use 0
                        </option>,
                        <option key="local1" value="local1">
                          local1 - Local use 1
                        </option>,
                      ]}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="column is-3">
              <div className="field">
                <label className="label">Level</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      value={ruleBuilder.level}
                      onChange={(e) =>
                        handleRuleBuilderChange("level", e.target.value)
                      }
                    >
                      {facilities?.levels?.map((level) => (
                        <option key={level.name} value={level.name}>
                          {level.name} - {level.description}
                        </option>
                      )) || [
                        <option value="emerg">emerg - Emergency</option>,
                        <option value="alert">alert - Alert</option>,
                        <option value="crit">crit - Critical</option>,
                        <option value="err">err - Error</option>,
                        <option value="warning">warning - Warning</option>,
                        <option value="notice">notice - Notice</option>,
                        <option value="info">info - Info</option>,
                        <option value="debug">debug - Debug</option>,
                      ]}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="column is-6">
              <div className="field">
                <label className="label">Action Type</label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select
                      value={ruleBuilder.action_type}
                      onChange={(e) => {
                        handleRuleBuilderChange("action_type", e.target.value);
                        // Reset target when action type changes
                        const defaultTargets = {
                          file: "/var/log/custom.log",
                          remote_host: "loghost",
                          all_users: "*",
                          user: "root",
                        };
                        handleRuleBuilderChange(
                          "action_target",
                          defaultTargets[e.target.value] || ""
                        );
                      }}
                    >
                      <option value="file">Log to File</option>
                      <option value="remote_host">Send to Remote Host</option>
                      <option value="all_users">
                        Broadcast to All Users (*)
                      </option>
                      <option value="user">Send to Specific User(s)</option>
                    </select>
                  </div>
                </div>
                <p className="help is-size-7">
                  {ruleBuilder.action_type === "file" &&
                    "Log messages to a local file"}
                  {ruleBuilder.action_type === "remote_host" &&
                    "Forward messages to a remote syslog server"}
                  {ruleBuilder.action_type === "all_users" &&
                    "Send messages to all logged-in users (emergency only)"}
                  {ruleBuilder.action_type === "user" &&
                    "Send messages to specific user(s)"}
                </p>
              </div>
            </div>
          </div>

          {/* Conditional Configuration Fields Based on Action Type */}
          {ruleBuilder.action_type === "file" && (
            <div className="columns">
              <div className="column">
                <div className="field">
                  <label className="label">Log File Path</label>
                  <div className="control has-icons-left">
                    <input
                      className="input"
                      type="text"
                      value={ruleBuilder.action_target}
                      onChange={(e) =>
                        handleRuleBuilderChange("action_target", e.target.value)
                      }
                      placeholder="/var/log/custom.log"
                    />
                    <span className="icon is-small is-left">
                      <i className="fas fa-file" />
                    </span>
                  </div>
                  <p className="help is-size-7">
                    Full path to the log file. Directory must exist or be
                    writable by syslog daemon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {ruleBuilder.action_type === "remote_host" && (
            <div className="columns">
              <div className="column is-4">
                <div className="field">
                  <label className="label">Remote Hostname</label>
                  <div className="control has-icons-left">
                    <input
                      className="input"
                      type="text"
                      value={ruleBuilder.action_target}
                      onChange={(e) =>
                        handleRuleBuilderChange("action_target", e.target.value)
                      }
                      placeholder="loghost.company.com"
                    />
                    <span className="icon is-small is-left">
                      <i className="fas fa-server" />
                    </span>
                  </div>
                  <p className="help is-size-7">
                    Hostname or IP address of remote syslog server.
                  </p>
                </div>
              </div>
              <div className="column is-4">
                <div className="field">
                  <label className="label">Protocol</label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select
                        value={ruleBuilder.remote_protocol}
                        onChange={(e) =>
                          handleRuleBuilderChange(
                            "remote_protocol",
                            e.target.value
                          )
                        }
                      >
                        <option value="udp">UDP (Standard)</option>
                        <option value="tcp">TCP (Reliable)</option>
                      </select>
                    </div>
                  </div>
                  <p className="help is-size-7">
                    UDP is standard syslog protocol. TCP provides reliable
                    delivery.
                  </p>
                </div>
              </div>
              <div className="column is-4">
                <div className="field">
                  <label className="label">Port (Optional)</label>
                  <div className="control has-icons-left">
                    <input
                      className="input"
                      type="number"
                      min="1"
                      max="65535"
                      value={ruleBuilder.remote_port}
                      onChange={(e) =>
                        handleRuleBuilderChange("remote_port", e.target.value)
                      }
                      placeholder="514 (default)"
                    />
                    <span className="icon is-small is-left">
                      <i className="fas fa-hashtag" />
                    </span>
                  </div>
                  <p className="help is-size-7">
                    Leave empty for default port 514. Use custom port if
                    required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {ruleBuilder.action_type === "user" && (
            <div className="columns">
              <div className="column is-8">
                <div className="field">
                  <label className="label">Username(s)</label>
                  <div className="control has-icons-left">
                    <input
                      className="input"
                      type="text"
                      value={ruleBuilder.action_target}
                      onChange={(e) =>
                        handleRuleBuilderChange("action_target", e.target.value)
                      }
                      placeholder="root,operator"
                    />
                    <span className="icon is-small is-left">
                      <i className="fas fa-user" />
                    </span>
                  </div>
                  <p className="help is-size-7">
                    Single user (e.g., "root") or multiple users separated by
                    commas (e.g., "root,operator").
                  </p>
                </div>
              </div>
              <div className="column is-4">
                <div className="field">
                  <label className="label">Multiple Users</label>
                  <div className="control">
                    <label className="switch is-medium">
                      <input
                        type="checkbox"
                        checked={ruleBuilder.multiple_users}
                        onChange={(e) =>
                          handleRuleBuilderChange(
                            "multiple_users",
                            e.target.checked
                          )
                        }
                      />
                      <span className="check" />
                      <span className="control-label">Multiple</span>
                    </label>
                  </div>
                  <p className="help is-size-7">
                    Enable to send to multiple users (comma-separated).
                  </p>
                </div>
              </div>
            </div>
          )}

          {ruleBuilder.action_type === "all_users" && (
            <div className="notification is-warning is-light">
              <div className="level is-mobile">
                <div className="level-left">
                  <div>
                    <p className="has-text-weight-semibold">
                      Emergency Broadcast Mode
                    </p>
                    <p className="is-size-7">
                      This will send messages to all logged-in users' terminals.
                      Use only for emergency situations as it interrupts all
                      users.
                    </p>
                  </div>
                </div>
                <div className="level-right">
                  <span className="icon has-text-warning">
                    <i className="fas fa-exclamation-triangle fa-2x" />
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="field">
            <div className="control">
              <button
                className="button is-primary"
                onClick={addRule}
                disabled={
                  !ruleBuilder.facility ||
                  !ruleBuilder.level ||
                  !ruleBuilder.action_target
                }
              >
                <span className="icon">
                  <i className="fas fa-plus" />
                </span>
                <span>Add Rule to Configuration</span>
              </button>
            </div>
          </div>

          {/* Preview of generated rule */}
          <div className="notification is-light mt-4">
            <h5 className="title is-6 mb-2">
              Rule Preview ({getServiceType(config).display} Format)
            </h5>
            <code className="is-size-7">
              {ruleBuilder.facility}.{ruleBuilder.level}\t\t\t
              {(() => {
                const serviceType = getServiceType(config);

                if (ruleBuilder.action_type === "file") {
                  return ruleBuilder.action_target;
                } else if (ruleBuilder.action_type === "remote_host") {
                  return `@${ruleBuilder.action_target}`;
                } else if (ruleBuilder.action_type === "all_users") {
                  return serviceType.name === "rsyslog" ? ":omusrmsg:*" : "*";
                } else if (ruleBuilder.action_type === "user") {
                  return serviceType.name === "rsyslog"
                    ? `:omusrmsg:${ruleBuilder.action_target}`
                    : ruleBuilder.action_target;
                }
                return ruleBuilder.action_target;
              })()}
            </code>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="box">
        <h4 className="title is-6 mb-3">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-question-circle" />
            </span>
            <span>{getServiceType(config).display} Configuration Help</span>
          </span>
        </h4>

        <div className="content is-small">
          <div className="columns">
            <div className="column">
              <p>
                <strong>Common Examples:</strong>
              </p>
              <ul>
                <li>
                  <code>*.notice /var/adm/messages</code> - All notices to
                  messages
                </li>
                <li>
                  <code>mail.* /var/log/maillog</code> - All mail logs to
                  maillog
                </li>
                <li>
                  <code>kern.err @loghost</code> - Kernel errors to remote host
                </li>
                <li>
                  <code>*.emerg *</code> - Emergency messages to all users
                </li>
                {getServiceType(config).name === "syslog" && (
                  <li>
                    <code>ifdef(`LOGHOST', action1, action2)</code> -
                    Conditional m4 macro
                  </li>
                )}
              </ul>
            </div>
            <div className="column">
              <p>
                <strong>Service Information:</strong>
              </p>
              <ul>
                <li>
                  <strong>Service:</strong> {getServiceType(config).display}
                </li>
                <li>
                  <strong>Config File:</strong>{" "}
                  {config?.config_file || "Unknown"}
                </li>
                <li>
                  <strong>FMRI:</strong> {config?.service_fmri || "Unknown"}
                </li>
                {getServiceType(config).name === "rsyslog" && (
                  <li>
                    <strong>Features:</strong> Advanced filtering, modules,
                    templates
                  </li>
                )}
                {getServiceType(config).name === "syslog" && (
                  <li>
                    <strong>Features:</strong> m4 macros, conditional processing
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Service-specific notes */}
          {getServiceType(config).name === "rsyslog" && (
            <div className="notification is-info is-light mt-3">
              <p className="is-size-7">
                <strong>rsyslog Notes:</strong> Modern syslog implementation
                with advanced features like modules, templates, and enhanced
                filtering. Supports both traditional syslog syntax and extended
                rsyslog directives.
              </p>
            </div>
          )}

          {getServiceType(config).name === "syslog" && (
            <div className="notification is-info is-light mt-3">
              <p className="is-size-7">
                <strong>Traditional Syslog Notes:</strong> Classic syslog
                implementation with m4 macro preprocessing. Supports conditional
                statements using ifdef() and backtick syntax for complex rule
                logic.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyslogConfiguration;
