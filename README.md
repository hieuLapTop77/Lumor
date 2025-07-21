#  Kế Hoạch Phát Triển Backend App Chia Sẻ Ảnh - 6 Tuần

Dự án này được chia thành 6 tuần, mỗi tuần tập trung vào một nhóm chức năng cụ thể để đảm bảo tiến độ ổn định và có thể kiểm chứng được.

---

##  tuần 1: Nền Tảng và Xác Thực Người Dùng 🔑

Mục tiêu của tuần này là xây dựng nền móng vững chắc cho toàn bộ dự án và hoàn thành hệ thống đăng ký, đăng nhập.

* **Nhiệm vụ:**
    * [x] **Thiết lập Môi trường:** Cài đặt Node.js, PostgreSQL, và các công cụ cần thiết (như Postman để test API).
    * [x] **Khởi tạo Dự án:** Tạo dự án Node.js/Express, cài đặt các thư viện cơ bản (`express`, `pg`, `dotenv`, `nodemon`).
    * [x] **Thiết kế & Tạo Database:** Viết script SQL để tạo các bảng `users`, `friendships`, `access_permissions`, và `photos` như đã thiết kế.
    * [x] **Kết nối Database:** Viết module kết nối từ ứng dụng Express tới PostgreSQL.
    * [x] **Xây dựng API Xác thực:**
        * `POST /api/auth/register`: Đăng ký người dùng mới (bao gồm cả việc hash mật khẩu với `bcryptjs`).
        * `POST /api/auth/login`: Đăng nhập và tạo JSON Web Token (JWT) với `jsonwebtoken`.
    * [x] **Tạo Middleware xác thực:** Viết một middleware để kiểm tra JWT trên các route yêu cầu đăng nhập.
* **Kết quả cuối tuần:** Có thể đăng ký và đăng nhập vào hệ thống. API được bảo vệ bằng token.

---

## tuần 2: Quản Lý Profile và Hệ Thống Bạn Bè 🧑‍🤝‍🧑

Tập trung vào các tính năng xã hội cơ bản, cho phép người dùng tương tác với nhau.

* **Nhiệm vụ:**
    * [x] **Xây dựng API Người dùng:**
        * `GET /api/users/me`: Lấy thông tin profile của người dùng đang đăng nhập.
        * `PUT /api/users/me`: Cập nhật thông tin profile (tên hiển thị, tiểu sử).
        * `GET /api/users/search?q=<query>`: Tìm kiếm người dùng khác theo username.
    * [x] **Xây dựng API Bạn bè:**
        * `POST /api/friends/request`: Gửi lời mời kết bạn.
        * `GET /api/friends/requests`: Xem danh sách lời mời đã nhận.
        * `POST /api/friends/respond`: Chấp nhận/từ chối lời mời kết bạn.
        * `GET /api/friends`: Lấy danh sách bạn bè đã được chấp nhận.
        * `DELETE /api/friends/:friendId`: Hủy kết bạn.
* **Kết quả cuối tuần:** Người dùng có thể tìm kiếm, gửi lời mời, chấp nhận và quản lý danh sách bạn bè.

---

## tuần 3: Chức Năng Cốt Lõi - Quản Lý Quyền Truy Cập 🛡️ ✅

Đây là tuần quan trọng nhất, xây dựng tính năng "linh hồn" của ứng dụng.

* **Nhiệm vụ:**
    * [x] **Xây dựng API Quyền truy cập:**
        * `POST /api/permissions/groups`: Tạo nhóm quyền tùy chỉnh (Custom Permission Groups).
        * `GET /api/permissions/groups`: Lấy danh sách nhóm quyền của người dùng.
        * `GET /api/permissions/groups/:groupId`: Lấy thông tin chi tiết một nhóm quyền.
        * `PUT /api/permissions/groups/:groupId`: Cập nhật thông tin nhóm quyền.
        * `DELETE /api/permissions/groups/:groupId`: Xóa nhóm quyền.
    * [x] **Quản lý Quyền Mặc định:**
        * `GET /api/permissions/defaults`: Lấy cài đặt quyền mặc định của người dùng.
        * `PUT /api/permissions/defaults`: Cập nhật quyền mặc định (Public, Friends, Close Friends, Custom).
    * [x] **Tích hợp Logic Kiểm tra Quyền:**
        * `POST /api/permissions/check`: Kiểm tra quyền truy cập của người dùng với nội dung cụ thể.
        * Hỗ trợ đầy đủ các loại quyền: Public, Friends, Close Friends, Custom Groups.
        * Validation đảm bảo chỉ bạn bè mới có thể được thêm vào nhóm quyền.
