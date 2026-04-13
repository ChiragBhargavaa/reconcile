"use client";

import Link from "next/link";
import Image from "next/image";
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
    <aside className="sticky top-0 z-20 flex h-16 w-full flex-row items-center border-b-4 border-zinc-900 bg-[#f8f4e8] px-3 md:h-screen md:w-[78px] md:flex-col md:border-b-0 md:border-r-4 md:px-0 md:py-5">
      <Link
        href="/dashboard"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-zinc-900 bg-white text-zinc-900 shadow-[4px_4px_0_#111] md:mb-6"
      >
        <Image src="/logo.png" alt="Reconcile" width={28} height={28} className="rounded-md" />
      </Link>

      <nav className="flex flex-1 flex-row items-center justify-center gap-2 md:flex-col">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex h-10 w-10 items-center justify-center rounded-md border-2 border-zinc-900 transition ${
                isActive
                  ? "bg-[#6ee7b7] text-zinc-900 shadow-[3px_3px_0_#111]"
                  : "bg-white text-zinc-700 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#111]"
              }`}
            >
              <Icon size={20} strokeWidth={1.7} />
            </Link>
          );
        })}
      </nav>

      <div className="mx-2 h-8 w-[2px] bg-zinc-900 md:mb-2 md:mx-0 md:h-[2px] md:w-8" />

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        title="Sign out"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-zinc-900 bg-white text-zinc-700 transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#111]"
      >
        <LogOut size={20} strokeWidth={1.7} />
      </button>
    </aside>
  );
}
