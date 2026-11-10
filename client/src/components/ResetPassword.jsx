import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Title, PasswordInput, Button, Text } from '@mantine/core';
import axios from 'axios';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const ResetPassword = () => {
  // useParams giúp lấy id và token từ thanh địa chỉ (URL)
  const { id, token } = useParams(); 
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (newPassword.length < 6) {
      return alert('Mật khẩu phải có ít nhất 6 ký tự!');
    }
    
    try {
      setLoading(true);
      const res = await axios.post(`http://localhost:3000/api/auth/reset-password/${id}/${token}`, {
        newPassword
      });
      alert('🎉 ' + res.data.message);
      navigate('/'); // Đổi pass xong thì đá người dùng về Trang chủ để họ đăng nhập
    } catch (error) {
      alert(error.response?.data?.error || 'Link đã hết hạn hoặc không hợp lệ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" order={2}>Thiết lập mật khẩu mới 🔒</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
        Nhập mật khẩu mới của bạn bên dưới
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <PasswordInput 
          label="Mật khẩu mới" 
          placeholder="Tối thiểu 6 ký tự" 
          required 
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Button fullWidth mt="xl" onClick={handleReset} loading={loading}>
          Cập nhật mật khẩu
        </Button>
      </Paper>
    </Container>
  );
};

export default ResetPassword;