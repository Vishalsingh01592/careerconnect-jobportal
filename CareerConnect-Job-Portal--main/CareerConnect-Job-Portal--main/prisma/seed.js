require("dotenv/config");

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const COMPANY = {
  name: "TechNova Solutions",
  description: "A technology company building modern web applications.",
  location: "Jaipur, India",
  website: "https://technova.example.com",
};

const JOBS = [
  {
    title: "Frontend Developer Intern",
    description: "Learn frontend development and build responsive websites.",
    location: "Jaipur, India",
    type: "INTERNSHIP",
    salary: "₹10,000–₹15,000 per month",
  },
  {
    title: "JavaScript Developer",
    description: "Build interactive web applications using JavaScript.",
    location: "Remote",
    type: "FULL_TIME",
    salary: "₹4–6 LPA",
  },
  {
    title: "UI/UX Designer",
    description: "Design user-friendly interfaces and engaging digital experiences.",
    location: "Delhi, India",
    type: "FULL_TIME",
    salary: "₹3–5 LPA",
  },
  {
    title: "Backend Developer Intern",
    description: "Learn APIs, server-side development, and databases.",
    location: "Remote",
    type: "INTERNSHIP",
    salary: "₹10,000 per month",
  },
  {
    title: "Full Stack Developer",
    description: "Work on frontend and backend features for web applications.",
    location: "Jaipur, India",
    type: "FULL_TIME",
    salary: "₹5–8 LPA",
  },
  {
    title: "Graphic Designer",
    description: "Create graphics and visual assets for digital products.",
    location: "Remote",
    type: "PART_TIME",
    salary: "₹15,000 per month",
  },
];

async function findRecruiter() {
  const preferredEmail = process.env.SEED_RECRUITER_EMAIL?.trim().toLowerCase();

  if (preferredEmail) {
    const recruiter = await prisma.user.findUnique({
      where: { email: preferredEmail },
    });

    if (!recruiter) {
      throw new Error(
        `No account found for SEED_RECRUITER_EMAIL="${preferredEmail}". ` +
          "Register that account first, or leave the variable empty."
      );
    }

    if (recruiter.role !== "RECRUITER") {
      throw new Error(
        `The account "${preferredEmail}" is registered as ${recruiter.role}, not RECRUITER.`
      );
    }

    return recruiter;
  }

  const recruiter = await prisma.user.findFirst({
    where: { role: "RECRUITER" },
    orderBy: { createdAt: "asc" },
  });

  if (!recruiter) {
    throw new Error(
      "No recruiter account found. Register a recruiter account first " +
        "(/register -> Job Seeker / Recruiter), then re-run `npm run db:seed`."
    );
  }

  return recruiter;
}

async function main() {
  const recruiter = await findRecruiter();

  const company = await prisma.company.upsert({
    where: { recruiterId: recruiter.id },
    update: {
      name: COMPANY.name,
      description: COMPANY.description,
      location: COMPANY.location,
      website: COMPANY.website,
    },
    create: {
      ...COMPANY,
      recruiterId: recruiter.id,
    },
  });

  let created = 0;

  for (const job of JOBS) {
    const existingJob = await prisma.job.findFirst({
      where: {
        title: job.title,
        recruiterId: recruiter.id,
        companyId: company.id,
      },
      select: { id: true },
    });

    if (!existingJob) {
      await prisma.job.create({
        data: {
          ...job,
          isActive: true,
          recruiterId: recruiter.id,
          companyId: company.id,
        },
      });
      created += 1;
    }
  }

  console.log(
    `Seed complete for ${recruiter.email} (${company.name}). ` +
      `${created} new job(s) created, ${JOBS.length - created} already existed.`
  );
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
