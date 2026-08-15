# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ
## Hệ thống đặt lịch sân cầu lông (Badminton Court Booking System)

| | |
|---|---|
| **Mã tài liệu** | BRD-BCB-001 |
| **Phiên bản** | 1.0 |
| **Loại hệ thống** | Web application (single-tenant — một cụm sân, một chủ sân) |

---

## 1. BỐI CẢNH & MỤC TIÊU

### 1.1. Vấn đề hiện tại

Chủ sân cầu lông hiện quản lý đặt sân qua điện thoại và sổ giấy. Cách làm này gây ra:

- Khách phải gọi điện mới biết sân còn trống hay không, chỉ đặt được trong giờ hành chính.
- Chủ sân ghi nhầm, ghi trùng hai khách vào một khung giờ, dẫn đến tranh chấp tại sân.
- Không có dữ liệu để biết khung giờ nào ế, sân nào được ưa chuộng, doanh thu tháng bao nhiêu.
- Khách đặt rồi không đến (no-show) mà không có cơ chế ràng buộc hay theo dõi.

### 1.2. Mục tiêu hệ thống

| Mã | Mục tiêu | Tiêu chí đo lường |
|---|---|---|
| G1 | Khách tự xem lịch trống và đặt sân 24/7 | Đặt sân hoàn tất trong ≤ 3 bước |
| G2 | Loại bỏ hoàn toàn tình trạng đặt trùng | 0 booking chồng lấn trong DB |
| G3 | Giảm công sức quản lý thủ công của chủ sân | Không cần ghi sổ tay |
| G4 | Cung cấp số liệu vận hành | Báo cáo doanh thu & tỷ lệ lấp đầy theo ngày/tháng |
| G5 | Giảm no-show | Có nhắc lịch tự động + theo dõi lịch sử vi phạm |

---

## 2. PHẠM VI

### 2.1. Trong phạm vi (In-scope)

- Quản lý danh mục sân và cấu hình giờ hoạt động
- Bảng giá theo khung giờ (thường / cao điểm) và theo ngày trong tuần
- Tra cứu lịch trống, đặt sân, hủy sân
- Xác thực người dùng, phân quyền theo vai trò
- Check-in tại sân, ghi nhận no-show
- Chặn sân để bảo trì
- Thông báo qua email (xác nhận, nhắc lịch, hủy)
- Báo cáo doanh thu và tỷ lệ lấp đầy

### 2.2. Ngoài phạm vi (Out-of-scope — phiên bản 1)

- Thanh toán online (VNPay/Momo) — thanh toán tiền mặt tại sân
- Đặt lịch cố định định kỳ hàng tuần
- Quản lý nhiều chi nhánh
- Cho thuê vợt / bán nước / quản lý kho hàng
- Ứng dụng di động native
- Ghép đôi tìm bạn đánh cặp

> **Ghi chú BA:** Các hạng mục ngoài phạm vi được đưa vào backlog phiên bản 2. Riêng thanh toán online sẽ ảnh hưởng lớn đến vòng đời booking, nên khi thiết kế DB cần chừa sẵn trường `payment_status` để không phải sửa cấu trúc sau này.

---

## 3. CÁC BÊN LIÊN QUAN & VAI TRÒ

| Vai trò | Mô tả | Quyền chính |
|---|---|---|
| **Khách vãng lai** (Guest) | Người chưa đăng nhập | Xem danh sách sân, xem lịch trống, xem bảng giá |
| **Khách hàng** (Customer) | Người chơi đã có tài khoản | Toàn quyền của Guest + đặt sân, hủy sân, xem lịch sử đặt của mình |
| **Nhân viên** (Staff) | Người trực tại quầy | Xem lịch tổng, đặt sân hộ khách gọi điện, check-in, ghi nhận no-show |
| **Chủ sân** (Owner/Admin) | Người quản lý | Toàn quyền của Staff + CRUD sân, cấu hình giá, chặn bảo trì, xem báo cáo, quản lý tài khoản |
| **Hệ thống** (System) | Tác nhân tự động | Gửi email nhắc lịch, tự hủy booking quá hạn giữ chỗ, tự đánh dấu no-show |

---

## 4. THUẬT NGỮ NGHIỆP VỤ

