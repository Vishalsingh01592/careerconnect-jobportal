import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { prisma } from "@/lib/prisma";
import { formatJobType } from "@/lib/labels";

// The homepage shows live jobs, so it must not be prerendered at build time.
export const dynamic = "force-dynamic";

async function getFeaturedJobs() {
  try {
    return await prisma.job.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        location: true,
        type: true,
        salary: true,
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  } catch (error) {
    console.error("Unable to load featured jobs:", error);
    return [];
  }
}

export default async function Home() {
  const featuredJobs = await getFeaturedJobs();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      {/* Hero section */}
      <section className="bg-gradient-to-r from-indigo-100 to-blue-50 px-6 py-20 text-center">
        <p className="font-semibold text-indigo-600">
          YOUR NEXT OPPORTUNITY STARTS HERE
        </p>

        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold md:text-6xl">
          Find a job you <span className="text-indigo-600">love.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
          Discover exciting jobs, connect with great companies, and take the
          next step in your career.
        </p>

        <form
          action="/jobs"
          className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 rounded-xl bg-white p-4 shadow md:flex-row"
        >
          <label className="min-w-0 flex-1">
            <span className="sr-only">Job title or keyword</span>
            <input
              name="search"
              type="search"
              placeholder="Job title or keyword"
              className="w-full rounded-lg border p-3 outline-none focus:border-indigo-500"
            />
          </label>

          <label className="min-w-0 flex-1">
            <span className="sr-only">City or Remote</span>
            <input
              name="location"
              placeholder="City or Remote"
              className="w-full rounded-lg border p-3 outline-none focus:border-indigo-500"
            />
          </label>

          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Search Jobs
          </button>
        </form>
      </section>

      {/* Featured jobs */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">Featured Jobs</h2>

        <p className="mt-2 text-slate-600">
          The latest opportunities posted by recruiters on CareerConnect.
        </p>

        {featuredJobs.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            No jobs have been posted yet.{" "}
            <Link href="/jobs" className="font-semibold text-indigo-600 hover:underline">
              Browse all jobs
            </Link>
            .
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredJobs.map((job) => (
              <article
                key={job.id}
                className="flex flex-col rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-xl font-bold text-indigo-600">
                  {(job.company?.name || "C").charAt(0)}
                </div>

                <h3 className="mt-4 text-xl font-bold">{job.title}</h3>

                <p className="mt-2 text-indigo-600">
                  {job.company?.name || "Company"}
                </p>

                <p className="mt-4 text-sm text-slate-600">
                  {job.location || "Location not specified"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {job.type && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                      {formatJobType(job.type)}
                    </span>
                  )}

                  {job.salary && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                      {job.salary}
                    </span>
                  )}
                </div>

                <Link
                  href="/jobs"
                  className="mt-auto pt-5 font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  View details →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Call to action */}
      <section className="bg-indigo-600 px-6 py-14 text-center text-white">
        <h2 className="text-3xl font-bold">
          Ready for your next opportunity?
        </h2>

        <p className="mt-3 text-indigo-100">
          Join CareerConnect and explore new career possibilities.
        </p>

        <Link
          href="/register"
          className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50"
        >
          Get Started
        </Link>
      </section>

      <footer className="bg-white px-6 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} CareerConnect
      </footer>
    </main>
  );
}
