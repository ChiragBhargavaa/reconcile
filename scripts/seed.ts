/**
 * Seed script for Reconcile - inserts test users.
 * Run: npm run seed
 * Requires MONGODB_URI in .env
 */

import "dotenv/config";
import { MongoClient } from "mongodb";

const SEED_USERS = [
  { name: "Krish Mehta", phone: "9503856753", email: "KrishMehta@gmail.com", username: "krishmehta" },
  { name: "Urvika Jadiya", phone: "9534856753", email: "urviijad@gmail.com", username: "urvikajadiya" },
  { name: "Vedant Sharma", phone: "9503845753", email: "vedantsharma@gmail.com", username: "vedantsharma" },
  { name: "Priyanshi Jain", phone: "9503856712", email: "priyyanshi@gmail.com", username: "priyanshijain" },
  { name: "Harshit Jain", phone: "8503856753", email: "harshit@gmail.com", username: "harshitjain" },
  { name: "Gargi Chaturvedi", phone: "9333856753", email: "gargiichatur@gmail.com", username: "gargichaturvedi" },
];

async function seed() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGODB_DB_NAME || "reconcile";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection("users");

    for (const u of SEED_USERS) {
      const existing = await users.findOne({ $or: [{ email: u.email }, { username: u.username }] });
      if (existing) {
        await users.updateOne(
          { _id: existing._id },
          {
            $set: {
              name: u.name,
              phone: `+91${u.phone}`,
              email: u.email.toLowerCase(),
              username: u.username,
              updatedAt: new Date(),
            },
          }
        );
        console.log(`Updated: ${u.name} (${u.email})`);
      } else {
        await users.insertOne({
          email: u.email.toLowerCase(),
          name: u.name,
          username: u.username,
          phone: `+91${u.phone}`,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`Created: ${u.name} (${u.email})`);
      }
    }
    console.log("Seed complete.");
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
