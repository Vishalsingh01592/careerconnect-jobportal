export const JOB_TYPE_LABELS = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  REMOTE: "Remote",
};

export const APPLICATION_STATUSES = [
  "PENDING",
  "REVIEWED",
  "SHORTLISTED",
  "REJECTED",
  "ACCEPTED",
];

const STATUS_LABELS = {
  PENDING: "Pending",
  REVIEWED: "Reviewed",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  ACCEPTED: "Accepted",
};

export function formatJobType(type) {
  if (!type) {
    return "";
  }

  return JOB_TYPE_LABELS[type] || String(type).replaceAll("_", " ");
}

export function formatStatus(status) {
  if (!status) {
    return "";
  }

  return STATUS_LABELS[status] || String(status).replaceAll("_", " ");
}
