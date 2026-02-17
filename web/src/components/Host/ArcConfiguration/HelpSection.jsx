const HelpSection = () => (
  <div className="box">
    <h4 className="title is-6 mb-3">
      <span className="icon-text">
        <span className="icon">
          <i className="fas fa-question-circle" />
        </span>
        <span>Configuration Help</span>
      </span>
    </h4>

    <div className="content is-small">
      <div className="columns">
        <div className="column">
          <p>
            <strong>Apply Methods (Oracle Solaris):</strong>
          </p>
          <ul>
            <li>
              <strong>Runtime Only:</strong> <em>Not supported</em> - Provided
              for compatibility only
            </li>
            <li>
              <strong>Persistent Only:</strong> Saves changes to config file,
              requires reboot (recommended)
            </li>
            <li>
              <strong>Both:</strong> <em>Functions as Persistent Only</em> -
              Runtime changes ignored
            </li>
          </ul>
        </div>
        <div className="column">
          <p>
            <strong>Best Practices:</strong>
          </p>
          <ul>
            <li>
              Leave fields empty for automatic calculation based on system
              memory
            </li>
            <li>Maximum ARC should not exceed 85% of total system memory</li>
            <li>Minimum ARC should be at least 1% of total system memory</li>
            <li>Always validate configuration before applying changes</li>
            <li>Plan maintenance window for reboot after ARC changes</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export default HelpSection;
