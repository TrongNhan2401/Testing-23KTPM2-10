# Đặc tả: Spot the PII & Invariant Bugs – Game Agent

## 1. Tổng quan

**Loại ứng dụng:** Web app (single page), chơi trực tiếp trên lớp, nhiều nhóm cùng truy cập song song.

**Thời lượng:** 10 phút chơi + chấm điểm tự động + 1-minute paper.

**Số nhóm:** cấu hình được (mặc định 6–8 nhóm, đặt tên Group01…Group08).

**Điểm số:** 1 loại duy nhất — Đúng: **+2** | Sai: **−1** | Bỏ sót: **0**.

**Phản hồi điểm:** tức thời ngay khi click, không cần bước phân loại nhãn (xem mục 6).

---

## 2. Luồng màn hình (Flow)

```
[1] Landing/Login screen
      → chọn nhóm từ danh sách → vào phòng của nhóm
[2] Game screen (bảng orders.csv, đếm ngược 10:00)
      → nhóm click vào ô nghi ngờ có lỗi
      → click đúng: ô chuyển xanh, +2 điểm ngay lập tức
      → click sai: ô chuyển đỏ, −1 điểm ngay lập tức
      → nộp bài sớm (submit) hoặc hết giờ tự nộp
[3] Scoring / Leaderboard screen (hiện điểm ngay sau submit)
      → bảng xếp hạng các nhóm theo điểm và thời gian nộp
[4] One-Minute Paper form
      → (a) one thing learned (text)
      → (b) one thing still unclear (text)
      → (c) usefulness rating 1–5 (scale)
      → submit → cảm ơn / kết thúc
```

---

## 3. Trang điều phối (dành cho nhóm thuyết trình)

Một trang riêng, đơn giản, do **nhóm thuyết trình** (nhóm đứng lớp seminar, không phải giảng viên hay ban tổ chức riêng) dùng để chủ động điều khiển trò chơi. Không cần thiết kế cầu kỳ — 1 danh sách + vài nút bấm là đủ.

### 3.1 Trạng thái trò chơi (Game State)

- Toàn bộ game có 1 trạng thái chung: `not_started` (mặc định) / `running` / `ended`.
- Ở trạng thái `not_started`: màn hình Login (mục 5) hiện thông báo "Trò chơi chưa bắt đầu, vui lòng chờ" — danh sách nhóm hiện nhưng **không bấm chọn được**.
- Nhóm thuyết trình bấm nút **"Bắt đầu trò chơi"** trên trang điều phối → chuyển toàn bộ game sang `running`. Lúc này màn hình Login mới cho phép các nhóm bấm chọn tên để vào.
- Đồng hồ đếm ngược 10 phút của từng nhóm chỉ bắt đầu chạy khi nhóm đó thực sự bấm vào (không phải khi trang điều phối bấm "Bắt đầu"), giữ đúng như mục 6.1 đã mô tả.
- Nhóm thuyết trình có thể bấm **"Kết thúc giờ"** để chuyển sang `ended`: mọi nhóm chưa nộp bị tự động submit ngay, khóa toàn bộ bảng.

### 3.2 Danh sách nhóm & quản lý khóa

- Bảng danh sách tất cả nhóm, mỗi dòng gồm: tên nhóm — trạng thái (`not_started` / `locked_in_progress` / `submitted`) — điểm hiện tại (nếu đã có) — thời gian nộp (nếu đã nộp) — nút hành động.
- Nút hành động theo trạng thái:
  - `locked_in_progress` → nút **"Mở khóa"** (dùng khi nhóm rớt mạng thật, cần vào lại từ thiết bị khác).
  - `not_started` → không có hành động gì thêm (đang chờ nhóm tự bấm vào).
  - `submitted` → không cần hành động (có thể xem lại điểm).
- Danh sách này nên tự cập nhật real-time (poll định kỳ vài giây là đủ, không cần websocket phức tạp).

### 3.3 Xem bảng xếp hạng

- Trang điều phối hiển thị luôn **bảng xếp hạng (leaderboard)** giống hệt những gì các nhóm thấy sau khi nộp bài (mục 9), cập nhật real-time — để nhóm thuyết trình có thể chiếu màn hình này lên cho cả lớp xem trực tiếp trong lúc chờ các nhóm còn lại nộp bài.

### 3.4 Giữ quy mô nhỏ gọn

Trang điều phối **không cần**: đăng nhập/mật khẩu riêng, phân quyền nhiều người, lịch sử thao tác, hay chỉnh sửa đáp án qua giao diện. Đây chỉ là 1 bảng điều khiển đơn giản (route riêng, ví dụ `/host`), đủ dùng cho 1 buổi seminar 10 phút. Answer Key vẫn cấu hình cứng trong code (mục 7), không cần UI để sửa.

---

## 4. Màn hình 1 — Login theo nhóm

