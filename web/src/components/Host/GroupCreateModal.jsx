import React, { useState } from "react";

import { useServers } from "../../contexts/ServerContext";
import FormModal from "../common/FormModal";

const GroupCreateModal = ({ server, onClose, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    groupname: "",
    gid: "",
  });

  const { makeZoneweaverAPIRequest } = useServers();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.groupname.trim()) {
      onError("Group name is required");
      return;
    }

    try {
      setLoading(true);
      onError("");

      const payload = {
        groupname: formData.groupname.trim(),
      };

      if (formData.gid) {
        payload.gid = parseInt(formData.gid);
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/groups",
        "POST",
        payload
      );

      if (result.success) {
        // Poll task if task_id is returned
        if (result.data?.task_id) {
          await pollTask(result.data.task_id);
        }
        onSuccess();
      } else {
        onError(result.message || "Failed to create group");
      }
    } catch (err) {
      onError(`Error creating group: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pollTask = async (taskId) => {
    const maxPolls = 30;
    let polls = 0;

    while (polls < maxPolls) {
      try {
        const taskResult = await makeZoneweaverAPIRequest(
          server.hostname,
          server.port,
          server.protocol,
          `tasks/${taskId}`,
          "GET"
        );

        if (taskResult.success) {
          const status = taskResult.data?.status;
          if (status === "completed" || status === "failed") {
            if (status === "failed" && taskResult.data?.error_message) {
              onError(taskResult.data.error_message);
            }
            break;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        polls++;
      } catch (err) {
        console.error("Error polling task:", err);
        break;
      }
    }
  };

  return (
    <FormModal
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Create Group"
      icon="fas fa-users-plus"
      submitText="Create Group"
      submitIcon="fas fa-plus"
      loading={loading}
      showCancelButton
      aria-label="Create new group"
    >
      <div className="field">
        <label className="label">
          Group Name <span className="has-text-danger">*</span>
        </label>
        <div className="control">
          <input
            className="input"
            type="text"
            value={formData.groupname}
            onChange={(e) => handleInputChange("groupname", e.target.value)}
            required
            disabled={loading}
            placeholder="Enter group name"
          />
        </div>
        <p className="help">
          Group name must be unique and contain only valid characters
        </p>
      </div>

      <div className="field">
        <label className="label">Group ID (GID)</label>
        <div className="control">
          <input
            className="input"
            type="number"
            value={formData.gid}
            onChange={(e) => handleInputChange("gid", e.target.value)}
            disabled={loading}
            placeholder="Auto-assign if empty"
            min="100"
          />
        </div>
        <p className="help">
          Leave empty to auto-assign. System groups use GID &lt; 100
        </p>
      </div>

      <div className="notification is-info">
        <p>
          <strong>Note:</strong> Group members can be managed after creation
          through user management or by editing individual user accounts.
        </p>
      </div>
    </FormModal>
  );
};

export default GroupCreateModal;
