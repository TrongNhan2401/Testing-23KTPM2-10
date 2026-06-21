# BẢN ĐỀ XUẤT KHẢO SÁT CÔNG CỤ: T08 — KIỂM THỬ CƠ SỞ DỮ LIỆU (NOSQL)

**Môn học:** CS423 / CSC15003 — Kiểm thử phần mềm
**Nhóm:** 10
**Thành viên nhóm:**

- Lê Gia Bảo - 23127325
- Hồ Gia Huy - 23127376
- Trần Phạm Trọng Nhân - 23127443
- Trần Thanh Trí - 23127503

**Mã đề tài:** T08 — Database Testing

---

## 1. Hệ thống thử nghiệm và Các công cụ đề xuất

Bản đề xuất này tập trung vào giải pháp kiểm thử cơ sở dữ liệu phi cấu trúc (NoSQL), đáp ứng yêu cầu chọn ít nhất 1 công cụ truyền thống và 1 công cụ AI:

- **Hệ thống thử nghiệm (SUT):** Dự án [Proshop-v2](https://github.com/bradtraversy/proshop-v2/security) - Ứng dụng thương mại điện tử xây dựng bằng Node.js và MongoDB. Nhóm sử dụng repository này thay cho EShop mặc định để có một môi trường NoSQL thực tế.
- **Công cụ truyền thống:** `migrate-mongo` (Lựa chọn chính)
- **Định hướng tích hợp AI:** Tập lệnh Node.js (`@faker-js/faker`) hỗ trợ bởi Gemini (Lựa chọn chính)
- **Công cụ dự phòng:** `Liquibase` (kết hợp phần mở rộng MongoDB Extension)

## 2. Ma trận so sánh các công cụ

Bảng so sánh sau được đánh giá dựa trên 5 tiêu chí cốt lõi của môn học:

| Tiêu chí so sánh                  | migrate-mongo (Lựa chọn chính)                                                          | Liquibase + MongoDB Extension (Công cụ dự phòng)                                                                | Gemini + Node.js Faker (AI chính)                                                  |
| :-------------------------------- | :-------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| **Chi phí bản quyền**             | Bản quyền mở (Miễn phí hoàn toàn).                                                      | Bản Community (Miễn phí / Mã nguồn mở).                                                                         | Gói Free Tier (Gemini Web / API).                                                  |
| **Lộ trình học (Learning Curve)** | Thấp (Sử dụng mã Node.js cơ bản qua các hàm `up` và `down`).                            | Trung bình (Yêu cầu làm quen với cấu trúc file XML/YAML/JSON cho môi trường NoSQL).                             | Trung bình (Sử dụng prompt kết hợp lập trình script Node.js).                      |
| **Mức độ phù hợp với Proshop-v2** | Hoàn hảo (Được thiết kế riêng để chạy kịch bản Node.js nâng cấp/hoàn tác trên MongoDB). | Tốt (Hỗ trợ MongoDB qua extension, giúp kiểm soát collection/index chặt chẽ nhưng file cấu hình cồng kềnh hơn). | Hoàn hảo (Tự linh hoạt dò tìm dữ liệu nhạy cảm trong các document JSON lồng nhau). |
| **Năng lực AI**                   | Không có (Đóng vai trò là trình chạy kịch bản thuần túy).                               | Không có (Công cụ quản lý sự thay đổi truyền thống).                                                            | Cao (Có khả năng phân tích đường dẫn JSON và đề xuất quy tắc che giấu).            |
| **Cộng đồng hỗ trợ**              | Rất phổ biến trong cộng đồng phát triển Node.js/MongoDB.                                | Cực kỳ vững chắc, phần mở rộng cho NoSQL đang phát triển nhanh.                                                 | Hệ sinh thái AI và tự động hóa đang phát triển bùng nổ.                            |

## 3. Lựa chọn đề xuất và Lý do kiểm chứng

Nhóm đề xuất chọn **migrate-mongo** (Truyền thống) và tập lệnh Node.js kết hợp **Gemini + `@faker-js/faker`** (AI) áp dụng trên hệ thống Proshop-v2 với 3 lý do cốt lõi sau:

- **Môi trường thực tiễn cho NoSQL:** Nhóm quyết định sử dụng repository [Proshop-v2](https://github.com/bradtraversy/proshop-v2/security) (chạy MongoDB) thay cho SQLite mặc định để có một môi trường "schemaless" (lược đồ linh hoạt) hoàn chỉnh. Điều này giúp phản ánh chính xác các thách thức trong việc kiểm soát rác dữ liệu và toàn vẹn cấu trúc của các dự án công nghiệp hiện đại.
- **An toàn di chuyển và hoàn tác (Migration Safety):** So với công cụ dự phòng Liquibase yêu cầu cấu hình tĩnh bằng XML/YAML, `migrate-mongo` cho phép quản lý sự thay đổi cấu trúc document linh hoạt bằng mã Node.js - ngôn ngữ gốc của dự án Proshop-v2. Công cụ cung cấp cơ chế hoàn tác an toàn thông qua hàm `down` (ví dụ: sử dụng lệnh `$unset` của MongoDB để đưa collection về nguyên trạng).
- **Xử lý dữ liệu PII lồng sâu thông minh bằng AI:** Trong cơ sở dữ liệu NoSQL, thông tin định danh (PII) thường nấp rất sâu ở các mảng lồng nhau (nested JSON). Bằng cách gọi Gemini API, AI sẽ quét document để phát hiện chính xác các đường dẫn (paths) chứa dữ liệu nhạy cảm. Sau đó, thư viện `@faker-js/faker` tiến hành băm (mask) dữ liệu nhằm đảm bảo việc che giấu không làm vỡ cấu trúc tổng thể của hệ thống.

## 4. Công khai AI và Quy trình đối chiếu thông tin (AI Disclosure)

- **Các công cụ AI đã sử dụng:** Nhóm đã sử dụng Google Gemini và AI Agent tích hợp trong các IDE. Công cụ AI được dùng để nghiên cứu các phương pháp kiểm thử cấu trúc NoSQL, viết mã cho hàm di chuyển dữ liệu và xử lý thao tác che giấu (masking) đối với dữ liệu JSON lồng nhau.
- **Quy trình đối chiếu và kiểm chứng:** Nhóm cam kết mọi đoạn mã cập nhật cấu trúc do AI sinh ra đều được kiểm tra kỹ lưỡng và thử nghiệm khứ hồi trên môi trường local trước khi áp dụng. Các lỗi ảo giác (hallucination) từ AI liên quan đến việc sinh sai kiểu dữ liệu Faker đã được con người rà soát và đối chiếu với tài liệu chính quy. Tuyệt đối không sao chép nguyên văn các phân tích từ AI mà không qua biên tập.
