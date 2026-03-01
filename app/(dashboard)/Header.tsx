"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, UserPlus, Settings, LogOut, Info } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/friends", icon: UserPlus, label: "Friends" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/about", icon: Info, label: "About" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-20 flex h-14 w-full flex-row items-center bg-white/15 backdrop-blur-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] px-3 md:h-screen md:w-[68px] md:flex-col md:px-0 md:py-5 md:shadow-[2px_0_10px_rgba(0,0,0,0.04)]">
      <Link
        href="/dashboard"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-900 md:mb-6"
      >
        <span className="text-lg font-bold tracking-tight">R</span>
      </Link>

      <nav className="flex flex-1 flex-row items-center justify-center gap-1 md:flex-col">
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

      <div className="mx-2 h-8 w-px bg-white/20 md:mb-2 md:mx-0 md:h-px md:w-8" />

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        title="Sign out"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-white/20 hover:text-zinc-800"
      >
        <LogOut size={20} strokeWidth={1.7} />
      </button>
    </aside>
  );
}
