import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/session";
import { jsonError, readJson, serverError } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";

export async function POST(request) {
  try {
    const body = await readJson(request);

    if (!body) {
      return jsonError("Invalid request body.");
    }

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
    const password = body.password;

    if (!isValidEmail(email) || typeof password !== "string" || !password) {
      return jsonError("Email and password are required.");
    }

    const limit = rateLimit(`login:${clientIp(request)}:${email}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!limit.allowed) {
      return jsonError(
        `Too many login attempts. Please try again in ${limit.retryAfter} seconds.`,
        429
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return jsonError("Invalid email or password.", 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return jsonError("Invalid email or password.", 401);
    }

    const token = await createSession(user);
    await setSessionCookie(token);

    return NextResponse.json({
      message: "Login successful!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return serverError("Unable to log in. Please try again.");
  }
}
