import db from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
const client = new OAuth2Client('462048970857-r86aktrklktk51akj7o90pnlf54bqr96.apps.googleusercontent.com');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'duydan257@gmail.com', // 👈 Điền Gmail của bạn vào đây
    pass: 'dusz ypkl itoq mmva' // 👈 Dán cái mã 16 chữ cái vừa lấy ở Bước 1 vào đây
  }
});

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body; // Cái vé React gửi lên

    // A. Nhờ thư viện của Google soi chiếu xem vé thật hay giả
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: '462048970857-r86aktrklktk51akj7o90pnlf54bqr96.apps.googleusercontent.com', 
    });
    const payload = ticket.getPayload(); // Rút trích thông tin: tên, email, ảnh đại diện...
    const { email, name } = payload;

    // B. Lục tìm trong MySQL xem user này đã từng đăng nhập hệ thống chưa
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (users.length === 0) {
      // Nếu là người mới -> Tự động đăng ký cho họ luôn
      // Mật khẩu để trống hoặc một chuỗi random vì họ xài Google
      const [result] = await db.execute(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [name, email, 'google-sso-no-password'] 
      );
      user = { id: result.insertId, username: name, email: email };
      console.log(`🎉 User mới gia nhập qua Google: ${name}`);
    } else {
      // Nếu đã có tài khoản -> Lấy thông tin ra
      user = users[0];
      console.log(`🔓 User quay lại qua Google: ${user.username}`);
    }

    // C. Cấp Token nội bộ của hệ thống (giống hệt đăng nhập thường)
    const token = jwt.sign(
  { id: user.id, username: user.username, role: user.role }, 
  'vibe_football_secret', 
  { expiresIn: '1d' }
);

    res.json({ message: 'Đăng nhập Google thành công!', token, username: user.username, role: user.role });

  } catch (err) {
    console.error('❌ Lỗi xác thực Google:', err);
    res.status(401).json({ error: 'Vé Google không hợp lệ!' });
  }
};

 
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Băm nhỏ mật khẩu (10 vòng - đủ an toàn và nhanh)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lưu vào MySQL
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    console.log(`🎉 Có user mới đăng ký: ${username}`);
    res.status(201).json({ message: 'Đăng ký thành công!', userId: result.insertId });

  } catch (err) {
    // 1062 là mã lỗi đặc trưng của MySQL khi bị TRÙNG DỮ LIỆU (UNIQUE)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc Email đã tồn tại!' });
    }
    
    console.error('❌ Lỗi đăng ký:', err);
    res.status(500).json({ error: 'Lỗi server!' });
  }
};

// 2. Hàm Xử lý Đăng nhập
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // A. Lục tìm xem có tên tài khoản này trong DB không
    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu!' });
    }
    const user = users[0];

    // B. Lấy cục mật khẩu mã hóa trong DB ra so sánh với mật khẩu nhập vào
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu!' });
    }

    // C. Mật khẩu đúng! Cấp cho cái thẻ (Token) có hạn 1 ngày
    const token = jwt.sign(
  { id: user.id, username: user.username, role: user.role }, 
  'vibe_football_secret', 
  { expiresIn: '1d' }
);

    console.log(`🔓 User đăng nhập: ${username}`);
    res.json({ message: 'Đăng nhập thành công!', token, username: user.username, role: user.role });

  } catch (err) {
    console.error('❌ Lỗi đăng nhập:', err);
    res.status(500).json({ error: 'Lỗi server!' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // A. Kiểm tra xem email này có tồn tại trong hệ thống Vibe Football chưa
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'Email này chưa được đăng ký!' });
    
    const user = users[0];

    // B. Tạo một vé Token có hạn sử dụng siêu ngắn (15 phút)
    // Dùng mật khẩu cũ làm một phần chữ ký, để khi đổi pass xong token này tự động chết
    const secret = 'vibe_football_secret' + user.password; 
    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '15m' });

    // C. Tạo đường link gửi cho user (Trỏ về Frontend React của bạn)
    const resetLink = `http://localhost:5173/reset-password/${user.id}/${token}`; // Nhớ đổi 5173 thành port React của bạn

    // D. Gửi mail
    const mailOptions = {
      from: 'Vibe Football 🏆 <email_cua_ban@gmail.com>',
      to: user.email,
      subject: 'Yêu cầu đặt lại mật khẩu - Vibe Football',
      html: `
        <h3>Chào ${user.username},</h3>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu. Vui lòng click vào nút bên dưới để đổi mật khẩu (Link này chỉ có hiệu lực trong 15 phút):</p>
        <a href="${resetLink}" style="background: #228be6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a>
        <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Đường link khôi phục đã được gửi vào email của bạn!' });

  } catch (err) {
    console.error('Lỗi gửi mail:', err);
    res.status(500).json({ error: 'Không thể gửi email lúc này!' });
  }
};

// 2. API: Cập nhật mật khẩu mới (Sau khi bấm link và nhập pass mới)
export const resetPassword = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { newPassword } = req.body;

    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) return res.status(404).json({ error: 'User không tồn tại!' });
    const user = users[0];

    // Kiểm tra xem vé (token) còn hạn và đúng chữ ký không
    const secret = 'vibe_football_secret' + user.password;
    try {
      jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ error: 'Đường link đã hết hạn hoặc không hợp lệ!' });
    }

    // Mã hóa mật khẩu mới và lưu vào DB
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

    res.json({ message: 'Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.' });

  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

export const isAdmin = (req, res, next) => {
  // Biến req.user này được tạo ra từ middleware giải mã JWT (verifyToken) chạy ngay trước đó
  if (req.user && req.user.role === 'admin') {
    next(); // Thẻ Admin hợp lệ -> Cho phép đi tiếp vào Controller
  } else {
    // Không phải Admin thì chặn lại ngay lập tức
    res.status(403).json({ error: 'Truy cập bị từ chối! Bạn không có quyền Admin.' });
  }
};
// Middleware: Kiểm tra vé vào cửa (Token) có hợp lệ không

export const verifyToken = (req, res, next) => {
  // Lấy token từ header do Frontend gửi lên (Có dạng: "Bearer asdfghjkl...")
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Truy cập từ chối! Bạn chưa đăng nhập.' });
  }

  // Cắt bỏ chữ "Bearer " để lấy đúng cái lõi token
  const token = authHeader.split(' ')[1];

  try {
    // Dùng chìa khóa bí mật để dịch ngược token ra thông tin user
    const decoded = jwt.verify(token, 'vibe_football_secret');
    
    // Gắn thông tin vừa dịch được vào biến req.user để truyền cho các hàm phía sau (như isAdmin)
    req.user = decoded; 
    next(); // Vé chuẩn, cho qua cửa!
  } catch (err) {
    console.log("❌ LỖI VERIFY TOKEN:", err.message);
    console.log("🔑 CỤC TOKEN NHẬN ĐƯỢC:", token);
    return res.status(403).json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ!' });
  }
};