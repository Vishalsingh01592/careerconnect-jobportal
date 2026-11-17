"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { formatJobType, formatStatus } from "@/lib/labels";

const STATUS_STYLES = {
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  SHORTLISTED: "bg-blue-100 text-blue-800",
  REVIEWED: "bg-purple-100 text-purple-800",
  PENDING: "bg-amber-100 text-amber-800",
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withdrawingId, setWithdrawingId] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      try {
        const response = await fetch("/api/applications/my", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your applications.");
        }

        if (!cancelled) {
          setApplications(data.applications || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load your applications.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  async function withdrawApplication(id) {
    const confirmed = window.confirm(
      "Withdraw this application? You will be able to apply again later."
    );

    if (!confirmed) {
      return;
    }

    setWithdrawingId(id);
    setNotice("");
    setError("");

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to withdraw this application.");
      }

      setApplications((current) =>
        current.filter((application) => application.id !== id)
      );
      setNotice("Application withdrawn.");
    } catch (err) {
      setError(err.message || "Unable to withdraw this application.");
    } finally {
      setWithdrawingId("");
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="mb-2 font-semibold text-indigo-600">CAREERCONNECT</p>

          <h1 className="text-3xl font-bold text-slate-900">My Applications</h1>

          <p className="mt-3 text-slate-600">
            Track the jobs you have applied for and check their status.
          </p>
        </div>

        {loading && (
          <p className="py-10 text-center text-slate-600">
            Loading your applications…
          </p>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && notice && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700"
          >
            {notice}
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              No applications yet
            </h2>

            <p className="mt-2 text-slate-600">
              Explore available jobs and submit your first application.
            </p>

            <Link
              href="/jobs"
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Browse Jobs
            </Link>
          </div>
        )}

        {!loading && applications.length > 0 && (
          <div className="space-y-5">
            <p className="text-sm text-slate-600">
              Total applications: {applications.length}
            </p>

            {applications.map((application) => (
              <article
                key={application.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {application.job.title}
                    </h2>

                    <p className="mt-1 font-medium text-indigo-600">
                      {application.job.company?.name || "Company"}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {application.job.location || "Location not specified"}
                      {application.job.type
                        ? ` · ${formatJobType(application.job.type)}`
                        : ""}
                      {application.job.isActive === false ? " · no longer accepting applications" : ""}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                      STATUS_STYLES[application.status] ||
                      "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {formatStatus(application.status)}
                  </span>
                </div>

                {application.coverLetter && (
                  <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <span className="font-semibold">Your cover letter: </span>
                    {application.coverLetter}
                  </p>
                )}

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <span>Applied on: {formatDate(application.createdAt)}</span>

                  <div className="flex items-center gap-4">
                    {application.resumeUrl && (
                      <a
                        href={application.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-indigo-600 hover:underline"
                      >
                        View resume
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => withdrawApplication(application.id)}
                      disabled={withdrawingId === application.id}
                      className="font-semibold text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {withdrawingId === application.id
                        ? "Withdrawing…"
                        : "Withdraw"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/jobs"
            className="font-semibold text-indigo-600 hover:underline"
          >
            ← Back to Jobs
          </Link>
        </div>
      </div>
    </main>
  );
}
