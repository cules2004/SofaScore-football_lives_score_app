import db from '../config/db.js'; // Gọi Database vào để làm việc
// Bên trong file: controllers/footballController.js

export const getTeams = async (req, res) => {
  try {
    // Câu SQL lấy dữ liệu với LIMIT 40 
    const [teams] = await db.execute('SELECT id, name, stadium, manager_name, logo_url FROM teams');
    
    console.log("Đã lấy được:", teams.length, "đội"); 
    res.json(teams);
  } catch (err) {
    console.error('❌ Lỗi chi tiết:', err); 
    res.status(500).json({ error: 'Tắc ống rồi!' });
  }
};

export const getTeamPlayers = async (req, res) => {
  try {
    const teamId = req.params.id; // Lấy cái ID người dùng truyền lên
    
    // Tìm cầu thủ có team_id tương ứng
    const [players] = await db.execute(
      'SELECT id, name, position, nationality, jersey_number FROM players WHERE team_id = ?', 
      [teamId]
    );
    
    res.json(players);
  } catch (err) {
    console.error('❌ Lỗi lấy cầu thủ:', err);
    res.status(500).json({ error: 'Lỗi lấy danh sách cầu thủ!' });
  }
};

export const getMatches = async (req, res) => {
  try {
    // Dùng câu lệnh JOIN để dịch ID thành Tên và Logo từ bảng teams
    const [rows] = await db.execute(`
      SELECT 
        m.*, 
        t1.name AS home_team_name, t1.logo_url AS home_logo,
        t2.name AS away_team_name, t2.logo_url AS away_logo
      FROM matches m
      JOIN teams t1 ON m.home_team_id = t1.id
      JOIN teams t2 ON m.away_team_id = t2.id
      ORDER BY m.id DESC -- Xếp trận mới tạo lên trên cùng
    `);
    
    res.json(rows);
  } catch (err) {
    console.error('Lỗi lấy danh sách trận đấu:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// API: Lấy lịch sử các trận đã đấu của 1 đội bóng
export const getTeamMatches = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(`
      SELECT 
        m.*, 
        t1.name AS home_team_name, t1.logo_url AS home_logo,
        t2.name AS away_team_name, t2.logo_url AS away_logo
      FROM matches m
      JOIN teams t1 ON m.home_team_id = t1.id
      JOIN teams t2 ON m.away_team_id = t2.id
      WHERE (m.home_team_id = ? OR m.away_team_id = ?) 
      AND m.status = 'FINISHED'
      ORDER BY m.id DESC
    `, [id, id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy lịch sử trận đấu' });
  }
};

export const searchTeams = async (req, res) => {
  try {
    // Lấy từ khóa từ đường dẫn, ví dụ: /api/teams/search?keyword=Arsenal
    const { keyword } = req.query; 

    // Nếu người dùng chưa gõ gì thì báo về mảng rỗng
    if (!keyword || keyword.trim() === '') {
      return res.json([]); 
    }

    // Bọc từ khóa bằng 2 dấu % để tìm kiếm chứa chuỗi (chữ hoa chữ thường MySQL tự lo)
    const searchQuery = `%${keyword}%`; 

    const [teams] = await db.execute(`
      SELECT id, name, logo_url, stadium, manager_name 
      FROM teams 
      WHERE name LIKE ?
      LIMIT 10 -- Giới hạn trả về 10 kết quả cho nhẹ server
    `, [searchQuery]);

    res.json(teams);
  } catch (err) {
    console.error('❌ Lỗi tìm kiếm đội bóng:', err);
    res.status(500).json({ error: 'Lỗi truy vấn tìm kiếm!' });
  }
};

// Hàm 4: Lấy Bảng Xếp Hạng (League Table) theo ID giải đấu
export const getStandings = async (req, res) => {
  try {
    const { tournamentId } = req.params; 

    const [standings] = await db.execute(`
      SELECT 
        ROW_NUMBER() OVER (
          ORDER BY s.points DESC, (s.scores_for - s.scores_against) DESC, s.scores_for DESC
        ) AS position,
        s.team_id AS id, 
        t.name, 
        t.logo_url,
        s.matches_played AS played,
        s.wins,
        s.draws AS draws,
        s.losses,
        s.scores_for AS goals_for,
        s.scores_against AS goals_against,
        (s.scores_for - s.scores_against) AS goal_difference,
        s.points
      FROM standings s
      JOIN teams t ON s.team_id = t.id
      WHERE s.tournament_id = ?
      ORDER BY position ASC
    `, [tournamentId]);
    
    res.json(standings);
  } catch (err) {
    console.error('❌ Lỗi lấy bảng xếp hạng:', err);
    res.status(500).json({ error: 'Lỗi truy vấn bảng standings!' });
  }
};

export const getTournaments = async (req, res) => {
  try {
    // Chỉ cần lấy id và tên giải đấu là đủ để làm thanh chọn
    const [tournaments] = await db.execute(`
      SELECT id, name 
      FROM tournaments
    `);
    
    res.json(tournaments);
  } catch (err) {
    console.error('❌ Lỗi lấy danh sách giải đấu:', err);
    res.status(500).json({ error: 'Lỗi truy vấn bảng tournaments!' });
  }
};

// API lấy chi tiết một đội bóng duy nhất theo ID
export const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // CẬP NHẬT: Dùng LEFT JOIN để lấy thêm logo giải đấu từ bảng tournaments
    const [rows] = await db.execute(`
      SELECT t.*, tr.logo_url AS tournament_logo 
      FROM teams t
      LEFT JOIN tournaments tr ON t.tournament_id = tr.id
      WHERE t.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đội bóng trong Database!' });
    }
    
    // Trả về đối tượng đội bóng (bây giờ đã đi kèm thuộc tính tournament_logo)
    res.json(rows[0]); 
  } catch (err) {
    console.error('❌ Lỗi lấy chi tiết đội bóng:', err);
    res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu!' });
  }
};


export const startMatch = async (req, res) => {
  const { id } = req.params;
  
  try {
    // 1. Cập nhật DB: Chuyển sang LIVE, reset phút và tỷ số về 0
    await db.execute(
      "UPDATE matches SET status = 'LIVE', live_minute = 0, home_score = 0, away_score = 0 WHERE id = ?", 
      [id]
    );

    // 2. Kéo dữ liệu trận đấu mới cập nhật ra (để lấy kèm logo, tên đội...)
    const [updatedMatch] = await db.execute(`
      SELECT m.*, t1.name AS home_team_name, t1.logo_url AS home_logo, t2.name AS away_team_name, t2.logo_url AS away_logo 
      FROM matches m 
      JOIN teams t1 ON m.home_team_id = t1.id 
      JOIN teams t2 ON m.away_team_id = t2.id 
      WHERE m.id = ?
    `, [id]);

    // 3. Phát sóng qua Socket để Frontend tự động cập nhật mà không cần F5
    // Lưu ý: Đảm bảo biến `io` (Socket) đã được import hoặc truyền vào file này
    // io.emit('match_started', updatedMatch[0]); 

    res.json({ message: 'Trận đấu đã chính thức bắt đầu!', match: updatedMatch[0] });
  } catch (err) {
    console.error('Lỗi khởi động trận đấu:', err);
    res.status(500).json({ error: 'Lỗi hệ thống khi bắt đầu trận đấu' });
  }
};

// API: Admin tạo trận đấu mới
export const createMatch = async (req, res) => {
  try {
    const home_team_id = parseInt(req.body.home_team_id);
    const away_team_id = parseInt(req.body.away_team_id);

    // Kiểm tra cơ bản: Không thể tự đá với chính mình
    if (home_team_id === away_team_id) {
      return res.status(400).json({ error: 'Đội nhà và Đội khách không được trùng nhau!' });
    }

    // Đẩy vào Database với trạng thái mặc định là SCHEDULED, tỷ số 0-0
    await db.execute(
      "INSERT INTO matches (home_team_id, away_team_id, status, home_score, away_score, live_minute) VALUES (?, ?, 'PENDING', 0, 0, 0)",
      [home_team_id, away_team_id]
    );

    res.status(201).json({ message: 'Đã lên lịch trận đấu mới thành công!' });
  } catch (err) {
    console.error('Lỗi tạo trận đấu:', err);
    res.status(500).json({ error: 'Lỗi hệ thống khi tạo trận đấu' });
  }
};
// ==========================================
// API: SỬA THÔNG TIN TRẬN ĐẤU
// ==========================================
export const updateMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { home_score, away_score, status, live_minute } = req.body;

    await db.execute(
      "UPDATE matches SET home_score = ?, away_score = ?, status = ?, live_minute = ? WHERE id = ?",
      [home_score, away_score, status, live_minute, id]
    );

    res.json({ message: '✅ Cập nhật trận đấu thành công!' });
  } catch (err) {
    console.error('Lỗi Sửa trận đấu:', err);
    res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật trận đấu' });
  }
};

// ==========================================
// API: XÓA TRẬN ĐẤU
// ==========================================
export const deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute("DELETE FROM matches WHERE id = ?", [id]);
    res.json({ message: '🗑️ Đã xóa trận đấu thành công!' });
  } catch (err) {
    console.error('Lỗi Xóa trận đấu:', err);
    res.status(500).json({ error: 'Lỗi hệ thống khi xóa trận đấu' });
  }
};