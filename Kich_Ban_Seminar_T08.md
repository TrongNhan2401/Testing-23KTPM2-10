# KỊCH BẢN THUYẾT TRÌNH — T08: Database Testing (NoSQL/MongoDB)

**Nhóm 10** — Lê Gia Bảo · Hồ Gia Huy · Trần Phạm Trọng Nhân · Trần Thanh Trí
**Thời lượng:** 45 phút (Pitch 10' → Demo 10' → Activity 20' → Q&A 5')
**SUT:** ProShop-v2 (Node.js + MongoDB)

## Phân vai (đề xuất)

| Vai trò | Việc chính | Gợi ý người đảm nhiệm |
|---|---|---|
| **Presenter** | Nói toàn bộ phần Pitch (slide 1–10), dẫn dắt mạch logic | Người tự tin nói chuyện, giọng ổn định |
| **Demoer** | Gõ lệnh thật trên terminal ở phần Demo | Người thao tác migrate-mongo/script mượt nhất |
| **Facilitator** | Điều phối trò chơi `pii-invariant-game`, phát tài liệu, lật đáp án | Người bao quát lớp tốt, nói rõ ràng |
| **Timekeeper** | Canh giờ, ra tín hiệu (giơ bảng số phút còn lại), nhắc chuyển phần | Người còn lại, đứng góc lớp dễ quan sát |

> Toàn bộ 4 người nên có mặt trên "sân khấu" xuyên suốt — không chỉ 1 người nói cả buổi. Khi Presenter nói slide 5–6 (Agent Skill) và slide 7–8 (migrate-mongo), có thể đổi người nói để giữ nhịp.

---

## PHẦN 1 — PITCH (10 phút) — dựa trên slide 1 → 10

### [0:00–0:01] Mở đầu — Slide 1: Vì sao database testing quan trọng

**Presenter nói:**
> "Xin chào cả lớp, nhóm mình là Nhóm 10, hôm nay trình bày đề tài T08 — Database Testing. Trước khi vào công cụ cụ thể, mình muốn đặt câu hỏi: vì sao lại phải test database?
> Database chính là nguồn sự thật cuối cùng của cả hệ thống. Giao diện đẹp đến đâu, logic code đúng đến đâu, nhưng nếu dữ liệu sai hoặc migration lỗi, toàn bộ hệ thống có thể sập theo.
> Nhóm mình tiếp cận theo 2 hướng bổ sung nhau: hướng truyền thống với `migrate-mongo`, và hướng AI-augmented với Google Gemini AI. Toàn bộ phần thực hành được chạy trên hệ thống thật — ProShop-v2, một ứng dụng thương mại điện tử dùng MongoDB."

*(Chuyển slide)*

### [0:01–0:02] Slide 2: Agenda

**Presenter nói:**
> "Buổi hôm nay có 4 phần: đầu tiên là kiểm thử schema và dữ liệu, thứ hai là quản lý migration với migrate-mongo, thứ ba là data masking với sự hỗ trợ của Gemini AI, và cuối cùng — phần mà mình nghĩ mọi người sẽ thích nhất — cả lớp sẽ cùng tham gia một hoạt động tương tác tên là `pii-invariant-game`, nơi các bạn tự tay đóng vai người kiểm thử để tìm ra dữ liệu 'nhiễm độc' trong MongoDB."

*(Chuyển slide)*

### [0:02–0:03] Slide 3: migrate-mongo là gì?

**Presenter nói:**
> "Công cụ đầu tiên là `migrate-mongo` — một thư viện Node.js giúp version-hóa các thay đổi schema và dữ liệu trên MongoDB. Cơ chế của nó rất đơn giản: mỗi lần có thay đổi, mình viết một file migration gồm 2 hàm — `up()` để áp dụng thay đổi, và `down()` để rollback nếu có sự cố. Công cụ này còn lưu lại lịch sử migration đã chạy, giúp đội dev kiểm soát chặt chẽ và nhất quán giữa các môi trường dev, staging, production."

*(Chuyển slide)*

### [0:03–0:04] Slide 4: Gemini AI là gì?

