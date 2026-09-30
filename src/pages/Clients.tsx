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
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import { clientsApi } from '../api/clients';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { serverMessage } from '../lib/apiError';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { Client } from '../types';

const PAGE_SIZE = 10;

export default function Clients() {
  const [all, setAll] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The endpoint returns the full list, so filtering happens server side
      // and pagination is applied on the result.
      setAll(await clientsApi.list(debouncedSearch || undefined));
    } catch (err) {
      setError(serverMessage(err, 'Could not load clients'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const rows = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    openForm();
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    openForm();
  };

  const confirmDelete = (c: Client) => {
    modals.openConfirmModal({
      title: 'Delete client',
      centered: true,
      children: (
        <Text size="sm">
          Delete <b>{c.name}</b>? This is only possible while the client has no vehicles and no
          interventions.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await clientsApi.remove(c.id);
          notifications.show({ title: 'Client deleted', message: c.name, color: 'teal' });
          load();
        } catch (err) {
          // 409 is expected and meaningful here: the client is still referenced.
          notifications.show({
            title: 'Cannot delete client',
            message: serverMessage(err, 'This client is still referenced by other records.'),
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
            Clients
          </Text>
          <Text size="sm" c="dimmed">
            {all.length} client{all.length === 1 ? '' : 's'}
            {debouncedSearch ? ' matching your search' : ' in the system'}
          </Text>
        </div>
        <Group gap="xs">
          <Tooltip label="Refresh">
            <ActionIcon variant="default" size="lg" onClick={load} loading={loading}>
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            New client
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="md" p="sm">
        <TextInput
          placeholder="Search by name or phone…"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
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

      <Card withBorder radius="md" p={0}>
        {loading ? (
          <Center py={60}>
            <Loader />
          </Center>
        ) : rows.length === 0 ? (
          <Center py={60}>
            <Stack align="center" gap="xs">
              <IconUsers size={34} opacity={0.4} />
              <Text c="dimmed" size="sm">
                {debouncedSearch ? 'No client matches your search.' : 'No client yet.'}
              </Text>
              {!debouncedSearch && (
                <Button variant="light" size="xs" onClick={openCreate}>
                  Create the first one
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={720}>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Address</Table.Th>
                  <Table.Th ta="center">Vehicles</Table.Th>
                  <Table.Th w={110}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((c) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Text fw={500} size="sm">
                        {c.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {c.phone}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {c.address}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Text size="sm">{c._count?.vehicles ?? 0}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="Edit client">
                          <ActionIcon variant="subtle" onClick={() => openEdit(c)}>
                            <IconPencil size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip
                          label={
                            (c._count?.vehicles ?? 0) > 0
                              ? 'Delete the vehicles first'
                              : 'Delete client'
                          }
                        >
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            disabled={(c._count?.vehicles ?? 0) > 0}
                            onClick={() => confirmDelete(c)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
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
          <Text size="xs" c="dimmed">
            Page {page} of {totalPages}
          </Text>
          <Pagination value={page} onChange={setPage} total={totalPages} withEdges />
        </Group>
      )}

      <ClientFormModal
        opened={formOpened}
        client={editing}
        onClose={closeForm}
        onSaved={load}
      />
    </Stack>
  );
}