* **Kết quả cuối tuần:** Hoàn thành toàn bộ hệ thống quản lý quyền truy cập với đầy đủ chức năng CRUD và logic kiểm tra quyền phức tạp.

---

## tuần 4: Quản Lý Ảnh và Tích Hợp Lưu Trữ S3 🖼️

Tập trung vào việc xử lý upload và lưu trữ hình ảnh một cách hiệu quả.

* **Nhiệm vụ:**
    * [ ] **Thiết lập AWS S3:** Tạo một bucket S3 và cấu hình quyền truy cập (IAM user) cho backend.
    * [ ] **Xây dựng API Upload Ảnh (Presigned URL):**
        * `POST /api/photos/upload-url`: Backend tạo và trả về một URL upload tạm thời (presigned URL) cho client.
    * [ ] **Xây dựng API Hoàn tất Upload:**
        * `POST /api/photos/upload/complete`: Sau khi client upload file lên S3 thành công, client gọi API này để backend lưu thông tin ảnh (URL trên S3, `owner_id`) vào bảng `photos`.
    * [ ] **Xây dựng API xem Ảnh:**
        * `GET /api/photos/:userId`: Lấy danh sách ảnh của một người dùng. **Quan trọng:** Tích hợp logic `checkAccessPermission` đã làm ở tuần 3 vào đây.
    * [ ] **Xây dựng API xóa Ảnh:**
        * `DELETE /api/photos/:photoId`: Cho phép người dùng xóa ảnh của chính mình.
* **Kết quả cuối tuần:** Người dùng có thể upload ảnh lên S3 và xem lại album ảnh của người khác (nếu có quyền).

---

## tuần 5: Tích Hợp Real-time với Socket.IO ⚡

Làm cho ứng dụng trở nên "sống động" bằng cách cập nhật giao diện người dùng ngay lập tức.

* **Nhiệm vụ:**
    * [ ] **Cài đặt và Cấu hình Socket.IO:** Tích hợp Socket.IO vào server Express.
    * [ ] **Quản lý Kết nối:** Xử lý việc người dùng kết nối và ngắt kết nối. Ánh xạ `userId` với `socket.id`.
    * [ ] **Phát Sự kiện (Emitting Events):**
        * Khi một ảnh được upload thành công (`POST /api/photos/upload/complete`), phát sự kiện `new_photo` tới những người dùng có quyền xem.
        * Khi một ảnh bị xóa, phát sự kiện `delete_photo`.
        * Khi quyền truy cập bị thu hồi (`POST /api/permissions/revoke`), phát sự kiện `permission_revoked` tới người dùng bị ảnh hưởng.
        * Phát các sự kiện cho thông báo (lời mời kết bạn, yêu cầu truy cập).
* **Kết quả cuối tuần:** Ứng dụng có khả năng cập nhật real-time các thay đổi về ảnh và quyền truy cập.

---

## tuần 6: Hoàn Thiện, Bảo Mật và Chuẩn Bị Deployment 🚀

Tuần cuối cùng để rà soát lại toàn bộ hệ thống, vá lỗi, tăng cường bảo mật và chuẩn bị đưa sản phẩm lên môi trường thật.

* **Nhiệm vụ:**
    * [ ] **Thêm Validation:** Sử dụng thư viện như `express-validator` để kiểm tra tất cả dữ liệu đầu vào của API (đảm bảo email hợp lệ, mật khẩu đủ mạnh, v.v.).
    * [ ] **Xử lý Lỗi (Error Handling):** Xây dựng một middleware xử lý lỗi tập trung để các lỗi không làm sập server và trả về thông báo lỗi nhất quán.
    * [ ] **Viết tài liệu API:** Sử dụng Postman hoặc Swagger/OpenAPI để tạo tài liệu cho các API đã viết.
    * [ ] **Tối ưu Truy vấn Database:** Rà soát lại các câu lệnh SQL để đảm bảo hiệu quả, thêm chỉ mục (index) cho các cột thường xuyên được truy vấn.
    * [ ] **Nghiên cứu Deployment:** Tìm hiểu cách để deploy một ứng dụng Node.js lên các nền tảng như Heroku, Vercel, hoặc AWS EC2.
    * [ ] **Viết Kịch bản Test (Tùy chọn):** Nếu có thời gian, viết các bài test tự động cho các API quan trọng.
* **Kết quả cuối tuần:** Backend đã sẵn sàng, ổn định, an toàn và có thể được triển khai.