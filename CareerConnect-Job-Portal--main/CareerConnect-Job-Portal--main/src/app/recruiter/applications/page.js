"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { APPLICATION_STATUSES, formatStatus } from "@/lib/labels";

const STATUS_STYLES = {
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  SHORTLISTED: "bg-blue-100 text-blue-800",
  REVIEWED: "bg-purple-100 text-purple-800",
  PENDING: "bg-amber-100 text-amber-800",
};

export default function RecruiterApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      try {
        const response = await fetch("/api/recruiter/applications", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load applications.");
        }

        if (!cancelled) {
          setApplications(data.applications || []);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || "Something went wrong.");
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

  function changeStatus(id, status) {
    setApplications((current) =>
      current.map((application) =>
        application.id === id
          ? { ...application, selectedStatus: status }
          : application
      )
    );
    setMessage("");
    setActionError("");
  }

  async function updateStatus(application) {
    const status = application.selectedStatus || application.status;

    setSavingId(application.id);
    setMessage("");
    setActionError("");

    try {
      const response = await fetch(
        `/api/recruiter/applications/${application.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update status.");
      }

      setApplications((current) =>
        current.map((item) =>
          item.id === application.id
            ? {
                ...item,
                status: data.application.status,
                selectedStatus: data.application.status,
              }
            : item
        )
      );

      setMessage("Application status updated successfully.");
    } catch (err) {
      setActionError(err.message || "Something went wrong.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <div className="mb-8 mt-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Candidate Applications
          </h1>
          <p className="mt-2 text-gray-600">
            Review candidates and update their application statuses.
          </p>
        </div>

        {loading && (
          <p className="rounded-lg bg-white p-6 text-gray-600 shadow-sm">
            Loading applications…
          </p>
        )}

        {!loading && loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {loadError}
          </div>
        )}

        {!loading && !loadError && actionError && (
          <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {actionError}
          </div>
        )}

        {!loading && !loadError && message && (
          <div role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        {!loading && !loadError && applications.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              No applications yet
            </h2>
            <p className="mt-2 text-gray-600">
              Applications for your posted jobs will appear here.
            </p>
            <Link
              href="/recruiter/jobs"
              className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              Post a Job
            </Link>
          </div>
        )}

        {!loading && !loadError && applications.length > 0 && (
          <>
            <p className="mb-4 text-sm text-gray-600">
              Total applications: <strong>{applications.length}</strong>
            </p>

            <div className="space-y-5">
              {applications.map((application) => {
                const selectedStatus =
                  application.selectedStatus || application.status;

                return (
                  <article
                    key={application.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {application.candidate?.name || "Unknown candidate"}
                        </h2>
                        <p className="mt-1 break-all text-sm text-gray-600">
                          {application.candidate?.email || "No email available"}
                        </p>
                      </div>

                      <span
                        className={`h-fit w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                          STATUS_STYLES[application.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {formatStatus(application.status)}
                      </span>
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <p className="font-medium text-gray-800">
                        {application.job?.title || "Job title unavailable"}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {application.job?.company?.name || "Company"}
                      </p>
                      <p className="mt-3 text-sm text-gray-500">
                        Applied on:{" "}
                        {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {application.coverLetter && (
                      <p className="mt-4 whitespace-pre-line rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                        <span className="font-semibold">Cover letter: </span>
                        {application.coverLetter}
                      </p>
                    )}

                    {application.resumeUrl && (
                      <a
                        href={application.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Open resume link
                      </a>
                    )}

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label
                          htmlFor={`status-${application.id}`}
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Update application status
                        </label>

                        <select
                          id={`status-${application.id}`}
                          value={selectedStatus}
                          onChange={(event) =>
                            changeStatus(application.id, event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-blue-500"
                        >
                          {APPLICATION_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {formatStatus(status)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateStatus(application)}
                        disabled={
                          savingId === application.id ||
                          selectedStatus === application.status
                        }
                        className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingId === application.id
                          ? "Updating…"
                          : "Update Status"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