| Thuật ngữ | Định nghĩa |
|---|---|
| **Sân (Court)** | Một sân cầu lông vật lý, có mã riêng (Sân 1, Sân 2...) |
| **Khung giờ (Slot)** | Đơn vị thời gian nhỏ nhất có thể đặt, mặc định 60 phút |
| **Booking** | Một lần đặt sân, gồm 1 sân + 1 khoảng thời gian liên tục |
| **Giờ cao điểm (Peak)** | Khung giờ có giá cao hơn, thường 17:00–21:00 và cuối tuần |
| **Chồng lấn (Overlap)** | Hai booking trên cùng một sân có khoảng thời gian giao nhau |
| **Giữ chỗ (Hold)** | Trạng thái tạm khóa slot trong lúc khách đang xác nhận |
| **No-show** | Khách đặt sân nhưng không đến chơi và không hủy trước |
| **Tỷ lệ lấp đầy** | (Số giờ đã đặt ÷ Tổng số giờ có thể đặt) × 100% |

---

## 5. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

Đây là phần quan trọng nhất — mọi quy tắc dưới đây **bắt buộc phải kiểm tra ở tầng backend**, không được chỉ xử lý ở giao diện.

### 5.1. Nhóm quy tắc về thời gian

| Mã | Quy tắc |
|---|---|
| BR-01 | Chỉ được đặt sân trong khung giờ hoạt động của sân đó (mặc định 05:00–23:00) |
| BR-02 | Thời lượng tối thiểu 1 giờ, tối đa 3 giờ liên tục cho mỗi booking |
| BR-03 | Thời gian bắt đầu phải rơi đúng vào mốc khung giờ (chỉ nhận :00, không nhận 18:20) |
| BR-04 | Không được đặt sân cho thời điểm trong quá khứ |
| BR-05 | Chỉ được đặt trước tối đa 30 ngày kể từ hôm nay |
| BR-06 | Toàn bộ thời gian lưu trong DB theo UTC; hiển thị theo giờ Việt Nam (UTC+7) |

### 5.2. Nhóm quy tắc về chống trùng lịch

| Mã | Quy tắc |
|---|---|
| BR-07 | Trên cùng một sân, tại một thời điểm chỉ tồn tại **duy nhất một** booking ở trạng thái đang hiệu lực (`HOLD`, `CONFIRMED`, `CHECKED_IN`) |
| BR-08 | Hai khoảng thời gian được coi là chồng lấn khi: `new_start < old_end AND new_end > old_start` |
| BR-09 | Slot đang ở trạng thái `HOLD` được coi là đã bị chiếm, khách khác không đặt được |
| BR-10 | Thời gian giữ chỗ tối đa 5 phút; quá hạn hệ thống tự giải phóng slot |
| BR-11 | Booking đã `CANCELLED` hoặc `NO_SHOW` **không** tính là chiếm slot |
| BR-12 | Slot nằm trong khoảng bảo trì của sân thì không ai đặt được, kể cả admin |

### 5.3. Nhóm quy tắc về hủy sân

| Mã | Quy tắc |
|---|---|
| BR-13 | Khách chỉ được tự hủy khi còn **ít nhất 2 giờ** trước giờ chơi |
| BR-14 | Trong vòng 2 giờ trước giờ chơi, khách muốn hủy phải liên hệ nhân viên; chỉ Staff/Owner được thực hiện |
| BR-15 | Không được hủy booking đã ở trạng thái `CHECKED_IN` hoặc `COMPLETED` |
| BR-16 | Khách chỉ được hủy booking của chính mình |
| BR-17 | Khi bảo trì đột xuất, admin hủy booking bị ảnh hưởng — hệ thống bắt buộc ghi lý do và gửi email xin lỗi |

### 5.4. Nhóm quy tắc về khách hàng

| Mã | Quy tắc |
|---|---|
| BR-18 | Một khách chỉ được có tối đa **3 booking đang hiệu lực** tại cùng thời điểm |
| BR-19 | Khách phải xác thực email trước khi được đặt sân lần đầu |
| BR-20 | Khách bị **3 lần no-show trong 30 ngày** sẽ bị khóa quyền đặt sân, cần Owner mở lại |
| BR-21 | Khách không thể tự đặt hai booking trùng giờ nhau ở hai sân khác nhau |

