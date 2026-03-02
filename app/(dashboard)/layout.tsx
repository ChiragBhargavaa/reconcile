import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./Header";
// #region agent log
import { appendFileSync } from "fs";
// #endregion

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  // #region agent log
  try { appendFileSync('/Users/chikuhome/WebDEvElopment/reconcile/.cursor/debug-22e2f2.log', JSON.stringify({sessionId:'22e2f2',location:'dashboard/layout.tsx',message:'Dashboard layout auth check',data:{hasSession:!!session,userId:session?.user?.id||null,username:session?.user?.username||null},timestamp:Date.now(),hypothesisId:'H5'}) + '\n'); } catch {}
  // #endregion
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
