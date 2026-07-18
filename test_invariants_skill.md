---
name: nosql-invariant-testing
description: Use this skill whenever the user wants to test, audit, or verify data correctness in a MongoDB (or other NoSQL) database — including generating "invariant test scripts", "data integrity checks", "test data / seed data", or a "database testing" deliverable for a course/seminar project. Trigger this for phrases like "viết test case cho NoSQL", "kiểm tra invariant", "audit script cho MongoDB", "sinh test data cho database testing", or any request to check that documents in a collection follow structural, referential, business-rule, temporal, or PII rules. This skill does NOT hardcode checks or code templates for one specific project/stack — it is a workflow + a set of language-agnostic principles for Claude to inspect a given project's schema/data and tech stack first, then generate invariant scripts tailored to it.
---

# NoSQL Invariant Testing Skill

Quy trình để sinh ra bộ test invariant (và test data đi kèm nếu cần) cho một dự án NoSQL (mặc định MongoDB) cụ thể. Không có script cố định sẵn — Claude phải **khám phá schema và tech stack thực tế của dự án người dùng** rồi mới sinh script, và **không có code mẫu cứng để copy** — chỉ có nguyên tắc.

## Quy trình 6 bước

### Bước 1 — Discover: Khám phá schema và kết nối

Mục tiêu: hiểu được collection nào tồn tại, field nào, kiểu dữ liệu nào, quan hệ nào.

Nguồn thông tin ưu tiên theo thứ tự:

1. Model/schema code có sẵn (Mongoose schema `.js`/`.ts`, TypeScript interface, JSON Schema validator của collection).
2. Nếu không có model code: kết nối trực tiếp tới DB (đọc config theo đúng cách project hiện tại đang dùng — xem Nguyên tắc #3 bên dưới), lấy **sample document** từ mỗi collection (`find().limit(20)` hoặc tương đương), và xem index nào là unique.
3. Nếu người dùng chỉ có tài liệu đặc tả (spec .md/.docx) mà chưa có DB thật: đọc tài liệu để suy ra cấu trúc, nhưng phải nói rõ với user là các con số/threshold sẽ cần họ xác nhận lại.

Việc quan trọng: dò tìm quan hệ denormalized — field nào trong collection A là bản copy dữ liệu từ collection B (ví dụ: `order.items[].productName` copy từ `product.name`). Đây là nguồn invariant hay bị bỏ sót nhất trong NoSQL.

### Bước 2 — Classify: Phân loại collection và quan hệ

Với mỗi collection, ghi lại:

- Vai trò (entity chính, log/audit, junction/liên kết, cấu hình)
- Field nào là ObjectId (hoặc key tương đương) tham chiếu tới collection/table khác, kể cả khi không có `ref` khai báo tường minh
- Field nào là dữ liệu denormalized/copy
- Field nào nhạy cảm (PII: email, số điện thoại, số thẻ, mật khẩu)

### Bước 3 — Derive: Suy ra danh sách invariant candidates

Dùng danh mục invariant ở phần **"Danh mục Invariant"** bên dưới để map từng field/quan hệ vừa phân loại sang loại invariant tương ứng (structural / uniqueness / referential / business rule / temporal / PII). Với mỗi invariant, xác định:

- Mức độ tự suy luận được từ schema (chắc chắn — ví dụ field required) vs. cần domain knowledge (không chắc chắn — ví dụ ngưỡng giảm giá tối đa của voucher, sẽ được gắn nhãn `[ASSUMED]` ở Bước 4).

### Bước 4 — Assume & Flag: Tự sinh business rule kèm giả định tường minh

Với các invariant thuộc nhóm "business rule" hoặc cần domain knowledge (ví dụ: voucher có được dùng chung với khuyến mãi khác không, tồn kho có thể âm tạm thời trong lúc concurrent checkout không), agent **vẫn tự sinh test case** dựa trên suy luận hợp lý nhất từ schema + convention phổ biến của loại hệ thống đó (ví dụ e-commerce), nhưng bắt buộc:

- Gắn nhãn rõ trong comment/report mỗi invariant này là `[ASSUMED]`, kèm 1 dòng giải thích giả định đã dùng (ví dụ: `[ASSUMED] voucher không stack với promotion khác — dựa trên field 'voucher' và 'promotion' là 2 field riêng biệt trong order, không thấy field kết hợp`).
- Gom toàn bộ các `[ASSUMED]` này vào một mục riêng trong báo cáo ở Bước 6, để user review nhanh 1 lần ở cuối thay vì bị hỏi rải rác giữa chừng.
- Nếu có ≥2 cách suy luận hợp lý ngang nhau mà không có tín hiệu nào từ schema để chọn (ví dụ không rõ voucher có giới hạn theo user hay không), chọn phương án **chặt chẽ hơn** (strict hơn) làm mặc định, vì test quá lỏng dễ bỏ sót lỗi thật hơn là test quá chặt rồi user nới ra sau.

Với invariant thuộc nhóm structural/uniqueness/temporal/PII (suy ra trực tiếp từ schema, không cần giả định) thì sinh thẳng, không cần gắn nhãn `[ASSUMED]`.

### Bước 5 — Generate: Sinh script phù hợp với tech stack thực tế

**Không có code mẫu cố định trong skill này.** Lý do: một template code cứng (ví dụ Node.js + MongoDB driver thô) sẽ gãy ngay khi dự án dùng Mongoose, PyMongo, driver của Cassandra/Redis, hay ngôn ngữ khác — càng "cụ thể hóa" template càng dễ lỗi khi áp vào hệ thống khác. Thay vào đó, agent tự quyết định cách viết code, miễn thỏa mãn checklist nguyên tắc ở phần **"Nguyên tắc viết script"** bên dưới.

Trước khi sinh code, xác định tech stack thực tế của dự án (không đoán, đọc trực tiếp):

- Ngôn ngữ/runtime: nhìn `package.json`, `requirements.txt`, hoặc hỏi user nếu không có file cấu hình nào.
- Driver/ORM đang dùng: MongoDB driver thô, Mongoose, PyMongo, hay ORM khác — soi trong `node_modules`/import hiện có trong project, đừng tự thêm dependency mới nếu project chưa dùng.
- Cách project hiện tại đang đọc config/`.env` — bắt chước đúng cách đó thay vì áp cách riêng của skill.

Sau khi biết stack, sinh **một script độc lập cho mỗi collection** (không gộp chung 1 file khổng lồ), áp checklist nguyên tắc bên dưới.

Nếu user cũng cần test data giả để chạy thử: sinh kèm 1 script seed bằng thư viện faker tương ứng với ngôn ngữ của project, đảm bảo data sinh ra **cố tình chứa vài vi phạm** (ví dụ 1 document thiếu field bắt buộc, 1 document có giá âm) để chứng minh script check thật sự bắt được lỗi — điều này quan trọng cho demo seminar.

### Bước 6 — Report

Sau khi sinh xong, xuất một bảng tổng hợp (markdown) liệt kê toàn bộ invariant đã implement, nhóm theo 6 loại ở dưới, kèm trạng thái pass/fail nếu đã chạy thử. Thêm một mục riêng **"Giả định cần user xác nhận"** liệt kê toàn bộ invariant gắn nhãn `[ASSUMED]` ở Bước 4, để user review và chỉnh sửa nếu giả định sai — đây chính là phần "tài liệu hóa" mà nộp kèm đồ án được.

## Lưu ý khi trigger cho seminar/đồ án

Nếu ngữ cảnh là bài tập/seminar (như trường hợp phổ biến), luôn nhắc user rằng mục **"Giả định cần user xác nhận"** ở Bước 6 nên được review và ghi lại thành log trước khi nộp — nhiều môn học yêu cầu khai báo rõ phần nào do AI suy luận, phần nào do con người xác nhận, để tránh vi phạm chính sách sử dụng AI của khóa học.

---

## Danh mục Invariant

Mỗi mục gồm: định nghĩa, cách phát hiện tự động từ schema/sample data.

### 1. Structural invariants

Kiểm tra hình dạng document đúng như kỳ vọng, bất kể NoSQL không ép schema.

- Field bắt buộc phải tồn tại và không null
- Kiểu dữ liệu đúng (string/number/ObjectId/array...)
- Giá trị nằm trong enum cho phép (ví dụ `status ∈ ['pending','paid','shipped','cancelled']`)
- Field không được có mặt (deprecated field còn sót lại sau migration)
- Độ dài string/array trong giới hạn hợp lý (tránh dữ liệu rác)

Phát hiện tự động: đọc Mongoose schema (`required: true`, `enum: [...]`, `type: ...`) hoặc JSON Schema validator (`$jsonSchema` trong `db.createCollection`).

### 2. Uniqueness invariants

- Field có index unique trong code (`unique: true`) → verify thực tế trong data không có document trùng giá trị đó (kể cả khi index bị lỗi hoặc bị tắt tạm thời khi migrate).
- Composite uniqueness (ví dụ 1 user không được có 2 review cho cùng 1 sản phẩm) — phải check bằng aggregation `$group` + `$match count > 1` hoặc tương đương.

Phát hiện tự động: xem index definitions lọc `unique: true`; với composite thì phải hỏi user hoặc suy từ business logic.

### 3. Referential invariants (giả FK)

NoSQL không có FK thật nên đây là nhóm dễ bị bỏ sót nhất, nhưng cực kỳ quan trọng.

- **Existence check**: mọi ID tham chiếu (`userId`, `productId`, `voucherId`...) phải trỏ tới document còn tồn tại ở collection đích (không bị xóa mà quên cascade).
- **Denormalized sync check**: nếu document A copy dữ liệu từ B (ví dụ `order.items[].price` tại thời điểm mua vs `product.price` hiện tại) — đây KHÔNG phải lỗi nếu là snapshot có chủ đích, nhưng CẦN phân biệt rõ field nào là "snapshot" (được phép lệch) và field nào là "phải luôn đồng bộ". Bước 4 phải hỏi user để phân loại đúng.
- **Orphan check**: document con tồn tại nhưng document cha đã bị xóa (ví dụ `reviews` còn tồn tại dù `product` đã bị xóa).

Phát hiện tự động: quét field có kiểu ObjectId hoặc tên field kết thúc bằng `Id`/`_id` không phải chính field `_id`; cross-check bằng `$lookup` hoặc query riêng.

### 4. Business rule invariants

Không thể tự suy hoàn toàn từ schema — **phải xác nhận với user ở Bước 4**.

Ví dụ điển hình cho hệ thống e-commerce/voucher:

- `stock >= 0`
- `price > 0`
- `order.totalAmount === sum(order.items[].price * order.items[].quantity)` (± phí ship/giảm giá được khai báo rõ)
- `voucher.usedCount <= voucher.maxUsage`
- `voucher.discountValue` không vượt quá `voucher.maxDiscountAmount` khi type là percentage
- Trạng thái đơn hàng chỉ được chuyển theo state machine hợp lệ (không thể từ `cancelled` quay lại `paid`)

### 5. Temporal invariants

- `createdAt <= updatedAt`
- Không có timestamp nào ở tương lai so với thời điểm chạy check
- Với voucher/promotion: `validFrom < validTo`
- Nếu có soft-delete (`deletedAt`): `deletedAt` chỉ tồn tại khi `isDeleted === true`

### 6. PII / Security invariants

- Field mật khẩu không bao giờ ở dạng plaintext (kiểm tra bằng regex — ví dụ nếu không giống bcrypt hash `^\$2[aby]\$` thì cảnh báo)
- Số thẻ ngân hàng/CCCD nếu lưu trong DB phải được mask hoặc mã hóa, không lưu full ở dạng đọc được
- Field PII không được xuất hiện trong các collection log/audit dạng plaintext nếu không cần thiết

Lưu ý an toàn: khi viết script cho nhóm này, **không bao giờ in giá trị PII thật ra console/report** — chỉ in `_id` của document vi phạm và tên field, không in giá trị.

---

## Nguyên tắc viết script (không phụ thuộc ngôn ngữ/stack)

Không có code mẫu ở đây. Đây là checklist mà bất kỳ script nào agent sinh ra — dù bằng Node.js, Python, hay bất kỳ ngôn ngữ nào project đang dùng — đều phải thỏa mãn.

**Vì sao không dùng code mẫu cố định**: một template code cụ thể (ví dụ viết sẵn bằng MongoDB driver thô của Node.js) chỉ đúng cho đúng 1 tổ hợp ngôn ngữ + driver. Khi áp vào project khác — dùng Mongoose, PyMongo, ORM khác, hoặc DB khác như Cassandra/Redis — code mẫu đó thường phải sửa nhiều đến mức sinh lỗi mới thay vì tiết kiệm thời gian. Checklist nguyên tắc thì luôn áp dụng được, bất kể stack.

1. **Tách 1 file/1 collection** — không gộp nhiều collection vào 1 script lớn, để dễ chạy riêng lẻ và dễ debug khi 1 check bị lỗi.

2. **Quét toàn bộ, không dừng ở lỗi đầu tiên** — script phải đi hết mọi document trong collection và gom lại toàn bộ vi phạm, không throw/exit ngay khi gặp document lỗi đầu tiên. Mục đích là biết được _quy mô_ vấn đề, phục vụ báo cáo.

3. **Đọc cấu hình theo đúng cách project hiện tại đang làm** — nếu project có sẵn cách đọc connection string/config, dùng lại đúng cách đó. Không tự ý hardcode connection string, không tự bịa ra quy ước riêng nếu project chưa có.

4. **Không phá dữ liệu thật** — mọi check phải là read-only (chỉ `find`/`SELECT`/tương đương). Nếu cần sinh test data, phải ghi rõ script đó ghi vào DB nào (tuyệt đối không seed nhầm vào DB production) và yêu cầu xác nhận rõ ràng từ user về connection string trước khi chạy.

5. **Exit code chuẩn để dùng được trong CI** — 0 khi mọi check pass, khác 0 khi có ít nhất 1 vi phạm.

6. **Báo cáo có cấu trúc, đọc được** — với mỗi invariant: tên, mô tả ngắn, số document vi phạm, một vài `_id` ví dụ (giới hạn số lượng). Format cụ thể (bảng, JSON, log) tùy theo cái gì tiện cho việc nộp báo cáo seminar của user — hỏi nếu không rõ.

7. **Không log giá trị PII thật** — chỉ log `_id` và tên field vi phạm cho các invariant thuộc nhóm PII (mục 6 ở trên), tuyệt đối không in giá trị nhạy cảm ra console/file log.

8. **Check liên collection phải load dữ liệu tham chiếu trước** — với invariant referential/composite uniqueness, load trước tập ID/giá trị cần đối chiếu thành một cấu trúc tra cứu nhanh (set/map hoặc tương đương) trước khi quét collection chính, tránh query lặp lại trong vòng lặp (N+1 query).

9. **Idempotent khi chạy lại nhiều lần** — chạy check nhiều lần trên cùng dữ liệu phải cho cùng kết quả; nếu có sinh test data kèm theo, script seed nên có cách dọn dẹp/reset để chạy lại không bị cộng dồn dữ liệu rác.

**Khi review script đã sinh ra**: trước khi đưa cho user, tự kiểm lại bằng chính 9 mục trên như một checklist — nếu thiếu mục nào, sửa trước khi present.