### 5.5. Nhóm quy tắc về giá

| Mã | Quy tắc |
|---|---|
| BR-22 | Giá được tính theo từng giờ, cộng dồn theo khung giờ mà booking đi qua |
| BR-23 | Giá được **chốt và lưu lại tại thời điểm đặt**; sau này chủ sân đổi bảng giá không làm thay đổi booking cũ |
| BR-24 | Cuối tuần (T7, CN) áp dụng bảng giá riêng |
| BR-25 | Booking bị hủy đúng hạn không phát sinh phí |

> **Ghi chú BA — BR-23 rất quan trọng.** Đây là lỗi kinh điển: lưu `price_id` rồi join ra giá hiện tại. Khi chủ sân tăng giá, toàn bộ hóa đơn cũ sẽ hiển thị sai. Phải lưu giá thành tiền cụ thể (`total_amount`) ngay trong bản ghi booking.

---

## 6. VÒNG ĐỜI BOOKING (STATE MACHINE)

### 6.1. Danh sách trạng thái

| Trạng thái | Ý nghĩa | Chiếm slot? |
|---|---|---|
| `HOLD` | Đang giữ chỗ, khách chưa xác nhận | Có |
| `CONFIRMED` | Đã xác nhận, chờ đến giờ chơi | Có |
| `CHECKED_IN` | Khách đã đến sân | Có |
| `COMPLETED` | Đã chơi xong, đã thanh toán | Không (đã qua) |
| `CANCELLED` | Đã hủy | Không |
| `NO_SHOW` | Khách không đến | Không |

### 6.2. Sơ đồ chuyển trạng thái

```
                    ┌──────────────────────────────┐
                    │   Khách chọn slot & xác nhận │
                    └──────────────┬───────────────┘
                                   ▼
                              ┌─────────┐
                    ┌─────────│  HOLD   │
                    │         └────┬────┘
      quá 5 phút    │              │ khách bấm "Xác nhận đặt sân"
      (System)      │              ▼
                    │        ┌───────────┐
                    │        │ CONFIRMED │──────────────┐
                    │        └─────┬─────┘              │
                    │              │                    │ khách/staff hủy
                    │  staff check-in tại sân           │ (BR-13, BR-14)
                    │              ▼                    ▼
                    │       ┌────────────┐        ┌───────────┐
                    │       │ CHECKED_IN │        │ CANCELLED │
                    │       └─────┬──────┘        └───────────┘
                    │             │ hết giờ chơi
                    │             ▼
                    │       ┌───────────┐
                    │       │ COMPLETED │
                    │       └───────────┘
                    │
                    │        quá 20 phút kể từ giờ bắt đầu
                    │        mà chưa check-in (System)
                    ▼              ▼
             ┌───────────┐   ┌───────────┐
             │ CANCELLED │   │  NO_SHOW  │
             └───────────┘   └───────────┘
```

### 6.3. Bảng chuyển trạng thái hợp lệ

| Từ | Sang | Ai thực hiện | Điều kiện |
|---|---|---|---|
| `HOLD` | `CONFIRMED` | Customer | Trong vòng 5 phút |
| `HOLD` | `CANCELLED` | System | Quá 5 phút không xác nhận |
| `CONFIRMED` | `CHECKED_IN` | Staff | Trong khoảng ±20 phút quanh giờ bắt đầu |
| `CONFIRMED` | `CANCELLED` | Customer | Còn ≥ 2 giờ trước giờ chơi (BR-13) |
| `CONFIRMED` | `CANCELLED` | Staff / Owner | Bất kỳ lúc nào, phải ghi lý do |
| `CONFIRMED` | `NO_SHOW` | System | Quá 20 phút kể từ giờ bắt đầu mà chưa check-in |
| `CHECKED_IN` | `COMPLETED` | System / Staff | Đã qua giờ kết thúc |

Mọi chuyển đổi không có trong bảng trên đều bị từ chối. Ví dụ: `CANCELLED` không thể quay lại `CONFIRMED` — khách muốn đặt lại phải tạo booking mới.

---

## 7. QUY TRÌNH NGHIỆP VỤ CHI TIẾT

### QT-01: Khách đặt sân trực tuyến

