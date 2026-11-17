import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson, serverError } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { cleanString, isValidEmail } from "@/lib/validation";

export async function POST(request) {
  try {
    const limit = rateLimit(`register:${clientIp(request)}`, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return jsonError(
        `Too many sign-up attempts. Please try again in ${limit.retryAfter} seconds.`,
        429
      );
    }

    const body = await readJson(request);

    if (!body) {
      return jsonError("Invalid request body.");
    }

    const name = cleanString(body.name, { min: 2, max: 80 });
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : null;
    const password = body.password;
    const requestedRole = body.role;

    if (!name) {
      return jsonError("Please enter your full name (2-80 characters).");
    }

    if (!isValidEmail(email)) {
      return jsonError("Please enter a valid email address.");
    }

    if (typeof password !== "string" || password.length < 8) {
      return jsonError("Password must be at least 8 characters.");
    }

    if (password.length > 72) {
      return jsonError("Password must be 72 characters or fewer.");
    }

    const role = requestedRole === "recruiter" ? "RECRUITER" : requestedRole === "candidate" ? "CANDIDATE" : null;

    if (!role) {
      return jsonError("Please select a valid account type.");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return jsonError("An account with this email already exists.", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(
      { message: "Account created successfully.", user },
      { status: 201 }
    );
  } catch (error) {
    if (error?.code === "P2002") {
      return jsonError("An account with this email already exists.", 409);
    }

    console.error("Registration error:", error);
    return serverError("Unable to create account. Please try again.");
  }
}
