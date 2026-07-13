# Đặc tả: Spot the PII & Invariant Bugs – Game Agent

## 1. Tổng quan

**Loại ứng dụng:** Web app (single page), chơi trực tiếp trên lớp, nhiều nhóm cùng truy cập song song.

**Thời lượng:** 10 phút chơi + chấm điểm tự động + 1-minute paper.

**Số nhóm:** cấu hình được (mặc định 6–8 nhóm, đặt tên Group01…Group08).

**Điểm số:** 1 loại duy nhất — Đúng: **+2** | Sai: **−1** | Bỏ sót: **0**.

---

## 2. Luồng màn hình (Flow)

```
[1] Landing/Login screen
      → chọn nhóm từ danh sách → vào phòng của nhóm
[2] Game screen (bảng orders.csv, đếm ngược 10:00)
      → nhóm click chọn các ô nghi ngờ có lỗi
      → nộp bài (submit) hoặc hết giờ tự nộp
[3] Scoring screen (hiện điểm ngay sau submit hoặc khi giờ kết thúc toàn lớp)
      → bảng xếp hạng các nhóm
[4] One-Minute Paper form
      → (a) one thing learned (text)
      → (b) one thing still unclear (text)
      → (c) usefulness rating 1–5 (scale)
      → submit → cảm ơn / kết thúc
```

---

## 3. Màn hình Admin (nhỏ)

Một trang riêng, đơn giản, chỉ phục vụ 2 việc: **bắt đầu trò chơi** và **quản lý khóa nhóm**. Không cần thiết kế cầu kỳ — 1 danh sách + vài nút bấm là đủ.

### 3.1 Trạng thái trò chơi (Game State)

- Toàn bộ game có 1 trạng thái chung: `not_started` (mặc định) / `running` / `ended`.
- Ở trạng thái `not_started`: màn hình Login (mục 4) hiện thông báo "Trò chơi chưa bắt đầu, vui lòng chờ người điều khiển" — danh sách nhóm hiện nhưng **không bấm chọn được**.
- Người điều khiển bấm nút **"Bắt đầu trò chơi"** trên trang admin → chuyển toàn bộ game sang `running`. Lúc này màn hình Login mới cho phép các nhóm bấm chọn tên để vào.
- Đồng hồ đếm ngược 10 phút của từng nhóm chỉ bắt đầu chạy khi nhóm đó thực sự bấm vào (không phải khi người điều khiển bấm "Bắt đầu"), giữ đúng như mục 6.1 đã mô tả.
- Người điều khiển có thể bấm **"Kết thúc giờ"** để chuyển sang `ended`: mọi nhóm chưa nộp bị tự động submit ngay, khóa toàn bộ bảng.

### 3.2 Danh sách nhóm & quản lý khóa

- Bảng danh sách tất cả nhóm, mỗi dòng gồm: tên nhóm — trạng thái (`not_started` / `locked_in_progress` / `submitted`) — điểm (nếu đã có) — nút hành động.
- Nút hành động theo trạng thái:
  - `locked_in_progress` → nút **"Mở khóa"** (dùng khi nhóm rớt mạng thật, cần vào lại từ thiết bị khác).
  - `not_started` → không có hành động gì thêm (đang chờ nhóm tự bấm vào).
  - `submitted` → không cần hành động (có thể xem lại điểm).
- Danh sách này nên tự cập nhật real-time (poll định kỳ vài giây là đủ, không cần websocket phức tạp).

### 3.3 Giữ quy mô nhỏ gọn

Trang admin **không cần**: đăng nhập/mật khẩu riêng, phân quyền nhiều người điều khiển, lịch sử thao tác, hay chỉnh sửa đáp án qua giao diện. Đây chỉ là 1 bảng điều khiển đơn giản (route riêng, ví dụ `/admin`), đủ dùng cho 1 buổi seminar 10 phút. Answer Key vẫn cấu hình cứng trong code (mục 7), không cần UI để sửa.