**Tác nhân chính:** Khách hàng
**Điều kiện đầu vào:** Đã đăng nhập, email đã xác thực, chưa bị khóa đặt sân
**Kết quả mong đợi:** Booking ở trạng thái `CONFIRMED`, khách nhận được email xác nhận

**Luồng chính:**

1. Khách chọn ngày muốn chơi trên lịch
2. Hệ thống hiển thị lưới khung giờ của tất cả sân trong ngày đó, mỗi ô ghi rõ: trống / đã đặt / đang giữ / bảo trì, kèm giá tiền
3. Khách chọn một sân và một hoặc nhiều khung giờ liền nhau
4. Hệ thống kiểm tra BR-01 đến BR-05, BR-18, BR-21
5. Hệ thống tạo booking `HOLD`, khóa slot trong 5 phút, hiển thị đồng hồ đếm ngược
6. Hệ thống hiển thị màn hình xác nhận: tên sân, ngày giờ, thời lượng, tổng tiền, chính sách hủy
7. Khách bấm "Xác nhận đặt sân"
8. Hệ thống kiểm tra lại chồng lấn lần cuối trong transaction (BR-07, BR-08)
9. Hệ thống chuyển booking sang `CONFIRMED`, sinh mã booking dạng `BK-20260815-0042`
10. Hệ thống đưa email xác nhận vào hàng đợi và lên lịch email nhắc trước giờ chơi 60 phút
11. Hệ thống hiển thị trang thành công kèm mã booking

**Luồng ngoại lệ:**

| Mã | Tình huống | Xử lý |
|---|---|---|
| E1 | Slot vừa bị người khác đặt mất ở bước 4 | Báo "Khung giờ vừa được đặt bởi người khác", tải lại lưới lịch, giữ nguyên lựa chọn ngày |
| E2 | Hai người bấm xác nhận cùng lúc ở bước 8 | Transaction thắng được ghi nhận; người thua nhận thông báo E1, không tạo bản ghi rác |
| E3 | Hết 5 phút giữ chỗ | Slot tự giải phóng, hiển thị "Phiên giữ chỗ đã hết hạn, vui lòng chọn lại" |
| E4 | Khách đã có 3 booking hiệu lực | Chặn ở bước 4, báo rõ số booking hiện có và gợi ý hủy bớt |
| E5 | Khách đang bị khóa do no-show | Chặn ngay từ bước 3, hiển thị số lần vi phạm và hướng dẫn liên hệ chủ sân |
| E6 | Khách chọn các khung giờ không liền nhau | Chặn, yêu cầu tách thành nhiều booking riêng |
| E7 | Gửi email thất bại ở bước 10 | **Không** rollback booking; ghi log, đưa vào hàng đợi thử lại. Booking vẫn hợp lệ |

> **Ghi chú BA — luồng E2 là trọng tâm kỹ thuật của dự án.** Việc kiểm tra ở bước 4 chỉ nhằm cải thiện trải nghiệm, **không** đảm bảo đúng đắn. Tính đúng đắn phải do bước 8 gánh, bằng transaction có khóa dòng trên bản ghi sân hoặc ràng buộc chống chồng lấn ở tầng cơ sở dữ liệu. Nên viết kịch bản gửi 20 request song song vào cùng một slot để tự kiểm chứng trước khi bàn giao.

---

### QT-02: Khách hủy sân

**Tác nhân chính:** Khách hàng
**Điều kiện đầu vào:** Booking thuộc về khách, đang ở `CONFIRMED`, còn ≥ 2 giờ trước giờ chơi

**Luồng chính:**

1. Khách mở "Lịch đặt của tôi", chọn booking cần hủy
2. Hệ thống kiểm tra BR-13, BR-15, BR-16
3. Hệ thống hiển thị hộp thoại xác nhận, nêu rõ hành động không thể hoàn tác
4. Khách xác nhận, chọn lý do hủy từ danh sách gợi ý (tùy chọn)
5. Hệ thống chuyển trạng thái sang `CANCELLED`, ghi lại thời điểm và người thực hiện
6. Hệ thống giải phóng slot, hủy email nhắc lịch đã lên lịch
7. Hệ thống gửi email xác nhận đã hủy

**Luồng ngoại lệ:**

