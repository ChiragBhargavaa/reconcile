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
      <div className="rounded-lg border-4 border-dashed border-zinc-900 bg-[#f8f4e8] p-16 text-center shadow-[8px_8px_0_#111]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-md border-2 border-zinc-900 bg-white">
          <Plus className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-zinc-900">No groups yet</h3>
        <p className="mt-2 max-w-sm mx-auto text-base text-zinc-600">
          Create a group to start splitting expenses with friends
        </p>
        <Link
          href="/groups/new"
          className="mt-6 inline-flex items-center gap-2 rounded-md border-2 border-zinc-900 bg-[#f6d64a] px-5 py-3 text-sm font-bold text-zinc-900 shadow-[4px_4px_0_#111] transition hover:-translate-y-0.5 disabled:opacity-60"
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
          className="inline-flex items-center gap-2 rounded-md border-2 border-zinc-900 bg-[#6ee7b7] px-4 py-2.5 text-sm font-bold text-zinc-900 shadow-[4px_4px_0_#111] transition hover:-translate-y-0.5"
        >
          <Plus size={18} /> New group
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {groupsWithMembers.map((g) => (
          <li key={g.id}>
            <Link
              href={`/groups/${g.id}`}
              className="block rounded-lg border-2 border-zinc-900 bg-white p-5 shadow-[5px_5px_0_#111] transition hover:-translate-y-0.5"
            >
              <span className="block text-lg font-bold text-zinc-900">{g.name}</span>
              <span className="mt-1 inline-flex items-center rounded-md border-2 border-zinc-900 bg-[#8de8ff] px-3 py-0.5 text-sm font-bold text-zinc-900">
                {g.members?.length || 0} members
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
