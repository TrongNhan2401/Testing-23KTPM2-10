# Kịch bản Seminar: NoSQL Database Testing

## 1. Mở đầu & Tổng quan

### Slide 1: Database Testing – Vì sao quan trọng?

- **Mục tiêu:** Nhấn mạnh vai trò cốt lõi của dữ liệu và giới thiệu phương pháp tiếp cận của nhóm.
- **Nội dung hiển thị (Visuals):**
  - Database là nguồn sự thật cuối cùng của hệ thống — lỗi dữ liệu ảnh hưởng trực tiếp đến toàn bộ ứng dụng.
  - Nhóm tập trung vào 2 hướng tiếp cận:
    - **Truyền thống:** `migrate-mongo` — quản lý migration an toàn, có version, có rollback.
    - **AI-augmented:** Google Gemini AI — hỗ trợ phát hiện & che dữ liệu nhạy cảm (PII).
  - Hệ thống áp dụng: **EShop**.

> **🎙️ Lời thoại (Speaker Notes):**
> "Xin chào thầy/cô và các bạn. Nhóm em xin trình bày về chủ đề Database Testing. Vì sao database lại quan trọng đến vậy? Vì database chính là nguồn sự thật cuối cùng của cả hệ thống — dù giao diện có đẹp đến đâu, logic xử lý có chạy đúng đến đâu, nhưng nếu dữ liệu sai, thiếu toàn vẹn, hay migration bị lỗi, thì cả hệ thống đều bị ảnh hưởng. Trong đề tài này, nhóm em tiếp cận theo hai hướng: một là công cụ truyền thống — `migrate-mongo`, để quản lý migration một cách an toàn; hai là hướng AI-augmented, dùng Google Gemini AI. Toàn bộ phần thực hành sẽ được áp dụng trên hệ thống EShop."

### Slide 2: Trong seminar hôm nay (Agenda)

- **Nội dung hiển thị (Visuals):**
  - Kiểm thử schema & dữ liệu.
  - Quản lý migration với `migrate-mongo`.
  - Data masking với sự hỗ trợ của Gemini AI.
  - Hoạt động tương tác: Spot-the-PII Game.

> **🎙️ Lời thoại (Speaker Notes):**
> "Trong buổi seminar hôm nay, nhóm em sẽ trình bày 4 phần chính: Thứ nhất là kiểm thử schema và dữ liệu. Thứ hai là quản lý migration bằng `migrate-mongo`. Thứ ba là data masking với sự hỗ trợ của Gemini AI. Và cuối cùng, cả lớp sẽ cùng tham gia một hoạt động tương tác mang tên Spot-the-PII Game. Bây giờ, mình sẽ giới thiệu nhanh về hai công cụ chính nhóm em sử dụng."

### Slide 3: `migrate-mongo` là gì?

- **Nội dung hiển thị (Visuals):**
  - Thư viện Node.js quản lý version hóa các thay đổi schema/dữ liệu trên MongoDB.
  - Mỗi thay đổi là một file migration với `up()` (áp dụng) và `down()` (rollback).
  - Lưu lịch sử migration đã chạy $\rightarrow$ dễ theo dõi, dễ khôi phục khi có lỗi.
  - **Vai trò:** Đảm bảo thay đổi dữ liệu được kiểm soát, nhất quán giữa các môi trường.

> **🎙️ Lời thoại (Speaker Notes):**
> "Đầu tiên là `migrate-mongo`. Đây là một thư viện Node.js, cho phép quản lý version hóa các thay đổi về schema và dữ liệu. Mỗi thay đổi sẽ là một file migration gồm hàm `up` để áp dụng và `down` để rollback. Điểm hay là nó lưu lại lịch sử tất cả các migration đã chạy, giúp nhóm theo dõi hệ thống đang ở version nào và khôi phục khi cần, đảm bảo sự nhất quán giữa dev, staging và production."

### Slide 4: Gemini AI là gì?

- **Nội dung hiển thị (Visuals):**
  - Mô hình AI của Google, hỗ trợ trong kiểm thử database.
  - **Vai trò chính:**
    - Phát hiện cột dữ liệu nhạy cảm (PII) dễ bị bỏ sót.
    - Đề xuất quy tắc che dữ liệu (masking) phù hợp.
    - Hỗ trợ sinh script/test liên quan.
  - **Nguyên tắc cốt lõi:** Mọi kết quả từ AI đều được kiểm chứng thủ công.