---

## 5. Màn hình 1 — Login theo nhóm

- Hiển thị danh sách nhóm dạng nút bấm (grid), lấy từ config (VD: Group01…Group08).
- Không cần mật khẩu — chỉ cần chọn đúng tên nhóm là "login".
- **Khóa nhóm ngay sau lần chọn đầu tiên (single-entry lock):** ngay khi có người bấm vào tên nhóm lần đầu, nhóm đó chuyển sang trạng thái `locked` (hiện xám/khóa trên danh sách, không thể bấm chọn được nữa từ bất kỳ thiết bị nào khác). Mục đích: cả nhóm dùng chung 1 thiết bị, và tránh nhóm khác bấm nhầm vào tên nhóm không phải của mình.
- **Rớt mạng / vào lại = không cho vào lại:** nếu thiết bị đã vào bị mất kết nối hoặc reload trang, group đó vẫn ở trạng thái `locked` và **không thể truy cập lại** qua màn hình chọn nhóm (không có cơ chế rejoin bằng cách bấm lại tên nhóm). Đây là đánh đổi có chủ đích để ưu tiên chống vào nhầm nhóm hơn là chống rớt mạng.
- Sau khi chọn nhóm → lưu `groupId` vào session/localStorage của thiết bị đó → chuyển sang màn hình Game.
- Nếu nhóm đã **nộp bài rồi** mà bấm lại vào tên nhóm (trường hợp vẫn còn mở được, ví dụ do người điều khiển (GV) can thiệp mở khóa) → đưa thẳng tới màn hình Scoring (không cho làm lại).
- **Cơ chế mở khóa khẩn cấp (cho người điều khiển (GV)):** vì khóa cứng có rủi ro nhóm bị mất trắng nếu rớt mạng thật, nên cần 1 nút "Mở khóa nhóm" ở màn hình `/admin` (xem mục 3) để người điều khiển chủ động unlock thủ công cho nhóm bị sự cố, cho phép họ chọn lại tên nhóm và tiếp tục từ state đã lưu (không mất dữ liệu `selectedCells` đã có).

**Data cần:** danh sách nhóm (tên + id), trạng thái mỗi nhóm (`not_started` / `locked_in_progress` / `submitted`).

---

## 6. Màn hình 2 — Game (bảng dữ liệu)

### 4.1 Hiển thị

- Đồng hồ đếm ngược góc trên, bắt đầu từ **10:00** khi nhóm vào màn hình này (đếm giờ theo từng nhóm, không phải đồng loạt toàn lớp — trừ khi bạn muốn khống chế cứng, xem mục 8).
- Bảng `orders.csv` render dạng table, mỗi ô có thể click để toggle trạng thái chọn.
- Khi click 1 ô → cho hiện menu nhỏ chọn nhãn: 🔴 PII hoặc 🟡 Invariant (bắt buộc chọn loại khi đánh dấu, vì đây là 1 phần của bài học phân loại — dù điểm tính chung 1 công thức, nhãn vẫn cần lưu lại để phân tích sau).
- Ô đã chọn đổi màu nền theo nhãn (đỏ nhạt / vàng nhạt) để dễ nhận biết.
- Click lại lần nữa vào ô đã chọn → bỏ chọn.
- Nút **"Nộp bài"** luôn hiển thị, có thể nộp sớm trước khi hết giờ.
- Hết giờ (00:00) → tự động submit bài hiện tại của nhóm đó, khóa bảng lại (không cho click nữa).

### 4.2 Dữ liệu bảng (orders.csv)

Bộ dữ liệu chính thức: **7 dòng**, đúng 11 cột: `id, full_name, email, phone, address, notes, shipping_instruction, items, tax, shipping, totalPrice`.


