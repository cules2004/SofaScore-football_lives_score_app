import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Group, Avatar, Text, Paper, Title, Select } from '@mantine/core'; // 👈 1. Thêm Select vào đây

const Standings = ({ initialTournamentId = 1 }) => {
  const [standings, setStandings] = useState([]);
  
  // 👈 2. Thêm 2 State mới để quản lý danh sách giải đấu
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(initialTournamentId.toString());

  // Kéo danh sách Giải đấu (Chỉ chạy 1 lần khi vừa mở Component)
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/tournaments');
        // Biến đổi data thành dạng { value, label } cho thanh Select của Mantine
        const options = res.data.map(t => ({
          value: t.id.toString(),
          label: t.name
        }));
        setTournaments(options);
      } catch (error) {
        console.error('❌ Lỗi tải danh sách giải đấu:', error);
      }
    };
    fetchTournaments();
  }, []);

  // Hàm kéo dữ liệu Bảng xếp hạng (Chạy lại mỗi khi đổi giải đấu)
  useEffect(() => {
    const fetchStandings = async () => {
      if (!selectedTournament) return; // Nếu chưa chọn giải thì không gọi API
      try {
        const response = await axios.get(`http://localhost:3000/api/standings/${selectedTournament}`);
        setStandings(response.data);
      } catch (error) {
        console.error('❌ Lỗi tải bảng xếp hạng:', error);
      }
    };

    fetchStandings();
  }, [selectedTournament]); // 👈 3. Lắng nghe sự thay đổi của selectedTournament

  // Đổ dữ liệu ra các hàng của bảng
  const rows = standings.map((team) => (
    <tr key={team.id}>
      <td>
        <Text weight={700} color={team.position <= 4 ? 'blue' : 'dark'}>
          {team.position}
        </Text>
      </td>
      <td>
        <Group spacing="sm">
          <Avatar size={28} src={team.logo_url} radius="xl" alt={team.name} />
          <Text size="sm" weight={500}>{team.name}</Text>
        </Group>
      </td>
      <td>{team.played}</td>
      <td>{team.wins}</td>
      <td>{team.draws}</td>
      <td>{team.losses}</td>
      <td>{team.goal_difference}</td>
      <td>
        <Text weight={700} color="blue" size="lg">
          {team.points}
        </Text>
      </td>
    </tr>
  ));

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      {/* 👈 4. Gắn thanh Select nằm ngang hàng với Tiêu đề */}
      <Group justify="space-between" align="center" mb="lg">
        <Title order={3}>🏆 BẢNG XẾP HẠNG</Title>
        <Select
          placeholder="Chọn giải đấu..."
          data={tournaments}
          value={selectedTournament}
          onChange={setSelectedTournament} // Tự động cập nhật State khi chọn
          searchable // Cho phép gõ để tìm nhanh tên giải
          style={{ width: 250 }}
          radius="md"
        />
      </Group>
      
      <Table highlightOnHover verticalSpacing="sm">
        <thead>
          <tr>
            <th>Hạng</th>
            <th>Câu Lạc Bộ</th>
            <th>Trận</th>
            <th>T</th>
            <th>H</th>
            <th>B</th>
            <th>HS</th>
            <th>Điểm</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </Paper>
  );
};

export default Standings;