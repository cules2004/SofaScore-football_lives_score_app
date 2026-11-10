import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Title, SimpleGrid, Card, Image, Text, Badge, Group, Modal, 
  Table, Loader, Center, Button, TextInput, PasswordInput, Stack, Avatar, Divider, Paper, Alert 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { io } from 'socket.io-client'; 
import { IconBellRinging } from '@tabler/icons-react'; 
import Standings from './components/Standings.jsx'; 
import TeamSearch from './components/TeamSearch.jsx'; 
import ResetPassword from './components/ResetPassword.jsx'; 
import TeamDetail from './components/TeamDetail.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import AdminMatches from './components/AdminMatches.jsx';

function App() {
  const [teams, setTeams] = useState([]);
  const [visibleTeamsCount, setVisibleTeamsCount] = useState(12);
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authOpened, { open: openAuth, close: closeAuth }] = useDisclosure(false);
  const [isLoginMode, setIsLoginMode] = useState(true); 
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [liveEvent, setLiveEvent] = useState(null);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    // 1. Kéo dữ liệu ban đầu
    axios.get('http://localhost:3000/api/matches')
      .then(res => setMatches(res.data))
      .catch(err => console.error("Lỗi tải trận đấu:", err));
      
    axios.get('http://localhost:3000/api/teams')
      .then(res => setTeams(res.data))
      .catch(err => console.error("Lỗi tải đội bóng:", err));

    const savedUser = localStorage.getItem('vibe_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    // 2. Thiết lập Socket.io
    const socket = io('http://localhost:3000');

    // Lắng nghe bàn thắng để hiện Popup
    socket.on('goal', (data) => {
      setLiveEvent(data); 
      setTimeout(() => setLiveEvent(null), 4000); // Tắt popup sau 4s
    });

    // Lắng nghe toàn bộ danh sách trận đấu để tự động nhảy phút
   socket.on('update_matches', (newData) => {
      setMatches(prevMatches => 
        prevMatches.map(oldMatch => {
          // Tìm xem trận đấu cũ này có dữ liệu mới cập nhật từ Backend gửi sang không
          const updatedMatch = newData.find(m => m.id === oldMatch.id);
          
          if (updatedMatch) {
            // Cú pháp Spread (...): Giữ nguyên Logo và Tên đội của oldMatch, 
            // chỉ chép đè tỷ số, phút và trạng thái của updatedMatch lên trên!
            return { ...oldMatch, ...updatedMatch };
          }
          return oldMatch;
        })
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleTeamClick = async (team) => {
    setSelectedTeam(team); open(); setLoadingPlayers(true); setPlayers([]); 
    try {
      const res = await axios.get(`http://localhost:3000/api/teams/${team.id}/players`);
      setPlayers(res.data);
    } catch (err) { console.error("Lỗi:", err); } finally { setLoadingPlayers(false); }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post('http://localhost:3000/api/auth/google-login', {
        credential: credentialResponse.credential,
      });
      const userData = { token: res.data.token, username: res.data.username };
      localStorage.setItem('vibe_user', JSON.stringify(userData));
      setCurrentUser(userData);
      alert(`Chào mừng ${res.data.username} đã đăng nhập!`);
      closeAuth(); 
    } catch (error) {
      alert('Đăng nhập Google thất bại!');
    }
  };

  const submitAuth = async () => {
    setAuthLoading(true);
    const url = isLoginMode ? 'http://localhost:3000/api/auth/login' : 'http://localhost:3000/api/auth/register';
    
    try {
      const res = await axios.post(url, formData);
      alert('🎉 ' + res.data.message);
      if (isLoginMode) {
        const userData = { username: res.data.username, token: res.data.token };
        localStorage.setItem('vibe_user', JSON.stringify(userData));
        setCurrentUser(userData);
      }
      setFormData({ username: '', email: '', password: '' });
      closeAuth();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Lỗi rồi bạn ơi!'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vibe_user');
    setCurrentUser(null);
  };

  const handleForgotPassword = async () => {
    try {
      setAuthLoading(true);
      const res = await axios.post('http://localhost:3000/api/auth/forgot-password', { email: formData.email });
      alert('✅ ' + res.data.message + ' Vui lòng kiểm tra hộp thư.');
      setIsForgotMode(false);
    } catch (error) {
      alert(error.response?.data?.error || 'Có lỗi xảy ra!');
    } finally {
      setAuthLoading(false);
    }
  };

  // ==========================================
  // KHU VỰC CHUẨN BỊ DỮ LIỆU TRƯỚC KHI VẼ GIAO DIỆN
  // ==========================================
  const liveMatches = matches.filter(match => match.status === 'LIVE');
  const finishedMatches = matches.filter(match => match.status === 'FINISHED');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Container size="xl" py="xl">
            {/* THANH ĐIỀU HƯỚNG */}
            <Group justify="space-between" mb="xl">
              <Title order={1} c="blue">🏆 SOFA FOOTBALL</Title>
              <TeamSearch />
              {currentUser ? (
                <Group>
                  <Avatar color="blue" radius="xl">{currentUser.username.charAt(0).toUpperCase()}</Avatar>
                  <Text fw={500}>Hi, {currentUser.username}!</Text>
                  <Button variant="subtle" color="red" onClick={handleLogout}>Đăng xuất</Button>
                </Group>
              ) : (
                <Button variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} onClick={() => { setIsLoginMode(true); openAuth(); }}>
                  Đăng nhập
                </Button>
              )}
            </Group>
            
            {/* POPUP BÀN THẮNG */}
            {liveEvent && (
              <Alert 
                icon={<IconBellRinging size={24} />} 
                title={<Text fw={900} size="xl">VÀOOOOO! Phút {liveEvent.minute}'</Text>} 
                color="red" variant="filled" mb="xl" radius="md"
              >
                <Text size="lg">⚽ Đội **{liveEvent.team}** vừa ghi bàn!</Text>
                <Text size="xl" fw={700} mt="sm">Tỷ số hiện tại: {liveEvent.score}</Text>
              </Alert>
            )}

            {/* DANH SÁCH ĐANG DIỄN RA */}
            <Title order={2} mb="md" mt="xl" c="red">
              🔥 Đang diễn ra ({liveMatches.length})
            </Title>
            {liveMatches.length === 0 ? (
              <Paper p="md" withBorder style={{ textAlign: 'center', background: '#f8fafc' }} radius="md" mb="xl">
                <Text c="dimmed" size="sm">Hiện không có trận đấu nào đang diễn ra trực tiếp.</Text>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
                {liveMatches.map(match => (
                  <Card key={match.id} shadow="md" radius="md" withBorder>
                    <Group justify="space-between" align="center">
                      <Stack align="center" gap="xs" style={{ width: '30%' }}>
                        <Image src={match.home_logo} fallbackSrc="https://placehold.co/100?text=Logo" h={60} w={60} fit="contain" referrerPolicy="no-referrer" />
                        <Text fw={600} ta="center">{match.home_team_name}</Text>
                      </Stack>
                      <Stack align="center" gap={0} style={{ width: '30%' }}>
                        <Badge color="red" variant="filled" className="pulse-animation">{match.live_minute}'</Badge>
                        <Text fw={900} size="h1" my="sm">{match.home_score} - {match.away_score}</Text>
                      </Stack>
                      <Stack align="center" gap="xs" style={{ width: '30%' }}>
                        <Image src={match.away_logo} fallbackSrc="https://placehold.co/100?text=Logo" h={60} w={60} fit="contain" referrerPolicy="no-referrer" />
                        <Text fw={600} ta="center">{match.away_team_name}</Text>
                      </Stack>
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>
            )}

            {/* DANH SÁCH ĐÃ KẾT THÚC */}
            {finishedMatches.length > 0 && (
              <>
                <Title order={2} mb="md" mt="xl" c="gray.7">
                  ✅ Đã kết thúc ({finishedMatches.length})
                </Title>
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
                  {finishedMatches.map(match => (
                    <Card key={match.id} shadow="sm" radius="md" withBorder style={{ opacity: 0.85, background: '#fafafa' }}>
                      <Group justify="space-between" align="center">
                        <Stack align="center" gap="xs" style={{ width: '30%' }}>
                          <Image src={match.home_logo} fallbackSrc="https://placehold.co/100?text=Logo" h={60} w={60} fit="contain" referrerPolicy="no-referrer" />
                          <Text fw={500} ta="center" c="dimmed">{match.home_team_name}</Text>
                        </Stack>
                        <Stack align="center" gap={0} style={{ width: '30%' }}>
                          <Badge color="gray" variant="light">HẾT GIỜ</Badge>
                          <Text fw={800} size="h2" my="xs" c="dimmed">{match.home_score} - {match.away_score}</Text>
                        </Stack>
                        <Stack align="center" gap="xs" style={{ width: '30%' }}>
                          <Image src={match.away_logo} fallbackSrc="https://placehold.co/100?text=Logo" h={60} w={60} fit="contain" referrerPolicy="no-referrer" />
                          <Text fw={500} ta="center" c="dimmed">{match.away_team_name}</Text>
                        </Stack>
                      </Group>
                    </Card>
                  ))}
                </SimpleGrid>
              </>
            )}

            {/* CÂU LẠC BỘ */}
            <Title order={2} mb="md" mt="xl" c="red">🛡️ Câu lạc bộ</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
              {teams.slice(0, visibleTeamsCount).map(team => (
                <Card key={team.id} shadow="sm" padding="lg" radius="md" withBorder onClick={() => window.location.href = '/team/' + team.id} style={{ cursor: 'pointer' }}>
                  <Card.Section>
                    <Image src={team.logo_url} fallbackSrc="https://placehold.co/400x400?text=No+Logo" height={160} alt={team.name} fit="contain" p="md" />
                  </Card.Section>
                 <Stack gap={4} mt="md" align="center">
                  <Text fw={700} size="lg" ta="center" c="dark.8">
                    {team.name}
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Sân nhà: {team.stadium || 'Chưa cập nhật'}
                  </Text>
                </Stack>
                </Card>
              ))}
            </SimpleGrid>
            <Group justify="center" mt="xl">
              {/* Nếu số lượng đang hiển thị vẫn còn NHỎ HƠN tổng số đội -> Hiện nút Xem thêm */}
              {visibleTeamsCount < teams.length && (
                <Button 
                  variant="light" 
                  color="blue" 
                  radius="xl"
                  onClick={() => setVisibleTeamsCount(prev => prev + 12)}
                >
                  Hiển thị thêm câu lạc bộ ⬇️
                </Button>
              )}

              {/* Nếu số lượng đang hiển thị LỚN HƠN 12 (mặc định) -> Hiện nút Ẩn bớt */}
              {visibleTeamsCount > 12 && (
                <Button 
                  variant="subtle" 
                  color="gray" 
                  radius="xl"
                  onClick={() => setVisibleTeamsCount(12)}
                >
                  Thu gọn ⬆️
                </Button>
              )}
            </Group>
            
            {/* BẢNG XẾP HẠNG */}
            <Standings tournamentId={17} />
            
            {/* MODAL CẦU THỦ */}
            <Modal opened={opened} onClose={close} title={<Text fw={700} size="lg">Đội hình: {selectedTeam?.name}</Text>} size="lg">
              {loadingPlayers ? (
                <Center h={100}><Loader type="dots" /></Center>
              ) : players.length === 0 ? (
                <Text c="dimmed" ta="center">Chưa có dữ liệu cầu thủ</Text>
              ) : (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      <Table.Th>Tên Cầu Thủ</Table.Th>
                      <Table.Th>Vị Trí</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {players.map((p, index) => (
                      <Table.Tr key={p.id}>
                        <Table.Td>{index + 1}</Table.Td>
                        <Table.Td fw={500}>{p.name}</Table.Td>
                        <Table.Td>
                            <Badge color={p.position === 'G' ? 'blue' : p.position === 'D' ? 'green' : p.position === 'M' ? 'yellow' : 'red'}>
                              {p.position || 'Unknown'}
                            </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Modal>

            {/* MODAL ĐĂNG NHẬP */}
            <Modal opened={authOpened} onClose={closeAuth} title={<Text fw={700} size="lg">{isForgotMode ? 'Quên mật khẩu' : (isLoginMode ? 'Đăng nhập' : 'Tạo tài khoản')}</Text>} centered>
              <GoogleOAuthProvider clientId="462048970857-r86aktrklktk51akj7o90pnlf54bqr96.apps.googleusercontent.com">
                <Stack>
                  {isForgotMode ? (
                    <>
                      <Text size="sm" c="dimmed" ta="center">Nhập địa chỉ email của bạn, chúng tôi sẽ gửi một đường link để đặt lại mật khẩu mới.</Text>
                      <TextInput label="Email của bạn" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                      <Button fullWidth mt="md" onClick={handleForgotPassword} loading={authLoading}>Gửi link khôi phục</Button>
                      <Text size="sm" ta="center" mt="sm">Nhớ ra mật khẩu rồi? <Text span c="blue" style={{ cursor: 'pointer' }} onClick={() => setIsForgotMode(false)}>Quay lại đăng nhập</Text></Text>
                    </>
                  ) : (
                    <>
                      <TextInput label="Tên đăng nhập" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
                      {!isLoginMode && (
                        <TextInput label="Email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                      )}
                      <PasswordInput label="Mật khẩu" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                      
                      {isLoginMode && (
                        <Text size="xs" c="blue" ta="right" style={{ cursor: 'pointer', marginTop: '-10px' }} onClick={() => setIsForgotMode(true)}>Quên mật khẩu?</Text>
                      )}
                      
                      <Button fullWidth mt="md" onClick={submitAuth} loading={authLoading}>
                        {isLoginMode ? 'Vào trong' : 'Đăng ký ngay'}
                      </Button>

                      <Divider label="Hoặc tiếp tục với" labelPosition="center" my="xs" />

                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => { console.log('Login Failed'); }}
                        />
                      </div>

                      <Text size="sm" ta="center" mt="sm">
                        {isLoginMode ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                        <Text span c="blue" style={{ cursor: 'pointer' }} onClick={() => setIsLoginMode(!isLoginMode)}>
                          {isLoginMode ? "Đăng ký ở đây" : "Đăng nhập luôn"}
                        </Text>
                      </Text>
                    </>
                  )}
                </Stack>
              </GoogleOAuthProvider>
            </Modal>

          </Container>
        } />

        <Route path="/reset-password/:id/:token" element={<ResetPassword />} />
        <Route path="/team/:id" element={<TeamDetail />} />
        <Route path="/admin" element={<AdminLayout />}>
          {/* Khi gõ localhost:5173/admin/matches, nó sẽ chui vào đây */}
          <Route path="matches" element={<AdminMatches />} />
          
          {/* Các trang dự phòng cho tương lai */}
          <Route path="users" element={<h2>Quản lý người dùng</h2>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;