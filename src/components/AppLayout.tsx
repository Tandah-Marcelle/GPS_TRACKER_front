import { useState, type ReactNode } from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import {
  AppShell,
  Avatar,
  Badge,
  Burger,
  Button,
  Divider,
  Group,
  Menu,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import {
  IconCar,
  IconChevronDown,
  IconLayoutDashboard,
  IconLogout,
  IconPackages,
  IconTool,
  IconUsers,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

interface NavItem {
  label: string;
  to: string;
  icon: typeof IconLayoutDashboard;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: IconLayoutDashboard,
    roles: ['STOCK_MANAGER'],
  },
  { label: 'Trackers', to: '/trackers', icon: IconPackages, roles: ['STOCK_MANAGER'] },
  { label: 'Clients', to: '/clients', icon: IconUsers, roles: ['STOCK_MANAGER'] },
  { label: 'Vehicles', to: '/vehicles', icon: IconCar, roles: ['STOCK_MANAGER'] },
  {
    label: 'Interventions',
    to: '/interventions',
    icon: IconTool,
    roles: ['STOCK_MANAGER'],
  },
  {
    label: 'My Interventions',
    to: '/my-interventions',
    icon: IconTool,
    roles: ['TECHNICIAN'],
  },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [opened, setOpened] = useState(false);

  const items = NAV_ITEMS.filter((i) => user && i.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="lg"
    >
      {/* ── Header ─────────────────────────────────── */}
      <AppShell.Header
        style={{
          background: 'var(--mantine-color-dark-7)',
          borderBottom: '1px solid var(--mantine-color-dark-5)',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={() => setOpened((o) => !o)} hiddenFrom="sm" size="sm" />
            <img src="/logo.png" alt="Camtrack" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
          </Group>

          <Menu shadow="xl" width={220} position="bottom-end">
            <Menu.Target>
              <UnstyledButton
                style={{
                  borderRadius: 8,
                  padding: '6px 10px',
                  transition: 'background 0.15s',
                }}
              >
                <Group gap="xs">
                  <Avatar
                    color="indigo"
                    radius="xl"
                    size="md"
                    style={{ fontWeight: 700 }}
                  >
                    {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                  </Avatar>
                  <Stack gap={0} visibleFrom="xs">
                    <Text size="sm" fw={600} lh={1.3}>
                      {user?.fullName}
                    </Text>
                    <Text size="xs" c="dimmed" lh={1.2}>
                      {user?.role === 'STOCK_MANAGER' ? 'Stock Manager' : 'Technician'}
                    </Text>
                  </Stack>
                  <IconChevronDown size={14} stroke={1.8} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label fw={600}>{user?.fullName}</Menu.Label>
              <div style={{ padding: '0 12px 4px', marginTop: -4 }}>
                <Text size="xs" c="dimmed">@{user?.username}</Text>
              </div>
              <Divider my="xs" />
              <Menu.Item
                leftSection={<IconLogout size={15} />}
                color="red"
                onClick={handleLogout}
              >
                Log out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      {/* ── Navbar ─────────────────────────────────── */}
      <AppShell.Navbar
        p="sm"
        style={{
          background: 'var(--mantine-color-dark-8)',
          borderRight: '1px solid var(--mantine-color-dark-5)',
        }}
      >
        <AppShell.Section mb="xs">
          <Stack gap={2} px={4} pt={4} pb={8}>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.08em' }}>
              Navigation
            </Text>
          </Stack>
        </AppShell.Section>

        <AppShell.Section grow component={ScrollArea}>
          <Stack gap={3}>
            {items.map((item) => (
              <NavLink
                key={item.to}
                component={RouterNavLink}
                to={item.to}
                label={
                  <Text size="sm" fw={500}>
                    {item.label}
                  </Text>
                }
                leftSection={<item.icon size={19} stroke={1.7} />}
                onClick={() => setOpened(false)}
                styles={{
                  root: {
                    borderRadius: 8,
                    padding: '10px 12px',
                  },
                }}
              />
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Divider mb="sm" />
          <Group gap="xs" px={4} mb="xs" wrap="nowrap">
            <Avatar color="indigo" radius="xl" size="sm">
              {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
            </Avatar>
            <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={600} truncate>
                {user?.fullName}
              </Text>
              <Badge size="xs" variant="light" color={user?.role === 'STOCK_MANAGER' ? 'indigo' : 'teal'} radius="sm">
                {user?.role === 'STOCK_MANAGER' ? 'Stock Manager' : 'Technician'}
              </Badge>
            </Stack>
          </Group>
          <Button
            variant="subtle"
            color="red"
            fullWidth
            size="sm"
            leftSection={<IconLogout size={15} />}
            onClick={handleLogout}
            style={{ borderRadius: 8 }}
          >
            Log out
          </Button>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* ── Main content ───────────────────────────── */}
      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
