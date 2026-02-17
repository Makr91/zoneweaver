import PropTypes from "prop-types";

import { getServiceType } from "./syslogUtils";

/**
 * Get the preview action text for the rule builder
 * @param {object} ruleBuilder - Rule builder state
 * @param {object} serviceType - Service type info from getServiceType
 * @returns {string} Preview action text
 */
const getRulePreviewAction = (ruleBuilder, serviceType) => {
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
};

/**
 * Interactive rule builder form with conditional fields
 */
const RuleBuilderView = ({
  config,
  facilities,
  ruleBuilder,
  handleRuleBuilderChange,
  addRule,
}) => {
  const serviceType = getServiceType(config);

  return (
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
            <label className="label" htmlFor="rule-facility">
              Facility
            </label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  id="rule-facility"
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
            <label className="label" htmlFor="rule-level">
              Level
            </label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  id="rule-level"
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
                    <option key="emerg" value="emerg">
                      emerg - Emergency
                    </option>,
                    <option key="alert" value="alert">
                      alert - Alert
                    </option>,
                    <option key="crit" value="crit">
                      crit - Critical
                    </option>,
                    <option key="err" value="err">
                      err - Error
                    </option>,
                    <option key="warning" value="warning">
                      warning - Warning
                    </option>,
                    <option key="notice" value="notice">
                      notice - Notice
                    </option>,
                    <option key="info" value="info">
                      info - Info
                    </option>,
                    <option key="debug" value="debug">
                      debug - Debug
                    </option>,
                  ]}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="column is-6">
          <div className="field">
            <label className="label" htmlFor="rule-action-type">
              Action Type
            </label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  id="rule-action-type"
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
                  <option value="all_users">Broadcast to All Users (*)</option>
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
              <label className="label" htmlFor="rule-file-path">
                Log File Path
              </label>
              <div className="control has-icons-left">
                <input
                  id="rule-file-path"
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
                Full path to the log file. Directory must exist or be writable
                by syslog daemon.
              </p>
            </div>
          </div>
        </div>
      )}

      {ruleBuilder.action_type === "remote_host" && (
        <div className="columns">
          <div className="column is-4">
            <div className="field">
              <label className="label" htmlFor="rule-remote-host">
                Remote Hostname
              </label>
              <div className="control has-icons-left">
                <input
                  id="rule-remote-host"
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
              <label className="label" htmlFor="rule-remote-protocol">
                Protocol
              </label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    id="rule-remote-protocol"
                    value={ruleBuilder.remote_protocol}
                    onChange={(e) =>
                      handleRuleBuilderChange("remote_protocol", e.target.value)
                    }
                  >
                    <option value="udp">UDP (Standard)</option>
                    <option value="tcp">TCP (Reliable)</option>
                  </select>
                </div>
              </div>
              <p className="help is-size-7">
                UDP is standard syslog protocol. TCP provides reliable delivery.
              </p>
            </div>
          </div>
          <div className="column is-4">
            <div className="field">
              <label className="label" htmlFor="rule-remote-port">
                Port (Optional)
              </label>
              <div className="control has-icons-left">
                <input
                  id="rule-remote-port"
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
                Leave empty for default port 514. Use custom port if required.
              </p>
            </div>
          </div>
        </div>
      )}

      {ruleBuilder.action_type === "user" && (
        <div className="columns">
          <div className="column is-8">
            <div className="field">
              <label className="label" htmlFor="rule-username">
                Username(s)
              </label>
              <div className="control has-icons-left">
                <input
                  id="rule-username"
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
                Single user (e.g., &quot;root&quot;) or multiple users separated
                by commas (e.g., &quot;root,operator&quot;).
              </p>
            </div>
          </div>
          <div className="column is-4">
            <div className="field">
              <label className="label" htmlFor="rule-multiple-users">
                Multiple Users
              </label>
              <div className="control">
                <label
                  className="switch is-medium"
                  htmlFor="rule-multiple-users"
                >
                  <input
                    id="rule-multiple-users"
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
                  This will send messages to all logged-in users&apos;
                  terminals. Use only for emergency situations as it interrupts
                  all users.
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
            type="button"
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
          Rule Preview ({serviceType.display} Format)
        </h5>
        <code className="is-size-7">
          {ruleBuilder.facility}.{ruleBuilder.level}\t\t\t
          {getRulePreviewAction(ruleBuilder, serviceType)}
        </code>
      </div>
    </div>
  );
};

RuleBuilderView.propTypes = {
  config: PropTypes.object,
  facilities: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  ruleBuilder: PropTypes.shape({
    facility: PropTypes.string.isRequired,
    level: PropTypes.string.isRequired,
    action_type: PropTypes.string.isRequired,
    action_target: PropTypes.string.isRequired,
    remote_protocol: PropTypes.string,
    remote_port: PropTypes.string,
    multiple_users: PropTypes.bool,
    user_list: PropTypes.string,
  }).isRequired,
  handleRuleBuilderChange: PropTypes.func.isRequired,
  addRule: PropTypes.func.isRequired,
};

export default RuleBuilderView;
