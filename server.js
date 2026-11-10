import footballRoutes from './routes/footballRoutes.js'; // Nhập biển chỉ đường
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer } from 'http'; // (Thư viện có sẵn của Node)
import { Server } from 'socket.io'; // (Mới cài)
import db from './config/db.js'; // Nhập Database từ nhà mới vào
import authRoutes from './routes/authRoutes.js';
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Chỉ cho phép React kết nối
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('⚡ Một khán giả vừa vào xem live-score, ID:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('❌ Khán giả đã thoát:', socket.id);
  });
});
app.use(cors());
app.use(express.json());
app.use('/api', footballRoutes); // Mọi request bắt đầu bằng /api sẽ giao cho footballRoutes xử lý
app.use('/api/auth', authRoutes); // Mọi request bắt đầu bằng /api/auth sẽ giao cho authRoutes xử lý

setInterval(async () => {
  try {
    const [liveMatches] = await db.execute(`
      SELECT m.*, 
             t1.name AS home_team_name, t1.logo_url AS home_team_logo,
             t2.name AS away_team_name, t2.logo_url AS away_team_logo
      FROM matches m
      JOIN teams t1 ON m.home_team_id = t1.id
      JOIN teams t2 ON m.away_team_id = t2.id
      WHERE m.status = 'LIVE'
    `);

    // Biến cờ hiệu để xem có trận nào đang đá không
    let hasUpdates = false;

    for (let match of liveMatches) {
      hasUpdates = true;
      
      // 1. DÙNG CỘT MỚI ĐỂ ĐẾM
      match.live_minute = (match.live_minute || 0) + 1; 
      
      let isGoal = false;
      let scoringTeam = '';

      if (Math.random() < 0.018) { 
        match.home_score++; isGoal = true; scoringTeam = match.home_team_name; 
      } else if (Math.random() < 0.012) { 
        match.away_score++; isGoal = true; scoringTeam = match.away_team_name; 
      }

      // 2. KHI TRẬN ĐẤU KẾT THÚC -> CẬP NHẬT TRẠNG THÁI & BẢNG XẾP HẠNG
      if (match.live_minute >= 90) {
         // Cập nhật tỷ số cuối cùng vào trận đấu luôn cho chắc cốp
         await db.execute(
            "UPDATE matches SET status = 'FINISHED', live_minute = 90, home_score = ?, away_score = ? WHERE id = ?", 
            [match.home_score, match.away_score, match.id]
         );
         
         // --- BẮT ĐẦU: CẬP NHẬT BẢNG XẾP HẠNG ---
         // A. Tính toán cho Đội Nhà (Home Team)
         let homePoints = match.home_score > match.away_score ? 3 : (match.home_score === match.away_score ? 1 : 0);
         let homeWin = match.home_score > match.away_score ? 1 : 0;
         let homeDraw = match.home_score === match.away_score ? 1 : 0;
         let homeLoss = match.home_score < match.away_score ? 1 : 0;

         await db.execute(`
             UPDATE standings SET 
                 matches_played = matches_played + 1,
                 wins = wins + ?, draws = draws + ?, losses = losses + ?,
                 scores_for = scores_for + ?, scores_against = scores_against + ?,
                 points = points + ?
             WHERE team_id = ?`, 
             [homeWin, homeDraw, homeLoss, match.home_score, match.away_score, homePoints, match.home_team_id]
         );

         // B. Tính toán cho Đội Khách (Away Team)
         let awayPoints = match.away_score > match.home_score ? 3 : (match.away_score === match.home_score ? 1 : 0);
         let awayWin = match.away_score > match.home_score ? 1 : 0;
         let awayDraw = match.away_score === match.home_score ? 1 : 0;
         let awayLoss = match.away_score < match.home_score ? 1 : 0;

         await db.execute(`
             UPDATE standings SET 
                 matches_played = matches_played + 1,
                 wins = wins + ?, draws = draws + ?, losses = losses + ?,
                 scores_for = scores_for + ?, scores_against = scores_against + ?,
                 points = points + ?
             WHERE team_id = ?`, 
             [awayWin, awayDraw, awayLoss, match.away_score, match.home_score, awayPoints, match.away_team_id]
         );
         // --- KẾT THÚC: CẬP NHẬT BẢNG XẾP HẠNG ---

         console.log(`⏱️ Hết giờ: Trận ${match.id} đã kết thúc! Đã chốt điểm vào Bảng Xếp Hạng.`);
         continue; 
      }

      // 3. LƯU VÀO CỘT live_minute ĐỐI VỚI TRẬN ĐANG ĐÁ
      await db.execute(
         "UPDATE matches SET live_minute = ?, home_score = ?, away_score = ? WHERE id = ?",
         [match.live_minute, match.home_score, match.away_score, match.id]
      );

      // 4. PHÁT TÍN HIỆU SOCKET BÀN THẮNG (Alert Popup của bạn)
      if (isGoal) {
         io.emit('goal', {
           matchId: match.id,
           team: scoringTeam,
           minute: match.live_minute,
           score: `${match.home_team_name} ${match.home_score} - ${match.away_score} ${match.away_team_name}`
         });
         console.log(`⚽ VÀO! ${scoringTeam} ghi bàn phút ${match.live_minute}`);
      }
    }

    // ==============================================================
    // 5. PHÁT TÍN HIỆU CẬP NHẬT TOÀN BỘ DANH SÁCH (ĐỂ SỐ PHÚT TỰ NHẢY)
    // ==============================================================
    if (hasUpdates) {
       const [allMatches] = await db.execute(`
          SELECT m.*, 
                 t1.name AS home_team_name, t1.logo_url AS home_team_logo,
                 t2.name AS away_team_name, t2.logo_url AS away_team_logo
          FROM matches m
          JOIN teams t1 ON m.home_team_id = t1.id
          JOIN teams t2 ON m.away_team_id = t2.id
       `);
       
       // Bắn toàn bộ mảng trận đấu mới về React
       io.emit('update_matches', allMatches);
    }

  } catch (err) {
     console.error("❌ Lỗi Engine Database:", err);
  }
}, 1000);
// 3. Khởi động máy bơm
httpServer.listen(3000, () => {
  console.log('🚀 Server đang quẩy tại: http://localhost:3000');
});