**Presenter nói:**
> "Công cụ thứ hai — hướng AI-augmented — là Google Gemini AI. Nhóm mình ứng dụng Gemini ở 3 việc: phát hiện những trường dữ liệu nhạy cảm mà con người dễ bỏ sót, đề xuất quy tắc che dữ liệu phù hợp, và hỗ trợ sinh script/test liên quan đến database.
> Nhưng có một nguyên tắc nhóm mình luôn giữ: mọi kết quả AI đưa ra đều được kiểm chứng thủ công trước khi đem vào dùng thật. AI hỗ trợ, chứ không thay thế việc kiểm tra của con người."

*(Chuyển slide)*

### [0:04–0:05] Slide 5: Agent Skill — pain point

**Presenter nói (có thể đổi người ở đây):**
> "Bây giờ mình nói về một vấn đề thực tế nhóm gặp phải. MongoDB không có Foreign Key, nên mỗi collection như `orders`, `products`, `users`... đều cần một bộ test invariant riêng để tự kiểm tra tính toàn vẹn dữ liệu.
> Nhóm mình đã viết `test_invariants.js` cho collection `orders`. Nhưng khi thử làm tương tự cho `products`, việc copy-paste thủ công phát sinh lỗi thật: quên field đúng theo schema, đặt nhầm test tham chiếu vào sai file, và có một lỗi rất khó chịu — khi chạy standalone trên Windows, script **im lặng bỏ qua** mà không log lỗi nào cả, tụi mình mất khá nhiều thời gian mới tìm ra nguyên nhân."

*(Chuyển slide)*

### [0:05–0:06] Slide 6: Agent Skill — giải pháp

**Presenter nói:**
> "Giải pháp của nhóm là đóng gói toàn bộ quy trình này — từ cách đọc schema, phân loại loại invariant, đến các lỗi cross-platform từng gặp — thành một **Skill** cho AI Agent.
> Từ giờ, chỉ cần yêu cầu 'viết test invariant cho collection X', Agent sẽ tự đọc đúng schema thật trong model, tự đặt test orphan-check đúng chỗ theo quy tắc — và quan trọng nhất là tự chạy một checklist kiểm tra lại trước khi giao file, đảm bảo không bịa field, không có lệnh ghi/xóa dữ liệu nguy hiểm."

*(Chuyển slide)*

### [0:06–0:07] Slide 7: migrate-mongo — pain point

**Presenter nói:**
> "Quay lại vấn đề migration. Trong thế giới SQL, đổi tên một cột chỉ cần lệnh `ALTER TABLE`, cấu trúc thay đổi đồng loạt, rất chặt chẽ. Nhưng MongoDB không có cấu trúc cố định — nếu team dev đổi trường `name` thành `fullName`, những document cũ trong DB sẽ không tự cập nhật theo.
> Hậu quả là khi deploy code mới lên Production, code đọc dữ liệu cũ sẽ gặp lỗi `undefined` và có thể làm sập cả ứng dụng."

*(Chuyển slide)*

### [0:07–0:08] Slide 8: migrate-mongo — giải pháp

**Presenter nói:**
> "Đây là lúc migrate-mongo phát huy tác dụng. Hàm `up()` thực thi kịch bản chuyển đổi — ví dụ đổi toàn bộ `name` thành `fullName`. Nếu có sự cố, hàm `down()` sẽ đảo ngược an toàn, trả `fullName` về lại `name`.
> Công cụ này còn tự động lưu vết mọi file migration đã chạy vào một collection riêng tên `changelog`, giúp team biết chính xác script nào đã áp dụng, script nào chưa."

*(Chuyển slide)*

### [0:08–0:09] Slide 9: Data masking — pain point

**Presenter nói:**
> "Phần cuối cùng của Pitch là data masking. MongoDB chứa rất nhiều JSON lồng nhau, ví dụ `shippingAddress`. Faker.js hoạt động rất tốt với các trường đơn giản như tên, email — nhưng với một object lồng nhau, nếu mask thủ công từng field một cách ngẫu nhiên, rất dễ tạo ra dữ liệu phi logic: mã bưu điện sai quốc gia, thiếu key bắt buộc — gây lỗi khi kiểm thử tích hợp."

*(Chuyển slide)*

### [0:09–0:10] Slide 10: Data masking — giải pháp (chốt Pitch)

