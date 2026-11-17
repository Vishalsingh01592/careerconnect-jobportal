import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-6xl font-extrabold text-indigo-600">404</p>

      <h1 className="mt-4 text-3xl font-bold text-slate-900">
        Page not found
      </h1>

      <p className="mt-3 max-w-md text-slate-600">
        The page you are looking for does not exist or may have been moved.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/jobs"
          className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          Browse jobs
        </Link>

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
