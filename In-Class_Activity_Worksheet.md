### WORKSHEET: HUMAN SCANNER VS. AI CHAOS

**Thông tin Nhóm làm bài:**

- **Nhóm:** ......................................................................................
- **Thành viên 1:** ..................................................................................
- **Thành viên 2:** ..................................................................................
- **Thành viên 3:** ..................................................................................
- **Thành viên 4:** ..................................................................................

---

**Câu hỏi 1 (Invariants Check):** Tìm ra **các vi phạm logic nghiệp vụ** đang bị ẩn giấu trong Bảng Orders.

**Câu hỏi 2 (Data Masking):** Tìm tất cả các **trường (fields) hoặc đoạn text** có nguy cơ làm lộ dữ liệu cá nhân (PII), cần phải được che giấu.

#### Phần 1: Bảng Khách Hàng (Users Collection)

```json
[
  { "_id": "USER_88", "email": "alice@gmail.com", "name": "Alice" },
  { "_id": "USER_99", "email": "bob@gmail.com", "name": "Bob" }
]
```

#### Phần 2: Bảng Sản Phẩm (Products Collection)

```json
[
  { "_id": "PROD_001", "name": "iPhone 15", "price": 1000 },
  { "_id": "PROD_002", "name": "MacBook Air", "price": 1500 }
]
```

#### Phần 3: Bảng Đơn Hàng (Orders Collection)

```json
[
  {
    "_id": "ORD_001",
    "user": "USER_99",
    "orderItems": [{ "product": "PROD_001", "qty": 1 }],
    "shippingAddress": {
      "address": "123 Đường A",
      "city": "HCM",
      "postalCode": "70000",
      "country": "Vietnam"
    },
    "notes": "Giao cho anh Nhân, gọi số 0987.654.321 trước khi đến. Cổng nhà mã số 1234.",
    "itemsPrice": 1000,
    "taxPrice": 100,
    "shippingPrice": 50,
    "totalPrice": 1150,
    "isPaid": true,
    "paidAt": "2026-07-01T10:00:00Z"
  },
  {
    "_id": "ORD_002",
    "user": "USER_99",
    "orderItems": [{ "product": "PROD_003", "qty": 1 }],
    "notes": "Nhờ bảo vệ chung cư nhận hộ.",
    "itemsPrice": 500,
    "taxPrice": 0,
    "shippingPrice": 0,
    "totalPrice": 500,
    "isPaid": false
  },
  {
    "_id": "ORD_003",
    "user": "USER_88",
    "orderItems": [{ "product": "PROD_002", "qty": 1 }],
    "notes": "Thanh toán bằng thẻ VISA đuôi 4444. Vui lòng đóng gói kỹ.",
    "itemsPrice": 1500,
    "taxPrice": 100,
    "shippingPrice": 0,
    "totalPrice": 9999,
    "isPaid": true
  }
]
```