**Presenter nói:**
> "Giải pháp của nhóm là chiến lược lai — hybrid masking. Faker.js xử lý các trường phẳng đơn giản như tên, email với tốc độ cao, không cần AI. Còn với object lồng nhau như `shippingAddress`, Gemini AI đọc địa chỉ gốc, nhận diện quốc gia, và sinh ra địa chỉ mới nhưng vẫn giữ đúng cấu trúc JSON, đúng ngữ cảnh địa lý.
> Kết quả: dữ liệu được che giấu an toàn mà ứng dụng vẫn chạy đúng, không bị vỡ schema.
> Đó là toàn bộ phần lý thuyết. Bây giờ, mời [tên Demoer] lên trình diễn trực tiếp trên terminal thật."

---

## PHẦN 2 — LIVE DEMO (10 phút)

> **Lưu ý bắt buộc theo rule khóa học:** demo phải chạy trên terminal/IDE thật, KHÔNG dùng video quay sẵn trừ khi mạng chết (có bản backup dự phòng). Demo phải thể hiện CẢ tính năng truyền thống VÀ tính năng AI.

### [0:10–0:13] Demo 1 — Migration & Rollback (traditional)

**Demoer nói + gõ lệnh (dựa theo User_Guide mục 3):**
> "Mình sẽ tạo 1 migration test ngay tại đây."

```bash
npx migrate-mongo create demo_migration
```
> "File migration vừa được tạo trong thư mục `migrations/`, có timestamp prefix. Bên trong, hàm `up` sẽ thêm 1 trường test vào toàn bộ sản phẩm, hàm `down` sẽ gỡ nó ra."

```bash
npx migrate-mongo status
```
> "Thấy migration đang ở trạng thái PENDING. Giờ mình apply."

```bash
npx migrate-mongo up
```
> "Terminal log MIGRATED UP — và nếu mở MongoDB Compass, mọi document trong `products` giờ có thêm trường test. Bây giờ mình rollback lại."

```bash
npx migrate-mongo down
```
> "MIGRATED DOWN — trường test đã bị gỡ sạch, dữ liệu quay về đúng như ban đầu. Đây chính là điểm mạnh: an toàn, có thể hoàn tác, không sợ mất dữ liệu."

### [0:13–0:16] Demo 2 — AI sinh dữ liệu "nhiễm độc" (AI-augmented)

**Demoer nói + gõ lệnh:**
```bash
node backend/generate_test_data.js
```
> "Script này gọi Gemini để đọc schema Mongoose thật của collection `orders`, rồi cố tình sinh ra 3 kịch bản: một đơn hàng hợp lệ, một đơn sai logic tài chính, và một đơn thiếu trường bắt buộc. Đây chính là dữ liệu 'nhiễm độc' mà sau này công cụ invariant-scanner phải bắt được."

### [0:16–0:18] Demo 3 — Invariant Scanner phát hiện lỗi (traditional + kết quả của AI)

```bash
node backend/test_invariants.js
```
> "Script quét toàn bộ 10 business rule. Mọi người để ý phần FAILED — chính là những đơn hàng Gemini vừa sinh ra ở bước trước. Đây là vòng lặp khép kín: AI sinh lỗi → công cụ truyền thống bắt lỗi."

### [0:18–0:20] Demo 4 — Data Masking (traditional + AI kết hợp)

```bash
node backend/data_masking.js
```
> "Cuối cùng, script này chạy chiến lược hybrid: Faker.js mask nhanh các trường tên/email, còn Gemini xử lý riêng object `shippingAddress` lồng nhau. Mọi người thấy dữ liệu sau khi mask vẫn đúng định dạng địa chỉ Việt Nam, không bị vỡ cấu trúc.
> Đó là toàn bộ phần Demo. Bây giờ đến phần thú vị nhất — mời [tên Facilitator] lên điều phối hoạt động `pii-invariant-game`."

---

## PHẦN 3 — IN-CLASS ACTIVITY: pii-invariant-game (20 phút)

*(Facilitator dùng trực tiếp nội dung trong `Activity_Worksheet.md` đã chuẩn bị — không cần viết lại kịch bản chi tiết ở đây, chỉ tóm tắt lời dẫn.)*

### [0:20–0:22] Giới thiệu trò chơi

