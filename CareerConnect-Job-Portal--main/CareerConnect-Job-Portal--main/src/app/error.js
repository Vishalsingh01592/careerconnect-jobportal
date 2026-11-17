"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Unexpected application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-semibold text-indigo-600">OOPS</p>

      <h1 className="mt-3 text-3xl font-bold text-slate-900">
        Something went wrong
      </h1>

      <p className="mt-3 max-w-md text-slate-600">
        An unexpected error occurred while loading this page. You can try again
        or head back to the homepage.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          Try again
        </button>

        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Go to homepage
        </Link>
      </div>
    </main>
  );
}
