import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  if (!session.user.username) redirect("/onboarding");

  return (
    <div className="flex min-h-screen flex-col bg-transparent md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
