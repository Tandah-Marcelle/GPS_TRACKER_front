import { useCallback, useEffect, useState } from 'react';
import { ActionIcon, Alert, Badge, Button, Card, Center, Group, Loader, Pagination, Select, Stack, Table, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCalendar, IconPlus, IconRefresh, IconTimeline, IconTrash } from '@tabler/icons-react';
import { interventionsApi } from '../api/interventions';
import { clientsApi } from '../api/clients';
import { vehiclesApi } from '../api/vehicles';
import { InterventionFormModal } from '../components/interventions/InterventionFormModal';
import { serverMessage } from '../lib/apiError';
import type { Client, Intervention, User, Vehicle } from '../types';
import api from '../api/axios'; // Direct call for users endpoint

const PAGE_SIZE = 10;

export default function Interventions() {
    const [all, setAll] = useState<Intervention[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [technicians, setTechnicians] = useState<User[]>([]);

    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [techFilter, setTechFilter] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);

    // Load related data (clients, vehicles, technicians)
    useEffect(() => {
        Promise.all([
            clientsApi.list(),
            vehiclesApi.list(),
            api.get<User[]>('/users?role=TECHNICIAN').then(r => r.data)
        ]).then(([c, v, t]) => {
            setClients(c);
            setVehicles(v);
            setTechnicians(t);
        }).catch(console.error);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setAll(await interventionsApi.list({
                status: statusFilter || undefined,
                technicianId: techFilter || undefined,
            }));
        } catch (err) {
            setError(serverMessage(err, 'Could not load interventions'));
        } finally {
            setLoading(false);
        }
    }, [statusFilter, techFilter]);

    useEffect(() => {
        load();
        setPage(1);
    }, [load]);

    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    const rows = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const confirmCancel = (inv: Intervention) => {
        modals.openConfirmModal({
            title: 'Cancel intervention',
            centered: true,
            children: (
                <Text size="sm">
                    Are you sure you want to cancel the intervention for <b>{inv.vehicle?.plate}</b> scheduled at {new Date(inv.scheduledAt).toLocaleString()}?
                </Text>
            ),
            labels: { confirm: 'Yes, cancel it', cancel: 'Keep it' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await interventionsApi.cancel(inv.id);
                    notifications.show({ title: 'Intervention cancelled', message: 'The status is now CANCELLED.', color: 'gray' });
                    load();
                } catch (err) {
                    notifications.show({
                        title: 'Error',
                        message: serverMessage(err, 'Could not cancel the intervention.'),
                        color: 'red',
                    });
                }
            },
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PLANNED': return 'blue';
            case 'DONE': return 'teal';
            case 'CANCELLED': return 'gray';
            default: return 'dark';
        }
    };

    return (
        <Stack gap="md">
            <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
                <div>
                    <Text fw={700} size="xl">Interventions</Text>
                    <Text size="sm" c="dimmed">{all.length} total records matching filters</Text>
                </div>
                <Group gap="xs">
                    <Tooltip label="Refresh">
                        <ActionIcon variant="default" size="lg" onClick={load} loading={loading}>
                            <IconRefresh size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <Button leftSection={<IconPlus size={16} />} onClick={openForm}>
                        Plan intervention
                    </Button>
                </Group>
            </Group>

            <Card withBorder radius="md" p="sm">
                <Group gap="sm" wrap="wrap">
                    <Select
                        placeholder="Status"
                        data={[
                            { value: 'PLANNED', label: 'Planned' },
                            { value: 'DONE', label: 'Done' },
                            { value: 'CANCELLED', label: 'Cancelled' }
                        ]}
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val ? String(val) : null)}
                        clearable
                        style={{ minWidth: 150 }}
                    />
                    <Select
                        placeholder="Technician"
                        data={technicians.map((t) => ({ value: t.id, label: t.fullName }))}
                        value={techFilter}
                        onChange={(val) => setTechFilter(val ? String(val) : null)}
                        clearable
                        searchable
                        style={{ minWidth: 200 }}
                    />
                </Group>
            </Card>

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" withCloseButton onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Card withBorder radius="md" p={0}>
                {loading ? (
                    <Center py={60}><Loader /></Center>
                ) : rows.length === 0 ? (
                    <Center py={60}>
                        <Stack align="center" gap="xs">
                            <IconTimeline size={34} opacity={0.4} />
                            <Text c="dimmed" size="sm">No intervention matches your criteria.</Text>
                        </Stack>
                    </Center>
                ) : (
                    <Table.ScrollContainer minWidth={850}>
                        <Table striped highlightOnHover verticalSpacing="sm">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Client</Table.Th>
                                    <Table.Th>Vehicle</Table.Th>
                                    <Table.Th>Technician</Table.Th>
                                    <Table.Th>Date & Time</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th w={80}>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {rows.map((inv) => (
                                    <Table.Tr key={inv.id}>
                                        <Table.Td>{inv.client?.name ?? '—'}</Table.Td>
                                        <Table.Td>
                                            <Text fw={500} size="sm">{inv.vehicle?.plate ?? '—'}</Text>
                                            <Text size="xs" c="dimmed">{inv.vehicle?.brand} {inv.vehicle?.model}</Text>
                                        </Table.Td>
                                        <Table.Td>{inv.technician?.fullName ?? '—'}</Table.Td>
                                        <Table.Td>
                                            <Group gap={4} wrap="nowrap">
                                                <IconCalendar size={14} color="gray" />
                                                <Text size="sm">{new Date(inv.scheduledAt).toLocaleString()}</Text>
                                            </Group>
                                            {inv.completedAt && (
                                                <Text size="xs" c="teal" mt={2}>Completed: {new Date(inv.completedAt).toLocaleString()}</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={getStatusColor(inv.status)} variant="light">
                                                {inv.status}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            {inv.status === 'PLANNED' && (
                                                <Tooltip label="Cancel intervention">
                                                    <ActionIcon variant="subtle" color="red" onClick={() => confirmCancel(inv)}>
                                                        <IconTrash size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            )}
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                )}
            </Card>

            {totalPages > 1 && (
                <Group justify="space-between">
                    <Text size="xs" c="dimmed">Page {page} of {totalPages}</Text>
                    <Pagination value={page} onChange={setPage} total={totalPages} withEdges />
                </Group>
            )}

            <InterventionFormModal
                opened={formOpened}
                onClose={closeForm}
                clients={clients}
                vehicles={vehicles}
                technicians={technicians}
                onSaved={load}
            />
        </Stack>
    );
}
