import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export function jsonError(message, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function unauthorized(message = "Please log in to continue.") {
  return jsonError(message, 401);
}

export function forbidden(message = "You do not have permission to do that.") {
  return jsonError(message, 403);
}

export function serverError(message = "Something went wrong. Please try again.") {
  return jsonError(message, 500);
}

/**
 * Verifies the session cookie and (optionally) the user's role.
 *
 *   const { session, response } = await requireSession("RECRUITER");
 *   if (response) return response;
 */
export async function requireSession(...allowedRoles) {
  let session;

  try {
    session = await getSession();
  } catch (error) {
    console.error("Session verification error:", error);
    return { response: serverError("Unable to verify your session.") };
  }

  if (!session) {
    return {
      response: unauthorized("Please log in before continuing."),
    };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    return { response: forbidden() };
  }

  return { session };
}

/**
 * Safely parse a JSON request body. Returns null when the body is missing
 * or is not a JSON object, so routes can answer with 400 instead of 500.
 */
export async function readJson(request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }

    return body;
  } catch {
    return null;
  }
}
