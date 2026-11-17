import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { homeForRole } from "@/lib/roles";

export default async function RecruiterLayout({ children }) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/recruiter/jobs");
  }

  if (session.role !== "RECRUITER") {
    redirect(homeForRole(session.role));
  }

  return children;
}
