import PropTypes from "prop-types";

const LogViewer = ({
  selectedLog,
  logData,
  loading,
  isStreaming,
  streamLines,
  onClearStream,
}) => {
  const getLogIcon = (type) => {
    switch (type) {
      case "system":
        return "fas fa-server";
      case "authentication":
        return "fas fa-key";
      case "fault-manager":
        return "fas fa-exclamation-triangle";
      default:
        return "fas fa-file-alt";
    }
  };

  const getLogLevelClass = (line) => {
    const lower = line.toLowerCase();
    if (lower.includes("error") || lower.includes("fail")) {
      return "has-text-danger";
    }
    if (lower.includes("warning") || lower.includes("warn")) {
      return "has-text-warning";
    }
    if (lower.includes("info")) {
      return "has-text-info";
    }
    if (lower.includes("debug")) {
      return "has-text-grey";
    }
    return "has-text-white";
  };

  const formatTimestamp = (line) => {
    // Extract timestamp from beginning of line if present
    const timestampMatch = line.match(
      /^(?<timestamp>\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/
    );
    return timestampMatch ? timestampMatch.groups.timestamp : "";
  };

  const handleDownload = () => {
    const blob = new Blob(
      [logData.raw_output || logData.lines?.join("\n") || ""],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedLog.name}-${new Date().toISOString().split("T")[0]}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderLogContent = () => {
    const hasContent =
      (isStreaming && streamLines.length > 0) || (logData && logData.lines);

    if (hasContent) {
      return (
        <div className="content">
          <pre
            className="box has-background-black has-text-light p-4 log-viewer"
            style={{
              height: "500px",
              overflowY: "auto",
              fontSize: "0.8rem",
              lineHeight: "1.2",
            }}
            ref={(el) => {
              // Auto-scroll to bottom for streaming
              if (el && isStreaming) {
                el.scrollTop = el.scrollHeight;
              }
            }}
          >
            {isStreaming
              ? // Display streaming lines
                streamLines.map((item) => {
                  const timestamp = formatTimestamp(item.line);
                  const content = timestamp
                    ? item.line.substring(timestamp.length).trim()
                    : item.line;

                  return (
                    <div key={`${selectedLog.name}-${item.id}`} className="log-line mb-1">
                      {timestamp && (
                        <span className="has-text-grey-light mr-2">
                          {timestamp}
                        </span>


                      )}
                      <span className={getLogLevelClass(content)}>
                        {content}
                      </span>
                    </div>
                  );
                })
              : // Display static log lines
                logData.lines.map((line, index) => {

                  const timestamp = formatTimestamp(line);
                  const content = timestamp
                    ? line.substring(timestamp.length).trim()
                    : line;
                    <div
                      key={`${selectedLog.name}-${line}-${index}`}
                      className="log-line mb-1"
                    >
                      {timestamp && (
                        <span className="has-text-grey-light mr-2">
                          {timestamp}
                        </span>
                      )}
                      <span className={getLogLevelClass(content)}>
                        {content}
                      </span>
                    </div>
                  );

                })}
          </pre>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="has-text-centered p-6">
          <span className="icon is-large">
            <i className="fas fa-spinner fa-spin fa-2x" />
          </span>
          <p className="mt-2">
            {isStreaming
              ? "Connecting to log stream..."
              : "Loading log content..."}
          </p>
        </div>
      );
    }

    if (isStreaming) {
      return (
        <div className="has-text-centered p-6">
          <span className="icon is-large has-text-success">
            <i className="fas fa-satellite-dish fa-2x" />
          </span>
          <p className="mt-2 has-text-success">
            <strong>Live stream active</strong>
          </p>
          <p className="is-size-7 has-text-grey">
            Waiting for new log entries...
          </p>
        </div>
      );
    }

    return (
      <div className="has-text-centered p-6">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-file-alt fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">
          {selectedLog
            ? "Click Refresh to load log content"
            : "Select a log file to view content"}
        </p>
      </div>
    );
  };

  return (
    <div className="box">
      <div className="level is-mobile mb-3">
        <div className="level-left">
          <h4 className="title is-6">
            <span className="icon-text">
              <span className="icon">
                <i className={getLogIcon(selectedLog.type)} />
              </span>
              <span>{selectedLog.displayName || selectedLog.name}</span>
            </span>
            {loading && (
              <span className="ml-2">
                <i className="fas fa-spinner fa-spin" />
              </span>
            )}
            {isStreaming && (
              <span className="tag is-primary is-small ml-2">
                <span className="icon is-small">
                  <i className="fas fa-satellite-dish" />
                </span>
                <span>Live Stream</span>
              </span>
            )}
          </h4>
        </div>
        <div className="level-right">
          <div className="field has-addons">
            {isStreaming && streamLines.length > 0 && (
              <div className="control">
                <button
                  className="button is-small"
                  onClick={onClearStream}
                  title="Clear stream buffer"
                >
                  <span className="icon">
                    <i className="fas fa-eraser" />
                  </span>
                  <span>Clear</span>
                </button>
              </div>
            )}
            <div className="control">
              <div className="tags">
                {isStreaming && (
                  <span className="tag is-primary is-small">
                    {streamLines.length} stream lines
                  </span>
                )}
                {!isStreaming && logData && (
                  <span className="tag is-info is-small">
                    {logData.totalLines} lines
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Display */}
      {renderLogContent()}

      {/* Log File Info */}
      {logData && logData.fileInfo && (
        <div className="notification is-light mt-3 is-small">
          <div className="level is-mobile">
            <div className="level-left">
              <div>
                <p className="is-size-7">
                  <strong>File:</strong> {logData.path}
                  <span className="ml-3">
                    <strong>Size:</strong> {logData.fileInfo.sizeFormatted}
                  </span>
                  <span className="ml-3">
                    <strong>Modified:</strong>{" "}
                    {new Date(logData.fileInfo.modified).toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
            <div className="level-right">
              <div className="buttons are-small">
                <button
                  className="button is-small"
                  onClick={handleDownload}
                  title="Download Log"
                >
                  <span className="icon">
                    <i className="fas fa-download" />
                  </span>
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

LogViewer.propTypes = {
  selectedLog: PropTypes.object.isRequired,
  logData: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  isStreaming: PropTypes.bool.isRequired,
  streamLines: PropTypes.array.isRequired,
  onClearStream: PropTypes.func.isRequired,
};

export default LogViewer;
