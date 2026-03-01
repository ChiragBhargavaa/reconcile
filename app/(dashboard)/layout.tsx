import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "./Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  if (!session.user.username) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
