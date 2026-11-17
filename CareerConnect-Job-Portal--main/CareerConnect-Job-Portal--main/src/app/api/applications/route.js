import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, readJson, jsonError, serverError } from "@/lib/api";
import {
  cleanString,
  isValidHttpUrl,
  optionalString,
} from "@/lib/validation";

export async function POST(request) {
  try {
    const { session, response } = await requireSession("CANDIDATE");

    if (response) {
      return response;
    }

    const body = await readJson(request);

    if (!body) {
      return jsonError("Invalid request body.");
    }

    const jobId = cleanString(body.jobId, { max: 40 });

    if (!jobId) {
      return jsonError("A valid job ID is required.");
    }

    const coverLetter = optionalString(body.coverLetter, { max: 2000 });
    const resumeUrl = optionalString(body.resumeUrl, { max: 500 });

    if (coverLetter === undefined) {
      return jsonError("Cover letter must be 2000 characters or fewer.");
    }

    if (resumeUrl === undefined) {
      return jsonError("Resume link is too long.");
    }

    if (resumeUrl && !isValidHttpUrl(resumeUrl)) {
      return jsonError("Resume link must be a valid http(s) URL.");
    }

    const job = await prisma.job.findFirst({
      where: { id: jobId, isActive: true },
      select: { id: true },
    });

    if (!job) {
      return jsonError("This job is unavailable.", 404);
    }

    const existingApplication = await prisma.application.findUnique({
      where: {
        candidateId_jobId: { candidateId: session.userId, jobId },
      },
      select: { id: true },
    });

    if (existingApplication) {
      return jsonError("You have already applied for this job.", 409);
    }

    const application = await prisma.application.create({
      data: {
        candidateId: session.userId,
        jobId,
        coverLetter,
        resumeUrl,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        jobId: true,
      },
    });

    return NextResponse.json(
      {
        message: "Your application was submitted successfully!",
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error?.code === "P2002") {
      return jsonError("You have already applied for this job.", 409);
    }

    console.error("Job application error:", error);
    return serverError("Unable to submit your application. Please try again.");
  }
}
