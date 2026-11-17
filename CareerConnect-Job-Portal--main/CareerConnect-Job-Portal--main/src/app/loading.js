export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-16">
      <div className="flex items-center gap-3 text-slate-600">
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"
        />
        <span>Loading…</span>
      </div>
    </div>
  );
}
