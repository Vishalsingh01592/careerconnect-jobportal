import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, readJson, jsonError, serverError } from "@/lib/api";

const ALLOWED_STATUSES = [
  "PENDING",
  "REVIEWED",
  "SHORTLISTED",
  "REJECTED",
  "ACCEPTED",
];

export async function PATCH(request, { params }) {
  try {
    const { session, response } = await requireSession("RECRUITER");

    if (response) {
      return response;
    }

    const { id } = await params;

    if (typeof id !== "string" || id.length === 0 || id.length > 40) {
      return jsonError("Invalid application ID.");
    }

    const body = await readJson(request);

    if (!body || !ALLOWED_STATUSES.includes(body.status)) {
      return jsonError("Invalid application status.");
    }

    const application = await prisma.application.findUnique({
      where: { id },
      select: { id: true, job: { select: { recruiterId: true } } },
    });

    if (!application) {
      return jsonError("Application not found.", 404);
    }

    if (application.job.recruiterId !== session.userId) {
      return jsonError("You cannot update this application.", 403);
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status: body.status },
    });

    return NextResponse.json({
      message: "Application status updated successfully.",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Application status update error:", error);
    return serverError("Unable to update application status.");
  }
}
