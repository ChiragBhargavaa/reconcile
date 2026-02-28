import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ObjectId } from "mongodb";
import { FriendsClient } from "./FriendsClient";

export default async function FriendsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const db = await connectDB();
  const conns = await db
    .collection("connections")
    .find({
      $or: [{ userId1: session.user.id }, { userId2: session.user.id }],
      status: "accepted",
    })
    .toArray();
  const friendIds = conns.map((c) =>
    c.userId1 === session.user.id ? c.userId2 : c.userId1
  );
  const friends =
    friendIds.length > 0
      ? await db
          .collection("users")
          .find({ _id: { $in: friendIds.map((id) => new ObjectId(id)) } })
          .toArray()
      : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Friends</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Find users and add them directly when creating groups
      </p>
      <FriendsClient
        initialFriends={friends.map((u) => ({
          id: u._id.toString(),
          name: u.name,
          username: u.username,
          image: u.image,
        }))}
      />
    </div>
  );
}
