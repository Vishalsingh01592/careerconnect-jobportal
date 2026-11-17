const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Returns the trimmed string, or null when the value is not a string or is
 * outside the allowed length. Never throws on numbers/objects/arrays.
 */
export function cleanString(value, { min = 1, max = 200 } = {}) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length < min || trimmed.length > max) {
    return null;
  }

  return trimmed;
}

/**
 * Optional text field.
 * - undefined/null/"" -> null
 * - valid string -> trimmed string
 * - invalid type or too long -> undefined (caller should reject the request)
 */
export function optionalString(value, { max = 2000 } = {}) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > max) {
    return undefined;
  }

  return trimmed;
}

export function isValidEmail(value) {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    EMAIL_PATTERN.test(value)
  );
}

export function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parsePositiveInt(value, fallback, { min = 1, max = 100 } = {}) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}