- Hiển thị danh sách nhóm dạng nút bấm (grid), lấy từ config (VD: Group01…Group08).
- Không cần mật khẩu — chỉ cần chọn đúng tên nhóm là "login".
- **Khóa nhóm ngay sau lần chọn đầu tiên (single-entry lock):** ngay khi có người bấm vào tên nhóm lần đầu, nhóm đó chuyển sang trạng thái `locked` (hiện xám/khóa trên danh sách, không thể bấm chọn được nữa từ bất kỳ thiết bị nào khác). Mục đích: cả nhóm dùng chung 1 thiết bị, và tránh nhóm khác bấm nhầm vào tên nhóm không phải của mình.
- **Rớt mạng / vào lại = không cho vào lại:** nếu thiết bị đã vào bị mất kết nối hoặc reload trang, group đó vẫn ở trạng thái `locked` và **không thể truy cập lại** qua màn hình chọn nhóm (không có cơ chế rejoin bằng cách bấm lại tên nhóm). Đây là đánh đổi có chủ đích để ưu tiên chống vào nhầm nhóm hơn là chống rớt mạng.
- Sau khi chọn nhóm → lưu `groupId` vào session/localStorage của thiết bị đó → chuyển sang màn hình Game.
- Nếu nhóm đã **nộp bài rồi** mà bấm lại vào tên nhóm (trường hợp vẫn còn mở được, ví dụ do nhóm thuyết trình can thiệp mở khóa) → đưa thẳng tới màn hình Scoring/Leaderboard (không cho làm lại).
- **Cơ chế mở khóa khẩn cấp:** vì khóa cứng có rủi ro nhóm bị mất trắng nếu rớt mạng thật, nên cần 1 nút "Mở khóa nhóm" ở trang điều phối (`/host`, xem mục 3) để chủ động unlock thủ công cho nhóm bị sự cố, cho phép họ chọn lại tên nhóm và tiếp tục từ state đã lưu (không mất dữ liệu `selectedCells` đã có).

**Data cần:** danh sách nhóm (tên + id), trạng thái mỗi nhóm (`not_started` / `locked_in_progress` / `submitted`).

---

## 5. Màn hình 2 — Game (bảng dữ liệu)

### 5.1 Hiển thị & tương tác

- Đồng hồ đếm ngược góc trên, bắt đầu từ **10:00** khi nhóm vào màn hình này (đếm giờ theo từng nhóm, không phải đồng loạt toàn lớp — trừ khi nhóm thuyết trình chủ động bấm "Kết thúc giờ" ở trang điều phối để khống chế cứng, xem mục 3.1).
- Bảng `orders.csv` render dạng table, mỗi ô trong 4 cột clickable (`notes`, `shipping_instruction`, `tax`, `totalPrice`) có thể click.
- **Phản hồi tức thời khi click (không qua bước chọn nhãn):**
  - Click vào ô **có trong Answer Key** → ô chuyển màu **xanh lá**, cộng ngay **+2 điểm** vào tổng điểm hiển thị trên màn hình.
  - Click vào ô **không có trong Answer Key** → ô chuyển màu **đỏ**, trừ ngay **−1 điểm**.
  - Điểm số hiển thị real-time ở góc màn hình, cập nhật theo từng click.
- Click lại lần nữa vào ô đã chọn → bỏ chọn (ô trở về màu gốc), hoàn tác điểm tương ứng (+2 hoặc −1) khỏi tổng điểm. Cho phép sinh viên sửa sai trước khi nộp bài.
- Nút **"Nộp bài"** luôn hiển thị, nhóm có thể nộp sớm bất cứ lúc nào trước khi hết giờ.
- Hết giờ (00:00) → tự động submit bài hiện tại của nhóm đó, khóa bảng lại (không cho click nữa).
- Thời điểm nộp bài (`submitTime`, tính bằng thời gian còn lại hoặc thời gian đã dùng) được lưu lại để dùng cho xếp hạng (mục 9).

### 5.2 Dữ liệu bảng (orders.csv)

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

## 6. Đáp án (Answer Key) — cấu hình cứng trong agent


| Row | Cột                  | Loại (chỉ để log, không ảnh hưởng điểm) | Ghi chú                                                  |
| --- | -------------------- | --------------------------------------- | -------------------------------------------------------- |
| 1   | notes                | 🔴 PII                                  | Tên "Tuan" + SĐT đầy đủ `0987654321` lộ trong text tự do |
| 3   | shipping_instruction | 🔴 PII                                  | Địa chỉ đầy đủ "45 Le Loi, District 1"                   |
| 4   | totalPrice           | 🟡 Invariant                            | 80 + 8 + 5 = 93 ≠ 100 (tính sai)                         |
| 6   | notes                | 🔴 PII                                  | Email cá nhân `minh.tran@gmail.com`                      |
| 6   | tax                  | 🟡 Invariant                            | tax âm (`-6`) — không hợp lệ về nghiệp vụ                |
| 7   | shipping_instruction | 🔴 PII                                  | SĐT đầy đủ `0912345678`                                  |


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

