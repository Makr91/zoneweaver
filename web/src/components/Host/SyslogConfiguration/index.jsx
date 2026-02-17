import PropTypes from "prop-types";

import { useSyslogData } from "../../../hooks/useSyslogData";
import ConfirmModal from "../../common/ConfirmModal";

import ConfigEditorView from "./ConfigEditorView";
import CurrentRulesView from "./CurrentRulesView";
import HelpSection from "./HelpSection";
import RuleBuilderView from "./RuleBuilderView";
import { getServiceStatusColor, getServiceType } from "./syslogUtils";

const SyslogConfiguration = ({ server }) => {
  const data = useSyslogData(server);

  const {
    config,
    loading,
    message,
    setMessage,
    messageType,
    activeView,
    setActiveView,
    requestSwitchService,
    confirmSwitchService,
    cancelSwitchService,
    pendingSwitchTarget,
  } = data;

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
          <button
            type="button"
            className="delete"
            onClick={() => setMessage("")}
          />
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
                <p className="label is-small">Service Type</p>
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
                <p className="label is-small">Service Status</p>
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
                <p className="label is-small">Configuration File</p>
                <p className="control">
                  <span className="tag is-info is-small">
                    {config.config_file || "/etc/syslog.conf"}
                  </span>
                </p>
              </div>
            </div>
            <div className="column">
              <div className="field">
                <p className="label is-small">Active Rules</p>
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
                      type="button"
                      className={`button is-small ${getServiceType(config).name === "syslog" ? "is-primary" : ""}`}
                      onClick={() => requestSwitchService("syslog")}
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
                      type="button"
                      className={`button is-small ${getServiceType(config).name === "rsyslog" ? "is-primary" : ""}`}
                      onClick={() => requestSwitchService("rsyslog")}
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
            <button
              type="button"
              className="button is-ghost"
              onClick={() => setActiveView("current")}
            >
              <span className="icon is-small">
                <i className="fas fa-list" />
              </span>
              <span>Current Rules</span>
            </button>
          </li>
          <li className={activeView === "editor" ? "is-active" : ""}>
            <button
              type="button"
              className="button is-ghost"
              onClick={() => setActiveView("editor")}
            >
              <span className="icon is-small">
                <i className="fas fa-edit" />
              </span>
              <span>Config Editor</span>
            </button>
          </li>
          <li className={activeView === "builder" ? "is-active" : ""}>
            <button
              type="button"
              className="button is-ghost"
              onClick={() => setActiveView("builder")}
            >
              <span className="icon is-small">
                <i className="fas fa-plus" />
              </span>
              <span>Rule Builder</span>
            </button>
          </li>
        </ul>
      </div>

      {/* View Content */}
      {activeView === "current" && <CurrentRulesView config={config} />}

      {activeView === "editor" && (
        <ConfigEditorView
          configContent={data.configContent}
          setConfigContent={data.setConfigContent}
          validation={data.validation}
          loading={loading}
          validationLoading={data.validationLoading}
          validateConfiguration={data.validateConfiguration}
          applyConfiguration={data.applyConfiguration}
          reloadSyslog={data.reloadSyslog}
        />
      )}

      {activeView === "builder" && (
        <RuleBuilderView
          config={config}
          facilities={data.facilities}
          ruleBuilder={data.ruleBuilder}
          handleRuleBuilderChange={data.handleRuleBuilderChange}
          addRule={data.addRule}
        />
      )}

      <HelpSection config={config} />

      <ConfirmModal
        isOpen={pendingSwitchTarget !== null}
        onClose={cancelSwitchService}
        onConfirm={confirmSwitchService}
        title="Switch Syslog Service"
        message={`Are you sure you want to switch to ${pendingSwitchTarget || ""}? This will restart the logging service.`}
        confirmText="Switch Service"
        confirmVariant="is-warning"
        icon="fas fa-exchange-alt"
        loading={loading}
      />
    </div>
  );
};

SyslogConfiguration.propTypes = {
  server: PropTypes.object,
};

export default SyslogConfiguration;
