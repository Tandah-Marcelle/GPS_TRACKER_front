import { useState, type ReactNode } from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import {
  AppShell,
  Avatar,
  Burger,
  Button,
  Group,
  Menu,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
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
    label: 'My interventions',
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
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={() => setOpened((o) => !o)} hiddenFrom="sm" size="sm" />
            <Group gap={8}>
              <ThemeIcon variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} size="md" radius="md">
                <IconPackages size={18} />
              </ThemeIcon>
              <div>
                <Text fw={700} size="md" lh={1}>
                  Camtrack
                </Text>
                <Text size="xs" c="dimmed" lh={1.2}>
                  GPS tracker management
                </Text>
              </div>
            </Group>
          </Group>

          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <UnstyledButton>
                <Group gap="xs">
                  <Avatar color="indigo" radius="xl" size="sm">
                    {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                  </Avatar>
                  <Stack gap={0} visibleFrom="xs">
                    <Text size="sm" fw={500} lh={1.2}>
                      {user?.fullName}
                    </Text>
                    <Text size="xs" c="dimmed" lh={1.2}>
                      {user?.role === 'STOCK_MANAGER' ? 'Stock manager' : 'Technician'}
                    </Text>
                  </Stack>
                  <IconChevronDown size={14} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{user?.username}</Menu.Label>
              <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>
                Log out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <AppShell.Section grow component={ScrollArea}>
          <Stack gap={4}>
            {items.map((item) => (
              <NavLink
                key={item.to}
                component={RouterNavLink}
                to={item.to}
                label={item.label}
                leftSection={<item.icon size={18} stroke={1.6} />}
                onClick={() => setOpened(false)}
                style={{ borderRadius: 8 }}
              />
            ))}
          </Stack>
        </AppShell.Section>
        <AppShell.Section>
          <Button variant="subtle" color="red" fullWidth leftSection={<IconLogout size={16} />} onClick={handleLogout}>
            Log out
          </Button>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <div className="grid-pattern rounded-xl border border-white/5">{children}</div>
      </AppShell.Main>
    </AppShell>
  );
}