**Lưu ý:** trường `type` (PII/Invariant) trong Answer Key chỉ dùng để lưu log/thống kê nội bộ (ví dụ: nhóm nào giỏi phát hiện PII hơn Invariant), **không hiển thị cho sinh viên và không ảnh hưởng đến điểm** — vì giờ sinh viên chỉ click chọn ô, không cần gắn nhãn loại lỗi.

---

## 7. Công thức chấm điểm

Với mỗi lần click vào 1 ô trong 4 cột clickable, so khớp ngay với Answer Key (theo `row + column`):


| Trường hợp                                                          | Điểm | Màu hiển thị             |
| ------------------------------------------------------------------- | ---- | ------------------------ |
| Ô click **có trong** Answer Key                                     | +2   | 🟢 Xanh lá               |
| Ô click **không có trong** Answer Key                               | −1   | 🔴 Đỏ                    |
| Ô **trong** Answer Key mà nhóm **không chọn** (khi hết giờ/nộp bài) | 0    | (giữ màu gốc, không đổi) |


**Tổng điểm = Σ điểm từng ô đã chọn**, cộng dồn real-time ngay khi click, không cần chờ đến lúc nộp bài mới tính. Không có điểm sàn/trần âm giới hạn (điểm có thể âm nếu chọn bừa quá nhiều).

---

## 8. Nộp bài (Submit)

- Nhóm có thể bấm **"Nộp bài"** bất cứ lúc nào trong thời gian 10 phút — không cần đợi hết giờ.
- Khi nộp (dù chủ động hay do hết giờ tự động) → khóa bảng, chuyển sang màn hình Scoring/Leaderboard.
- Ghi lại `submitTime` (mốc thời gian nộp, hoặc thời gian còn lại tại lúc nộp) để dùng làm tiêu chí phụ khi xếp hạng.

---

## 9. Màn hình 3 — Scoring & Leaderboard

- Sau khi nhóm nộp bài → hiện ngay: tổng điểm cuối cùng của nhóm, số ô đúng / sai (dựa trên các ô đã click, đã có màu xanh/đỏ sẵn từ lúc chơi).
- Hiện thêm các ô bị **bỏ sót** (⚪, có trong Answer Key nhưng nhóm không chọn) để nhóm học được ngay sau khi chơi.
- **Bảng xếp hạng (leaderboard) toàn lớp**, sắp xếp theo:
  1. Tổng điểm giảm dần (ưu tiên chính).
  2. Nếu bằng điểm → nhóm nộp bài **sớm hơn** xếp trên (thời gian là tiêu chí phụ).
- Bảng xếp hạng cập nhật real-time khi có nhóm mới nộp, và hiển thị cho **cả nhóm đang xem màn hình của mình lẫn trang điều phối** (mục 3.3).
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
- Nhóm thuyết trình cần 1 view riêng (có thể chỉ cần export CSV/JSON) để xem toàn bộ phản hồi 1-minute paper của các nhóm sau buổi học.

---

## 11. Yêu cầu kỹ thuật cho agent

- **State cần lưu theo từng nhóm:** `groupId`, `status` (not_started/locked_in_progress/submitted), `selectedCells` (list of {row, column, result: "correct"|"wrong"}), `score`, `startTime`, `submitTime`, `feedbackForm` ({learned, unclear, rating}).
- **Tính điểm tức thời phía client, xác nhận lại phía lưu trữ khi nộp:** mỗi click tính điểm ngay để hiển thị UX mượt, nhưng khi submit cần tính lại `score` dựa trên `selectedCells` đã lưu để đảm bảo không bị sai lệch do lỗi mạng/đồng bộ.
- **Đồng bộ nhiều thiết bị:** nếu 3–4 sinh viên/nhóm dùng chung 1 thiết bị thì không cần realtime sync phức tạp; nếu cho phép nhiều thiết bị/nhóm thì cần lưu state chung theo `groupId` (không theo từng thiết bị).
- **Trang điều phối:** xem chi tiết đầy đủ ở mục 3 (bắt đầu/kết thúc trò chơi, mở khóa nhóm, xem leaderboard). Về mặt kỹ thuật, chỉ cần 1 route riêng (ví dụ `/host`), không cần auth riêng, đọc/ghi cùng data store shared với các nhóm.
- **Lưu trữ dữ liệu:** không cần backend phức tạp — dùng key-value storage (per-nhóm là non-shared cho phần làm bài, phần leaderboard là shared để mọi nhóm và trang điều phối cùng thấy điểm nhau).
- **Không cần xác thực thật (real auth)** — chỉ là chọn tên nhóm, phù hợp bối cảnh in-class.

