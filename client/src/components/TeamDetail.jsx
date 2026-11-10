import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Title, Text, Group, Image, Paper, Tabs, 
  Badge, Center, Loader, Button, Stack, Avatar, SimpleGrid
} from '@mantine/core';
import { IconArrowLeft, IconShirt, IconBrain, IconHistory } from '@tabler/icons-react';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [teamInfo, setTeamInfo] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamMatches, setTeamMatches] = useState([]);
  
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        const [teamRes, playersRes, matchesRes] = await Promise.all([
          axios.get(`http://localhost:3000/api/teams/${id}`),
          axios.get(`http://localhost:3000/api/teams/${id}/players`),
          axios.get(`http://localhost:3000/api/teams/${id}/matches`)
        ]);
        
        setTeamInfo(teamRes.data); 
        setPlayers(playersRes.data);
        setTeamMatches(matchesRes.data); 
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamData();
  }, [id]);

  if (loading) return <Center h="100vh"><Loader size="xl" type="bars" /></Center>;
  if (!teamInfo) return <Center h="100vh"><Title>Không tìm thấy đội bóng!</Title></Center>;

  return (
    <Container size="xl" py="xl">
      {/* Nút quay lại */}
      <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)} mb="md">
        Quay lại
      </Button>

      {/* HEADER BANNER */}
      <Paper shadow="md" radius="lg" p="xl" mb="xl" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
        <Group justify="space-between" align="center" wrap="nowrap">
          
          {/* Bên Trái: Logo Đội Bóng và Thông tin */}
          <Group wrap="nowrap" align="center" gap="xl">
            <Paper p="sm" radius="md" bg="white">
              <Image src={teamInfo.logo_url} h={120} w={120} fit="contain" fallbackSrc="https://placehold.co/120" />
            </Paper>
            
            <Stack gap={5}>
              <Title order={1} size="3rem">{teamInfo.name}</Title>
              
              {/* DÒNG MỚI: THÊM TÊN HLV VÀO ĐÂY */}
              {/* Lưu ý: Thay chữ 'coach_name' bằng đúng tên cột HLV trong database của bạn (ví dụ: coach, hoặc manager) */}
              <Text size="lg" c="gray.4" mt={5}>
                👔 HLV: {teamInfo.manager_name || 'Chưa cập nhật'}
              </Text>
              
              <Text size="lg" c="gray.4">
                🏟️ Sân nhà: {teamInfo.stadium || 'Đang cập nhật'}
              </Text>
            </Stack>
          </Group>

          {/* Bên Phải: Logo Giải Đấu */}
          <Stack align="flex-end" gap={5}>
            <Text size="xs" fw={700} c="gray.5" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            </Text>
            <Paper p="xs" radius="md" style={{ background: 'rgba(255, 255, 255, 0.98)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Image 
                src={teamInfo.tournament_logo} 
                h={60} 
                w={60} 
                fit="contain" 
                fallbackSrc="https://placehold.co/60?text=League" 
              />
            </Paper>
          </Stack>

        </Group>
      </Paper>

      {/* HỆ THỐNG TABS */}
      <Tabs defaultValue="squad" variant="pills" radius="md">
        <Tabs.List mb="lg">
          <Tabs.Tab value="squad" leftSection={<IconShirt size={16} />}>
            <Text fw={600} size="md">Đội hình</Text>
          </Tabs.Tab>
          
          <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
            <Text fw={600} size="md">Các trận đấu</Text>
          </Tabs.Tab>
          
          <Tabs.Tab value="tactics" leftSection={<IconBrain size={16} />}>
            <Text fw={600} size="md">Chiến thuật</Text>
          </Tabs.Tab>
        </Tabs.List>

        {/* NỘI DUNG TAB ĐỘI HÌNH (ĐÃ ĐƯỢC LÀM MỚI) */}
        <Tabs.Panel value="squad">
          {players.length === 0 ? (
            <Paper p="xl" withBorder ta="center">
              <Text c="dimmed">Đội bóng này chưa có dữ liệu đội hình.</Text>
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {players.map((p) => (
                <Paper key={p.id} p="md" radius="md" withBorder shadow="sm">
                  <Group wrap="nowrap">
                    {/* Avatar hiển thị Số áo cầu thủ */}
                    <Avatar size="lg" radius="md" color="blue" variant="light">
                      <Text fw={900} size="lg">{p.jersey_number || '-'}</Text>
                    </Avatar>
                    
                    {/* Thông tin cầu thủ xếp dọc */}
                    <Stack gap={2} style={{ flex: 1, overflow: 'hidden' }}>
                      <Text fw={700} size="md" truncate="end">
                        {p.name}
                      </Text>
                      <Text size="sm" c="dimmed" truncate="end">
                        • Vị trí: {p.position || '--'} • {p.nationality || 'Chưa cập nhật'}
                      </Text>
                    </Stack>
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>
          )}
        </Tabs.Panel>

        {/* NỘI DUNG TAB CÁC TRẬN ĐẤU */}
        <Tabs.Panel value="history">
          {teamMatches.length === 0 ? (
            <Paper p="xl" withBorder ta="center">
              <Text c="dimmed">Đội bóng này chưa có dữ liệu trận đấu đã kết thúc.</Text>
            </Paper>
          ) : (
            <Stack gap="md">
              {teamMatches.map(m => {
                const isHome = m.home_team_id === parseInt(id);
                const isWin = isHome ? (m.home_score > m.away_score) : (m.away_score > m.home_score);
                const isDraw = m.home_score === m.away_score;

                return (
                  <Paper key={m.id} p="md" withBorder radius="md" shadow="xs">
                    <Group justify="space-between" wrap="nowrap">
                      <Badge color={isWin ? 'green' : isDraw ? 'yellow' : 'red'} variant="filled" size="lg" style={{ width: 85 }}>
                        {isWin ? 'THẮNG' : isDraw ? 'HÒA' : 'THUA'}
                      </Badge>

                      <Group gap="xl" style={{ flex: 1 }} justify="center" wrap="nowrap">
                        <Group gap="sm" style={{ width: 180 }} justify="flex-end" wrap="nowrap">
                          <Text fw={m.home_team_id === parseInt(id) ? 800 : 400} ta="right" truncate="end">
                            {m.home_team_name}
                          </Text>
                          <Avatar src={m.home_logo} size="sm" />
                        </Group>

                        <Paper bg="gray.1" px="md" py={4} radius="sm" withBorder>
                          <Text fw={900} size="xl">{m.home_score} - {m.away_score}</Text>
                        </Paper>

                        <Group gap="sm" style={{ width: 180 }} wrap="nowrap">
                          <Avatar src={m.away_logo} size="sm" />
                          <Text fw={m.away_team_id === parseInt(id) ? 800 : 400} truncate="end">
                            {m.away_team_name}
                          </Text>
                        </Group>
                      </Group>
                      
                      <div style={{ width: 85 }}></div>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Tabs.Panel>

        {/* NỘI DUNG TAB CHIẾN THUẬT */}
        <Tabs.Panel value="tactics">
          <Paper shadow="sm" radius="md" p="xl" withBorder>
             <Title order={3} mb="md">Triết lý thi đấu</Title>
             <Text c="dimmed">Đội bóng ưa thích triển khai đội hình 4-3-3, áp dụng lối đá tấn công tổng lực dựa trên việc kiểm soát không gian và cự ly đội hình.</Text>
          </Paper>
        </Tabs.Panel>

      </Tabs>
    </Container>
  );
};

export default TeamDetail;