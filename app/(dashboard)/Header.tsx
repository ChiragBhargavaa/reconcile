"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, UserPlus, Settings, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/friends", icon: UserPlus, label: "Friends" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-20 flex h-screen w-[68px] flex-col items-center bg-white/15 backdrop-blur-2xl shadow-[2px_0_10px_rgba(0,0,0,0.04)] py-5">
      <Link
        href="/dashboard"
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl text-zinc-900"
      >
        <span className="text-lg font-bold tracking-tight">R</span>
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                isActive
                  ? "bg-white/30 text-zinc-900"
                  : "text-zinc-500 hover:bg-white/20 hover:text-zinc-800"
              }`}
            >
              <Icon size={20} strokeWidth={1.7} />
            </Link>
          );
        })}
      </nav>

      <div className="mb-2 h-px w-8 bg-white/20" />

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        title="Sign out"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-white/20 hover:text-zinc-800"
      >
        <LogOut size={20} strokeWidth={1.7} />
      </button>
    </aside>
  );
}
