import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, readJson, jsonError, serverError } from "@/lib/api";

/** Open or close one of the recruiter's own job postings. */
export async function PATCH(request, { params }) {
  try {
    const { session, response } = await requireSession("RECRUITER");

    if (response) {
      return response;
    }

    const { id } = await params;

    if (typeof id !== "string" || id.length === 0 || id.length > 40) {
      return jsonError("Invalid job ID.");
    }

    const body = await readJson(request);

    if (!body || typeof body.isActive !== "boolean") {
      return jsonError("A boolean `isActive` value is required.");
    }

    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true, recruiterId: true },
    });

    if (!job) {
      return jsonError("Job not found.", 404);
    }

    if (job.recruiterId !== session.userId) {
      return jsonError("You cannot update this job.", 403);
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: { isActive: body.isActive },
      select: { id: true, isActive: true },
    });

    return NextResponse.json({
      message: updatedJob.isActive
        ? "Job is now visible to candidates."
        : "Job has been closed.",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Update job error:", error);
    return serverError("Unable to update this job.");
  }
}
