# Database Testing & Version Control Guide (ProShop-v2)

## 1. Introduction

Welcome to the Database Testing and Schema Versioning guide for the ProShop-v2 project. Unlike traditional SQL databases, NoSQL databases (MongoDB) lack built-in schema enforcement and referential integrity (Foreign Keys).

This guide demonstrates a robust testing architecture that addresses these NoSQL vulnerabilities using:

- **Schema Versioning & Rollback:** Utilizing `migrate-mongo` to safely apply and reverse database schema changes.
- **AI-Assisted Data Generation & Masking:** Integrating Google Gemini AI and Faker.js to generate synthetic edge-case data and mask sensitive PII (Personally Identifiable Information) without breaking JSON structures.
- **Business Invariants Testing:** Automated Node.js scripts to detect data anomalies and orphaned documents (Dead Links).

## 2. Install

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB Atlas** account (or local MongoDB server)
- **Google Gemini API Key** (for AI data masking/generation)

### Setup Instructions

#### Step 1 — Clone the repository

```bash
git clone https://github.com/bradtraversy/proshop-v2.git
cd proshop-v2
```

#### Step 2 — Set up MongoDB Atlas

- Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up / log in
- Create a **Free Cluster** (M0 Sandbox), choose the region closest to you (e.g. Singapore)
- Go to **Security → Network Access** → **Add IP Address** → choose **Allow Access from Anywhere** (0.0.0.0/0) for development
- Go to **Security → Database Access** → **Add New Database User**, set a username and password, grant **Read and write to any database**, and save the password
- Go to **Database** → click **Connect** on your cluster → **Connect your application** → copy the connection string:

```bash
  mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/?retryWrites=true&w=majority
```

#### Step 3 — Install project dependencies

```bash
npm install
```

> Installs all base dependencies already listed in `package.json` (including `dotenv` and `mongoose`). Deprecation warnings and audit vulnerability notices may appear — these come from third-party sub-dependencies and do not block setup; no action is required.

#### Step 4 — Install data masking & migration dependencies

```bash
npm install migrate-mongo @faker-js/faker @google/generative-ai mongodb
```


| Package                 | Purpose                                                                                              | Already in package.json?          |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------- |
| `migrate-mongo`         | Database migration tool (CLI included)                                                               | No                                |
| `@faker-js/faker`       | Generates fake data for masking                                                                      | No                                |
| `@google/generative-ai` | Gemini AI SDK for AI-powered masking                                                                 | No                                |
| `mongodb`               | MongoDB driver — required directly by `migrate-mongo` (separate from `mongoose`, which the app uses) | No                                |
| ~~`dotenv`~~            | Loads `.env` variables                                                                               | **Yes — already installed, skip** |


#### Step 5 — Initialize the migration tool

```bash
npx migrate-mongo init
```

This generates `migrate-mongo-config.js` and a `migrations/` folder in the project root. The package is considered installed once this command completes without error.

#### Step 6 — Configure `.env`

Create or update `.env` in the root directory:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/proshop?retryWrites=true&w=majority
GEMINI_API_KEY=your_google_gemini_api_key
```

#### Step 7 — Configure `migrate-mongo-config.js` (ESM)

Since ProShop uses ES Modules (`"type": "module"` in `package.json`), overwrite the generated `migrate-mongo-config.js` with:

```javascript
import dotenv from "dotenv";
dotenv.config();

