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

1. Navigate to the backend directory and install the required testing dependencies:
   ```bash
   cd backend
   npm install migrate-mongo @faker-js/faker @google/generative-ai dotenv mongodb
   ```

````
2. Initialize the migration tool:
   ```bash
npx migrate-mongo init
````

3. Configure Environment Variables: Create or update your `.env` file in the root directory.
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/proshop?retryWrites=true&w=majority
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

````
4. **ESM Configuration (Critical):** Since ProShop uses ES Modules, overwrite the generated `migrate-mongo-config.js` with the following:
   ```javascript
   import dotenv from 'dotenv';
   dotenv.config();

   export default {
     mongodb: {
       url: process.env.MONGO_URI,
       databaseName: "proshop",
       options: {} // Keep empty for MongoDB Driver v4.0+
     },
     migrationsDir: "migrations",
     changelogCollectionName: "changelog",
     migrationFileExtension: ".js",
     moduleSystem: 'esm', // Forces ES Module execution
   };
````

## 3. First Test (Migration & Rollback)

This test verifies the system's ability to upgrade the database schema and safely revert it without data loss.

_Scenario: Renaming the `name` field to `fullName` in the `users` collection._

**Step 1: Verify current status**

```bash
npx migrate-mongo status
```

_Expected: The target migration file shows `PENDING`._

**Step 2: Execute Migration (Up)**

```bash
npx migrate-mongo up
```

_Expected: Database schema is updated. The `name` field becomes `fullName`. Status changes to `APPLIED`._

**Step 3: Execute Rollback (Down)**

```bash
npx migrate-mongo down
```

_Expected: Schema reverts to the original state safely. The `fullName` field reverts to `name`. Status changes to `PENDING`._

## 4. Advanced Usage

Beyond structural changes, we implemented automated data testing scripts located in the `backend/` directory.

### 4.1. AI-Assisted Test Data Generation & Masking

- **Generate Synthetic Data:** Run `node backend/generate_test_data.js` to prompt Gemini AI to generate boundary test cases (e.g., negative prices, missing addresses) based on our Mongoose schema.
- **Data Masking:** Run `node backend/demo_masking.js` to mask real user data. It uses Faker for standard PII (Names, Emails) and Gemini AI to contextually rewrite unstructured nested JSON like `shippingAddress` while maintaining geographical logic.

### 4.2. Invariants Testing (Orphaned Data Detection)

Run the core testing suite to scan the entire MongoDB instance for business logic violations:

```bash
node backend/test_invariants.js
```

This script executes 6 structural tests, highlighting:

- Missing mandatory fields (Email, Shipping Address).
- Financial calculation mismatches (`totalPrice` vs `itemsPrice + taxPrice`).
- **Orphaned Documents (Missing Foreign Keys):** Uses MongoDB Aggregation (`$lookup`) to identify `orderItems` referencing a `product` that has been deleted, preventing Frontend UI crashes.

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
