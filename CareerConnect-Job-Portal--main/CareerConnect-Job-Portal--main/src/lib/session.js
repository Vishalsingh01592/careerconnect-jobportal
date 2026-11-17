import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "careerconnect_session";

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * The secret is read lazily so importing this module never crashes a build
 * when the environment file is missing. The error surfaces at request time
 * with a clear message instead.
 */
function getSecretKey() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Add it to your .env file (see .env.example)."
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(user) {
  return await new SignJWT({
    userId: user.id,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySession(token) {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload?.userId ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Read and verify the session cookie for the current request.
 * Returns the JWT payload ({ userId, role, iat, exp }) or null.
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return verifySession(token);
}

export async function setSessionCookie(token) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
