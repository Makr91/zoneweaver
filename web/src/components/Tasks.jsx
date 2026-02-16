import React, { useRef, useEffect, useContext, memo, useState } from "react";

import { useFooter } from "../contexts/FooterContext";
import { UserSettings } from "../contexts/UserSettingsContext";
import TaskDetailModal from "./TaskDetailModal";

const renderPriority = (task) => {
  const p = task.priority;
  if (p >= 100) return <span className="has-text-danger">CRITICAL</span>;
  if (p >= 80) return <span className="has-text-warning">HIGH</span>;
  if (p >= 60) return <span>MEDIUM</span>;
  if (p >= 50) return <span>SERVICE</span>;
  if (p >= 40) return <span className="has-text-grey">LOW</span>;
  return <span className="has-text-grey-light">BG</span>;
};

const renderStatus = (task) => {
  if (task.status === "running") {
    return (
      <span>
        <i className="fas fa-spinner fa-spin mr-1" />
        {task.status}
      </span>
    );
  }
  return task.status;
};

const renderProgress = (task) => {
  const { status, progress_percent } = task;

  if (["completed", "prepared", "pending"].includes(status)) {
    return "-";
  }

  if (status === "running") {
    if (progress_percent !== null && progress_percent !== undefined) {
      return (
        <div className="level mb-0">
          <progress
            className="level-item progress is-width-unset is-small is-primary mb-0"
            value={progress_percent}
            max="100"
          >
            {progress_percent}%
          </progress>
          <span className="level-item is-size-7">{progress_percent}%</span>
        </div>
      );
    }
    return "running";
  }

  if (progress_percent !== null && progress_percent !== undefined) {
    return `${progress_percent}%`;
  }

  return "-";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
};

const truncate = (str, max = 40) => {
  if (!str) return "-";
  return str.length > max ? `${str.substring(0, max)}...` : str;
};

export const TASK_COLUMNS = [
  { key: "id", label: "ID", render: (task) => task.id },
  { key: "operation", label: "Operation", render: (task) => task.operation },
  { key: "zone_name", label: "Target", render: (task) => task.zone_name },
  { key: "status", label: "Status", render: renderStatus },
  { key: "progress", label: "Progress", render: renderProgress },
  { key: "priority", label: "Priority", render: renderPriority },
  { key: "created_by", label: "Created By", render: (task) => task.created_by || "-" },
  { key: "created_at", label: "Created", render: (task) => formatDate(task.created_at) },
  { key: "started_at", label: "Started", render: (task) => formatDate(task.started_at) },
  { key: "completed_at", label: "Completed", render: (task) => formatDate(task.completed_at) },
  { key: "error_message", label: "Error", render: (task) => truncate(task.error_message) },
];

const getStatusClass = (status) => {
  switch (status) {
    case "failed":
      return "task-failed";
    case "running":
      return "task-running";
    default:
      return "";
  }
};

const TaskRow = memo(({ task, visibleColumns, onSelect }) => (
  <tr
    className={getStatusClass(task.status)}
    onClick={() => onSelect(task)}
    style={{ cursor: "pointer" }}
  >
    {visibleColumns.map((col) => (
      <td key={col.key}>{col.render(task)}</td>
    ))}
  </tr>
));

const Tasks = () => {
  const { tasks, loadingTasks, tasksError } = useFooter();
  const { tasksScrollPosition, setTasksScrollPosition, taskVisibleColumns } =
    useContext(UserSettings);
  const tableContainerRef = useRef(null);
  const [previousTasksLength, setPreviousTasksLength] = useState(0);
  const [isScrollRestored, setIsScrollRestored] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const visibleColumns = TASK_COLUMNS.filter((col) =>
    taskVisibleColumns.includes(col.key)
  );

  // Only restore scroll position on initial load or server change
  useEffect(() => {
    if (tableContainerRef.current && !isScrollRestored && tasks.length > 0) {
      tableContainerRef.current.scrollTop = tasksScrollPosition;
      setIsScrollRestored(true);
    }
  }, [tasks.length, tasksScrollPosition, isScrollRestored]);

  // Adjust scroll position when new tasks are added to maintain user's view
  useEffect(() => {
    if (
      tableContainerRef.current &&
      isScrollRestored &&
      tasks.length > previousTasksLength
    ) {
      const newTasksCount = tasks.length - previousTasksLength;
      const rowHeight = 40;
      const addedHeight = newTasksCount * rowHeight;

      if (tableContainerRef.current.scrollTop > 0) {
        tableContainerRef.current.scrollTop += addedHeight;
      }
    }
    setPreviousTasksLength(tasks.length);
  }, [tasks.length, previousTasksLength, isScrollRestored]);

  // Reset scroll restoration flag when tasks are cleared (server change)
  useEffect(() => {
    if (tasks.length === 0) {
      setIsScrollRestored(false);
      setPreviousTasksLength(0);
    }
  }, [tasks.length]);

  const handleScroll = () => {
    if (tableContainerRef.current && isScrollRestored) {
      setTasksScrollPosition(tableContainerRef.current.scrollTop);
    }
  };

  return (
    <>
      <div
        onScroll={handleScroll}
        ref={tableContainerRef}
        className="has-overflow-y-scroll"
      >
        {loadingTasks && <p>Loading tasks...</p>}
        {tasksError && <p className="has-text-danger">{tasksError}</p>}
        {!loadingTasks && !tasksError && (
          <table className="table is-fullwidth is-striped">
            <thead>
              <tr>
                {visibleColumns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  visibleColumns={visibleColumns}
                  onSelect={setSelectedTask}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
};

export default memo(Tasks);
