import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import Link from "next/link";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const { code } = await params;

  const db = await connectDB();
  const link = await db.collection("friendlinks").findOne({
    code,
    expiresAt: { $gt: new Date() },
  });
  if (!link) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Invalid or expired link
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This invite link has expired or doesn&apos;t exist.
        </p>
        <Link href="/friends" className="mt-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          Go to Friends
        </Link>
      </div>
    );
  }

  const inviterId = link.userId as string;
  if (inviterId === session.user.id) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          That&apos;s your own link
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Share this link with others so they can add you as a friend.
        </p>
        <Link href="/friends" className="mt-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          Go to Friends
        </Link>
      </div>
    );
  }

  const inviter = await db.collection("users").findOne({ _id: new ObjectId(inviterId) });
  const userId1 = session.user.id < inviterId ? session.user.id : inviterId;
  const userId2 = session.user.id < inviterId ? inviterId : session.user.id;
  const existing = await db.collection("connections").findOne({ userId1, userId2 });

  if (existing?.status === "accepted") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Already friends
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          You and {inviter?.name || inviter?.username || "this user"} are already connected.
        </p>
        <Link href="/friends" className="mt-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          Go to Friends
        </Link>
      </div>
    );
  }

  if (existing?.status === "pending") {
    if (existing.requestedBy === session.user.id) {
      return (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Request pending
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            You&apos;ve already sent a friend request to {inviter?.name || inviter?.username || "this user"}.
          </p>
          <Link href="/friends" className="mt-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400">
            Go to Friends
          </Link>
        </div>
      );
    }
  }

  await db.collection("connections").updateOne(
    { userId1, userId2 },
    {
      $set: {
        userId1,
        userId2,
        status: "accepted",
        requestedBy: inviterId,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        You&apos;re now friends!
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        You and {inviter?.name || inviter?.username || "this user"} are now connected. You can add each other to groups and split expenses.
      </p>
      <Link href="/friends" className="mt-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400">
        Go to Friends
      </Link>
    </div>
  );
}
