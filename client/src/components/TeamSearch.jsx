import React, { useState, useEffect } from 'react';
import { Select, Group, Avatar, Text } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TeamSearch = () => {
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  // Kéo danh sách Đội bóng 1 lần duy nhất khi thanh tìm kiếm xuất hiện
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/teams');
        
        // Chuẩn bị form dữ liệu chuẩn mà Mantine <Select> yêu cầu: { value, label }
        const formattedTeams = res.data.map(team => ({
          value: team.id.toString(), // value bắt buộc phải là chuỗi (String)
          label: team.name,          // Tên đội để tìm kiếm
          logo: team.logo_url        // Lưu trữ thêm logo để lát vẽ lên giao diện
        }));
        
        setTeams(formattedTeams);
      } catch (err) {
        console.error("Lỗi tải danh sách tìm kiếm:", err);
      }
    };
    fetchTeams();
  }, []);

  // Hàm tuỳ chỉnh giao diện cho từng dòng kết quả xổ xuống (Có Icon + Tên)
  const renderSelectOption = ({ option }) => (
    <Group gap="sm">
      <Avatar src={option.logo} size={24} fallbackSrc="https://placehold.co/100?text=Logo" />
      <Text size="sm" fw={500}>{option.label}</Text>
    </Group>
  );

  return (
    <Select
      placeholder="Tìm kiếm đội bóng..."
      data={teams}
      searchable
      nothingFoundMessage="Không tìm thấy đội nào"
      leftSection={<IconSearch size={16} />}
      renderOption={renderSelectOption} // Bơm cái hàm vẽ Logo vào đây
      style={{ width: 300 }} // Có thể chỉnh độ rộng thanh tìm kiếm ở đây
      
      // ĐÂY LÀ ĐIỂM QUAN TRỌNG NHẤT: Bắt sự kiện khi click chọn 1 kết quả
      onChange={(value) => {
        if (value) {
          // value ở đây chính là team.id (từ option.value ở trên)
          // Dùng navigate để đẩy thẳng người dùng sang trang chi tiết cực mượt
          navigate(`/team/${value}`);
        }
      }}
    />
  );
};

export default TeamSearch;