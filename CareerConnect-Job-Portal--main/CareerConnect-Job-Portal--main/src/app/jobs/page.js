"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { JOB_TYPE_LABELS, formatJobType } from "@/lib/labels";

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  ...Object.entries(JOB_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

function JobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appliedJobs, setAppliedJobs] = useState(() => new Set());
  const [activeJobId, setActiveJobId] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({});

  const [form, setForm] = useState({
    search: searchParams.get("search") || "",
    location: searchParams.get("location") || "",
    type: searchParams.get("type") || "",
  });

  const hasFilters = Boolean(
    searchParams.get("search") ||
      searchParams.get("location") ||
      searchParams.get("type")
  );

  useEffect(() => {
    setForm({
      search: searchParams.get("search") || "",
      location: searchParams.get("location") || "",
      type: searchParams.get("type") || "",
    });
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/jobs${queryString ? `?${queryString}` : ""}`,
          { cache: "no-store" }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load jobs.");
        }

        if (!cancelled) {
          setJobs(data.jobs || []);
          setMeta({
            page: data.page ?? 1,
            total: data.total ?? 0,
            totalPages: data.totalPages ?? 1,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load jobs.");
          setJobs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  useEffect(() => {
    let cancelled = false;

    async function loadAppliedJobs() {
      try {
        const response = await fetch("/api/applications/my", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!cancelled && Array.isArray(data.applications)) {
          setAppliedJobs(
            new Set(data.applications.map((application) => application.jobId))
          );
        }
      } catch {
        // Not logged in or offline: the server still prevents duplicates.
      }
    }

    loadAppliedJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleFilterSubmit(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (form.search.trim()) params.set("search", form.search.trim());
    if (form.location.trim()) params.set("location", form.location.trim());
    if (form.type) params.set("type", form.type);

    const nextQuery = params.toString();
    router.push(nextQuery ? `/jobs?${nextQuery}` : "/jobs");
  }

  function clearFilters() {
    setForm({ search: "", location: "", type: "" });
    router.push("/jobs");
  }

  function goToPage(page) {
    const params = new URLSearchParams(queryString);

    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }

    const nextQuery = params.toString();
    router.push(nextQuery ? `/jobs?${nextQuery}` : "/jobs");
  }

  function openApplyPanel(jobId) {
    setActiveJobId(jobId);
    setFeedback((previous) => ({ ...previous, [jobId]: null }));
  }

  async function submitApplication(jobId) {
    setSubmitting(true);
    setFeedback((previous) => ({ ...previous, [jobId]: null }));

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, coverLetter, resumeUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setFeedback((previous) => ({
            ...previous,
            [jobId]: { ok: false, text: data.message, needsLogin: true },
          }));
          return;
        }

        throw new Error(data.message || "Unable to submit your application.");
      }

      setAppliedJobs((previous) => new Set(previous).add(jobId));
      setActiveJobId("");
      setCoverLetter("");
      setResumeUrl("");
      setFeedback((previous) => ({
        ...previous,
        [jobId]: {
          ok: true,
          text: data.message || "Application submitted successfully!",
        },
      }));
    } catch (err) {
      setFeedback((previous) => ({
        ...previous,
        [jobId]: { ok: false, text: err.message || "Something went wrong." },
      }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <SiteHeader />

      <div className="mx-auto mt-8 max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 font-semibold text-indigo-600">CAREERCONNECT</p>

          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Explore Job Opportunities
          </h1>

          <p className="mt-3 text-slate-600">
            Find your next opportunity and take the next step in your career.
          </p>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end"
        >
          <label className="flex-1">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Job title or keyword
            </span>
            <input
              type="search"
              value={form.search}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  search: event.target.value,
                }))
              }
              placeholder="e.g. React developer"
              className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500"
            />
          </label>

          <label className="flex-1">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              City or Remote
            </span>
            <input
              value={form.location}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  location: event.target.value,
                }))
              }
              placeholder="e.g. Jaipur"
              className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500"
            />
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Employment type
            </span>
            <select
              value={form.type}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  type: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Search
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {loading && (
          <p className="py-10 text-center text-slate-600">Loading jobs…</p>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            <h2 className="text-xl font-semibold text-slate-900">
              No jobs found
            </h2>

            <p className="mt-2">
              {hasFilters
                ? "No jobs match your filters. Try a different search."
                : "No jobs are available right now. Please check again later."}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && jobs.length > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-600">
              Showing {jobs.length} of {meta.total} job
              {meta.total === 1 ? "" : "s"}
              {meta.totalPages > 1 ? ` · page ${meta.page} of ${meta.totalPages}` : ""}
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => {
                const alreadyApplied = appliedJobs.has(job.id);
                const notice = feedback[job.id];
                const isPanelOpen = activeJobId === job.id;

                return (
                  <article
                    key={job.id}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-slate-900">
                        {job.title}
                      </h2>

                      <p className="mt-1 font-medium text-indigo-600">
                        {job.company?.name || "Company"}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {job.location ||
                          job.company?.location ||
                          "Location not specified"}
                      </p>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {job.type && (
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                          {formatJobType(job.type)}
                        </span>
                      )}

                      {job.salary && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          {job.salary}
                        </span>
                      )}
                    </div>

                    <p className="mb-6 flex-1 whitespace-pre-line leading-6 text-slate-600">
                      {job.description}
                    </p>

                    {alreadyApplied ? (
                      <p className="rounded-lg bg-green-50 p-3 text-center text-sm font-semibold text-green-700">
                        ✓ Application submitted
                      </p>
                    ) : isPanelOpen ? (
                      <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
                        <label
                          htmlFor={`cover-letter-${job.id}`}
                          className="mb-1 block text-sm font-medium text-slate-700"
                        >
                          Cover letter (optional)
                        </label>

                        <textarea
                          id={`cover-letter-${job.id}`}
                          value={coverLetter}
                          onChange={(event) => setCoverLetter(event.target.value)}
                          rows={3}
                          maxLength={2000}
                          placeholder="Tell the recruiter why you are a great fit…"
                          className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-indigo-500"
                        />

                        <label
                          htmlFor={`resume-url-${job.id}`}
                          className="mt-3 mb-1 block text-sm font-medium text-slate-700"
                        >
                          Resume link (optional)
                        </label>

                        <input
                          id={`resume-url-${job.id}`}
                          type="url"
                          value={resumeUrl}
                          onChange={(event) => setResumeUrl(event.target.value)}
                          maxLength={500}
                          placeholder="https://drive.google.com/…"
                          className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-indigo-500"
                        />

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => submitApplication(job.id)}
                            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {submitting ? "Submitting…" : "Submit application"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveJobId("")}
                            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openApplyPanel(job.id)}
                        className="mt-auto w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700"
                      >
                        Apply Now
                      </button>
                    )}

                    {notice && (
                      <p
                        role="status"
                        aria-live="polite"
                        className={`mt-3 text-sm ${
                          notice.ok ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {notice.text}

                        {notice.needsLogin && (
                          <>
                            {" "}
                            <Link
                              href={`/login?next=${encodeURIComponent(
                                `/jobs${queryString ? `?${queryString}` : ""}`
                              )}`}
                              className="font-semibold underline"
                            >
                              Log in
                            </Link>
                          </>
                        )}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>

            {meta.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => goToPage(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-sm text-slate-600">
                  Page {meta.page} of {meta.totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => goToPage(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-8">
          <p className="py-10 text-center text-slate-600">Loading jobs…</p>
        </main>
      }
    >
      <JobsContent />
    </Suspense>
  );
}
