export const ROLES = {
  CANDIDATE: "CANDIDATE",
  RECRUITER: "RECRUITER",
  ADMIN: "ADMIN",
};

/** Where each role should land after signing in. */
export function homeForRole(role) {
  switch (role) {
    case ROLES.RECRUITER:
      return "/recruiter/jobs";
    case ROLES.ADMIN:
      return "/";
    default:
      return "/jobs";
  }
}

/**
 * Only allow relative, same-site redirect targets such as "/jobs?page=2".
 * Blocks open-redirect attempts like "//evil.com" or "https://evil.com".
 */
export function safeRedirectPath(value, fallback = "/") {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  return value;
}
