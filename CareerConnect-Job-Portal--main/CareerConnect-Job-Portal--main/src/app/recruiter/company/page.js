"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";

const EMPTY_FORM = {
  name: "",
  description: "",
  location: "",
  website: "",
};

export default function RecruiterCompanyPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [hasCompany, setHasCompany] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCompany() {
      try {
        const response = await fetch("/api/recruiter/company", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your company.");
        }

        if (!cancelled && data.company) {
          setHasCompany(true);
          setForm({
            name: data.company.name || "",
            description: data.company.description || "",
            location: data.company.location || "",
            website: data.company.website || "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load your company.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCompany();

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
      const response = await fetch("/api/recruiter/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save your company.");
      }

      setHasCompany(true);
      setMessage(data.message || "Company profile saved.");
    } catch (err) {
      setError(err.message || "Unable to save your company.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900">
          {hasCompany ? "Company Profile" : "Create Your Company Profile"}
        </h1>

        <p className="mt-2 text-slate-600">
          {hasCompany
            ? "This company is shown on every job you post."
            : "Post a job requires a company. Set it up once and reuse it for every posting."}
        </p>

        {hasCompany && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Company linked.{" "}
            <Link href="/recruiter/jobs" className="font-semibold underline">
              Go to your jobs
            </Link>
            .
          </p>
        )}

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

        {loading ? (
          <p className="mt-8 text-slate-600">Loading…</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div>
              <label htmlFor="name" className="mb-2 block font-medium">
                Company Name
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                minLength={2}
                maxLength={120}
                placeholder="e.g. TechNova Solutions"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="location" className="mb-2 block font-medium">
                Location
              </label>
              <input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                maxLength={120}
                placeholder="e.g. Jaipur, India"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="website" className="mb-2 block font-medium">
                Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={form.website}
                onChange={handleChange}
                maxLength={300}
                placeholder="https://yourcompany.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block font-medium">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                maxLength={2000}
                placeholder="What does your company do?"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : hasCompany
                  ? "Save Changes"
                  : "Create Company"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
