# ⚽ Real-Time Live-Score & Standings Platform

Hệ thống theo dõi tỷ số và bảng xếp hạng bóng đá trực tuyến thời gian thực (Full-stack SPA).

## 🚀 Tính năng chính
- **Real-time Live Updates:** Tự động đồng bộ tỷ số, phút thi đấu và trạng thái trận đấu (PENDING/LIVE/FINISHED) qua **Socket.io** không cần F5.
- **Admin Dashboard (CRUD):** Quản lý trận đấu, kích hoạt trận LIVE, sửa kết quả, xóa trận đấu.
- **Data Consistency Engine:** Tự động tính toán lại toàn bộ Bảng xếp hạng (Standings) dựa trên dữ liệu trận đấu thực tế.
- **Bảo mật & Phân quyền:** Xác thực qua **JWT Token**, băm mật khẩu bằng **Bcrypt**, tích hợp **Google OAuth 2.0**.
- **Tối ưu UI/UX:** Tìm kiếm câu lạc bộ thả xuống thông minh, phân trang tự động (Show more/less).

## 🛠️ Công nghệ sử dụng
- **Frontend:** React, Mantine UI, Axios, React Router, Socket.io-client, Tabler Icons.
- **Backend:** Node.js, Express.js, Socket.io, JWT, Bcrypt.
- **Database:** MySQL.

## ⚙️ Hướng dẫn cài đặt & Chạy cục bộ

### 1. Yêu cầu hệ thống
- Node.js (v16 trở lên)
- MySQL Server

### 2. Cài đặt Backend
```bash
cd backend
npm install
npm run dev