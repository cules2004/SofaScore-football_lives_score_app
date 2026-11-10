import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Điền pass của bạn nếu có
  database: 'football_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("🔌 Database đã sẵn sàng từ thư mục config!");

export default db; // Xuất ra để các file khác dùng