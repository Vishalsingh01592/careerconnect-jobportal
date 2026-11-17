import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serverError } from "@/lib/api";

export async function GET() {
  const { session, response } = await requireSession("RECRUITER");

  if (response) {
    return response;
  }

  try {
    const applications = await prisma.application.findMany({
      where: {
        job: { recruiterId: session.userId },
      },
      include: {
        candidate: {
          select: { name: true, email: true },
        },
        job: {
          select: {
            id: true,
            title: true,
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Recruiter applications error:", error);
    return serverError("Unable to load applications. Please try again.");
  }
}
