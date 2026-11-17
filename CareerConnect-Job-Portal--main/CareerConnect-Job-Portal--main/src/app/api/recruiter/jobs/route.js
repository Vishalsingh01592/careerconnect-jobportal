import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, readJson, jsonError, serverError } from "@/lib/api";
import { cleanString, optionalString } from "@/lib/validation";

const JOB_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "REMOTE",
];

/** List every job posted by the logged-in recruiter. */
export async function GET() {
  const { session, response } = await requireSession("RECRUITER");

  if (response) {
    return response;
  }

  try {
    const jobs = await prisma.job.findMany({
      where: { recruiterId: session.userId },
      select: {
        id: true,
        title: true,
        location: true,
        type: true,
        salary: true,
        isActive: true,
        createdAt: true,
        company: { select: { name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Recruiter jobs error:", error);
    return serverError("Unable to load your jobs.");
  }
}

export async function POST(request) {
  try {
    const { session, response } = await requireSession("RECRUITER");

    if (response) {
      return response;
    }

    const body = await readJson(request);

    if (!body) {
      return jsonError("Invalid request body.");
    }

    const title = cleanString(body.title, { min: 3, max: 120 });
    const description = cleanString(body.description, { min: 10, max: 5000 });
    const location = cleanString(body.location, { min: 2, max: 120 });
    const type = body.type;
    const salary = optionalString(body.salary, { max: 80 });

    if (!title || !description || !location) {
      return jsonError(
        "Please provide a title (3+ chars), description (10+ chars), and location."
      );
    }

    if (!JOB_TYPES.includes(type)) {
      return jsonError("Please select a valid employment type.");
    }

    if (salary === undefined) {
      return jsonError("Salary must be 80 characters or fewer.");
    }

    const company = await prisma.company.findUnique({
      where: { recruiterId: session.userId },
      select: { id: true },
    });

    // The company always comes from the recruiter's own profile, so it can
    // never be spoofed through the request body.
    if (!company) {
      return jsonError(
        "Please create your company profile before posting a job.",
        409
      );
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        type,
        salary,
        isActive: true,
        recruiterId: session.userId,
        companyId: company.id,
      },
    });

    return NextResponse.json(
      { message: "Job posted successfully!", job },
      { status: 201 }
    );
  } catch (error) {
    console.error("Recruiter job creation error:", error);
    return serverError("Unable to post the job. Please try again.");
  }
}
