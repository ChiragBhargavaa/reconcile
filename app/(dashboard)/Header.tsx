"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Users, UserPlus, Settings, LogOut } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Reconcile
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <Users size={18} /> Groups
          </Link>
          <Link
            href="/friends"
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <UserPlus size={18} /> Friends
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <Settings size={18} /> Settings
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <LogOut size={18} /> Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
