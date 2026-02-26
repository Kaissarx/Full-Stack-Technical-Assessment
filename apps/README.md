# 👟 Hype Drops - High-Concurrency Reservation System

A full-stack web application designed to handle high-traffic, limited-edition product drops. This system allows users to reserve a product, locking the inventory for 5 minutes to complete the checkout process, while strictly preventing race conditions, double-booking, and overselling.

## 🚀 Tech Stack
* **Frontend:** React, TypeScript, Vite, TailwindCSS
* **Backend:** Node.js, Express, TypeScript
* **Database:** PostgreSQL, Prisma ORM
* **Security & Tools:** JWT Authentication, Express Rate Limit, Node-Cron, Morgan (Logging)

---

## 🧠 Architecture & Concurrency Strategy

The core challenge of this application is handling **Concurrency and Race Conditions**—specifically, what happens when 100 users try to buy the last pair of sneakers at the exact same millisecond. 

To solve this, the backend implements strict database-level constraints:

1. **Prisma Transactions (`$transaction`):** When a reservation request is made, the system initiates an atomic database transaction. It checks the current stock and existing reservations. If the stock drops below the requested quantity during the read phase, the transaction is safely rolled back before any data is written.
2. **Duplicate Reservation Prevention:** The database actively queries for existing `PENDING` reservations for the requesting `userId`. If an active reservation exists, the API rejects the request, preventing users from hoarding inventory by spamming the button.
3. **Automated Inventory Release (Cron Job):**
   A background `node-cron` job runs every minute to scan the database for reservations older than 5 minutes. Expired reservations are automatically marked as `EXPIRED`, and the locked inventory is immediately released back to the global stock pool.

---

## 🔒 Security & API Features
* **JWT Authentication:** All reservation and checkout routes are protected by a custom authentication middleware.
* **Rate Limiting:** IP-based rate limiting is implemented to block abusive traffic and automated scalper bots.
* **Pagination & Filtering:** The `/products` endpoint supports scalable data retrieval with `page`, `limit`, and `search` query parameters.
* **Centralized Error Handling:** All backend errors are caught and formatted uniformly before being sent to the client.

---

## 🛠️ Local Setup Instructions

### 1. Prerequisites
* Node.js (v18+)
* PostgreSQL running locally or via a cloud provider (e.g., Supabase/Neon).

### 2. Environment Variables
Create a `.env` file inside `apps/api` with the following:
\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/your_db"
JWT_SECRET="your_super_secret_key"
PORT=3000
\`\`\`

### 3. Installation & Database Setup
From the root directory, install dependencies and migrate the database:
\`\`\`bash
# Install all dependencies
npm install

# Navigate to the API to set up the database
cd apps/api
npx prisma migrate dev --name init
\`\`\`

### 4. Running the Application
You can start both the frontend and backend servers.
**Terminal 1 (Backend):**
\`\`\`bash
cd apps/api
npm run dev
\`\`\`
**Terminal 2 (Frontend):**
\`\`\`bash
cd apps/web
npm run dev
\`\`\`

---

## 🧪 Running the Concurrency Simulation

To mathematically prove that the database safely handles race conditions without overselling, a simulation script is included. This script automatically generates 100 fake users, authenticates them, and blasts the `/reserve` endpoint at the exact same millisecond.

To run the attack, ensure your Express server is running, then open a new terminal:
\`\`\`bash
cd apps/api
npx ts-node src/simulate.ts
\`\`\`

**Expected Result:** The Prisma connection pool will safely process a batch of requests, securing inventory for the first successful users, and strictly rejecting the remaining requests with `Out of Stock` or connection errors. Zero race conditions occur.