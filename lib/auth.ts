import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB } from "./db";
import { ObjectId } from "mongodb";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const db = await connectDB();
      const users = db.collection("users");
      const existing = await users.findOne({ email: user.email });
      if (!existing) {
        await users.insertOne({
          email: user.email,
          name: user.name || null,
          image: user.image || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await users.updateOne(
          { email: user.email },
          {
            $set: {
              name: user.name || existing.name,
              image: user.image || existing.image,
              updatedAt: new Date(),
            },
          }
        );
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user?.email) {
        const db = await connectDB();
        const dbUser = await db.collection("users").findOne({ email: user.email });
        if (dbUser) {
          token.userId = dbUser._id.toString();
          token.username = dbUser.username;
          token.email = dbUser.email;
        }
      }
      if (token.userId && (trigger === "update" || !token.username)) {
        const db = await connectDB();
        const dbUser = await db.collection("users").findOne(
          { _id: new ObjectId(token.userId as string) },
          { projection: { username: 1 } }
        );
        if (dbUser) token.username = dbUser.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        (session.user as { id?: string }).id = token.userId as string;
        (session.user as { username?: string | null }).username = (token.username as string) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: { strategy: "jwt" },
});

declare module "next-auth" {
  interface User {
    id?: string;
  }
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      username?: string | null;
    };
  }
}
