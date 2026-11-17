import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, jsonError, serverError } from "@/lib/api";

/**
 * Withdraw (delete) one of the candidate's own applications.
 * This also lets a candidate apply again after being rejected.
 */
export async function DELETE(request, { params }) {
  try {
    const { session, response } = await requireSession("CANDIDATE");

    if (response) {
      return response;
    }

    const { id } = await params;

    if (typeof id !== "string" || id.length === 0 || id.length > 40) {
      return jsonError("Invalid application ID.");
    }

    const application = await prisma.application.findUnique({
      where: { id },
      select: { id: true, candidateId: true },
    });

    if (!application) {
      return jsonError("Application not found.", 404);
    }

    if (application.candidateId !== session.userId) {
      return jsonError("You cannot withdraw this application.", 403);
    }

    await prisma.application.delete({ where: { id } });

    return NextResponse.json({
      message: "Application withdrawn successfully.",
    });
  } catch (error) {
    console.error("Withdraw application error:", error);
    return serverError("Unable to withdraw this application.");
  }
}
