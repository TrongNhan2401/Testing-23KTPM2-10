# Database Testing & Version Control Guide (ProShop-v2)

## 1. Giới thiệu

Chào mừng bạn đến với hướng dẫn về Database Testing và Schema Versioning cho dự án ProShop-v2. Khác với các database SQL truyền thống, các database NoSQL (MongoDB) không có sẵn schema enforcement và referential integrity (Foreign Keys) tích hợp.

Hướng dẫn này trình bày một kiến trúc testing toàn diện giải quyết các điểm yếu của NoSQL thông qua:

- **Schema Versioning & Rollback:** Sử dụng `migrate-mongo` để an toàn apply và revert các thay đổi schema database.
- **AI-Assisted Data Generation & Masking:** Tích hợp Google Gemini AI và Faker.js để tạo synthetic edge-case data và mask các PII (Personally Identifiable Information) mà không làm hỏng cấu trúc JSON.
- **Business Invariants Testing:** Các script Node.js tự động phát hiện data anomaly và orphaned documents (Dead Links).

## 2. Cài đặt

### Yêu cầu hệ thống

- **Node.js** (v18 trở lên)
- **MongoDB Atlas** account (hoặc MongoDB server local)
- **Google Gemini API Key** (để sử dụng AI data masking/generation)

### Hướng dẫn cài đặt

#### Bước 1 — Clone repository

```bash
git clone https://github.com/bradtraversy/proshop-v2.git
cd proshop-v2
```

#### Bước 2 — Thiết lập MongoDB Atlas

- Truy cập [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) và đăng ký / đăng nhập
- Tạo **Free Cluster** (M0 Sandbox), chọn region gần bạn nhất (ví dụ: Singapore)
- Vào **Security → Network Access** → **Add IP Address** → chọn **Allow Access from Anywhere** (0.0.0.0/0) cho môi trường development
- Vào **Security → Database Access** → **Add New Database User**, đặt username và password, cấp quyền **Read and write to any database**, và lưu lại password
- Vào **Database** → click **Connect** trên cluster của bạn → **Connect your application** → copy connection string:

```bash
mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/?retryWrites=true&w=majority
```

#### Bước 3 — Cài đặt các dependencies của project

```bash
npm install
```

> Cài đặt tất cả base dependencies đã được liệt kê sẵn trong `package.json` (bao gồm `dotenv` và `mongoose`). Các cảnh báo deprecation và audit vulnerability có thể xuất hiện — đây là từ các sub-dependencies bên thứ ba và không ảnh hưởng đến quá trình cài đặt, không cần thao tác gì thêm.

#### Bước 4 — Cài đặt các dependencies cho data masking & migration

```bash
npm install migrate-mongo @faker-js/faker @google/generative-ai mongodb
```


| Package                 | Mục đích                                                                                        | Đã có trong package.json?   |
| ----------------------- | ----------------------------------------------------------------------------------------------- | --------------------------- |
| `migrate-mongo`         | Database migration tool (CLI đi kèm)                                                            | Không                       |
| `@faker-js/faker`       | Tạo fake data để masking                                                                        | Không                       |
| `@google/generative-ai` | Gemini AI SDK cho việc masking bằng AI                                                          | Không                       |
| `mongodb`               | MongoDB driver — được migrate-mongo yêu cầu trực tiếp (tách biệt với `mongoose` mà app sử dụng) | Không                       |
| ~~`dotenv`~~            | Load các biến môi trường `.env`                                                                 | **Có — đã cài sẵn, bỏ qua** |


#### Bước 5 — Khởi tạo migration tool

```bash
npx migrate-mongo init
```

Lệnh này tạo ra `migrate-mongo-config.js` và thư mục `migrations/` trong thư mục gốc của project. Package được coi là đã cài đặt thành công khi lệnh này chạy xong mà không có lỗi.

#### Bước 6 — Cấu hình `.env`

