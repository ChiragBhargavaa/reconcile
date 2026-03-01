import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ObjectId } from "mongodb";

async function GroupsList() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const db = await connectDB();
  const groups = await db
    .collection("groups")
    .find({ memberIds: session.user.id })
    .sort({ updatedAt: -1 })
    .toArray();
  const userIds = new Set<string>();
  groups.forEach((g) => (g.memberIds || []).forEach((id: string) => userIds.add(id)));
  const users =
    userIds.size > 0
      ? await db
          .collection("users")
          .find({ _id: { $in: Array.from(userIds).map((id) => new ObjectId(id)) } })
          .toArray()
      : [];
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
  const groupsWithMembers = groups.map((g) => ({
    id: g._id.toString(),
    name: g.name,
    members: (g.memberIds || []).map((id: string) => ({
      id,
      name: userMap[id]?.name,
      username: userMap[id]?.username,
    })),
  }));
  if (groupsWithMembers.length === 0) {
    return (
      <div className="rounded-2xl bg-white/30 backdrop-blur-2xl ring-2 ring-dashed ring-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
          <Plus className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-zinc-900">No groups yet</h3>
        <p className="mt-2 max-w-sm mx-auto text-base text-zinc-600">
          Create a group to start splitting expenses with friends
        </p>
        <Link
          href="/groups/new"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:opacity-60"
        >
          <Plus size={18} /> Create your first group
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900">Your groups</h2>
        <Link
          href="/groups/new"
          className="inline-flex items-center gap-2 rounded-lg bg-white/15 backdrop-blur-xl ring-1 ring-white/20 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-white/25"
        >
          <Plus size={18} /> New group
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {groupsWithMembers.map((g) => (
          <li key={g.id}>
            <Link
              href={`/groups/${g.id}`}
              className="block rounded-2xl bg-white/30 backdrop-blur-2xl ring-1 ring-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5 transition hover:bg-white/35"
            >
              <span className="block text-lg font-bold text-zinc-900">{g.name}</span>
              <span className="mt-1 inline-flex items-center text-base font-medium text-zinc-800">
                <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/20 text-xs font-medium">
                  {g.members?.length || 0}
                </span>
                members
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] || "there";
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Hi, {firstName}
        </h1>
        <p className="mt-1 text-zinc-800">@{session?.user?.username}</p>
      </section>
      <section>
        <GroupsList />
      </section>
    </div>
  );
}
