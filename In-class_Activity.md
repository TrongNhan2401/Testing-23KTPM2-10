# **Trò chơi: Spot the PII – AI vs Human Detective**

**Thời lượng:** 25 phút

**Số lượng:** 3–4 sinh viên/nhóm

**Mục tiêu**

Bạn là đội QA của EShop. Trước khi chia sẻ cơ sở dữ liệu cho đối tác kiểm thử, nhóm phải:

* Xác định tất cả dữ liệu nhạy cảm (PII) trong database dump.  
* Chọn phương pháp masking phù hợp.  
* So sánh với kết quả của AI và tìm những PII mà AI bỏ sót.

---

# **Bối cảnh**

EShop chuẩn bị gửi dữ liệu Staging cho một công ty QA bên ngoài.

Một thực tập sinh đã dùng AI để tìm PII và cho rằng dữ liệu đã an toàn.

Tuy nhiên, AI không phải lúc nào cũng phát hiện hết dữ liệu nhạy cảm.

Nhiệm vụ của nhóm là kiểm tra lại và đảm bảo **không còn PII nào bị rò rỉ**.

## **Luật chơi**

Mỗi nhóm nhận một file CSV khoảng **20 dòng**.

Một số ô đã được AI masking.

Một số ô vẫn còn PII.

Các nhóm phải **đánh dấu chính xác những ô còn chứa PII**.

## **Cách chơi**

Các nhóm dùng bút highlight hoặc đánh dấu vào từng ô.

Ví dụ

| Ô | Có nên chọn? |
| ----- | ----- |
| Row 1 \- Notes | ✅ |
| Row 2 \- Notes | ❌ |
| Row 3 \- Notes | ✅ |
| Row 4 \- Notes | ❌ |

---

## **Cách tính điểm**

* Chọn đúng 1 ô còn PII: **\+2 điểm**  
* Chọn nhầm 1 ô không chứa PII: **−1 điểm**  
* Bỏ sót 1 ô có PII: **0 điểm**

Nhóm có tổng điểm cao nhất thắng.

## **Gợi ý chấm điểm**

Để chấm nhanh, bạn có thể chuẩn bị sẵn một **đáp án** dưới dạng tọa độ ô.

Ví dụ:

| Cell | Đáp án |
| ----- | ----- |
| E1 | ✅ |
| F2 | ✅ |
| E3 | ✅ |
| F4 | ✅ |

## **Schema**

### **orders.csv**

| id | full\_name | email | phone | address | notes | shipping\_instruction | items | tax | shipping | totalPrice |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | User001 | user001@test.com | 09\*\*\*\*\*\*21 | District \* | Please call Jane at 123122100278 before delivery. | Leave at front door. | 100 | 10 | 5 | 115 |
| 2 | User002 | user002@test.com | 09\*\*\*\*\*\*55 | District \* | Customer prefers morning delivery. | \- | 250 | 25 | 0 | 275 |
| 3 | User003 | user003@test.com | 09\*\*\*\*\*\*88 | District \* | Passport VN1234567 verified. | \- | 50 | 5 | 10 | **50** |
| 4 | User004 | user004@test.com | 09\*\*\*\*\*\*66 | District \* | VIP customer. | \- | 1000 | 100 | 50 | 1150 |
| 5 | User005 | user005@test.com | 09\*\*\*\*\*\*99 | District \* | \- | Deliver to 123 Nguyen Trai, District 5 | 120 | **\-12** | 15 | **123** |
| 6 | User006 | user006@test.com | 09\*\*\*\*\*\*12 | District \* | Company email: john.smith@abc.com | \- | 80 | 8 | 5 | 93 |
| 7 | User007 | user007@test.com | 09\*\*\*\*\*\*34 | District \* | Allergic to peanuts. | \- | 300 | 30 | 0 | 330 |
| 8 | User008 | user008@test.com | 09\*\*\*\*\*\*45 | District \* | National ID 079203001234 checked. | \- | 45 | 4.5 | 5 | **999** |
| 9 | User009 | user009@test.com | 09\*\*\*\*\*\*67 | District \* | Lives near HCMUS. | \- | 600 | 60 | 20 | 680 |
| 10 | User010 | user010@test.com | 09\*\*\*\*\*\*89 | District \* | Birthday gift. | Call 0909123456 on arrival. | 150 | 15 | 15 | 180 |