> **🎙️ Lời thoại (Speaker Notes):**
> "Tiếp theo là Google Gemini AI. Nhóm sử dụng Gemini cho 3 việc chính: phát hiện dữ liệu nhạy cảm ở các trường văn bản tự do, đề xuất quy tắc che dữ liệu (như hash, sinh giả lập), và hỗ trợ viết script test. Tuy nhiên, nhóm luôn giữ nguyên tắc: mọi kết quả AI đưa ra đều phải được thành viên kiểm tra thủ công trước khi áp dụng thực tế để đảm bảo an toàn."

---

## 2. Quản lý Phiên bản Dữ liệu

### Slide 1: The NoSQL Dilemma (Vấn đề của NoSQL)

- **Mục tiêu:** Tạo ra "nỗi đau" (Pain point) để dẫn dắt vào giải pháp.
- **Tiêu đề Slide:** Tại sao cần Database Migration cho MongoDB?
- **Nội dung hiển thị (Visuals):**
  - **Thế giới SQL:** Lệnh `ALTER TABLE` $\rightarrow$ Cấu trúc thay đổi đồng loạt, chặt chẽ.
  - **Thế giới NoSQL:** Schema-less (Linh hoạt) $\rightarrow$ **Hậu quả:** Dữ liệu phân mảnh (Tài liệu cũ dùng `name`, mới dùng `fullName`).
  - **Nguy cơ:** Khi deploy lên Production, code mới đọc dữ liệu cũ gây lỗi `undefined` và sập ứng dụng (Crash).

> **🎙️ Lời thoại (Speaker Notes):**
> "Trong SQL truyền thống, muốn đổi tên cột, ta chỉ cần chạy `ALTER TABLE`. Nhưng MongoDB không có cấu trúc cố định. Nếu team Dev đổi trường 'name' thành 'fullName', dữ liệu cũ sẽ không tự động cập nhật. Kết quả là khi đẩy code mới lên Production, hệ thống sẽ sập vì không đọc được dữ liệu. Đó là lúc chúng ta cần công cụ quản lý phiên bản."

### Slide 2: Giải pháp: `migrate-mongo`

- **Mục tiêu:** Giới thiệu trực diện công cụ và cơ chế hoạt động.
- **Nội dung hiển thị (Visuals):**
  - `migrate-mongo`: Database Migration cho MongoDB trên Node.js.
  - **Cơ chế cốt lõi (2 hành động):**
    - 🚀 **UP (Nâng cấp):** Thực thi kịch bản chuyển đổi (`name` $\rightarrow$ `fullName`).
    - ⏪ **DOWN (Rollback):** Đảo ngược quá trình an toàn (`fullName` $\rightarrow$ `name`).
  - **Changelog Tracking:** Tự động lưu vết vào bảng `changelog` riêng trong DB.

> **🎙️ Lời thoại (Speaker Notes):**
> "Để khắc phục sự phân mảnh, nhóm dùng `migrate-mongo`. Nó hoạt động dựa trên hàm 'up' để nâng cấp cấu trúc, và 'down' để rollback an toàn. Điểm thông minh là nó tạo ra một bảng changelog theo dõi đoạn script nào đã chạy, giúp team Dev tự tin deploy mà không sợ mất mát dữ liệu."

### Slide 3: `migrate-mongo` trong Hệ sinh thái ProShop

- **Nội dung hiển thị (Visuals):**
  - File `YYYYMMDD-rename-product-name.js`
    - `up`: `$rename: { "name": "fullName" }`
    - `down`: `$rename: { "fullName": "name" }`
  - **Tác dụng:** Đảm bảo 100% dữ liệu `products` chuẩn mực trước khi Invariants Test bắt đầu.

> **🎙️ Lời thoại (Speaker Notes):**
> "Áp dụng vào dự án ProShop, nhóm viết kịch bản migration để chuẩn hóa tên sản phẩm. Gõ lệnh 'migrate-mongo up', hàng ngàn bản ghi sẽ lập tức đồng bộ. Đây là trụ cột đầu tiên: Đảm bảo nền móng dữ liệu thống nhất trước khi chạy test nghiệp vụ."

---

## 3. Kiểm thử Toàn vẹn

### Slide 1: The Scaling Problem (Viết test thủ công)

- **Mục tiêu:** Tạo "nỗi đau" khi test tay từng collection.
- **Tiêu đề Slide:** Viết Test Invariant thủ công — Lặp lại và dễ sai sót
- **Nội dung hiển thị (Visuals):**
  - MongoDB thiếu Foreign Key $\rightarrow$ Mọi collection (`orders`, `products`...) đều cần bộ test riêng.
  - **Hạn chế viết tay:**
    - Dễ quên field thật trong schema.
    - Đặt nhầm orphan-check (test tham chiếu) ở sai collection.
  - **Bug nền tảng:** Chạy standalone trên Windows script im lặng bỏ qua, không có log lỗi $\rightarrow$ Rất khó debug.