Tạo hoặc cập nhật file `.env` trong thư mục gốc:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/proshop?retryWrites=true&w=majority
GEMINI_API_KEY=your_google_gemini_api_key
```

#### Bước 7 — Cấu hình `migrate-mongo-config.js` (ESM)

Vì ProShop sử dụng ES Modules (`"type": "module"` trong `package.json`), hãy ghi đè file `migrate-mongo-config.js` đã được tạo bằng nội dung sau:

```javascript
import dotenv from "dotenv";
dotenv.config();

export default {
  mongodb: {
    url: process.env.MONGO_URI,
    databaseName: "proshop",
    options: {}, // Để trống cho MongoDB Driver v4.0+
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",
  moduleSystem: "esm", // Bắt buộc dùng ES Module
};
```

## 3. First Test (Migration & Rollback)

Test này xác minh khả năng upgrade database schema và safely revert mà không mất dữ liệu. Tất cả các lệnh được thực thi trực tiếp từ thư mục gốc của project.

**Bước 1: Tạo một Test Migration File**
Tạo script migration mới bằng lệnh sau trong thư mục gốc:

```
npx migrate-mongo create initial_test_migration
```

- Kết quả mong đợi: Một file mới được tạo trong thư mục `migrations/` tại thư mục gốc với prefix là timestamp (ví dụ: `20260621075815-initial_test_migration.js`).

**Bước 2: Implement Migration Logic**

```
export const up = async (db, client) => {
    // Test: Thêm một trường test tạm thời vào tất cả products
    await db.collection('products').updateMany(
        {},
        { $set: { testField: "Migration is working!" } }
    );
};

export const down = async (db, client) => {
    // Revert: Xóa hoàn toàn trường test tạm thời khỏi tất cả products
    await db.collection('products').updateMany(
        {},
        { $unset: { testField: "" } }
    );
};
```

**Bước 3: Kiểm tra Migration Status ban đầu**

```bash
npx migrate-mongo status
```

*Kết quả mong đợi:*

```
┌──────────────────────────────────────────┬────────────┬─────────────────┐
│ Filename                                 │ Applied At │ Migration block │
├──────────────────────────────────────────┼────────────┼─────────────────┤
│20260621075815initial_test_migration.js   │  PENDING   │                 │
└──────────────────────────────────────────┴────────────┴─────────────────┘
```

**Bước 4: Thực thi Migration (Up)**
Apply các thay đổi schema trực tiếp vào MongoDB database instance của bạn:

```
npx migrate-mongo up
```

*Kết quả mong đợi:*

- Terminal log: `MIGRATED UP: ...-initial_test_migration.js`
- Status Update: Nếu chạy lại `npx migrate-mongo status`, bảng sẽ ghi lại timestamp thực thi chính xác và gán migration block number:
Ví dụ:

```
┌──────────────────────────────────────────┬──────────────────────────┬─────────────────┐
│ Filename                                 │ Applied At               │ Migration block │
├──────────────────────────────────────────┼──────────────────────────┼─────────────────┤
│ 20260621075815-initial_test_migration.js │ 2026-06-21 15:12:34 UTC  │ 178202896604    │
└──────────────────────────────────────────┴──────────────────────────┴─────────────────┘
```

- Database Verification: Kiểm tra products collection qua MongoDB Compass hoặc Atlas. Mọi product document giờ sẽ chứa "testField": "Migration is working!"

Ví dụ:

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

**Bước 5: Thực thi Rollback (Down)**
Revert database schema về trạng thái ban đầu để đảm bảo logic rollback có thể dọn dẹp thành công:

```
npx migrate-mongo down
```

*Kết quả mong đợi:*

- Terminal log: `MIGRATED DOWN: ...-initial_test_migration.js`
- Status Update: Nếu chạy lại `npx migrate-mongo status`, bảng sẽ ghi lại trạng thái:
Ví dụ:

```
┌──────────────────────────────────────────┬────────────┬─────────────────┐
│ Filename                                 │ Applied At │ Migration block │
├──────────────────────────────────────────┼────────────┼─────────────────┤
│20260621075815-initial_test_migration.js  │  PENDING   │                 │
└──────────────────────────────────────────┴────────────┴─────────────────┘
```

- Database Cleanup: Trong MongoDB instance, testField sẽ được xóa hoàn toàn ($unset), khôi phục product documents về đúng cấu trúc Mongoose schema ban đầu.

## 4. Advanced Usage

Ngoài các thay đổi về cấu trúc, các quy trình QA truyền thống gặp khó khăn trong việc tạo valid test data và bảo vệ real user data trong quá trình NoSQL integration testing. Chúng tôi đã triển khai một automated testing suite dựa trên AI và Node.js trong thư mục `backend/` để giải quyết vấn đề này.

### 4.1. AI-Assisted Synthetic Data Generation

Việc tạo edge-case data thủ công rất tốn thời gian. Chúng tôi sử dụng Google Gemini AI như một automated QA engineer để đọc Mongoose Schema và cố tình inject các "poisoned" test cases vào database.

**Bước 1: Chạy Generator Script**
Thực thi lệnh sau từ thư mục gốc:

```bash
node backend/generate_test_data.js
```

**Kết quả mong đợi:**
Script sẽ prompt Gemini tạo và insert chính xác 3 document scenarios vào `orders` collection:

1. Một order "Happy Path" hợp lệ.
2. Một order có logic error (ví dụ: `taxPrice` âm hoặc tổng tiền không đúng).
3. Một order thiếu boundary data (ví dụ: hoàn toàn thiếu object `shippingAddress`).

### 4.2. Intelligent Data Masking (PII Protection)

Khi pull production data vào môi trường testing, Personally Identifiable Information (PII) cần được che giấu mà không phá vỡ cấu trúc JSON tree của hệ thống.

**Bước 1: Chạy Masking Script**

```bash
node backend/data_masking.js
```

**Kết quả mong đợi:**
Script áp dụng chiến lược masking lai:

- **Faker.js** xử lý các flat fields ngay lập tức, thay thế `name` và `email` thật bằng mock data.
- **Gemini AI** xử lý object `shippingAddress` phức tạp, không có cấu trúc. Nó diễn giải context địa lý (ví dụ: "Vietnam") và tạo địa chỉ fake thực tế, localization cao trong khi vẫn tuân thủ nghiêm ngặt JSON schema để tránh application crash.

### 4.3. Business Invariants Testing

Vì các database NoSQL (như MongoDB) không có constraint, schema, hay referential integrity (Foreign Keys) tự nhiên, invalid data có thể dễ dàng làm crash frontend application.

Để giảm thiểu điều này, chúng tôi đã xây dựng một comprehensive validation scanner sử dụng Node.js và MongoDB Aggregation Pipelines.

**Bước 1: Thực thi Invariants Scanner**

```bash
node backend/test_invariants.js
```

**Kết quả mong đợi:**
Script quét toàn bộ MongoDB instance qua 10 business rules quan trọng. Nó đóng vai trò như một automated security net phát hiện các "poisoned" data đã được tạo ở Bước 4.1.

*Ví dụ Terminal Output:*

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

**Các khái niệm chính được test:**

- **Null/Boundary Constraints (Tests 1, 3):** Xác định các mandatory fields bị thiếu (ví dụ: Email, Shipping Address).
- **Mathematical & Value Constraints (Tests 2, 4, 5, 9):** Validate các Enum properties, số nguyên dương, bounds (Rating ≤ 5), và logic tài chính ($TotalPrice = Items + Tax + Shipping$).
- **State Synchronization (Test 8):** Đảm bảo parity logic giữa boolean states và timestamps (ví dụ: `isPaid` phải có `paidAt` tương ứng).
- **Referential Integrity / Virtual Foreign Keys (Tests 6, 10):** Sử dụng `$lookup` pipeline để đánh dấu **Orphaned Documents** — ví dụ: order tham chiếu đến product hoặc user account đã bị xóa.
- **Unique Indexing (Test 7):** Quét các email trùng lặp giữa nhiều users để ngăn conflict về authentication.

### 4.4. AI Agent Skill for Invariant Testing

Thay vì chạy một script được viết sẵn, bạn có thể sử dụng Cursor AI Agent kết hợp với một skill file để **tự động sinh invariant test scripts** phù hợp với bất kỳ collection nào trong database. Cách tiếp cận này tự động thích ứng với schema thực tế của bạn.

**Bước 1: Import Skill**

**Bước 2: Prompt Agent**

Mở một Agent chat mới và mô tả collection nào bạn muốn test. Ví dụ:

```
Use the nosql-invariant-testing skill to generate invariant tests
for the [collection_name] collection.
```

Thay `[collection_name]` bằng collection mục tiêu của bạn (ví dụ: `orders`, `products`, `users`). Agent sẽ:

1. **Discover** — Khám phá MongoDB schema và field definitions thực tế của bạn
2. **Classify** — Phân loại các relationships và denormalized fields
3. **Derive** — Xác định các invariant candidates phù hợp (structural, uniqueness, referential, business-rule, temporal, PII)
4. **Generate** — Sinh một standalone test script (`.js` hoặc `.py`) cho collection đó
5. **Report** — Xuất bảng tổng hợp với tất cả invariants đã implement

**Bước 3: Chạy Test đã được sinh ra**

```bash
node backend/test_[collection_name]_invariants.js
```

Hoặc, nếu có script runner:

```bash
node backend/runAllInvariants.js
```

**Kết quả mong đợi:**

Agent xuất một markdown report liệt kê tất cả invariants đã test, trạng thái pass/fail, và các business rules `[ASSUMED]` cần bạn xác nhận.

> **Lưu ý:** Phần `[ASSUMED]` rất quan trọng cho các project seminar — nó ghi lại các business rules mà AI suy luận từ schema. Hãy review và xác nhận trước khi nộp deliverable của bạn.

## 5. Xử lý sự cố

**Sự cố 1: Environment Variables không được load**

- Error: `Error: The` uri`parameter to`openUri()`must be a string, got "undefined". Make sure the first parameter to`mongoose.connect()`or`mongoose.createConnection() `is a string.`
- Khi nào: Chạy `npm run dev`
- Nguyên nhân: File môi trường được đặt tên là `.env.example` thay vì `.env`, nên application không thể load các biến môi trường.
- Khắc phục: Đổi tên file từ `.env.example` thành `.env`.

**Sự cố 2: Kết nối MongoDB thất bại**

- Error: `Error: Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted.`
- Khi nào: Chạy `npm run dev`
- Nguyên nhân: MongoDB không được cấu hình với địa chỉ IP 0.0.0.0/0 (cho phép tất cả).
- Khắc phục: Truy cập Atlas Dashboard → Security → Network Access → IP ACCESS List → Add IP Address → Thêm `0.0.0.0/0` (Allow Access From Everywhere).

**Sự cố 3: Xung đột ES Module và CommonJS**

- Error: `ERROR: module is not defined in ES module scope`
`This file is being treated as an ES module because it has a '.js' file extension and 'package.json' contains "type": "module".`
- Khi nào: Chạy `npx migrate-mongo create initial_test_migration`
- Nguyên nhân: `package.json` được định nghĩa với type là ESM nhưng `migrate-mongo-config.js` được định nghĩa bằng CommonJS.
- Khắc phục: Đảm bảo `migrate-mongo-config.js` sử dụng `export default` và `moduleSystem: 'esm'` thay vì CommonJS `module.exports`.

## 6. Tài liệu tham khảo

- [migrate-mongo Official Documentation](https://github.com/seppevs/migrate-mongo)
- [MongoDB Aggregation Pipeline (`$lookup`)](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/)
- [Google Gemini API Node.js SDK](https://ai.google.dev/docs)
- [Faker.js Documentation](https://fakerjs.dev/)

