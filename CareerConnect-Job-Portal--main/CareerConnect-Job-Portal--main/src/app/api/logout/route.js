import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";
import { serverError } from "@/lib/api";

export async function POST() {
  try {
    await clearSessionCookie();

    return NextResponse.json({ message: "You have been logged out." });
  } catch (error) {
    console.error("Logout error:", error);
    return serverError("Unable to log out. Please try again.");
  }
}