| id  | full_name | email                                       | phone | address  | notes                                                                   | shipping_instruction              | items | tax | shipping | totalPrice |
| --- | --------- | ------------------------------------------- | ----- | -------- | ----------------------------------------------------------------------- | --------------------------------- | ----- | --- | -------- | ---------- |
| 1   | User001   | [user001@test.com](mailto:user001@test.com) | 0921  | District | Please call Tuan at 0987654321 before delivery.                         | Leave at front door.              | 100   | 10  | 5        | 115        |
| 2   | User002   | [user002@test.com](mailto:user002@test.com) | 0955  | District | Customer prefers evening delivery.                                      |                                   | 200   | 20  | 10       | 230        |
| 3   | User003   | [user003@test.com](mailto:user003@test.com) | 0988  | District | Fragile item, handle with care.                                         | Deliver to 45 Le Loi, District 1. | 150   | 15  | 0        | 165        |
| 4   | User004   | [user004@test.com](mailto:user004@test.com) | 0966  | District | Regular customer.                                                       |                                   | 80    | 8   | 5        | 100        |
| 5   | User005   | [user005@test.com](mailto:user005@test.com) | 0999  | District | Gift wrap requested.                                                    |                                   | 300   | 30  | 20       | 350        |
| 6   | User006   | [user006@test.com](mailto:user006@test.com) | 0912  | District | Contact backup email: [minh.tran@gmail.com](mailto:minh.tran@gmail.com) |                                   | 60    | 6   | 5        | 59         |
| 7   | User007   | [user007@test.com](mailto:user007@test.com) | 0934  | District | Deliver after 6pm.                                                      | Call 0912345678 when arriving.    | 500   | 50  | 25       | 575        |


Chỉ các ô sau được phép click chọn (các cột khác không tương tác, tránh sinh viên chọn nhầm cột đã mask sẵn như `phone`, `address`):

- `notes`
- `shipping_instruction`
- `tax`
- `totalPrice`

---

## 7. Đáp án (Answer Key) — cấu hình cứng trong agent


| Row | Cột                  | Loại         | Ghi chú                                                  |
| --- | -------------------- | ------------ | -------------------------------------------------------- |
| 1   | notes                | 🔴 PII       | Tên "Tuan" + SĐT đầy đủ `0987654321` lộ trong text tự do |
| 3   | shipping_instruction | 🔴 PII       | Địa chỉ đầy đủ "45 Le Loi, District 1"                   |
| 4   | totalPrice           | 🟡 Invariant | 80 + 8 + 5 = 93 ≠ 100 (tính sai)                         |
| 6   | notes                | 🔴 PII       | Email cá nhân `minh.tran@gmail.com`                      |
| 6   | tax                  | 🟡 Invariant | tax âm (`-6`) — không hợp lệ về nghiệp vụ                |
| 7   | shipping_instruction | 🔴 PII       | SĐT đầy đủ `0912345678`                                  |


```json
[
  { "row": 1, "column": "notes", "type": "PII" },
  { "row": 3, "column": "shipping_instruction", "type": "PII" },
  { "row": 4, "column": "totalPrice", "type": "Invariant" },
  { "row": 6, "column": "notes", "type": "PII" },
  { "row": 6, "column": "tax", "type": "Invariant" },
  { "row": 7, "column": "shipping_instruction", "type": "PII" }
]
```

**Tổng: 6 ô có lỗi / 28 ô khả dụng** (7 hàng × 4 cột clickable) ≈ 21% — đủ để tránh đoán bừa, vẫn giữ 2 hàng "sạch hoàn toàn" (row 2, row 5) làm distractor.

**Lưu ý về nhãn khi chấm điểm:** vì công thức điểm dùng chung (+2/−1/0) không phân biệt loại, nhãn PII/Invariant **không ảnh hưởng đến điểm**, chỉ dùng để lưu log/thống kê (ví dụ: nhóm nào giỏi phát hiện PII hơn Invariant). Nếu nhóm chọn đúng ô nhưng gắn sai nhãn (VD: đúng là PII nhưng nhóm gắn Invariant) → **vẫn tính +2** (vì chỉ có 1 loại tính điểm dựa trên vị trí ô, không phạt nhãn sai). Cần ghi rõ điều này trong luật để agent không tự ý phạt thêm.

