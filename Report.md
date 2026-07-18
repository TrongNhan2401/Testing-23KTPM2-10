# BÁO CÁO SEMINAR DATABASE TESTING

## 1. Tổng quan Hệ thống & Dự án

- **Môn học:** CS423 / CSC15003 — Kiểm thử phần mềm.

- **Thành viên (Nhóm 10):** Lê Gia Bảo, Hồ Gia Huy, Trần Phạm Trọng Nhân, Trần Thanh Trí.

- **Hệ thống thử nghiệm (SUT):** Dự án Proshop-v2. Link: https://github.com/bradtraversy/proshop-v2

- **Đặc điểm nền tảng:** Đây là ứng dụng thương mại điện tử được xây dựng bằng Node.js và MongoDB.

- **Thách thức Schema:** Khác với cơ sở dữ liệu SQL truyền thống, MongoDB là cơ sở dữ liệu phi cấu trúc (NoSQL), không có sẵn tính năng bắt buộc tuân thủ lược đồ (schema enforcement) và thiếu tính toàn vẹn tham chiếu (Foreign Keys).

## 2. Cấu trúc Database Schema Cơ bản

Dựa trên các kịch bản kiểm thử và dữ liệu mô phỏng, cấu trúc các Schema (Collection) trong hệ thống Proshop-v2 bao gồm các trường dữ liệu sau:

### 2.1. Users Collection

- **`_id`**: Mã định danh của người dùng (ví dụ: `USER_88`, `USER_99`).

- **`email`**: Địa chỉ thư điện tử của người dùng (ví dụ: `alice@gmail.com`).

- **`name`**: Tên của người dùng.

### 2.2. Products Collection

- **Định danh & Thông tin cơ bản:** Gồm các trường `_id`, `name`, `price`, `image`, `brand`, `category`, `description`.

- **Đánh giá & Tồn kho:** Gồm `rating`, `numReviews`, `countInStock`, và mảng `reviews`.

- **Bên trong mảng `reviews`:** Chứa thông tin của từng đánh giá gồm `name`, `rating`, `comment`, `user` (tham chiếu ObjectId), `createdAt`, và `updatedAt`.

- **Truy xuất & Mở rộng:** Chứa trường tham chiếu người tạo `user`, các mốc thời gian `createdAt`, `updatedAt`, và có thể thêm các trường tạm thời qua migration (ví dụ: `testField`).

### 2.3. Orders Collection

- **Thông tin giao dịch:** Chứa `_id` và tham chiếu người mua `user`.

- **Chi tiết giỏ hàng:** Mảng `orderItems` chứa các sản phẩm (`product`) và số lượng (`qty`).

- **Địa chỉ giao hàng (`shippingAddress`):** Là một đối tượng JSON lồng nhau (Nested JSON) bao gồm `address`, `city`, `postalCode`, và `country`.

- **Tài chính:** Các trường tính toán gồm `itemsPrice`, `taxPrice`, `shippingPrice`, và `totalPrice`.

- **Trạng thái & Ghi chú:** Chứa cờ boolean `isPaid`, mốc thời gian `paidAt`, và trường văn bản tự do `notes` (ghi chú giao hàng).

## 3. Quản lý Phiên bản Schema (Database Migration)

Do đặc tính lược đồ linh hoạt (schema-less) của MongoDB, dữ liệu có nguy cơ bị phân mảnh (ví dụ: document cũ dùng `name`, document mới dùng `fullName`). Việc triển khai mã nguồn mới trên dữ liệu cũ có thể gây lỗi `undefined` và sập ứng dụng.

- **Công cụ lựa chọn chính:** `migrate-mongo`.

- **Công cụ dự phòng:** `Liquibase` kết hợp MongoDB Extension (tuy nhiên công cụ này cấu hình cồng kềnh bằng XML/YAML/JSON).

- **Cơ chế hoạt động của `migrate-mongo`:**
- Sử dụng mã Node.js cơ bản để quản lý sự thay đổi cấu trúc document.

- Hàm `up()` được dùng để thực thi kịch bản chuyển đổi và nâng cấp dữ liệu.

- Hàm `down()` được dùng để hoàn tác (rollback) và đảo ngược quá trình an toàn nếu bản cập nhật bị lỗi.

- **Lưu lịch sử:** Công cụ tự động lưu vết các file đã chạy vào một collection có tên là `changelog` riêng trong database.

- **Cấu hình:** Sử dụng tệp `migrate-mongo-config.js` với thiết lập `moduleSystem: "esm"` để ép thực thi dạng ES Module tương thích với ProShop-v2.

## 4. Kiểm thử Toàn vẹn Lược đồ (Business Invariants Testing)

Vì thiếu Khóa ngoại (Foreign Keys), dữ liệu không hợp lệ có thể dễ dàng làm sập ứng dụng frontend. Nhóm thực hiện rà soát các vi phạm logic bằng tập lệnh Node.js và MongoDB Aggregation Pipelines. Các bài test toàn vẹn (Invariants Check) xử lý các trường hợp vi phạm Schema sau:

