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
import {
  IconAlertCircle,
  IconHistory,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconStack2,
  IconSwitchHorizontal,
} from '@tabler/icons-react';
import { trackersApi } from '../api/trackers';
import { serverMessage } from '../lib/apiError';
import { STATUS_LABELS, allowedTransitionsFrom } from '../lib/trackers';
import { StatusBadge } from '../components/StatusBadge';
import { TrackerFormModal } from '../components/trackers/TrackerFormModal';
import { ChangeStatusModal } from '../components/trackers/ChangeStatusModal';
import { HistoryDrawer } from '../components/trackers/HistoryDrawer';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { Tracker, TrackerStatus } from '../types';

const STATUS_OPTIONS = (Object.keys(STATUS_LABELS) as TrackerStatus[]).map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
}));

const PAGE_SIZE = 10;

export default function Trackers() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TrackerStatus | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 350);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpened, setFormOpened] = useState(false);
  const [editing, setEditing] = useState<Tracker | null>(null);
  const [statusTarget, setStatusTarget] = useState<Tracker | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Tracker | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await trackersApi.list({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
        search: debouncedSearch || undefined,
      });
      setTrackers(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      setError(serverMessage(err, 'Could not load trackers'));
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to the first page whenever the filter changes.
  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  const openCreate = () => {
    setEditing(null);
    setFormOpened(true);
  };

  const openEdit = (t: Tracker) => {
    setEditing(t);
    setFormOpened(true);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <div>
          <Text fw={700} size="xl">
            Trackers
          </Text>
          <Text size="sm" c="dimmed">
            {total} tracker{total === 1 ? '' : 's'} in the system
          </Text>
        </div>
        <Group gap="xs">
          <Tooltip label="Refresh">
            <ActionIcon variant="default" size="lg" onClick={load} loading={loading}>
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Receive tracker
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="md" p="sm">
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Search by IMEI…"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <Select
            placeholder="All statuses"
            data={STATUS_OPTIONS}
            value={status}
            onChange={(v) => setStatus((v as TrackerStatus | null) ?? null)}
            clearable
            w={190}
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
          <Center py={60}>
            <Loader />
          </Center>
        ) : trackers.length === 0 ? (
          <Center py={60}>
            <Stack align="center" gap="xs">
              <IconStack2 size={34} opacity={0.4} />
              <Text c="dimmed" size="sm">
                No tracker matches your filters.
              </Text>
              <Button variant="light" size="xs" onClick={openCreate}>
                Receive the first one
              </Button>
            </Stack>
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={860}>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>IMEI</Table.Th>
                  <Table.Th>Model</Table.Th>
                  <Table.Th>SIM</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Vehicle</Table.Th>
                  <Table.Th>Added</Table.Th>
                  <Table.Th w={130}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {trackers.map((t) => {
                  const canChange = allowedTransitionsFrom(t.status).length > 0;
                  return (
                    <Table.Tr key={t.id}>
                      <Table.Td>
                        <Text ff="monospace" size="sm">
                          {t.imei}
                        </Text>
                      </Table.Td>
                      <Table.Td>{t.model}</Table.Td>
                      <Table.Td>
                        <Text ff="monospace" size="xs" c="dimmed">
                          {t.simNumber}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <StatusBadge status={t.status} />
                      </Table.Td>
                      <Table.Td>
                        {t.vehicle ? (
                          <Text size="sm">{t.vehicle.plate}</Text>
                        ) : (
                          <Text size="sm" c="dimmed">
                            —
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label={canChange ? 'Change status' : `No manual change from ${STATUS_LABELS[t.status]}`}>
                            <ActionIcon
                              variant="subtle"
                              disabled={!canChange}
                              onClick={() => setStatusTarget(t)}
                            >
                              <IconSwitchHorizontal size={17} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Edit model / SIM">
                            <ActionIcon variant="subtle" onClick={() => openEdit(t)}>
                              <IconPencil size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="History">
                            <ActionIcon variant="subtle" onClick={() => setHistoryTarget(t)}>
                              <IconHistory size={17} />
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

      <TrackerFormModal
        opened={formOpened}
        tracker={editing}
        onClose={() => setFormOpened(false)}
        onSaved={load}
      />
      <ChangeStatusModal
        opened={Boolean(statusTarget)}
        tracker={statusTarget}
        onClose={() => setStatusTarget(null)}
        onSaved={load}
      />
      <HistoryDrawer
        opened={Boolean(historyTarget)}
        tracker={historyTarget}
        onClose={() => setHistoryTarget(null)}
      />
    </Stack>
  );
}
