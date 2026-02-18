const getSeverityTagClass = (severity) => {
  const level = severity?.toLowerCase();
  if (level === "critical") {
    return "is-danger";
  }
  if (level === "major") {
    return "is-warning";
  }
  if (level === "minor") {
    return "is-info";
  }
  return "is-light";
};

export { getSeverityTagClass };
