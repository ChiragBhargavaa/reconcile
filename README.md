# Reconcile

Split expenses, track balances, and settle up with friends effortlessly.

Reconcile is a group expense-splitting web app — think Splitwise, but open source. Create groups, log shared expenses, and let the app figure out who owes whom.

## Features

- **Google Sign-In** with onboarding flow
- **Groups** — create groups, add members, manage settings
- **Expenses** — add and split expenses among group members
- **Balance Tracking** — automatic pairwise debt calculation
- **Settle Up** — record payments to clear debts
- **Friends** — search users, send/accept friend requests, shareable invite links
- **PDF Export** — download group expense summaries
- **Duplicate Check** — configurable per-group duplicate payment prevention

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, glassmorphism UI |
| Database | MongoDB (native driver) |
| Auth | NextAuth v5 (Google OAuth, JWT sessions) |
| Animations | GSAP |
| PDF | jsPDF |

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Google OAuth credentials ([Google Cloud Console](https://console.cloud.google.com/))

### Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/reconcile.git
cd reconcile
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root:

```env
AUTH_SECRET=your_auth_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=reconcile
```


4. Start the dev server:

```bash
npm run dev
```

## Project Structure

```
app/
├── (auth)/           # Sign-in and onboarding pages
├── (dashboard)/      # Authenticated pages (dashboard, groups, friends, settings)
└── api/              # API routes (users, groups, expenses, friends, invites)
lib/
├── auth.ts           # NextAuth configuration
├── db.ts             # MongoDB connection and indexes
└── utils/
    └── balance.ts    # Balance computation logic
```

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](./LICENSE). You are free to use, modify, and share this software for any **non-commercial** purpose. Commercial use is not permitted.

## Author

**Chirag Bhargava**

