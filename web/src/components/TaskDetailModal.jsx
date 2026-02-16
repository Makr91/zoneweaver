import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";

import ContentModal from "./common/ContentModal";
import { useServers } from "../contexts/ServerContext";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
};

const renderPriorityBadge = (priority) => {
  if (priority >= 100) return <span className="tag is-danger">CRITICAL</span>;
  if (priority >= 80) return <span className="tag is-warning">HIGH</span>;
  if (priority >= 60) return <span className="tag is-info">MEDIUM</span>;
  if (priority >= 50) return <span className="tag is-link">SERVICE</span>;
  if (priority >= 40) return <span className="tag is-light">LOW</span>;
  return <span className="tag is-light">BACKGROUND</span>;
};

const renderStatusBadge = (status) => {
  const classMap = {
    completed: "is-success",
    failed: "is-danger",
    running: "is-warning",
    pending: "is-light",
    cancelled: "is-dark",
  };
  return <span className={`tag ${classMap[status] || "is-light"}`}>{status}</span>;
};

const InfoRow = ({ label, children }) => (
  <div className="columns is-mobile mb-1">
    <div className="column is-4 has-text-grey">{label}</div>
    <div className="column">{children}</div>
  </div>
);

InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const SubtaskRow = ({ task, onSelect }) => (
  <tr
    onClick={() => onSelect(task)}
    style={{ cursor: "pointer" }}
  >
    <td>{task.operation}</td>
    <td>{task.zone_name}</td>
    <td>{renderStatusBadge(task.status)}</td>
    <td>
      {task.progress_percent !== null && task.progress_percent !== undefined
        ? `${task.progress_percent}%`
        : "-"}
    </td>
  </tr>
);

SubtaskRow.propTypes = {
  task: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
};

const TaskDetailModal = ({ task, onClose }) => {
  const { currentServer, makeZoneweaverAPIRequest } = useServers();
  const [output, setOutput] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [childTask, setChildTask] = useState(null);
  const outputRef = useRef(null);
  const wsRef = useRef(null);

  // Fetch subtasks if this is a parent task
  useEffect(() => {
    if (!task.parent_task_id && currentServer && makeZoneweaverAPIRequest) {
      makeZoneweaverAPIRequest(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        "tasks",
        "GET",
        null,
        { parent_task_id: task.id, limit: 100 }
      ).then((result) => {
        if (result.success && result.data?.tasks) {
          setSubtasks(result.data.tasks);
        }
      });
    }
  }, [task.id, task.parent_task_id, currentServer, makeZoneweaverAPIRequest]);

  // Connect to WebSocket for task output
  useEffect(() => {
    if (!currentServer) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/servers/${currentServer.hostname}:${currentServer.port}/tasks/${task.id}/stream`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "output") {
        setOutput((prev) => [...prev, msg]);
      }
    };

    ws.onerror = (err) => {
      console.error("Task stream WebSocket error:", err);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [task.id, currentServer]);

  // Auto-scroll output to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleSubtaskSelect = useCallback((subtask) => {
    setChildTask(subtask);
  }, []);

  const parseMetadata = (metadata) => {
    if (!metadata) return null;
    try {
      return JSON.parse(metadata);
    } catch {
      return metadata;
    }
  };

  const parsedMetadata = parseMetadata(task.metadata);

  return (
    <>
      <ContentModal
        isOpen={true}
        onClose={onClose}
        title={`Task: ${task.operation}`}
        icon="fas fa-tasks"
        className="is-large"
      >
        {/* Task Info */}
        <div className="box">
          <h6 className="title is-6">Details</h6>
          <InfoRow label="ID">{task.id}</InfoRow>
          <InfoRow label="Operation">{task.operation}</InfoRow>
          <InfoRow label="Target">{task.zone_name}</InfoRow>
          <InfoRow label="Status">{renderStatusBadge(task.status)}</InfoRow>
          <InfoRow label="Priority">{renderPriorityBadge(task.priority)}</InfoRow>
          <InfoRow label="Created By">{task.created_by || "-"}</InfoRow>
          <InfoRow label="Created">{formatDate(task.created_at)}</InfoRow>
          <InfoRow label="Started">{formatDate(task.started_at)}</InfoRow>
          <InfoRow label="Completed">{formatDate(task.completed_at)}</InfoRow>
          {task.error_message && (
            <InfoRow label="Error">
              <span className="has-text-danger">{task.error_message}</span>
            </InfoRow>
          )}
          {task.depends_on && (
            <InfoRow label="Depends On">{task.depends_on}</InfoRow>
          )}
          {task.parent_task_id && (
            <InfoRow label="Parent Task">{task.parent_task_id}</InfoRow>
          )}
        </div>

        {/* Progress */}
        {task.progress_percent > 0 && (
          <div className="box">
            <h6 className="title is-6">Progress</h6>
            <progress
              className="progress is-primary"
              value={task.progress_percent}
              max="100"
            >
              {task.progress_percent}%
            </progress>
            <p className="has-text-centered">{task.progress_percent}%</p>
            {task.progress_info && (
              <pre className="is-size-7 mt-2">
                {JSON.stringify(task.progress_info, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Metadata */}
        {parsedMetadata && (
          <div className="box">
            <h6 className="title is-6">Metadata</h6>
            <pre className="is-size-7" style={{ maxHeight: "200px", overflow: "auto" }}>
              {typeof parsedMetadata === "string"
                ? parsedMetadata
                : JSON.stringify(parsedMetadata, null, 2)}
            </pre>
          </div>
        )}

        {/* Task Output */}
        <div className="box">
          <h6 className="title is-6">
            Output
            {task.status === "running" && (
              <span className="ml-2">
                <i className="fas fa-spinner fa-spin is-size-7" />
              </span>
            )}
          </h6>
          <div
            ref={outputRef}
            style={{
              maxHeight: "300px",
              overflow: "auto",
              backgroundColor: "#1a1a2e",
              borderRadius: "4px",
              padding: "8px",
              fontFamily: "monospace",
              fontSize: "12px",
            }}
          >
            {output.length === 0 && (
              <span className="has-text-grey-light">No output available</span>
            )}
            {output.map((entry, idx) => (
              <div
                key={idx}
                className={entry.stream === "stderr" ? "has-text-danger" : "has-text-white"}
              >
                {entry.data}
              </div>
            ))}
          </div>
        </div>

        {/* Subtasks */}
        {subtasks.length > 0 && (
          <div className="box">
            <h6 className="title is-6">Subtasks ({subtasks.length})</h6>
            <table className="table is-fullwidth is-striped is-narrow">
              <thead>
                <tr>
                  <th>Operation</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {subtasks.map((st) => (
                  <SubtaskRow
                    key={st.id}
                    task={st}
                    onSelect={handleSubtaskSelect}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentModal>

      {/* Child task detail modal (recursive) */}
      {childTask && (
        <TaskDetailModal
          task={childTask}
          onClose={() => setChildTask(null)}
        />
      )}
    </>
  );
};

TaskDetailModal.propTypes = {
  task: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TaskDetailModal;