| Mã | Tình huống | Xử lý |
|---|---|---|
| E1 | Còn dưới 2 giờ trước giờ chơi | Ẩn nút hủy trên giao diện **và** chặn ở backend; hiển thị số điện thoại nhân viên |
| E2 | Khách cố hủy booking của người khác (đổi ID trên URL) | Trả lỗi 403, ghi log cảnh báo |
| E3 | Booking đã `CHECKED_IN` | Chặn, báo "Booking đang diễn ra, không thể hủy" |

---

### QT-03: Nhân viên đặt sân hộ khách gọi điện

**Tác nhân chính:** Staff
**Bối cảnh:** Khách lớn tuổi hoặc khách quen vẫn quen gọi điện thoại đặt sân

**Luồng chính:**

1. Staff mở màn hình "Đặt hộ khách", chọn ngày và xem lưới lịch
2. Staff nhập số điện thoại khách
3. Hệ thống tra cứu: nếu số đã tồn tại thì tự điền tên; nếu chưa thì cho phép nhập tên và tạo hồ sơ khách vãng lai (không cần mật khẩu, không cần xác thực email)
4. Staff chọn sân và khung giờ, xác nhận
5. Hệ thống áp dụng các quy tắc tương tự QT-01, **trừ** BR-19 (không bắt xác thực email)
6. Hệ thống tạo booking `CONFIRMED`, ghi nhận `created_by = staff_id` để phân biệt kênh đặt

> **Ghi chú BA:** Trường `booking_channel` (ONLINE / PHONE / WALK_IN) nên có ngay từ đầu. Sau này chủ sân sẽ muốn biết bao nhiêu phần trăm khách đã chuyển sang đặt online — đó chính là thước đo hệ thống có thành công hay không.

---

### QT-04: Check-in tại sân

**Tác nhân chính:** Staff
**Thời điểm:** Khi khách đến sân

**Luồng chính:**

1. Staff tra cứu theo mã booking hoặc số điện thoại khách
2. Hệ thống hiển thị thông tin booking và trạng thái hiện tại
3. Staff bấm "Check-in"
4. Hệ thống kiểm tra đang trong khoảng ±20 phút quanh giờ bắt đầu
5. Hệ thống chuyển sang `CHECKED_IN`, ghi thời điểm thực tế
6. Staff thu tiền mặt, đánh dấu đã thanh toán

**Luồng ngoại lệ:**

| Mã | Tình huống | Xử lý |
|---|---|---|
| E1 | Khách đến sớm hơn 20 phút | Cho phép check-in nhưng cảnh báo "Sân đang có người chơi đến HH:mm" |
| E2 | Khách đến muộn, đã bị đánh `NO_SHOW` | Cho phép Staff khôi phục về `CHECKED_IN` nếu sân vẫn trống, có ghi log |

---

### QT-05: Chủ sân cấu hình sân và bảng giá

**Tác nhân chính:** Owner

**Luồng chính:**

1. Owner vào "Quản lý sân", thêm sân mới với: tên, loại mặt sân, giờ mở/đóng, bước khung giờ, trạng thái hoạt động
2. Owner thiết lập bảng giá: với mỗi khoảng giờ và loại ngày (ngày thường / cuối tuần), nhập đơn giá theo giờ
3. Hệ thống kiểm tra bảng giá phủ kín toàn bộ giờ hoạt động, không có khoảng trống, không chồng lấn
4. Owner lưu, hệ thống áp dụng cho các booking **tạo mới từ thời điểm này** (BR-23)

**Luồng ngoại lệ:**

| Mã | Tình huống | Xử lý |
|---|---|---|
| E1 | Bảng giá có khoảng giờ chưa được định giá | Chặn lưu, chỉ rõ khoảng nào đang thiếu |
| E2 | Owner tắt hoạt động một sân đang có booking tương lai | Cảnh báo số booking bị ảnh hưởng, yêu cầu xử lý từng booking trước |

---

### QT-06: Chặn sân để bảo trì

**Tác nhân chính:** Owner

**Luồng chính:**

