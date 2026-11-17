import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, readJson, jsonError, serverError } from "@/lib/api";
import { cleanString, optionalString, isValidHttpUrl } from "@/lib/validation";

async function loadCompany(recruiterId) {
  return prisma.company.findUnique({ where: { recruiterId } });
}

export async function GET() {
  const { session, response } = await requireSession("RECRUITER");

  if (response) {
    return response;
  }

  try {
    const company = await loadCompany(session.userId);
    return NextResponse.json({ company });
  } catch (error) {
    console.error("Load company error:", error);
    return serverError("Unable to load your company profile.");
  }
}

/** Create or update the company attached to the logged-in recruiter. */
export async function PUT(request) {
  try {
    const { session, response } = await requireSession("RECRUITER");

    if (response) {
      return response;
    }

    const body = await readJson(request);

    if (!body) {
      return jsonError("Invalid request body.");
    }

    const name = cleanString(body.name, { min: 2, max: 120 });
    const description = optionalString(body.description, { max: 2000 });
    const location = optionalString(body.location, { max: 120 });
    const website = optionalString(body.website, { max: 300 });

    if (!name) {
      return jsonError("Please enter a company name (2-120 characters).");
    }

    if (description === undefined) {
      return jsonError("Description must be 2000 characters or fewer.");
    }

    if (location === undefined) {
      return jsonError("Location must be 120 characters or fewer.");
    }

    if (website === undefined) {
      return jsonError("Website must be 300 characters or fewer.");
    }

    if (website && !isValidHttpUrl(website)) {
      return jsonError("Website must start with http:// or https://.");
    }

    const existing = await loadCompany(session.userId);

    const company = existing
      ? await prisma.company.update({
          where: { recruiterId: session.userId },
          data: { name, description, location, website },
        })
      : await prisma.company.create({
          data: {
            name,
            description,
            location,
            website,
            recruiterId: session.userId,
          },
        });

    return NextResponse.json(
      {
        message: existing
          ? "Company profile updated."
          : "Company profile created.",
        company,
      },
      { status: existing ? 200 : 201 }
    );
  } catch (error) {
    if (error?.code === "P2002") {
      return jsonError("A company is already linked to this account.", 409);
    }

    console.error("Save company error:", error);
    return serverError("Unable to save your company profile.");
  }
}
