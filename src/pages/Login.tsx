import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Paper, TextInput, PasswordInput, Title, Text, Stack, Container, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { username: '', password: '' },
    validate: {
      username: (v) => (v.trim().length < 2 ? 'Username is required' : null),
      password: (v) => (v.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setServerError(null);
    setLoading(true);
    try {
      await login(values.username, values.password);
      notifications.show({ title: 'Welcome', message: 'Logged in successfully', color: 'green' });
      // redirect by role: will be handled by router, default to dashboard
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      if (user?.role === 'TECHNICIAN') navigate('/my-interventions', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const data = err.response?.data;
      const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message || 'Invalid credentials';
      const status = err.response?.status;

      if (status === 401) {
        setServerError(message);
        form.setErrors({ username: ' ', password: message });
      } else if (status === 400 && Array.isArray(data?.message)) {
        // map server validation array to form
        const fieldErrors: Record<string, string> = {};
        data.message.forEach((msg: string) => {
          if (msg.toLowerCase().includes('username')) fieldErrors.username = msg;
          else if (msg.toLowerCase().includes('password')) fieldErrors.password = msg;
        });
        if (Object.keys(fieldErrors).length) form.setErrors(fieldErrors);
        else setServerError(message);
      } else {
        setServerError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" order={2} mb="md">
        🛰️ Camtrack Login
      </Title>
      <Text c="dimmed" size="sm" ta="center" mb="lg">
        GPS tracker stock and installation management
      </Text>

      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {serverError && (
              <Alert icon={<IconAlertCircle size={16} />} title="Login failed" color="red" variant="light">
                {serverError}
              </Alert>
            )}

            <TextInput
              label="Username"
              placeholder="manager / tech1"
              required
              {...form.getInputProps('username')}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              {...form.getInputProps('password')}
            />

            <Button type="submit" fullWidth mt="md" loading={loading} disabled={loading}>
              Log in
            </Button>

            <Text size="xs" c="dimmed" ta="center" mt="sm">
              Test accounts: manager / Manager123! | tech1 / Tech123! | tech2 / Tech123!
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
