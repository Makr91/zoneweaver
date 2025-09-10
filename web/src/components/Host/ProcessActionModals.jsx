import React, { useState } from "react";

import { FormModal } from "../common";

// Kill Process Confirmation Modal
const KillProcessModal = ({ process, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [force, setForce] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await onConfirm(process.pid, "kill", { force });
      if (result.success) {
        onClose();
      }
    } catch (error) {
      console.error("Error killing process:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Kill Process"
      icon="fas fa-times"
      submitText={loading ? "Killing..." : "Kill Process"}
      submitVariant="is-danger"
      loading={loading}
      showCancelButton
    >
      {/* Process Information */}
      <div className="box mb-4">
        <h3 className="title is-6">Process Information</h3>
        <div className="table-container">
          <table className="table is-fullwidth">
            <tbody>
              <tr>
                <td>
                  <strong>PID</strong>
                </td>
                <td className="is-family-monospace">{process.pid}</td>
              </tr>
              <tr>
                <td>
                  <strong>User</strong>
                </td>
                <td>{process.username}</td>
              </tr>
              <tr>
                <td>
                  <strong>Zone</strong>
                </td>
                <td>{process.zone}</td>
              </tr>
              <tr>
                <td>
                  <strong>Command</strong>
                </td>
                <td className="is-family-monospace is-size-7">
                  {process.command}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning */}
      <div className="notification is-danger">
        <p>
          <strong>Warning:</strong> This will terminate the process.
        </p>
        <p className="mt-2">
          The process will first receive SIGTERM for graceful shutdown. If it
          doesn't respond, SIGKILL will be sent to force termination.
        </p>
      </div>

      {/* Options */}
      <div className="box">
        <h3 className="title is-6">Kill Options</h3>

        <div className="field">
          <div className="control">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
              />
              <span className="ml-2">
                <strong>Force Kill</strong> - Send SIGKILL immediately (not
                recommended)
              </span>
            </label>
          </div>
          <p className="help">
            If unchecked, the process will first receive SIGTERM for graceful
            shutdown.
          </p>
        </div>
      </div>
    </FormModal>
  );
};

