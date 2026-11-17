import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { homeForRole } from "@/lib/roles";

export default async function MyApplicationsLayout({ children }) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/my-applications");
  }

  if (session.role !== "CANDIDATE") {
    redirect(homeForRole(session.role));
  }

  return children;
}
