import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  const db = await connectDB();
  const group = await db.collection("groups").findOne({
    _id: new ObjectId(id),
    memberIds: session.user.id,
  });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  const userIds = group.memberIds || [];
  const users =
    userIds.length > 0
      ? await db
          .collection("users")
          .find({ _id: { $in: userIds.map((id: string) => new ObjectId(id)) } })
          .toArray()
      : [];
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
  return NextResponse.json({
    id: group._id.toString(),
    name: group.name,
    createdBy: group.createdBy,
    memberIds: group.memberIds || [],
    members: (group.memberIds || []).map((id: string) => ({
      id,
      name: userMap[id]?.name,
      username: userMap[id]?.username,
      image: userMap[id]?.image,
    })),
    createdAt: group.createdAt,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  const body = await request.json();
  const db = await connectDB();
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (Array.isArray(body.memberIds)) {
    const memberIds = (body.memberIds as string[]).filter((id: unknown) => typeof id === "string");
    if (!memberIds.includes(session.user.id)) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }
    update.memberIds = Array.from(new Set(memberIds));
  }
  const result = await db.collection("groups").findOneAndUpdate(
    { _id: new ObjectId(id), memberIds: session.user.id },
    { $set: update },
    { returnDocument: "after" }
  );
  if (!result) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  return NextResponse.json({ id: result._id.toString(), ...result });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  const db = await connectDB();
  const result = await db.collection("groups").deleteOne({
    _id: new ObjectId(id),
    memberIds: session.user.id,
  });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
