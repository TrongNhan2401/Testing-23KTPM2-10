# BẢN ĐỀ XUẤT KHẢO SÁT CÔNG CỤ: T08 — KIỂM THỬ CƠ SỞ DỮ LIỆU

**Môn học:** CS423 / CSC15003 — Kiểm thử phần mềm

**Nhóm**: 10

**Thành viên nhóm:**

- Lê Gia Bảo - 23127325
- Hồ Gia Huy - 23127376
- Trần Phạm Trọng Nhân - 23127443
- Trần Thanh Trí - 23127503

**Mã đề tài:** T08 — Database Testing

---

## 1. Các công cụ đề xuất

- **Công cụ truyền thống:** Liquibase (Lựa chọn chính)
- **Định hướng tích hợp AI:** Tập lệnh Node.js (`@faker-js/faker`) hỗ trợ bởi Gemini (Lựa chọn chính)
- **Công cụ dự phòng:** Flyway

## 2. Ma trận so sánh các công cụ

| Tiêu chí so sánh                  | Liquibase (Lựa chọn chính)                                  | Flyway (Công cụ dự phòng)                                    | Gemini + Node.js Faker (AI chính)                                    |
| :-------------------------------- | :---------------------------------------------------------- | :----------------------------------------------------------- | :------------------------------------------------------------------- |
| **Chi phí bản quyền**             | Bản Community (Miễn phí / Mã nguồn mở)                      | Bản Community (Miễn phí / Mã nguồn mở)                       | Gói Free Tier (Gemini Web / Gemini API)                              |
| **Lộ trình học (Learning Curve)** | Thấp (Sử dụng Formatted SQL thuần túy)                      | Thấp (Viết mã di chuyển bằng các tệp SQL thuần)              | Thấp đến Trung bình (Sử dụng câu lệnh prompt bằng ngôn ngữ tự nhiên) |
| **Mức độ phù hợp với EShop**      | Tốt (Hỗ trợ SQLite đầy đủ, quản lý trạng thái DB chặt chẽ)  | Hoàn hảo (Nhẹ nhàng, hỗ trợ trực tiếp thông qua các tệp SQL) | Hoàn hảo (Cực kỳ linh hoạt, tự thích ứng với mọi lược đồ database)   |
| **Năng lực AI**                   | Không có (Công cụ quản lý chuyên biệt thuần túy)            | Không có (Công cụ truyền thống thuần túy)                    | Cao (Tự động phát hiện dữ liệu nhạy cảm PII và sinh quy tắc ẩn danh) |
| **Cộng đồng hỗ trợ**              | Rất mạnh trong phân khúc hệ thống doanh nghiệp (Enterprise) | Lớn mạnh, tài liệu hướng dẫn cực kỳ phong phú                | Hệ sinh thái tự động hóa bằng AI đang bùng nổ mạnh mẽ                |

## 3. Lựa chọn đề xuất và Lý do kiểm chứng

Nhóm đề xuất chọn bộ đôi **Liquibase** (Truyền thống) và **Tập lệnh Node.js kết hợp thư viện `@faker-js/faker` do Gemini hỗ trợ kỹ thuật** (AI) làm trọng tâm nghiên cứu vì 3 lý do cốt lõi sau:

- **Khả năng kiểm thử Migration và Hoàn tác (Rollback) chuyên sâu:** So với Flyway (bản miễn phí chỉ hỗ trợ di chuyển tiến lên), Liquibase vượt trội hơn ở khả năng hỗ trợ tính năng tự động Rollback hoặc định nghĩa kịch bản hoàn tác cực kỳ chặt chẽ thông qua các tệp cấu hình (XML/YAML/JSON). Điều này giúp nhóm hoàn thành xuất sắc mục tiêu kiểm thử di chuyển dữ liệu một cách an toàn mà không làm mất mát dữ liệu cũ của EShop.
- **Độc lập và an toàn về mặt cấu trúc lược đồ (Schema Invariants):** Thao tác thông qua cấu trúc trừu tượng của Liquibase đảm bảo tính toàn vẹn tham chiếu và ràng buộc dữ liệu (`NOT NULL`, `UNIQUE`) được kiểm soát nghiêm ngặt. Việc chọn Flyway làm công cụ dự phòng sẽ tạo ra một góc nhìn đối chiếu hoàn hảo trong bài thuyết trình về việc quản lý DB bằng SQL thô và quản lý DB bằng cấu hình có định dạng.
- **Che giấu dữ liệu thông minh hiểu ngữ cảnh qua Gemini:** Bằng cách cung cấp cấu trúc bảng hiện tại của EShop cho Gemini, AI sẽ đóng vai trò kiến trúc sư phân tích để viết ra một tập lệnh Node.js sử dụng thư viện `@faker-js/faker`. Tập lệnh này sẽ quét qua SQLite, tự động phát hiện và ghi đè dữ liệu giả lập chuẩn định dạng vào các trường PII nhạy cảm (`email`, `phone`, `shipping_address`). Quy trình này bảo vệ an toàn thông tin định danh nhưng vẫn giữ cho các bài kiểm thử chức năng của hệ thống (như đăng nhập, tìm kiếm) không bị lỗi.

## 4. Công khai AI và Quy trình đối chiếu thông tin (AI Disclosure)

- **Các công cụ AI đã sử dụng:** Nhóm đã sử dụng Google Gemini (Mô hình 2.5 Flash) để thực hiện khảo sát sơ bộ thị trường về các khung kiểm thử DB mã nguồn mở, dịch thuật ngữ tài liệu chuyên ngành và phân tích sự khác biệt về cơ chế quản lý trạng thái (Database Changelog) giữa Liquibase và Flyway.
- **Quy trình đối chiếu và kiểm chứng:** Mọi thông tin do AI cung cấp về cú pháp lệnh, định dạng file changelog, tính tương thích với SQLite và các tham số CLI đều được các thành viên trong nhóm đối chiếu và kiểm tra lại trực tiếp tại trang tài liệu chính thức của Liquibase (liquibase.com) và Flyway (flywaydb.org). Nhóm cam kết không có bất kỳ đoạn mã hay nội dung văn bản nào được sao chép trực tiếp mà không qua kiểm chứng thực tế trên hệ thống.
