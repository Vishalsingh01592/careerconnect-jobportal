"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { JOB_TYPE_LABELS, formatJobType } from "@/lib/labels";

const EMPTY_FORM = {
  title: "",
  description: "",
  location: "",
  type: "FULL_TIME",
  salary: "",
};

export default function RecruiterJobsPage() {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState("");

  const loadJobs = useCallback(async () => {
    const response = await fetch("/api/recruiter/jobs", { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load your jobs.");
    }

    setJobs(data.jobs || []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [companyResponse, jobsResponse] = await Promise.all([
          fetch("/api/recruiter/company", { cache: "no-store" }),
          fetch("/api/recruiter/jobs", { cache: "no-store" }),
        ]);

        const companyData = await companyResponse.json();
        const jobsData = await jobsResponse.json();

        if (!companyResponse.ok) {
          throw new Error(companyData.message || "Unable to load your company.");
        }

        if (!jobsResponse.ok) {
          throw new Error(jobsData.message || "Unable to load your jobs.");
        }

        if (!cancelled) {
          setCompany(companyData.company);
          setJobs(jobsData.jobs || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/recruiter/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to post the job.");
      }

      setMessage("Job posted successfully!");
      setForm(EMPTY_FORM);
      await loadJobs();
    } catch (err) {
      setError(err.message || "Unable to post the job.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleJob(job) {
    setTogglingId(job.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/recruiter/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !job.isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update this job.");
      }

      setJobs((current) =>
        current.map((item) =>
          item.id === job.id ? { ...item, isActive: data.job.isActive } : item
        )
      );
      setMessage(data.message);
    } catch (err) {
      setError(err.message || "Unable to update this job.");
    } finally {
      setTogglingId("");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-4 py-10">
        {loading && <p className="text-slate-600">Loading…</p>}

        {!loading && !company && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-2xl font-bold text-amber-900">
              Set up your company first
            </h1>
            <p className="mt-2 text-amber-800">
              Every job posting needs a company profile. Create yours and then
              come back to publish jobs.
            </p>
            <Link
              href="/recruiter/company"
              className="mt-5 inline-block rounded-lg bg-amber-600 px-5 py-3 font-semibold text-white hover:bg-amber-700"
            >
              Create company profile
            </Link>
          </div>
        )}

        {!loading && company && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold">Post a New Job</h1>
                  <p className="mt-2 text-slate-600">
                    Publishing as{" "}
                    <span className="font-semibold text-indigo-600">
                      {company.name}
                    </span>
                    .
                  </p>
                </div>

                <Link
                  href="/recruiter/company"
                  className="text-sm font-semibold text-indigo-600 hover:underline"
                >
                  Edit company
                </Link>
              </div>

              {message && (
                <p role="status" className="mt-5 rounded-lg bg-green-50 p-3 text-green-700">
                  {message}
                </p>
              )}

              {error && (
                <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-red-700">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="title" className="mb-2 block font-medium">
                    Job Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    minLength={3}
                    maxLength={120}
                    placeholder="e.g. Frontend Developer"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="mb-2 block font-medium">
                    Job Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    minLength={10}
                    maxLength={5000}
                    placeholder="Describe the responsibilities and requirements…"
                    className={inputClass}
                    rows={5}
                    required
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="location" className="mb-2 block font-medium">
                      Location
                    </label>
                    <input
                      id="location"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      minLength={2}
                      maxLength={120}
                      placeholder="e.g. Jaipur, India or Remote"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="mb-2 block font-medium">
                      Employment Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="salary" className="mb-2 block font-medium">
                    Salary (Optional)
                  </label>
                  <input
                    id="salary"
                    name="salary"
                    value={form.salary}
                    onChange={handleChange}
                    maxLength={80}
                    placeholder="e.g. ₹25,000 per month"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Publishing Job…" : "Publish Job"}
                </button>
              </form>
            </section>

            <section className="mt-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">
                  Your job postings ({jobs.length})
                </h2>

                <Link
                  href="/recruiter/applications"
                  className="text-sm font-semibold text-indigo-600 hover:underline"
                >
                  View applications
                </Link>
              </div>

              {jobs.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
                  You have not posted any jobs yet.
                </p>
              ) : (
                <ul className="space-y-4">
                  {jobs.map((job) => (
                    <li
                      key={job.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <h3 className="text-lg font-bold">{job.title}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {job.location} · {formatJobType(job.type)}
                            {job.salary ? ` · ${job.salary}` : ""}
                          </p>
                        </div>

                        <span
                          className={`h-fit w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                            job.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {job.isActive ? "OPEN" : "CLOSED"}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-sm">
                        <span className="text-slate-600">
                          {job._count?.applications ?? 0} application
                          {(job._count?.applications ?? 0) === 1 ? "" : "s"}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleJob(job)}
                          disabled={togglingId === job.id}
                          className="font-semibold text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {togglingId === job.id
                            ? "Updating…"
                            : job.isActive
                              ? "Close job"
                              : "Reopen job"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
