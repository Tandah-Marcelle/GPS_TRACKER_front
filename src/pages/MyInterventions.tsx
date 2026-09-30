import { useCallback, useEffect, useState } from 'react';
import { ActionIcon, Alert, Badge, Button, Card, Center, Group, Loader, Stack, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAlertCircle, IconCalendar, IconCheck, IconMapPin, IconRefresh, IconTimeline } from '@tabler/icons-react';
import { interventionsApi } from '../api/interventions';
import { CompleteInterventionModal } from '../components/interventions/CompleteInterventionModal';
import { serverMessage } from '../lib/apiError';
import type { Intervention } from '../types';

export default function MyInterventions() {
    const [all, setAll] = useState<Intervention[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // We don't filter by technicianId param because the backend automatically
            // limits results to the logged-in technician's interventions via service logic.
            const data = await interventionsApi.list();

            // Sort: PLANNED first, then DONE/CANCELLED, then by date (upcoming first for planned)
            const sorted = [...data].sort((a, b) => {
                if (a.status === 'PLANNED' && b.status !== 'PLANNED') return -1;
                if (a.status !== 'PLANNED' && b.status === 'PLANNED') return 1;
                return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
            });

            setAll(sorted);
        } catch (err) {
            setError(serverMessage(err, 'Could not load your interventions'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleCompleteClick = (inv: Intervention) => {
        setSelectedIntervention(inv);
        openModal();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PLANNED': return <Badge color="blue" size="lg">Planned</Badge>;
            case 'DONE': return <Badge color="teal" size="lg">Done</Badge>;
            case 'CANCELLED': return <Badge color="gray" size="lg">Cancelled</Badge>;
            default: return null;
        }
    };

    return (
        <Stack gap="md" maw={600} mx="auto">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text fw={700} size="xl">My Interventions</Text>
                    <Text size="sm" c="dimmed">{all.length} assigned to you</Text>
                </div>
                <Tooltip label="Refresh list">
                    <ActionIcon variant="default" size="lg" onClick={load} loading={loading}>
                        <IconRefresh size={18} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" withCloseButton onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Center py={60}><Loader size="lg" /></Center>
            ) : all.length === 0 ? (
                <Card withBorder radius="md" p="xl" ta="center">
                    <Center mb="md">
                        <IconTimeline size={48} opacity={0.4} />
                    </Center>
                    <Text c="dimmed">You don't have any interventions assigned yet.</Text>
                </Card>
            ) : (
                <Stack gap="md">
                    {all.map((inv) => (
                        <Card key={inv.id} withBorder radius="md" p="md" shadow="sm">
                            <Group justify="space-between" mb="xs" wrap="nowrap">
                                <Text size="lg" fw={600}>{inv.vehicle?.plate}</Text>
                                {getStatusBadge(inv.status)}
                            </Group>

                            <Text c="dimmed" size="sm" mb="md">
                                Client: {inv.client?.name} | {inv.vehicle?.brand} {inv.vehicle?.model}
                            </Text>

                            <Group gap="xs" mb="sm" wrap="nowrap">
                                <IconCalendar size={18} color="var(--mantine-color-blue-6)" />
                                <Text fw={500}>{new Date(inv.scheduledAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</Text>
                            </Group>

                            <Group gap="xs" mb="lg" wrap="nowrap" align="start">
                                <IconMapPin size={18} color="var(--mantine-color-red-6)" style={{ marginTop: 2 }} />
                                <Text style={{ flex: 1 }}>{inv.address}</Text>
                            </Group>

                            {inv.status === 'PLANNED' && (
                                <Button
                                    fullWidth
                                    size="lg"
                                    color="blue"
                                    leftSection={<IconCheck size={20} />}
                                    onClick={() => handleCompleteClick(inv)}
                                >
                                    Complete Installation
                                </Button>
                            )}
                        </Card>
                    ))}
                </Stack>
            )}

            <CompleteInterventionModal
                opened={modalOpened}
                onClose={closeModal}
                intervention={selectedIntervention}
                onSaved={load}
            />
        </Stack>
    );
}