1. Owner chọn sân, chọn khoảng thời gian bảo trì, nhập lý do
2. Hệ thống liệt kê toàn bộ booking `CONFIRMED` bị ảnh hưởng
3. Owner xác nhận
4. Hệ thống tạo bản ghi chặn, chuyển các booking bị ảnh hưởng sang `CANCELLED` với lý do "Bảo trì sân"
5. Hệ thống gửi email xin lỗi kèm gợi ý các khung giờ trống thay thế trong cùng ngày
6. Slot bị chặn hiển thị màu xám trên lưới lịch, không ai đặt được (BR-12)

---

### QT-07: Tác vụ tự động của hệ thống

| Tác vụ | Tần suất | Hành động |
|---|---|---|
| Dọn booking `HOLD` hết hạn | Mỗi phút | Chuyển sang `CANCELLED`, giải phóng slot |
| Gửi email nhắc lịch | Mỗi 5 phút | Gửi cho booking `CONFIRMED` bắt đầu sau 60 phút |
| Đánh dấu no-show | Mỗi 5 phút | Booking `CONFIRMED` đã quá giờ bắt đầu 20 phút → `NO_SHOW`, tăng bộ đếm vi phạm |
| Hoàn tất booking | Mỗi 15 phút | Booking `CHECKED_IN` đã qua giờ kết thúc → `COMPLETED` |
| Khóa khách vi phạm | Khi ghi nhận no-show | Nếu đủ 3 lần trong 30 ngày → khóa quyền đặt sân, thông báo cho Owner |
| Sao lưu cơ sở dữ liệu | Hằng ngày 03:00 | Xuất file, đẩy lên lưu trữ đám mây |

---

### QT-08: Xem báo cáo vận hành

**Tác nhân chính:** Owner

Các báo cáo cần có trong phiên bản 1:

| Báo cáo | Nội dung | Kỹ thuật liên quan |
|---|---|---|
| Doanh thu theo ngày | Tổng tiền các booking `COMPLETED` theo từng ngày trong khoảng chọn | `GROUP BY` theo ngày |
| Xếp hạng sân | Số giờ được đặt và doanh thu của từng sân | `GROUP BY court_id`, `ORDER BY` |
| Tỷ lệ lấp đầy theo khung giờ | Phần trăm lấp đầy của từng khung giờ trong ngày, giúp phát hiện giờ ế | `GROUP BY` giờ + phép chia |
| Thống kê no-show | Danh sách khách có tỷ lệ hủy/no-show cao | `HAVING COUNT(*) >= n` |
| Cơ cấu kênh đặt | Tỷ trọng ONLINE / PHONE / WALK_IN | `GROUP BY booking_channel` |

---

## 8. MÔ HÌNH DỮ LIỆU GỢI Ý

```
users
  id, full_name, email, phone, password_hash, role,
  is_email_verified, is_blocked, no_show_count, created_at

courts
  id, 
  name, 
  court_type, - STANDARD/VIP
  open_time, 
  close_time,
  slot_minutes, 
  deleted_at, - Xóa mềm với giá trị null và thời gian xóa
  created_at, 
  updated_at

pricing_rules
  id, court_id, day_type (WEEKDAY | WEEKEND),
  start_time, end_time, price_per_hour, effective_from

bookings
  id, booking_code, user_id, court_id,
  start_time (UTC), end_time (UTC),
  status, total_amount, booking_channel,
  created_by, cancelled_at, cancelled_by, cancel_reason,
  checked_in_at, created_at
  → chỉ mục: (court_id, start_time, end_time, status)

maintenance_blocks
  id, court_id, start_time, end_time, reason, created_by

notification_logs
  id, booking_id, type, recipient, status, sent_at
```

**Lưu ý thiết kế:**

- Lưu `start_time` / `end_time` dạng timestamp, **không** lưu `slot_number`. Cách này cho phép đổi độ dài khung giờ sau này mà không phải chuyển đổi dữ liệu cũ.
- `total_amount` là số tiền đã chốt, không tính lại từ `pricing_rules` (BR-23).
- Trạng thái nên là kiểu enum ở tầng DB để tránh ghi sai chuỗi.
- Bảng `bookings` cần chỉ mục phục vụ truy vấn chồng lấn, vì đây là truy vấn chạy nhiều nhất.

---

## 9. YÊU CẦU PHI CHỨC NĂNG

