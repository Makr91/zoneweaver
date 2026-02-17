import PropTypes from "prop-types";

import { processRuleDisplay, getActionTypeDisplay } from "./syslogUtils";

/**
 * Current syslog rules table display
 */
const CurrentRulesView = ({ config }) => (
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
            {config.parsed_rules.map((rule) => {
              const processed = processRuleDisplay(rule);
              const actionDisplay = getActionTypeDisplay(
                processed.actionType,
                processed.isComplex
              );

              return (
                <tr
                  key={rule.line_number ?? rule.full_line}
                  className={!processed.isValid ? "has-background-light" : ""}
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
                    <span className={`tag is-small ${actionDisplay.class}`}>
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
                        processed.hasConditionals ? "has-text-warning" : ""
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
                        processed.hasConditionals ? "has-text-warning" : ""
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
);

CurrentRulesView.propTypes = {
  config: PropTypes.object,
};

export default CurrentRulesView;
