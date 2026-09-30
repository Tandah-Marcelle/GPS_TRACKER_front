import { useCallback, useEffect, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconCar,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { clientsApi } from '../api/clients';
import { vehiclesApi } from '../api/vehicles';
import { VehicleFormModal } from '../components/vehicles/VehicleFormModal';
import { serverMessage } from '../lib/apiError';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { Client, Vehicle } from '../types';

const PAGE_SIZE = 10;

export default function Vehicles() {
  const [all, setAll] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [clientId, setClientId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  // The client list feeds both the "owned by" filter and the create/edit form.
  useEffect(() => {
    clientsApi
      .list()
      .then(setClients)
      .catch(() => setClients([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAll(await vehiclesApi.list(clientId || undefined));
    } catch (err) {
      setError(serverMessage(err, 'Could not load vehicles'));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  // The vehicle endpoint has no search param, so filter the returned list.
  const needle = debouncedSearch.trim().toLowerCase();
  const filtered = needle
    ? all.filter((v) =>
      [v.plate, v.brand, v.model, v.client?.name ?? ''].some((f) =>
        f.toLowerCase().includes(needle),
      ),
    )
    : all;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, clientId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    openForm();
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    openForm();
  };

  const confirmDelete = (v: Vehicle) => {
    modals.openConfirmModal({
      title: 'Delete vehicle',
      centered: true,
      children: (
        <Text size="sm">
          Delete <b>{v.plate}</b>? This is only possible while no tracker and no intervention is
          linked to it.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await vehiclesApi.remove(v.id);
          notifications.show({ title: 'Vehicle deleted', message: v.plate, color: 'teal' });
          load();
        } catch (err) {
          notifications.show({
            title: 'Cannot delete vehicle',
            message: serverMessage(err, 'This vehicle is still referenced by other records.'),
            color: 'red',
          });
        }
      },
    });
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <div>
          <Text fw={700} size="xl">
            Vehicles
          </Text>
          <Text size="sm" c="dimmed">
            {filtered.length} vehicle{filtered.length === 1 ? '' : 's'}
            {clientId ? ' for this client' : ' in the system'}
          </Text>
        </div>
        <Group gap="xs">
          <Tooltip label="Refresh">
            <ActionIcon variant="default" size="lg" onClick={load} loading={loading}>
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate} disabled={clients.length === 0}>
            New vehicle
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="md" p="sm">
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Search by plate, brand, model or client…"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <Select
            placeholder="All clients"
            data={clients.map((c) => ({ value: c.id, label: c.name }))}
            value={clientId}
            onChange={(v) => setClientId(v ?? null)}
            clearable
            searchable
            w={220}
          />
        </Group>
      </Card>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          variant="light"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {clients.length === 0 && !loading && (
        <Alert color="yellow" variant="light">
          Create a client first: every vehicle must belong to one.
        </Alert>
      )}

      <Card withBorder radius="md" p={0}>
        {loading ? (
          <Center py={60}>
            <Loader />
          </Center>
        ) : rows.length === 0 ? (
          <Center py={60}>
            <Stack align="center" gap="xs">
              <IconCar size={34} opacity={0.4} />
              <Text c="dimmed" size="sm">
                No vehicle matches your filters.
              </Text>
            </Stack>
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={760}>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Plate</Table.Th>
                  <Table.Th>Brand</Table.Th>
                  <Table.Th>Model</Table.Th>
                  <Table.Th>Client</Table.Th>
                  <Table.Th ta="center">Trackers</Table.Th>
                  <Table.Th w={110}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((v) => {
                  const linked = v._count?.trackers ?? 0;
                  return (
                    <Table.Tr key={v.id}>
                      <Table.Td>
                        <Text ff="monospace" size="sm" fw={500}>
                          {v.plate}
                        </Text>
                      </Table.Td>
                      <Table.Td>{v.brand}</Table.Td>
                      <Table.Td>{v.model}</Table.Td>
                      <Table.Td>
                        <Text size="sm">{v.client?.name ?? '—'}</Text>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Text size="sm">{linked}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label="Edit vehicle">
                            <ActionIcon variant="subtle" onClick={() => openEdit(v)}>
                              <IconPencil size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip
                            label={linked > 0 ? 'Detach the tracker first' : 'Delete vehicle'}
                          >
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              disabled={linked > 0}
                              onClick={() => confirmDelete(v)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      {totalPages > 1 && (
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            Page {page} of {totalPages}
          </Text>
          <Pagination value={page} onChange={setPage} total={totalPages} withEdges />
        </Group>
      )}

      <VehicleFormModal
        opened={formOpened}
        vehicle={editing}
        clients={clients}
        onClose={closeForm}
        onSaved={load}
      />
    </Stack>
  );
}