---

## 8. Công thức chấm điểm

Với mỗi nhóm, so khớp danh sách ô đã chọn với Answer Key (chỉ theo `row + column`, bỏ qua `type`):


| Trường hợp                                    | Điểm |
| --------------------------------------------- | ---- |
| Ô nhóm chọn **có trong** Answer Key           | +2   |
| Ô nhóm chọn **không có trong** Answer Key     | −1   |
| Ô **trong** Answer Key mà nhóm **không chọn** | 0    |


**Tổng điểm = Σ điểm từng ô.** Không có điểm sàn/trần âm giới hạn (điểm có thể âm nếu chọn bừa quá nhiều).

---

## 9. Màn hình 3 — Scoring

- Sau khi nhóm nộp bài → hiện ngay: tổng điểm của nhóm, số ô đúng / sai / bỏ sót.
- Hiện bảng review chi tiết: liệt kê từng ô đã chọn — đúng (✅ +2) hay sai (❌ −1), và liệt kê các ô bị bỏ sót (⚪ 0) để nhóm học được ngay sau khi chơi.
- Bảng xếp hạng (leaderboard) toàn lớp: tên nhóm + tổng điểm, sắp giảm dần, cập nhật real-time khi có nhóm mới nộp.
- Nút **"Tiếp tục"** → chuyển sang One-Minute Paper.

---

## 10. Màn hình 4 — One-Minute Paper

Form đơn giản, 3 trường, bắt buộc điền cả 3 trước khi submit:


| Field                       | Loại input                          | Ghi chú  |
| --------------------------- | ----------------------------------- | -------- |
| (a) One thing learned       | Textarea ngắn (giới hạn ~200 ký tự) | Bắt buộc |
| (b) One thing still unclear | Textarea ngắn (giới hạn ~200 ký tự) | Bắt buộc |
| (c) Usefulness rating       | Thang 1–5 (radio/star)              | Bắt buộc |


- Submit → lưu vào data store gắn với `groupId`.
- Sau submit → màn hình cảm ơn ("Cảm ơn nhóm đã tham gia!") + có thể hiện lại điểm số/leaderboard lần cuối.
- Giảng viên cần 1 view riêng (có thể chỉ cần export CSV/JSON) để xem toàn bộ phản hồi 1-minute paper của các nhóm sau buổi học.

---

## 11. Yêu cầu kỹ thuật cho agent

- **State cần lưu theo từng nhóm:** `groupId`, `status` (not_started/in_progress/submitted), `selectedCells` (list of {row, column, type}), `score`, `startTime`, `submitTime`, `feedbackForm` ({learned, unclear, rating}).
- **Đồng bộ nhiều thiết bị:** nếu 3–4 sinh viên/nhóm dùng chung 1 thiết bị thì không cần realtime sync phức tạp; nếu cho phép nhiều thiết bị/nhóm thì cần lưu state chung theo `groupId` (không theo từng thiết bị).
- **Trang Admin:** xem chi tiết đầy đủ ở mục 3 (bắt đầu/kết thúc trò chơi, mở khóa nhóm). Về mặt kỹ thuật, chỉ cần 1 route riêng (`/admin`), không cần auth riêng, đọc/ghi cùng data store shared với các nhóm.
- **Lưu trữ dữ liệu:** không cần backend phức tạp — dùng key-value storage (per-nhóm là non-shared cho phần làm bài, phần leaderboard là shared để mọi nhóm thấy điểm nhau).
- **Không cần xác thực thật (real auth)** — chỉ là chọn tên nhóm, phù hợp bối cảnh in-class.