export default {
  mongodb: {
    url: process.env.MONGO_URI,
    databaseName: "proshop",
    options: {}, // Keep empty for MongoDB Driver v4.0+
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",
  moduleSystem: "esm", // Forces ES Module execution
};
```

## 3. First Test (Migration & Rollback)

This test verifies the system's ability to upgrade the database schema and safely revert it without data loss. All commands are executed directly from the project root directory.

**Step 1 : Create a Test Migration File**
Generate a new migration script by running the following command in the root directory:

```
npx migrate-mongo create initial_test_migration
```

- Expected Output: A new file is created inside the migrations/ directory at the root with a timestamp prefix (e.g., 20260621075815-initial_test_migration.js).

**Step 2: Implement the Migration Logic**

```
export const up = async (db, client) => {
    // Test: Add a temporary test field to all products
    await db.collection('products').updateMany(
        {},
        { $set: { testField: "Migration is working!" } }
    );
};

export const down = async (db, client) => {
    // Revert: Completely remove the temporary test field from all products
    await db.collection('products').updateMany(
        {},
        { $unset: { testField: "" } }
    );
};
```

**Step 3: Execute Migration (Up)**

```bash
npx migrate-mongo up
```

**Step 3: Check Initial Migration Status**

```bash
npx migrate-mongo status
```

*Expected:*

```
┌──────────────────────────────────────────┬────────────┬─────────────────┐
│ Filename                                 │ Applied At │ Migration block │
├──────────────────────────────────────────┼────────────┼─────────────────┤
│20260621075815initial_test_migration.js   │  PENDING   │                 │
└──────────────────────────────────────────┴────────────┴─────────────────┘
```

**Step 4: Execute Migration (Up)**
Apply the schema changes directly to your MongoDB database instance:

```
npx migrate-mongo up
```

*Expected:*

- Terminal log : MIGRATED UP: ...-initial_test_migration.js
- Status Update: If you run npx migrate-mongo status again, the table will record the exact execution timestamp and assign a migration block number:
Example :

```
┌──────────────────────────────────────────┬──────────────────────────┬─────────────────┐
│ Filename                                 │ Applied At               │ Migration block │
├──────────────────────────────────────────┼──────────────────────────┼─────────────────┤
│ 20260621075815-initial_test_migration.js │ 2026-06-21 15:12:34 UTC  │ 178202896604    │
└──────────────────────────────────────────┴──────────────────────────┴─────────────────┘
```

- Database Verification: Check your products collection via MongoDB Compass or Atlas. Every product document will now dynamically contain "testField": "Migration is working!"

Example :

```
{
  "_id": {
    "$oid": "6a2e480a2bec7b74c9e9789e"
  },
  "user": {
    "$oid": "6a2e480a2bec7b74c9e9789c"
  },
  "name": "iPhone 15 Pro Max",
  "image": "/images/phone.jpg",
  "brand": "Apple",
  "category": "Electronics",
  "description": "Chính hãng VN/A với dung lượng 256GB",
  "reviews": [
    {
      "name": "John Doe",
      "rating": 5,
      "comment": "Sản phẩm tuyệt vời!",
      "user": {
        "$oid": "6a2e480a2bec7b74c9e9789d"
      },
      "createdAt": {
        "$date": "2026-06-14T06:19:54.863Z"
      },
      "updatedAt": {
        "$date": "2026-06-14T06:19:54.863Z"
      }
    }
  ],
  "rating": 5,
  "numReviews": 1,
  "price": 1200,
  "countInStock": 10,
  "createdAt": {
    "$date": "2026-06-14T06:19:54.863Z"
  },
  "updatedAt": {
    "$date": "2026-06-14T06:19:54.863Z"
  },
  "testField": "Migration is working!"
}
```

**Step 5: Execute Rollback (Down)**
Revert the database schema to its original state to ensure that your rollback logic can clean up successfully:

```
npx migrate-mongo down
```

*Expected:*

- Terminal log : MIGRATED DOWN: ...-initial_test_migration.js
- Status Update: If you run npx migrate-mongo status again, the table will record the exact execution timestamp and assign a migration block number:
Example :

```
┌──────────────────────────────────────────┬────────────┬─────────────────┐
│ Filename                                 │ Applied At │ Migration block │
├──────────────────────────────────────────┼────────────┼─────────────────┤
│20260621075815-initial_test_migration.js  │  PENDING   │                 │
└──────────────────────────────────────────┴────────────┴─────────────────┘
```

- Database Cleanup: In your MongoDB instance, the testField will be fully purged ($unset), restoring your product documents exactly back to their original Mongoose schema structure.

## 4. Advanced Usage

Beyond structural changes, traditional QA processes struggle with generating valid test data and protecting real user data during NoSQL integration testing. We implemented an automated AI and Node.js-driven testing suite in the `backend/` directory to solve this.

### 4.1. AI-Assisted Synthetic Data Generation

Creating edge-case data manually is time-consuming. We utilize Google Gemini AI as an automated QA engineer to read the Mongoose Schema and purposefully inject "poisoned" test cases into the database.

**Step 1: Run the Generator Script**
Execute the following command from the root directory:

```bash
node backend/generate_test_data.js
```

**Expected Result:**
The script successfully prompts Gemini to generate and insert exactly 3 targeted document scenarios into the `orders` collection:

1. A valid "Happy Path" order.
2. A logic error order (e.g., negative `taxPrice` or incorrect total sum).
3. A missing boundary data order (e.g., completely missing the `shippingAddress` object).

### 4.2. Intelligent Data Masking (PII Protection)

When pulling production data to a testing environment, Personally Identifiable Information (PII) must be obscured without breaking the system's JSON tree structure.

**Step 1: Run the Masking Script**

```bash
node backend/data_masking.js
```

**Expected Result:**
The script applies a hybrid role-based masking strategy:

- **Faker.js** processes flat fields instantly, replacing real `name` and `email` with mock data.
- **Gemini AI** intercepts the complex, unstructured `shippingAddress` object. It interprets the geographical context (e.g., "Vietnam") and generates a highly realistic, localized fake address while strictly adhering to the JSON schema to prevent application crashes.

### 4.3. Business Invariants Testing

Because NoSQL databases (like MongoDB) do not natively enforce constraints, schemas, or referential integrity (Foreign Keys), invalid data can easily crash the frontend application.

To mitigate this, we built a comprehensive validation scanner using Node.js and MongoDB Aggregation Pipelines.

**Step 1: Execute the Invariants Scanner**

```bash
node backend/test_invariants.js
```

**Expected Result:**
The script scans the entire MongoDB instance across 10 critical business rules. It serves as an automated security net that catches the "poisoned" data generated in Step 4.1.

*Terminal Output Example:*

```text
==================================================
📊 KẾT QUẢ QUÉT DATABASE (INVARIANTS REPORT)
==================================================

✅ [TEST 1 PASSED]: 100% User có Email hợp lệ.
✅ [TEST 2 PASSED]: 100% Sản phẩm có giá niêm yết hợp lệ.
❌ [TEST 3 FAILED]: Phát hiện 1 đơn hàng bị mất địa chỉ giao hàng!
   👉 ID vi phạm: [6a3a5e8dc4810551abd67208]
❌ [TEST 4 FAILED]: Phát hiện 1 đơn hàng sai logic tài chính (VD: Thuế âm, Tổng tiền KHÔNG BẰNG Items + Tax + Shipping)!
   👉 ID vi phạm: [6a3a5e8dc4810551abd67207]
✅ [TEST 5 PASSED]: 100% Phương thức thanh toán chuẩn hóa.
❌ [TEST 6 FAILED]: Phát hiện 1 order item(s) mồ côi (tham chiếu đến Sản phẩm không tồn tại trong kho)!
   👉 ID vi phạm (Đơn hàng): [6a3a5e8dc4810551abd67206]
✅ [TEST 7 PASSED]: 100% Email trong hệ thống là duy nhất (Unique Index Guarantee).
❌ [TEST 8 FAILED]: Phát hiện 1 đơn hàng có trạng thái 'Đã thanh toán' (hoặc 'Đã giao') nhưng thiếu ngày giao (hoặc ngày thanh toán)!
   👉 ID vi phạm: [6a3a5e8dc4810551abd67209]
✅ [TEST 9 PASSED]: 100% Sản phẩm có số lượng Tồn kho và Điểm đánh giá (Rating) hợp lệ.
✅ [TEST 10 PASSED]: 100% Đơn hàng có liên kết với User hợp lệ.

==================================================
🚨 CẢNH BÁO: HỆ THỐNG ĐANG TỒN TẠI 4 LỖI DỮ LIỆU CẦN XỬ LÝ GẤP!
==================================================
```

**Key Concepts Tested:**

- **Null/Boundary Constraints (Tests 1, 3):** Identifies missing mandatory fields (e.g., Email, Shipping Address).
- **Mathematical & Value Constraints (Tests 2, 4, 5, 9):** Validates Enum properties, positive integers, bounds (Rating $\le$ 5), and financial logic ($TotalPrice = Items + Tax + Shipping$).
- **State Synchronization (Test 8):** Ensures logical parity between boolean states and timestamps (e.g., `isPaid` must have a corresponding `paidAt` date).
- **Referential Integrity / Virtual Foreign Keys (Tests 6, 10):** Uses the `$lookup` pipeline to flag **Orphaned Documents**—such as an order referencing a deleted product or a deleted user account.
- **Unique Indexing (Test 7):** Scans for duplicated emails across multiple users to prevent authentication conflicts.

## 5. Troubleshooting

- **Error:** `module is not defined in ES module scope`
  - **Fix:** Ensure your `migrate-mongo-config.js` uses `export default` and `moduleSystem: 'esm'` instead of CommonJS `module.exports`.
- **Error:** `No url defined in config file!` or `Cannot read properties of undefined (reading 'startsWith')`
  - **Fix:** The `.env` file is not being loaded. Ensure you are running the commands from the correct root directory where the `.env` file is located, or provide the direct MongoDB URI string in the config file.
- **Error:** `MongoServerSelectionError: connection timed out`
  - **Fix:** MongoDB Atlas is blocking your connection. Go to the Atlas Dashboard -> Network Access -> Add IP Address -> Select "Allow Access From Anywhere" (`0.0.0.0/0`).
- **Error:** `options usenewurlparser, useunifiedtopology are not supported`
  - **Fix:** Remove these deprecated options from the `migrate-mongo-config.js` file (Supported MongoDB driver version > 4.0).

## 6. References

- [migrate-mongo Official Documentation](https://github.com/seppevs/migrate-mongo)
- [MongoDB Aggregation Pipeline (`$lookup`)](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/)
- [Google Gemini API Node.js SDK](https://ai.google.dev/docs)
- [Faker.js Documentation](https://fakerjs.dev/)