- **Lỗi Ràng buộc Biên (Missing Boundary):** Thiếu các trường bắt buộc, ví dụ đơn hàng bị mất hoàn toàn đối tượng `shippingAddress`.

- **Lỗi Logic Tài chính (Financial Logic):** Trường `totalPrice` tính toán sai lệch, không bằng tổng của Items, Tax và Shipping (hoặc thuế bị âm).

- **Lỗi Dữ liệu Mồ côi (Orphaned Data / Referential Integrity):** Hệ thống phát hiện order item tham chiếu đến một Sản phẩm không còn tồn tại trong kho lưu trữ.

- **Bất đồng bộ Trạng thái (State Inconsistency):** Đơn hàng có cờ `isPaid` (Đã thanh toán) là `true`, nhưng lại thiếu trường mốc thời gian `paidAt`.

- **Đảm bảo tính duy nhất:** Quét kiểm tra để đảm bảo trường `email` của User trong hệ thống là duy nhất (Unique Index Guarantee).

_Lưu ý: Để giải quyết khó khăn khi phải viết test thủ công lặp lại cho từng collection, nhóm sử dụng Agent Skill để AI Agent tự đọc schema thật từ model và tự sinh file test độc lập cho mỗi collection, đảm bảo không tự bịa ra field_.

## 5. Sinh & Che giấu Dữ liệu dựa trên AI (Data Generation & Masking)

Nhóm tích hợp Google Gemini AI và thư viện Node.js để kiểm thử mà không làm vỡ cấu trúc JSON. Mọi kết quả từ AI đều được con người rà soát, kiểm chứng thủ công trước khi áp dụng để đảm bảo an toàn.

- **Sinh dữ liệu kiểm thử (Synthetic Data Generation):**
- Gemini được cấp đúng cấu trúc schema thông qua prompt.

- AI tự động sinh 3 kịch bản: đơn hàng hợp lệ (Happy Path), đơn hàng vi phạm logic giá (Negative test), và đơn hàng thiếu trường (Boundary test).

- Tập lệnh tự động chuyển đổi chuỗi 24 ký tự hex thành định dạng `ObjectId` chuẩn trước khi chèn vào MongoDB.

- **Che giấu dữ liệu thông minh (Intelligent Data Masking):**
- Áp dụng chiến thuật che giấu kết hợp (Hybrid AI Data Masking).

- **Với các trường phẳng (Flat fields):** Dùng `@faker-js/faker` để thay thế tức thì các dữ liệu định danh cá nhân đơn giản như `name` và `email` với hiệu năng cao.

- **Với các đối tượng lồng nhau (Nested JSON):** Gemini AI phân tích ngữ cảnh của các cấu trúc phức tạp như `shippingAddress`. Nó giữ nguyên cấu trúc schema, tuân thủ định dạng mã bưu điện và sinh ra địa chỉ giả thực tế theo đúng quốc gia mà không làm hỏng document.

- Gemini AI cũng được dùng để dò tìm các dữ liệu nhạy cảm dễ bị bỏ sót trong các trường văn bản tự do (ví dụ: đoạn text ghi chú giao hàng `notes`).

## 6. BẢNG ĐÁNH GIÁ THÀNH VIÊN VÀ MỨC ĐỘ ĐÓNG GÓP

| STT   | Họ và tên            | MSSV     | Nhiệm vụ                                                                                                                                       | Đánh giá                                   | Mức độ hoàn thành |
| :---- | :------------------- | :------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------- | :---------------- |
| **1** | Hồ Gia Huy           | 23127376 | Phụ trách phần Mở đầu & Tổng quan Seminar; Giới thiệu tầm quan trọng của Database Testing và hai công cụ cốt lõi (`migrate-mongo`, Gemini AI). | Tích cực và hoàn thành tốt, đúng thời hạn. | **100%**          |
| **2** | Trần Thanh Trí       | 23127503 | Nghiên cứu tích hợp `migrate-mongo` (Quản lý phiên bản); Xây dựng script sinh dữ liệu biên bằng AI; Thiết kế kịch bản Live Demo.               | Tích cực và hoàn thành tốt, đúng thời hạn. | **100%**          |
| **3** | Trần Phạm Trọng Nhân | 23127443 | Phát triển giải pháp Kiểm thử Toàn vẹn (Business Invariants Testing); Đóng gói quy trình thành Agent Skill cho AI để tự động sinh test case.   | Tích cực và hoàn thành tốt, đúng thời hạn. | **100%**          |
| **4** | Lê Gia Bảo           | 23127325 | Phụ trách tính năng Che giấu dữ liệu (Data Masking); Kết hợp thư viện `Faker.js` cho các trường phẳng và `Gemini AI` cho các JSON lồng nhau.   | Tích cực và hoàn thành tốt, đúng thời hạn. | **100%**          |
