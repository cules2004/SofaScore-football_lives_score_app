import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Group, Text, Paper, Title, Loader, Center, Modal, Select, Stack, Avatar, ActionIcon, NumberInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlayerPlay, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react'; // Bổ sung IconEdit, IconTrash
import axios from 'axios';

const AdminMatches = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // Modal Tạo mới
  const [opened, { open, close }] = useDisclosure(false);
  const [newMatch, setNewMatch] = useState({ home_team_id: '', away_team_id: '' });
  
  // Modal Chỉnh sửa
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editingMatch, setEditingMatch] = useState(null); // Lưu thông tin trận đang sửa

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesRes, teamsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/matches'),
        axios.get('http://localhost:3000/api/teams')
      ]);
      setMatches(matchesRes.data);
      setTeams(teamsRes.data.map(t => ({ value: t.id.toString(), label: t.name })));
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getToken = () => {
    const savedUser = localStorage.getItem('vibe_user');
    return savedUser ? JSON.parse(savedUser).token : null;
  };

  // 1. TẠO TRẬN (Giữ nguyên)
  const handleCreateMatch = async () => {
    if (!newMatch.home_team_id || !newMatch.away_team_id) return alert("Vui lòng chọn đủ 2 đội!");
    try {
      setIsSubmitting(true);
      await axios.post('http://localhost:3000/api/matches', newMatch, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      alert('✅ Tạo trận đấu thành công!');
      close(); setNewMatch({ home_team_id: '', away_team_id: '' }); fetchData();
    } catch (err) { alert('❌ Lỗi: ' + (err.response?.data?.error || 'Không thể tạo')); } 
    finally { setIsSubmitting(false); }
  };

  // 2. BẮT ĐẦU TRẬN (Giữ nguyên)
  const handleStartMatch = async (matchId) => {
    if (!window.confirm("Bắt đầu trận đấu này?")) return;
    try {
      await axios.patch(`http://localhost:3000/api/matches/${matchId}/start`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      alert('🚀 Trận đấu đã LIVE!'); fetchData(); 
    } catch (err) { alert('❌ Lỗi: ' + err.response?.data?.error); }
  };

  // 3. 🚀 SỬA TRẬN ĐẤU (MỚI)
  const handleUpdateMatch = async () => {
    try {
      setIsSubmitting(true);
      await axios.put(`http://localhost:3000/api/matches/${editingMatch.id}`, editingMatch, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      alert('✅ Đã cập nhật kết quả!');
      closeEdit(); fetchData(); 
    } catch (err) { alert('❌ Lỗi Sửa: ' + err.response?.data?.error); } 
    finally { setIsSubmitting(false); }
  };

  // 4. 🚀 XÓA TRẬN ĐẤU (MỚI)
  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm("⚠️ BẠN CÓ CHẮC MUỐN XÓA TRẬN NÀY KHÔNG? Hành động này không thể hoàn tác!")) return;
    try {
      await axios.delete(`http://localhost:3000/api/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      alert('🗑️ Đã xóa trận đấu!'); fetchData(); 
    } catch (err) { alert('❌ Lỗi Xóa: ' + err.response?.data?.error); }
  };

  if (loading) return <Center h={300}><Loader type="dots" size="xl" /></Center>;

  return (
    <Paper p="lg" radius="md" shadow="sm" withBorder>
      <Group justify="space-between" mb="xl">
        <Title order={2} c="blue.8">Bảng Điều Khiển Trận Đấu</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>Thêm trận đấu</Button>
      </Group>
      
      <Table striped highlightOnHover verticalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Cặp Đấu</Table.Th>
            <Table.Th>Trạng Thái</Table.Th>
            <Table.Th ta="right">Bảng Điều Khiển</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {matches.map(m => (
            <Table.Tr key={m.id}>
              <Table.Td fw={700} c="dimmed">#{m.id}</Table.Td>
              
              <Table.Td>
                <Group gap="sm" wrap="nowrap">
                  <Avatar src={m.home_logo} size="sm" />
                  <Text fw={600} style={{ width: 120 }} truncate="end">{m.home_team_name}</Text>
                  <Badge color="gray" variant="light">
                    {m.status === 'PENDING' ? 'VS' : `${m.home_score} - ${m.away_score}`}
                  </Badge>
                  <Text fw={600} style={{ width: 120 }} ta="right" truncate="end">{m.away_team_name}</Text>
                  <Avatar src={m.away_logo} size="sm" />
                </Group>
              </Table.Td>
              
              <Table.Td>
                <Badge color={m.status === 'LIVE' ? 'red' : m.status === 'FINISHED' ? 'gray' : 'blue'} variant="filled">
                  {m.status}
                </Badge>
              </Table.Td>
              
              <Table.Td ta="right">
                <Group justify="flex-end" gap="sm">
                  {/* Trạng thái Bắt đầu hoặc Số phút */}
                  {m.status === 'PENDING' ? (
                    <Button size="xs" color="green" leftSection={<IconPlayerPlay size={14} />} onClick={() => handleStartMatch(m.id)}>
                      Bắt đầu
                    </Button>
                  ) : m.status === 'LIVE' ? (
                    <Text size="sm" c="red" fw={700} className="pulse-animation" mr="xs">Phút {m.live_minute}'</Text>
                  ) : null}

                  {/* NÚT SỬA */}
                  <ActionIcon 
                    variant="light" color="blue" 
                    onClick={() => { setEditingMatch(m); openEdit(); }}
                    title="Chỉnh sửa kết quả"
                  >
                    <IconEdit size={18} />
                  </ActionIcon>

                  {/* NÚT XÓA */}
                  <ActionIcon 
                    variant="light" color="red" 
                    onClick={() => handleDeleteMatch(m.id)}
                    title="Xóa trận đấu"
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {/* MODAL 1: THÊM TRẬN ĐẤU */}
      <Modal opened={opened} onClose={close} title={<Text fw={900} size="xl">Lên lịch trận đấu</Text>} centered>
         {/* (Giữ nguyên như cũ, chỉ rút gọn cho bạn dễ nhìn) */}
         <Stack>
          <Select label="Đội chủ nhà" data={teams} searchable limit={500} value={newMatch.home_team_id} onChange={(v) => setNewMatch({...newMatch, home_team_id: v})} />
          <Center><Text fw={900} c="dimmed">VS</Text></Center>
          <Select label="Đội khách" data={teams} searchable limit={500} value={newMatch.away_team_id} onChange={(v) => setNewMatch({...newMatch, away_team_id: v})} />
          <Button mt="xl" size="lg" fullWidth onClick={handleCreateMatch} loading={isSubmitting}>Lên Lịch Ngay</Button>
        </Stack>
      </Modal>

      {/* MODAL 2: 🚀 CHỈNH SỬA KẾT QUẢ TRẬN ĐẤU */}
      <Modal opened={editOpened} onClose={closeEdit} title={<Text fw={900} size="xl">Cập nhật trận #{editingMatch?.id}</Text>} centered>
        {editingMatch && (
          <Stack>
            <Select
              label="Trạng thái"
              data={[
                { value: 'PENDING', label: 'Chưa đá (PENDING)' },
                { value: 'LIVE', label: 'Đang đá trực tiếp (LIVE)' },
                { value: 'FINISHED', label: 'Đã kết thúc (FINISHED)' }
              ]}
              value={editingMatch.status}
              onChange={(v) => setEditingMatch({ ...editingMatch, status: v })}
            />
            
            <Group grow>
              <NumberInput 
                label={`Bàn thắng: ${editingMatch.home_team_name}`} 
                value={editingMatch.home_score} 
                onChange={(v) => setEditingMatch({ ...editingMatch, home_score: v })} 
                min={0} 
              />
              <NumberInput 
                label={`Bàn thắng: ${editingMatch.away_team_name}`} 
                value={editingMatch.away_score} 
                onChange={(v) => setEditingMatch({ ...editingMatch, away_score: v })} 
                min={0} 
              />
            </Group>
            
            <NumberInput 
              label="Phút thi đấu hiện tại" 
              value={editingMatch.live_minute} 
              onChange={(v) => setEditingMatch({ ...editingMatch, live_minute: v })} 
              min={0} max={120} 
            />

            <Button mt="xl" size="md" color="blue" fullWidth onClick={handleUpdateMatch} loading={isSubmitting}>
              Lưu Cập Nhật
            </Button>
          </Stack>
        )}
      </Modal>

    </Paper>
  );
};

export default AdminMatches;