> **🎙️ Lời thoại (Speaker Notes):**
> "Nhóm đã viết `test_invariants.js` cho orders. Nhưng khi làm tương tự cho products hay users, copy-paste thủ công dễ sinh lỗi — quên schema thật, đặt nhầm test, hoặc gặp lỗi cross-platform không có log báo. Vấn đề là làm sao viết test đúng và nhất quán cho rất nhiều file mà không bị đuối."

### Slide 2: Giải pháp: Agent Skill (NoSQL Invariant Generator)

- **Mục tiêu:** Cơ chế skill giúp Agent tự sinh test đúng chuẩn.
- **Tiêu đề Slide:** Đóng gói quy trình thành Skill cho AI Agent
- **Nội dung hiển thị (Visuals):**
  - **1 Skill = 1 quy trình chuẩn hoá:** Agent tự sinh 1 file test độc lập/collection.
  - **Đọc Schema thật:** AI đọc model trước khi viết $\rightarrow$ Không tự bịa field.
  - **Quy tắc tham chiếu:** Collection nào trỏ đi, test orphan-check nằm ở đó.
  - **Chạy gộp:** Gộp qua `runAllInvariants.js` chung 1 connection.
  - Tự chạy Checklist kiểm tra trước khi trả kết quả.

> **🎙️ Lời thoại (Speaker Notes):**
> "Thay vì viết tay, nhóm đóng gói quy trình này thành một Skill cho AI Agent. Giờ chỉ cần yêu cầu 'viết test invariant cho collection X', Agent sẽ tự đọc đúng schema, tự đặt đúng chỗ, và tự kiểm tra checklist trước khi giao file — giống như huấn luyện một QA engineer tuân theo chuẩn của nhóm."

---

## 4. Che giấu Dữ liệu - Data Masking

### Slide 1: Data Masking trong NoSQL (The Problem)

- **Tiêu đề Slide:** Data Masking trong NoSQL — Không chỉ là text
- **Nội dung hiển thị (Visuals):**
  - MongoDB chứa nhiều **Nested Documents** (JSON lồng nhau như `shippingAddress`).
  - Faker.js hoạt động rất tốt với trường đơn giản (`name`, `email`).
  - Các thông tin lồng nhau cần duy trì:
    - Đúng cấu trúc JSON.
    - Đúng quốc gia & định dạng mã bưu điện.
  - **Hậu quả mask thủ công:** Làm sai schema, sinh dữ liệu phi logic $\rightarrow$ Gãy kịch bản test tích hợp.

> **🎙️ Lời thoại (Speaker Notes):**
> "Trong MongoDB, không phải mọi dữ liệu đều là chuỗi đơn giản. Những object như `shippingAddress` có nhiều trường liên quan với nhau. Nếu chỉ thay ngẫu nhiên bằng code cứng, rất dễ sinh ra mã bưu điện sai quốc gia hoặc thiếu key bắt buộc, khiến dữ liệu test không còn phản ánh đúng môi trường thực tế."

### Slide 2: Giải pháp — Hybrid AI Data Masking

- **Tiêu đề Slide:** Hybrid Data Masking với Faker + Gemini AI
- **Nội dung hiển thị (Visuals):**

```text
Production Data
        │
        ▼
  ┌────────────┐
  │ Detect PII │
  └────────────┘
        │
  ┌─────┴────────┐
  ▼              ▼
Faker.js       Gemini AI
(Tên, Email)   (Nested JSON)
  │              │
  └─────┬────────┘
        ▼
  Masked MongoDB

```

- **Faker.js:** Mask tốc độ cao PII đơn giản, không cần AI.
- **Gemini AI:** Phân tích JSON lồng, sinh địa chỉ giả đúng quốc gia, giữ nguyên schema hợp lệ.

> **🎙️ Lời thoại (Speaker Notes):**
> "Nhóm sử dụng chiến lược phân vai. Faker.js xử lý các trường phẳng như tên và email với tốc độ cực cao. Còn với object `shippingAddress`, Gemini sẽ đọc địa chỉ gốc, nhận diện quốc gia, rồi sinh ra một địa chỉ hoàn toàn mới nhưng giữ đúng cấu trúc JSON và logic địa lý. Nhờ vậy dữ liệu được an toàn tuyệt đối mà app vẫn chạy mượt mà."

---
