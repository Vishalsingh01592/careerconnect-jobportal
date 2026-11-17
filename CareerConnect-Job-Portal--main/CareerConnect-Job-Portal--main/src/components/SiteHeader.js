"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const linkBase = "transition hover:text-indigo-600";

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const data = await response.json();

        if (!cancelled) {
          setUser(response.ok ? data.user : null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // Ignore network errors: the cookie expires on its own.
    } finally {
      setUser(null);
      setLoggingOut(false);
      router.push("/");
      router.refresh();
    }
  }

  function renderNav() {
    if (!ready) {
      return (
        <span className="h-8 w-32 animate-pulse rounded bg-slate-100" aria-hidden="true" />
      );
    }

    if (!user) {
      return (
        <>
          <Link href="/jobs" className={linkBase}>
            Find Jobs
          </Link>

          <Link href="/login" className={linkBase}>
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"
          >
            Sign Up
          </Link>
        </>
      );
    }

    if (user.role === "RECRUITER") {
      return (
        <>
          <Link
            href="/recruiter/jobs"
            className={`${linkBase} ${isActive(pathname, "/recruiter/jobs") ? "font-semibold text-indigo-600" : ""}`}
          >
            My Jobs
          </Link>

          <Link
            href="/recruiter/applications"
            className={`${linkBase} ${isActive(pathname, "/recruiter/applications") ? "font-semibold text-indigo-600" : ""}`}
          >
            Applications
          </Link>

          <Link
            href="/recruiter/company"
            className={`${linkBase} ${isActive(pathname, "/recruiter/company") ? "font-semibold text-indigo-600" : ""}`}
          >
            Company
          </Link>
        </>
      );
    }

    return (
      <>
        <Link
          href="/jobs"
          className={`${linkBase} ${isActive(pathname, "/jobs") ? "font-semibold text-indigo-600" : ""}`}
        >
          Find Jobs
        </Link>

        <Link
          href="/my-applications"
          className={`${linkBase} ${isActive(pathname, "/my-applications") ? "font-semibold text-indigo-600" : ""}`}
        >
          My Applications
        </Link>
      </>
    );
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <Link href="/" className="text-2xl font-bold text-indigo-600">
        CareerConnect
      </Link>

      <nav className="flex flex-wrap items-center gap-5 text-sm sm:text-base">
        {renderNav()}

        {ready && user && (
          <>
            <span className="hidden text-slate-500 sm:inline">
              {user.name}
              {user.role === "RECRUITER" && user.company ? ` · ${user.company.name}` : ""}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