| Nhóm | Yêu cầu |
|---|---|
| Hiệu năng | Trang lưới lịch một ngày phản hồi < 500ms; chịu được 50 người xem đồng thời |
| Tính đúng đắn | Tuyệt đối không có hai booking hiệu lực chồng lấn trên cùng một sân |
| Bảo mật | Mật khẩu băm bằng bcrypt; JWT có refresh token; kiểm tra quyền sở hữu ở mọi thao tác trên booking |
| Kiểm toán | Mọi thay đổi trạng thái booking đều ghi lại ai làm, lúc nào, lý do gì |
| Khả dụng | Hoạt động tốt trên trình duyệt di động (phần lớn khách đặt bằng điện thoại) |
| Sao lưu | Sao lưu cơ sở dữ liệu hằng ngày, giữ tối thiểu 7 bản gần nhất |

---

## 10. RỦI RO & GIẢ ĐỊNH

### Rủi ro

| Mã | Rủi ro | Mức độ | Biện pháp |
|---|---|---|---|
| R1 | Đặt trùng do xử lý đồng thời sai | Cao | Transaction + khóa dòng; viết kịch bản kiểm thử tải song song |
| R2 | Sai lệch múi giờ giữa frontend và backend | Cao | Thống nhất UTC ở tầng lưu trữ, chỉ đổi múi giờ khi hiển thị |
| R3 | Khách quen vẫn gọi điện, không dùng web | Trung bình | Xây QT-03 để nhân viên nhập hộ, dữ liệu vẫn tập trung một chỗ |
| R4 | Hàng đợi email chết âm thầm, khách không nhận được nhắc lịch | Trung bình | Ghi log mọi lần gửi; có trang theo dõi trạng thái hàng đợi |
| R5 | Chủ sân đổi giá làm sai lệch hóa đơn cũ | Trung bình | Áp dụng BR-23, chốt giá tại thời điểm đặt |

### Giả định

- Cụm sân chỉ có một địa điểm, dưới 20 sân
- Thanh toán bằng tiền mặt tại quầy
- Mỗi booking gắn với đúng một sân (nhóm đông muốn 2 sân thì tạo 2 booking)
- Lượng truy cập ở mức nhỏ, chưa cần kiến trúc phân tán

---

## 11. TIÊU CHÍ NGHIỆM THU

Hệ thống được coi là hoàn thành phiên bản 1 khi:

- [ ] Khách đăng ký, xác thực email, đăng nhập và đặt được sân từ đầu đến cuối
- [ ] Chạy 20 request đồng thời vào cùng một slot, chỉ đúng 1 booking được tạo
- [ ] Toàn bộ quy tắc từ BR-01 đến BR-25 đều được kiểm tra ở backend, kiểm chứng được bằng lời gọi API trực tiếp
- [ ] Mọi chuyển trạng thái không hợp lệ đều bị từ chối
- [ ] Email xác nhận và email nhắc lịch gửi đúng thời điểm
- [ ] Tài khoản khách không truy cập được bất kỳ chức năng quản trị nào
- [ ] Năm loại báo cáo ở mục 8 cho ra số liệu đúng
- [ ] Hệ thống đã chạy trên tên miền thật với HTTPS
- [ ] README có sơ đồ quan hệ dữ liệu, ảnh chụp màn hình và tài khoản dùng thử cho từng vai trò

---

## PHỤ LỤC: LỘ TRÌNH TRIỂN KHAI THEO GIAI ĐOẠN

| Giai đoạn | Nội dung | Quy trình liên quan |
|---|---|---|
| 1 | Quản lý sân, bảng giá, xem lưới lịch trống | QT-05 |
| 2 | Xác thực người dùng, phân quyền | — |
| 3 | Đặt sân, chống trùng, hủy sân | QT-01, QT-02 |
| 4 | Check-in, đặt hộ, chặn bảo trì | QT-03, QT-04, QT-06 |
| 5 | Tác vụ tự động, email, hàng đợi | QT-07 |
| 6 | Báo cáo, tối ưu truy vấn, triển khai | QT-08 |

Nên hoàn thành trọn vẹn từng giai đoạn rồi mới sang giai đoạn kế tiếp. Sau giai đoạn 3, hệ thống đã đủ để trình bày như một sản phẩm hoàn chỉnh.