**Facilitator nói:**
> "Bây giờ mọi người sẽ đóng vai một QA engineer thật. Mình sẽ phát cho mỗi nhóm 6 hồ sơ — là 6 document JSON thật lấy từ collection `orders` của ProShop-v2, sau khi Gemini sinh dữ liệu kiểm thử biên. Một vài hồ sơ trong đó đã bị 'nhiễm độc'. Nhiệm vụ của các bạn: đọc kỹ, tự tay tìm ra hồ sơ nào có vấn đề, vấn đề gì, và ghi vào Bảng ghi nhận điều tra.
> Các bạn có 10 phút để điều tra. Sau đó mình sẽ lật đáp án thật — chính là output thật từ script `test_invariants.js` mà nhóm mình vừa demo."

*(Phát Bộ hồ sơ điều tra + Bảng ghi nhận — mục 3, 4 trong Activity_Worksheet.md)*

### [0:22–0:32] Vòng 1 — Điều tra thủ công (10 phút)

Facilitator + Timekeeper đi vòng quanh lớp hỗ trợ, nhắc thời gian còn lại ở phút thứ 5 và phút thứ 2.

### [0:32–0:37] Vòng 2 — Đối chiếu đáp án AI (5 phút)

**Facilitator nói:**
> "Giờ mình lật đáp án thật." *(chiếu/đọc bảng ở mục 5 Activity_Worksheet.md)* "Nhóm nào tìm đúng được bao nhiêu case? Có nhóm nào bắt được Case F — lỗi rò rỉ PII trong đoạn `comment` — không? Đây là điểm đặc biệt: 10 rule invariant của tụi mình KHÔNG bắt được lỗi này, vì nó không phải lỗi cấu trúc mà là lỗi ngữ nghĩa ẩn trong free-text."

### [0:37–0:40] Vòng 3 — Đề xuất Masking Rule (3 phút)

**Facilitator nói:**
> "Cuối cùng, với 2 case có PII, mỗi nhóm viết 1 quy tắc masking đề xuất lên bảng — dùng Faker hay Gemini, và vì sao."

*(Dùng đáp án tham khảo ở mục 7 Activity_Worksheet.md để nhận xét nhanh câu trả lời của các nhóm)*

---

## PHẦN 4 — DEBRIEF + Q&A (5 phút)

### [0:40–0:43] Câu hỏi thảo luận

**Facilitator/Presenter nêu 2 câu hỏi mở (mục 6 Activity_Worksheet.md):**
1. "Nếu MongoDB không có Foreign Key, nên đặt invariant-check ở write-time hay batch-scan định kỳ? Đánh đổi là gì?"
2. "Case F cho thấy AI có thể bỏ sót PII ẩn trong free-text. Nên viết prompt cho Gemini thế nào để giảm rủi ro này?"

*(Gọi 1–2 nhóm trả lời, cả nhóm 10 cùng phản hồi/bổ sung)*

### [0:43–0:45] Q&A tự do + thu Minute Paper

**Presenter chốt:**
> "Cảm ơn cả lớp đã tham gia rất nhiệt tình. Trước khi kết thúc, mời mọi người điền nhanh Minute Paper — 3 câu ngắn về điều học được hôm nay, điều còn chưa rõ, và đánh giá mức độ hữu ích. Nhóm mình sẽ mở Q&A cho bất kỳ câu hỏi nào còn lại."

*(Timekeeper thu Minute Paper trong lúc Q&A diễn ra để không mất thời gian riêng)*

---

## Checklist trước buổi seminar (dùng nội bộ nhóm)

- [ ] Test lại toàn bộ 4 lệnh demo trên máy thật, đúng thứ tự, đúng dữ liệu sample
- [ ] Có bản ghi màn hình dự phòng (backup recording) nếu mạng/Atlas lỗi
- [ ] In đủ số bộ hồ sơ điều tra (6 case/nhóm) theo sĩ số lớp thực tế
- [ ] Chuẩn bị sẵn 1-page cheat-sheet phát cho khán giả không có laptop
- [ ] Canh lại giờ thử 1 lần với đồng hồ bấm giờ trước buổi thật — kịch bản này đã tính đúng 45 phút nhưng nên có biên độ ±2 phút mỗi phần
