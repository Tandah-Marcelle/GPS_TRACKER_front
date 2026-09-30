import { Title, Text, Paper } from '@mantine/core';
import { useAuth } from '../context/AuthContext';

export default function DashboardPlaceholder() {
  const { user, logout } = useAuth();
  return (
    <Paper p="md">
      <Title order={3}>Welcome {user?.fullName} ({user?.role})</Title>
      <Text c="dimmed">Dashboard will be implemented in Phase 2</Text>
      <Text size="sm" mt="md" style={{ cursor: 'pointer', color: 'red' }} onClick={logout}>
        Logout
      </Text>
    </Paper>
  );
}