// Send Signal Modal
const SendSignalModal = ({ process, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [signal, setSignal] = useState("TERM");

  const signals = [
    { value: "TERM", label: "SIGTERM - Graceful termination" },
    { value: "KILL", label: "SIGKILL - Force kill (cannot be ignored)" },
    { value: "HUP", label: "SIGHUP - Hangup (reload configuration)" },
    { value: "INT", label: "SIGINT - Interrupt (Ctrl+C)" },
    { value: "QUIT", label: "SIGQUIT - Quit with core dump" },
    { value: "USR1", label: "SIGUSR1 - User defined signal 1" },
    { value: "USR2", label: "SIGUSR2 - User defined signal 2" },
    { value: "STOP", label: "SIGSTOP - Stop process (cannot be ignored)" },
    { value: "CONT", label: "SIGCONT - Continue stopped process" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await onConfirm(process.pid, "signal", { signal });
      if (result.success) {
        onClose();
      }
    } catch (error) {
      console.error("Error sending signal:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Send Signal to Process"
      icon="fas fa-bolt"
      submitText={loading ? "Sending..." : "Send Signal"}
      submitVariant="is-warning"
      loading={loading}
      showCancelButton
    >
      {/* Process Information */}
      <div className="box mb-4">
        <h3 className="title is-6">Process Information</h3>
        <div className="table-container">
          <table className="table is-fullwidth">
            <tbody>
              <tr>
                <td>
                  <strong>PID</strong>
                </td>
                <td className="is-family-monospace">{process.pid}</td>
              </tr>
              <tr>
                <td>
                  <strong>User</strong>
                </td>
                <td>{process.username}</td>
              </tr>
              <tr>
                <td>
                  <strong>Zone</strong>
                </td>
                <td>{process.zone}</td>
              </tr>
              <tr>
                <td>
                  <strong>Command</strong>
                </td>
                <td className="is-family-monospace is-size-7">
                  {process.command}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Signal Selection */}
      <div className="box">
        <h3 className="title is-6">Signal Selection</h3>

        <div className="field">
          <label className="label">Signal to Send</label>
          <div className="control">
            <div className="select is-fullwidth">
              <select
                value={signal}
                onChange={(e) => setSignal(e.target.value)}
              >
                {signals.map((sig) => (
                  <option key={sig.value} value={sig.value}>
                    {sig.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="help">
            Choose the appropriate signal based on your intent.
          </p>
        </div>
      </div>

      {/* Signal Information */}
      <div className="notification is-info">
        <p>
          <strong>Note:</strong> Different signals have different effects on
          processes.
        </p>
        <ul className="mt-2">
          <li>
            • <strong>SIGTERM:</strong> Requests graceful termination -
            processes can handle cleanup
          </li>
          <li>
            • <strong>SIGKILL:</strong> Forces immediate termination - cannot be
            ignored or handled
          </li>
          <li>
            • <strong>SIGHUP:</strong> Often used to reload configuration files
          </li>
          <li>
            • <strong>SIGSTOP/SIGCONT:</strong> Pause and resume process
            execution
          </li>
        </ul>
      </div>
    </FormModal>
  );
};

// Batch Kill Modal
const BatchKillModal = ({ onClose, onConfirm, availableZones }) => {
  const [loading, setLoading] = useState(false);
  const [pattern, setPattern] = useState("");
  const [zone, setZone] = useState("");
  const [signal, setSignal] = useState("TERM");

  const signals = ["TERM", "KILL", "HUP", "INT", "QUIT"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pattern.trim()) {
      return;
    }

    setLoading(true);
    try {
      const result = await onConfirm(pattern, signal, zone);
      if (result.success) {
        onClose();
      }
    } catch (error) {
      console.error("Error performing batch kill:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Batch Kill Processes"
      icon="fas fa-stop-circle"
      submitText={loading ? "Processing..." : "Kill Processes"}
      submitVariant="is-danger"
      loading={loading}
      disabled={!pattern.trim()}
      showCancelButton
    >
      {/* Warning */}
      <div className="notification is-danger mb-4">
        <p>
          <strong>Warning:</strong> This will affect multiple processes matching
          the pattern.
        </p>
        <p className="mt-2">
          Use this feature carefully. Test with a specific pattern first.
        </p>
      </div>

      {/* Pattern Selection */}
      <div className="box mb-4">
        <h3 className="title is-6">Process Selection</h3>

        <div className="field">
          <label className="label">
            Command Pattern <span className="has-text-danger">*</span>
          </label>
          <div className="control">
            <input
              className="input"
              type="text"
              placeholder="e.g., apache, bhyve, nginx..."
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              required
            />
          </div>
          <p className="help">
            Enter a command name pattern to match processes. This will match
            processes whose command contains this text.
          </p>
        </div>

        <div className="field">
          <label className="label">Zone Filter (Optional)</label>
          <div className="control">
            <div className="select is-fullwidth">
              <select value={zone} onChange={(e) => setZone(e.target.value)}>
                <option value="">All Zones</option>
                {availableZones.map((zoneName, index) => (
                  <option key={index} value={zoneName}>
                    {zoneName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="help">
            Optionally limit the operation to processes in a specific zone.
          </p>
        </div>
      </div>

      {/* Signal Selection */}
      <div className="box">
        <h3 className="title is-6">Signal Options</h3>

        <div className="field">
          <label className="label">Signal to Send</label>
          <div className="control">
            <div className="select is-fullwidth">
              <select
                value={signal}
                onChange={(e) => setSignal(e.target.value)}
              >
                {signals.map((sig) => (
                  <option key={sig} value={sig}>
                    SIG{sig}{" "}
                    {sig === "TERM"
                      ? "(Graceful)"
                      : sig === "KILL"
                        ? "(Force)"
                        : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="help">
            SIGTERM is recommended for graceful shutdown. SIGKILL for force
            termination.
          </p>
        </div>
      </div>

      {/* Examples */}
      <div className="notification is-info">
        <p>
          <strong>Pattern Examples:</strong>
        </p>
        <ul className="mt-2">
          <li>
            • <code>apache</code> - Matches all Apache processes
          </li>
          <li>
            • <code>bhyve</code> - Matches all VM processes
          </li>
          <li>
            • <code>java</code> - Matches all Java applications
          </li>
          <li>
            • <code>python</code> - Matches all Python scripts
          </li>
        </ul>
      </div>
    </FormModal>
  );
};

// Main component that renders the appropriate modal
const ProcessActionModals = ({
  selectedProcess,
  showKillModal,
  showSignalModal,
  showBatchKillModal,
  availableZones,
  onCloseKillModal,
  onCloseSignalModal,
  onCloseBatchKillModal,
  onProcessAction,
  onBatchKill,
}) => (
  <>
    {showKillModal && selectedProcess && (
      <KillProcessModal
        process={selectedProcess}
        onClose={onCloseKillModal}
        onConfirm={onProcessAction}
      />
    )}

    {showSignalModal && selectedProcess && (
      <SendSignalModal
        process={selectedProcess}
        onClose={onCloseSignalModal}
        onConfirm={onProcessAction}
      />
    )}

    {showBatchKillModal && (
      <BatchKillModal
        onClose={onCloseBatchKillModal}
        onConfirm={onBatchKill}
        availableZones={availableZones}
      />
    )}
  </>
);

export default ProcessActionModals;
