import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { serverError } from "@/lib/api";

/**
 * Returns the signed-in user, or `{ user: null }` with status 200 when there is
 * no session. Answering 200 (instead of 401) keeps the public header probe out
 * of the browser console, and the payload is still unambiguous.
 */
export async function GET() {
  let session;

  try {
    session = await getSession();
  } catch (error) {
    console.error("Session verification error:", error);
    return serverError("Unable to verify your session.");
  }

  if (!session) {
    return NextResponse.json({ user: null });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ user: user ?? null });
  } catch (error) {
    console.error("Current user error:", error);
    return serverError("Unable to load your profile.");
  }
}
