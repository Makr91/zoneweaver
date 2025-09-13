import React, { useRef, useEffect, useContext, memo, useState } from "react";

import { useFooter } from "../contexts/FooterContext";
import { UserSettings } from "../contexts/UserSettingsContext";

const TaskRow = memo(({ task }) => {
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

  const renderStatus = (status) => {
    if (status === "running") {
      return (
        <span>
          <i className="fas fa-spinner fa-spin mr-1" />
          {status}
        </span>
      );
    }
    return status;
  };

  const renderProgress = (task) => {
    const { status, progress_percent } = task;
    
    // Don't show progress for completed, prepared, or pending states
    if (["completed", "prepared", "pending"].includes(status)) {
      return "-";
    }
    
    // For running tasks, show progress percentage if available, otherwise just show "running"
    if (status === "running") {
      if (progress_percent !== null && progress_percent !== undefined) {
        return (
          <div className="progress-container">
            <progress className="progress is-small is-primary" value={progress_percent} max="100">
              {progress_percent}%
            </progress>
            <span className="is-size-7">{progress_percent}%</span>
          </div>
        );
      } else {
        return "running";
      }
    }
    
    // For other statuses, show progress percentage if available
    if (progress_percent !== null && progress_percent !== undefined) {
      return `${progress_percent}%`;
    }
    
    return "-";
  };

  return (
    <tr key={task.id} className={getStatusClass(task.status)}>
      <td>{task.id}</td>
      <td>{task.operation}</td>
      <td>{task.zone_name}</td>
      <td>{renderStatus(task.status)}</td>
      <td>{renderProgress(task)}</td>
      <td>{new Date(task.created_at).toLocaleString()}</td>
    </tr>
  );
});

const Tasks = () => {
  const { tasks, loadingTasks, tasksError } = useFooter();
  const { tasksScrollPosition, setTasksScrollPosition } =
    useContext(UserSettings);
  const tableContainerRef = useRef(null);
  const [previousTasksLength, setPreviousTasksLength] = useState(0);
  const [isScrollRestored, setIsScrollRestored] = useState(false);

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
      const rowHeight = 40; // Approximate height of a table row
      const addedHeight = newTasksCount * rowHeight;

      // Only adjust if user isn't at the very top
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
    <div
      onScroll={handleScroll}
      ref={tableContainerRef}
      className="has-height-100 has-overflow-y-auto"
    >
      {loadingTasks && <p>Loading tasks...</p>}
      {tasksError && <p className="has-text-danger">{tasksError}</p>}
      {!loadingTasks && !tasksError && (
        <table className="table is-fullwidth is-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Operation</th>
              <th>Zone</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default memo(Tasks);
