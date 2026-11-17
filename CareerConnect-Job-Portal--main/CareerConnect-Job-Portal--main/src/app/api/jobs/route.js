import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/api";
import { cleanString, parsePositiveInt } from "@/lib/validation";

const JOB_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "REMOTE",
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = cleanString(searchParams.get("search"), { max: 100 });
    const location = cleanString(searchParams.get("location"), { max: 100 });
    const rawType = cleanString(searchParams.get("type"), { max: 20 });
    const type = rawType && JOB_TYPES.includes(rawType) ? rawType : null;

    const page = parsePositiveInt(searchParams.get("page"), 1, {
      min: 1,
      max: 10_000,
    });
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), 9, {
      min: 1,
      max: 50,
    });

    const where = { isActive: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (type) {
      where.type = type;
    }

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          type: true,
          salary: true,
          createdAt: true,
          company: {
            select: {
              name: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      jobs,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("Fetch jobs error:", error);
    return serverError("Unable to fetch jobs.");
  }
}
