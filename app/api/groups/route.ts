import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await connectDB();
  const groups = await db
    .collection("groups")
    .find({ memberIds: session.user.id })
    .sort({ updatedAt: -1 })
    .toArray();
  const userIds = new Set<string>();
  groups.forEach((g) => g.memberIds?.forEach((id: string) => userIds.add(id)));
  const users =
    userIds.size > 0
      ? await db
          .collection("users")
          .find({ _id: { $in: Array.from(userIds).map((id) => new ObjectId(id)) } })
          .toArray()
      : [];
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
  const result = groups.map((g) => ({
    id: g._id.toString(),
    name: g.name,
    createdBy: g.createdBy,
    memberIds: g.memberIds || [],
    members: (g.memberIds || []).map((id: string) => ({
      id,
      name: userMap[id]?.name,
      username: userMap[id]?.username,
      image: userMap[id]?.image,
    })),
    createdAt: g.createdAt,
  }));
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const memberIds = Array.isArray(body.memberIds)
    ? (body.memberIds as string[]).filter((id: unknown) => typeof id === "string")
    : [];
  if (!name) {
    return NextResponse.json({ error: "Group name is required" }, { status: 400 });
  }
  const allMemberIds = Array.from(new Set([session.user.id, ...memberIds]));
  const db = await connectDB();
  const { insertedId } = await db.collection("groups").insertOne({
    name,
    createdBy: session.user.id,
    memberIds: allMemberIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return NextResponse.json({ id: insertedId.toString(), name, memberIds: allMemberIds });
}
