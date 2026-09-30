import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Badge,
    Card,
    Center,
    Grid,
    Group,
    Loader,
    Progress,
    RingProgress,
    Stack,
    Table,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import {
    IconAlertTriangle,
    IconBolt,
    IconCheck,
    IconPackage,
    IconRefresh,
    IconTool,
    IconTimeline,
} from '@tabler/icons-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { dashboardApi, type DashboardData } from '../api/dashboard';
import { serverMessage } from '../lib/apiError';

const STATUS_CONFIG = {
    IN_STOCK: { label: 'In Stock', color: '#4dabf7', icon: IconPackage, mantine: 'blue' },
    INSTALLED: { label: 'Installed', color: '#51cf66', icon: IconCheck, mantine: 'teal' },
    FAULTY: { label: 'Faulty', color: '#ff6b6b', icon: IconAlertTriangle, mantine: 'red' },
    RETURNED: { label: 'Returned', color: '#94a3b8', icon: IconRefresh, mantine: 'gray' },
};

export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const stats = await dashboardApi.get();
            setData(stats);
        } catch (err) {
            setError(serverMessage(err, 'Could not load dashboard data'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <Center py={120}>
                <Stack align="center" gap="md">
                    <Loader size="xl" type="dots" />
                    <Text c="dimmed" size="sm">Loading dashboard…</Text>
                </Stack>
            </Center>
        );
    }

    if (error) {
        return (
            <Alert title="Error loading dashboard" color="red" variant="light" icon={<IconAlertTriangle />}>
                {error}
            </Alert>
        );
    }

    if (!data) return null;

    const total = Object.values(data.trackersByStatus).reduce((s, v) => s + v, 0);

    const ringData = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
        value: total > 0 ? Math.round(((data.trackersByStatus as any)[key] / total) * 100) : 0,
        color: cfg.color,
        tooltip: `${cfg.label}: ${(data.trackersByStatus as any)[key]}`,
    }));

    const barData = data.interventionsThisWeekPerTechnician.map((t) => ({
        name: t.fullName.split(' ')[0], // first name to keep it short
        count: t.count,
    }));

    const BAR_COLORS = ['#4dabf7', '#51cf66', '#ffd43b', '#ff6b6b', '#cc5de8', '#20c997'];

    return (
        <Stack gap="xl">
            {/* ── Title ───────────────────────────── */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Title order={2} fw={700}>Dashboard</Title>
                    <Text c="dimmed" size="sm" mt={2}>Overview of your GPS tracker operations</Text>
                </div>
                <Badge variant="outline" color="gray" size="sm">
                    {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Badge>
            </Group>

            {/* ── Low Stock Alert ──────────────────── */}
            {data.lowStockAlert && (
                <Alert
                    icon={<IconAlertTriangle size={22} />}
                    title="⚠ Low Stock Alert"
                    color="red"
                    variant="filled"
                    radius="md"
                    style={{ fontSize: '1rem' }}
                >
                    Only <strong>{data.inStockCount}</strong> trackers remain in stock — below the threshold of{' '}
                    <strong>{data.lowStockThreshold}</strong>. Restock immediately!
                </Alert>
            )}

            {/* ── KPI Cards ───────────────────────── */}
            <Grid gutter="md">
                {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => {
                    const count = data.trackersByStatus[key];
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                        <Grid.Col key={key} span={{ base: 12, xs: 6, md: 3 }}>
                            <Card
                                withBorder
                                radius="lg"
                                p="lg"
                                style={{
                                    borderColor: `${cfg.color}33`,
                                    background: `linear-gradient(135deg, var(--mantine-color-dark-7) 60%, ${cfg.color}0d)`,
                                }}
                            >
                                <Group justify="space-between" mb="md">
                                    <Text size="xs" fw={700} c="dimmed" tt="uppercase" ls={0.8}>
                                        {cfg.label}
                                    </Text>
                                    <ThemeIcon
                                        variant="light"
                                        color={cfg.mantine as any}
                                        size="lg"
                                        radius="md"
                                    >
                                        <cfg.icon size={18} />
                                    </ThemeIcon>
                                </Group>
                                <Text size="3xl" fw={800} lh={1} mb="xs" style={{ fontSize: 32, color: cfg.color }}>
                                    {count}
                                </Text>
                                <Progress value={pct} color={cfg.mantine as any} size="xs" radius="xl" mt="xs" />
                                <Text size="xs" c="dimmed" mt={4}>{pct.toFixed(0)}% of fleet</Text>
                            </Card>
                        </Grid.Col>
                    );
                })}
            </Grid>

            {/* ── Charts Row ──────────────────────── */}
            <Grid gutter="md">
                {/* Donut chart: tracker status breakdown */}
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <Card withBorder radius="lg" p="lg" h="100%">
                        <Text fw={700} size="md" mb="lg">Tracker Status Breakdown</Text>
                        {total === 0 ? (
                            <Center py={60}>
                                <Text c="dimmed" size="sm">No tracker data yet.</Text>
                            </Center>
                        ) : (
                            <Group align="center" justify="center" gap="xl">
                                <RingProgress
                                    size={200}
                                    thickness={24}
                                    roundCaps
                                    sections={ringData}
                                    label={
                                        <Center>
                                            <Stack align="center" gap={2}>
                                                <Text fw={800} size="xl">{total}</Text>
                                                <Text size="xs" c="dimmed">Total</Text>
                                            </Stack>
                                        </Center>
                                    }
                                />
                                <Stack gap="sm">
                                    {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, (typeof STATUS_CONFIG)[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => (
                                        <Group key={key} gap="xs" wrap="nowrap">
                                            <div
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 3,
                                                    background: cfg.color,
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                                {cfg.label}
                                            </Text>
                                            <Text size="sm" fw={600} ml="auto">
                                                {data.trackersByStatus[key]}
                                            </Text>
                                        </Group>
                                    ))}
                                </Stack>
                            </Group>
                        )}
                    </Card>
                </Grid.Col>

                {/* Bar chart: interventions per technician this week */}
                <Grid.Col span={{ base: 12, md: 7 }}>
                    <Card withBorder radius="lg" p="lg" h="100%">
                        <Group justify="space-between" mb="lg">
                            <Text fw={700} size="md">Interventions This Week</Text>
                            <Badge variant="light" color="blue" leftSection={<IconBolt size={12} />}>
                                Current week
                            </Badge>
                        </Group>
                        {barData.length === 0 ? (
                            <Center py={60}>
                                <Stack align="center" gap="xs">
                                    <IconTimeline size={34} opacity={0.4} />
                                    <Text c="dimmed" size="sm">No interventions planned this week.</Text>
                                </Stack>
                            </Center>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#94a3b8', fontSize: 13 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--mantine-color-dark-6)',
                                            border: '1px solid var(--mantine-color-dark-4)',
                                            borderRadius: 8,
                                            color: 'white',
                                        }}
                                        labelStyle={{ fontWeight: 600 }}
                                        formatter={(v: number) => [v, 'Interventions']}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                        {barData.map((_, i) => (
                                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Card>
                </Grid.Col>
            </Grid>

            {/* ── Intervention Detail Table ─────── */}
            <Card withBorder radius="lg" p={0}>
                <Group px="lg" py="md" justify="space-between">
                    <Group gap="xs">
                        <ThemeIcon variant="light" color="blue" radius="md">
                            <IconTool size={16} />
                        </ThemeIcon>
                        <Text fw={700} size="md">Technician Summary — This Week</Text>
                    </Group>
                </Group>
                {data.interventionsThisWeekPerTechnician.length === 0 ? (
                    <Center py={60}>
                        <Stack align="center" gap="xs">
                            <IconTimeline size={34} opacity={0.3} />
                            <Text c="dimmed" size="sm">No interventions recorded this week.</Text>
                        </Stack>
                    </Center>
                ) : (
                    <Table.ScrollContainer minWidth={400}>
                        <Table
                            striped
                            highlightOnHover
                            verticalSpacing="md"
                            horizontalSpacing="xl"
                            style={{ fontSize: 14 }}
                        >
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.08em', color: 'var(--mantine-color-dimmed)' }}>
                                        Technician
                                    </Table.Th>
                                    <Table.Th ta="center" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.08em', color: 'var(--mantine-color-dimmed)' }}>
                                        Interventions
                                    </Table.Th>
                                    <Table.Th style={{ width: '40%', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.08em', color: 'var(--mantine-color-dimmed)' }}>
                                        Activity
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {data.interventionsThisWeekPerTechnician.map((tech, i) => {
                                    const maxCount = Math.max(...data.interventionsThisWeekPerTechnician.map((t) => t.count));
                                    const pct = maxCount > 0 ? (tech.count / maxCount) * 100 : 0;
                                    return (
                                        <Table.Tr key={tech.technicianId}>
                                            <Table.Td>
                                                <Group gap="sm" wrap="nowrap">
                                                    <div
                                                        style={{
                                                            width: 34,
                                                            height: 34,
                                                            borderRadius: 8,
                                                            background: `${BAR_COLORS[i % BAR_COLORS.length]}22`,
                                                            border: `1.5px solid ${BAR_COLORS[i % BAR_COLORS.length]}55`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 700,
                                                            color: BAR_COLORS[i % BAR_COLORS.length],
                                                            fontSize: 14,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {tech.fullName.charAt(0)}
                                                    </div>
                                                    <Text fw={600} size="sm">{tech.fullName}</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td ta="center">
                                                <Badge
                                                    size="lg"
                                                    radius="md"
                                                    variant="light"
                                                    color="blue"
                                                    style={{ fontWeight: 700, fontSize: 15 }}
                                                >
                                                    {tech.count}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Progress
                                                    value={pct}
                                                    color={BAR_COLORS[i % BAR_COLORS.length] as any}
                                                    size="md"
                                                    radius="xl"
                                                />
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                )}
            </Card>
        </Stack>
    );
}
