import PropTypes from "prop-types";
import { useState } from "react";

import { FormModal } from "../common";

const ConfirmActionModal = ({
  bootEnvironment,
  action,
  onClose,
  onConfirm,
}) => {
  const [options, setOptions] = useState({
    temporary: false,
    force: true,
    snapshots: false,
    mountpoint: `/mnt/${bootEnvironment.name}`,
    sharedMode: "ro",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await onConfirm(bootEnvironment.name, action, options);
      if (result.success) {
        onClose();
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (field, value) => {
    setOptions((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getActionDetails = () => {
    switch (action) {
      case "activate":
        return {
          title: "Activate Boot Environment",
          icon: "fa-power-off",
          buttonClass: "has-background-success-dark has-text-success-light",
          description: `Activate boot environment "${bootEnvironment.name}" for next reboot.`,
          warning:
            "The system will boot from this environment on next restart.",
        };
      case "mount":
        return {
          title: "Mount Boot Environment",
          icon: "fa-folder-open",
          buttonClass: "has-background-info-dark has-text-info-light",
          description: `Mount boot environment "${bootEnvironment.name}" to access its filesystem.`,
          warning:
            "This will make the boot environment filesystem accessible for inspection or modification.",
        };
      case "unmount":
        return {
          title: "Unmount Boot Environment",
          icon: "fa-folder",
          buttonClass: "has-background-warning-dark has-text-warning-light",
          description: `Unmount boot environment "${bootEnvironment.name}".`,
          warning: "This will disconnect the boot environment filesystem.",
        };
      case "delete":
        return {
          title: "Delete Boot Environment",
          icon: "fa-trash",
          buttonClass: "has-background-danger-dark has-text-danger-light",
          description: `Permanently delete boot environment "${bootEnvironment.name}".`,
          warning:
            "This action cannot be undone. All data in this boot environment will be lost.",
        };
      default:
        return {
          title: "Boot Environment Action",
          icon: "fa-layer-group",
          buttonClass: "is-info",
          description: `Perform ${action} on boot environment "${bootEnvironment.name}".`,
          warning: "Please confirm this action.",
        };
    }
  };

  const actionDetails = getActionDetails();

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title={actionDetails.title}
      icon={`fas ${actionDetails.icon}`}
      submitText={loading ? "Processing..." : actionDetails.title}
      submitVariant={
        actionDetails.buttonClass.includes("danger")
          ? "is-danger"
          : actionDetails.buttonClass.includes("warning")
            ? "is-warning"
            : actionDetails.buttonClass.includes("success")
              ? "is-success"
              : "is-info"
      }
      loading={loading}
    >
      {/* Boot Environment Information */}
      <div className="box mb-4">
        <h3 className="title is-6">Boot Environment Information</h3>
        <div className="table-container">
          <table className="table is-fullwidth">
            <tbody>
              <tr>
                <td>
                  <strong>Name</strong>
                </td>
                <td className="is-family-monospace">{bootEnvironment.name}</td>
              </tr>
              <tr>
                <td>
                  <strong>Active Status</strong>
                </td>
                <td>
                  {bootEnvironment.is_active_now &&
                    bootEnvironment.is_active_on_reboot && (
                      <span className="tag is-success is-small">
                        Active Now + Reboot
                      </span>
                    )}
                  {bootEnvironment.is_active_now &&
                    !bootEnvironment.is_active_on_reboot && (
                      <span className="tag is-success is-small">
                        Active Now
                      </span>
                    )}
                  {!bootEnvironment.is_active_now &&
                    bootEnvironment.is_active_on_reboot && (
                      <span className="tag is-info is-small">
                        Active on Reboot
                      </span>
                    )}
                  {!bootEnvironment.is_active_now &&
                    !bootEnvironment.is_active_on_reboot && (
                      <span className="tag is-grey is-small">Inactive</span>
                    )}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Mountpoint</strong>
                </td>
                <td className="is-family-monospace">
                  {bootEnvironment.mountpoint === "-"
                    ? "Not Mounted"
                    : bootEnvironment.mountpoint}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Space Used</strong>
                </td>
                <td>{bootEnvironment.space || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Description */}
      <div
        className={`notification ${action === "delete" ? "is-danger" : "is-info"}`}
      >
        <p>
          <strong>Action:</strong> {actionDetails.description}
        </p>
        <p className="mt-2">{actionDetails.warning}</p>
      </div>

      {/* Action-specific Options */}
      {action === "activate" && (
        <div className="box">
          <h3 className="title is-6">Activation Options</h3>

          <div className="field">
            <div className="control">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={options.temporary}
                  onChange={(e) =>
                    handleOptionChange("temporary", e.target.checked)
                  }
                />
                <span className="ml-2">
                  <strong>Temporary Activation</strong> - Only activate for one
                  boot cycle
                </span>
              </label>
            </div>
            <p className="help">
              If checked, the system will revert to the previous BE after the
              next reboot.
            </p>
          </div>
        </div>
      )}

      {action === "mount" && (
        <div className="box">
          <h3 className="title is-6">Mount Options</h3>

          <div className="field">
            <label className="label" htmlFor="mountpoint-input">
              Mountpoint
            </label>
            <div className="control">
              <input
                id="mountpoint-input"
                className="input"
                type="text"
                value={options.mountpoint}
                onChange={(e) =>
                  handleOptionChange("mountpoint", e.target.value)
                }
              />
            </div>
            <p className="help">
              Directory where the boot environment will be mounted
            </p>
          </div>

          <div className="field">
            <label className="label" htmlFor="shared-mode-select">
              Shared Mode
            </label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  id="shared-mode-select"
                  value={options.sharedMode}
                  onChange={(e) =>
                    handleOptionChange("sharedMode", e.target.value)
                  }
                >
                  <option value="ro">Read-Only</option>
                  <option value="rw">Read-Write</option>
                </select>
              </div>
            </div>
            <p className="help">Mount access mode</p>
          </div>
        </div>
      )}

      {action === "unmount" && (
        <div className="box">
          <h3 className="title is-6">Unmount Options</h3>

          <div className="field">
            <div className="control">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={options.force}
                  onChange={(e) =>
                    handleOptionChange("force", e.target.checked)
                  }
                />
                <span className="ml-2">
                  <strong>Force Unmount</strong> - Force unmount even if busy
                </span>
              </label>
            </div>
            <p className="help">
              Use this if the normal unmount fails due to busy files.
            </p>
          </div>
        </div>
      )}

      {action === "delete" && (
        <div className="box">
          <h3 className="title is-6">Delete Options</h3>

          <div className="field">
            <div className="control">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={options.force}
                  onChange={(e) =>
                    handleOptionChange("force", e.target.checked)
                  }
                />
                <span className="ml-2">
                  <strong>Force Delete</strong> - Required for non-interactive
                  deletion (recommended)
                </span>
              </label>
            </div>
          </div>

          <div className="field">
            <div className="control">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={options.snapshots}
                  onChange={(e) =>
                    handleOptionChange("snapshots", e.target.checked)
                  }
                />
                <span className="ml-2">
                  <strong>Delete Snapshots</strong> - Also delete all associated
                  snapshots
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </FormModal>
  );
};

ConfirmActionModal.propTypes = {
  bootEnvironment: PropTypes.shape({
    name: PropTypes.string.isRequired,
    is_active_now: PropTypes.bool,
    is_active_on_reboot: PropTypes.bool,
    mountpoint: PropTypes.string,
    space: PropTypes.string,
  }).isRequired,
  action: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default ConfirmActionModal;
