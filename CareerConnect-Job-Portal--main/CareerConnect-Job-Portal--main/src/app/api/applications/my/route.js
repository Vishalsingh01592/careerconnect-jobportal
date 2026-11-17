import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serverError } from "@/lib/api";

export async function GET() {
  const { session, response } = await requireSession("CANDIDATE");

  if (response) {
    return response;
  }

  try {
    const applications = await prisma.application.findMany({
      where: { candidateId: session.userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            type: true,
            isActive: true,
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Fetch applications error:", error);
    return serverError("Unable to load your applications.");
  }
}
