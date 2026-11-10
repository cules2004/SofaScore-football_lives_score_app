import React from 'react';
import { AppShell, Burger, Group, NavLink, Title, Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { IconSoccerField, IconUsers, IconDashboard, IconHome } from '@tabler/icons-react';

const AdminLayout = () => {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation(); // Để biết đang ở trang nào mà highlight màu xanh

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
      bg="gray.0"
    >
      {/* 1. THANH HEADER TRÊN CÙNG */}
      <AppShell.Header p="md">
        <Group justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3} c="blue.7">VIBE ADMIN 🏆</Title>
          </Group>
          <Button 
            variant="subtle" 
            color="dark" 
            leftSection={<IconHome size={18} />} 
            onClick={() => navigate('/')}
          >
            Về Trang Chủ
          </Button>
        </Group>
      </AppShell.Header>

      {/* 2. THANH SIDEBAR BÊN TRÁI */}
      <AppShell.Navbar p="sm">
        <Text size="xs" fw={700} c="dimmed" mb="sm" mt="md" style={{ letterSpacing: 1 }}>QUẢN LÝ GIẢI ĐẤU</Text>
        
        {/* Nút chuyển sang trang quản lý trận đấu */}
        <NavLink 
          label="Điều khiển trận đấu" 
          leftSection={<IconSoccerField size={20} />} 
          active={location.pathname === '/admin/matches'}
          onClick={() => navigate('/admin/matches')}
          variant="filled"
          style={{ borderRadius: 8, marginBottom: 5 }}
        />

        <Text size="xs" fw={700} c="dimmed" mb="sm" mt="lg" style={{ letterSpacing: 1 }}>HỆ THỐNG</Text>
        
        {/* Nút chuyển sang trang quản lý người dùng (Làm sau) */}
        <NavLink 
          label="Người dùng" 
          leftSection={<IconUsers size={20} />} 
          active={location.pathname === '/admin/users'}
          onClick={() => navigate('/admin/users')}
          variant="filled"
          style={{ borderRadius: 8 }}
        />
      </AppShell.Navbar>

      {/* 3. KHU VỰC HIỂN THỊ NỘI DUNG CHÍNH */}
      <AppShell.Main>
        {/* <Outlet /> là một cái "lỗ hổng" của React Router. 
            Nội dung của các trang con (Matches, Users...) sẽ được bơm vào đây! */}
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

export default AdminLayout;