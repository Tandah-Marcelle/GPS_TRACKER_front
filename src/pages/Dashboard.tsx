import { useCallback, useEffect, useState } from 'react';
import { Alert, Card, Center, Grid, Group, Loader, Stack, Table, Text, Title } from '@mantine/core';
import { IconAlertTriangle, IconSettings, IconTimeline } from '@tabler/icons-react';
import { dashboardApi, type DashboardData } from '../api/dashboard';
import { serverMessage } from '../lib/apiError';

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
            <Center py={100}>
                <Loader size="xl" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert title="Error" color="red" variant="light">
                {error}
            </Alert>
        );
    }

    if (!data) return null;

    return (
        <Stack gap="xl">
            <Title order={2}>Dashboard</Title>

            {data.lowStockAlert && (
                <Alert
                    icon={<IconAlertTriangle size={24} />}
                    title="Low Stock Alert"
                    color="red"
                    variant="filled"
                >
                    Trackers in stock ({data.inStockCount}) are below the threshold of {data.lowStockThreshold}. Needs restocking!
                </Alert>
            )}

            <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <Text size="xs" color="dimmed" fw={700} tt="uppercase">In Stock</Text>
                            <IconSettings size={22} color="var(--mantine-color-blue-6)" />
                        </Group>
                        <Text mt="sm" size="xl" fw={700}>{data.trackersByStatus.IN_STOCK}</Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <Text size="xs" color="dimmed" fw={700} tt="uppercase">Installed</Text>
                            <IconSettings size={22} color="var(--mantine-color-teal-6)" />
                        </Group>
                        <Text mt="sm" size="xl" fw={700}>{data.trackersByStatus.INSTALLED}</Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <Text size="xs" color="dimmed" fw={700} tt="uppercase">Faulty</Text>
                            <IconSettings size={22} color="var(--mantine-color-red-6)" />
                        </Group>
                        <Text mt="sm" size="xl" fw={700}>{data.trackersByStatus.FAULTY}</Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <Text size="xs" color="dimmed" fw={700} tt="uppercase">Returned</Text>
                            <IconSettings size={22} color="var(--mantine-color-gray-6)" />
                        </Group>
                        <Text mt="sm" size="xl" fw={700}>{data.trackersByStatus.RETURNED}</Text>
                    </Card>
                </Grid.Col>
            </Grid>

            <Title order={3} mt="md">Interventions This Week</Title>

            <Card withBorder radius="md" p={0}>
                {data.interventionsThisWeekPerTechnician.length === 0 ? (
                    <Center py={60}>
                        <Stack align="center" gap="xs">
                            <IconTimeline size={34} opacity={0.4} />
                            <Text c="dimmed" size="sm">No interventions planned or done this week.</Text>
                        </Stack>
                    </Center>
                ) : (
                    <Table.ScrollContainer minWidth={500}>
                        <Table striped highlightOnHover verticalSpacing="md" horizontalSpacing="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Technician</Table.Th>
                                    <Table.Th ta="right">Interventions Count</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {data.interventionsThisWeekPerTechnician.map((tech) => (
                                    <Table.Tr key={tech.technicianId}>
                                        <Table.Td fw={500}>{tech.fullName}</Table.Td>
                                        <Table.Td ta="right">{tech.count}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                )}
            </Card>

        </Stack>
    );
}
