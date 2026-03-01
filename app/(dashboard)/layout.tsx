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
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10 sm:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
