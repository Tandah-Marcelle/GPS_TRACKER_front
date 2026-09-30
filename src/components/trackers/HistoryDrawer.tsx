import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Center,
  Drawer,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Timeline,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { trackersApi } from '../../api/trackers';
import { serverMessage } from '../../lib/apiError';
import { STATUS_LABELS } from '../../lib/trackers';
import { StatusBadge } from '../StatusBadge';
import type { Tracker, TrackerHistoryEntry } from '../../types';

interface Props {
  opened: boolean;
  onClose: () => void;
  tracker: Tracker | null;
}

const ACTION_COLORS: Record<string, string> = {
  RECEIVED: 'teal',
  INSTALLED: 'blue',
  REMOVED: 'orange',
  DECLARED_FAULTY: 'red',
  RETURNED: 'yellow',
  RESTOCKED: 'grape',
};

export function HistoryDrawer({ opened, onClose, tracker }: Props) {
  const [entries, setEntries] = useState<TrackerHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tracker) return;
    setLoading(true);
    setError(null);
    try {
      setEntries(await trackersApi.history(tracker.id));
    } catch (err) {
      setError(serverMessage(err, 'Could not load the history'));
    } finally {
      setLoading(false);
    }
  }, [tracker]);

  useEffect(() => {
    if (opened) load();
  }, [opened, load]);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="lg"
      title={
        tracker ? (
          <Stack gap={2}>
            <Text fw={600}>History</Text>
            <Text size="xs" c="dimmed" ff="monospace">
              {tracker.imei}
            </Text>
          </Stack>
        ) : (
          'History'
        )
      }
    >
      {loading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : error ? (
        <Text c="red" size="sm">
          {error}
        </Text>
      ) : entries.length === 0 ? (
        <Text c="dimmed" size="sm">
          No history recorded yet.
        </Text>
      ) : (
        <Timeline active={entries.length} bulletSize={22} lineWidth={2}>
          {entries.map((e) => (
            <Timeline.Item
              key={e.id}
              bullet={
                <Text size="10px" fw={700}>
                  {e.oldStatus ? STATUS_LABELS[e.oldStatus].charAt(0) : '+'}
                </Text>
              }
              title={
                <Group gap="xs">
                  {e.oldStatus ? <StatusBadge status={e.oldStatus} /> : <Badge variant="outline">new</Badge>}
                  <Text size="sm" c="dimmed">
                    →
                  </Text>
                  <StatusBadge status={e.newStatus} />
                  <Badge
                    size="xs"
                    variant="light"
                    color={ACTION_COLORS[e.action] ?? 'gray'}
                  >
                    {e.action}
                  </Badge>
                </Group>
              }
            >
              <Stack gap={2} mt={4}>
                <Text size="xs" c="dimmed">
                  {new Date(e.createdAt).toLocaleString()} · {e.user.fullName} ({e.user.username})
                </Text>
                {e.vehicle && (
                  <Text size="xs" c="dimmed">
                    Vehicle: {e.vehicle.plate}
                  </Text>
                )}
                {e.intervention && (
                  <Text size="xs" c="dimmed">
                    Intervention linked ({e.intervention.status})
                  </Text>
                )}
                {e.comment && (
                  <Text size="xs" fs="italic">
                    “{e.comment}”
                  </Text>
                )}
              </Stack>
            </Timeline.Item>
          ))}
        </Timeline>
      )}
    </Drawer>
  );
}

/** Compact table variant used on the main screen. */
export function HistoryTable({ entries }: { entries: TrackerHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <Group gap="xs" p="md" c="dimmed">
        <IconAlertCircle size={16} />
        <Text size="sm">No history recorded yet.</Text>
      </Group>
    );
  }
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Date</Table.Th>
          <Table.Th>Change</Table.Th>
          <Table.Th>Action</Table.Th>
          <Table.Th>User</Table.Th>
          <Table.Th>Vehicle</Table.Th>
          <Table.Th>Comment</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {entries.map((e) => (
          <Table.Tr key={e.id}>
            <Table.Td style={{ whiteSpace: 'nowrap' }}>
              {new Date(e.createdAt).toLocaleString()}
            </Table.Td>
            <Table.Td>
              <Group gap={6} wrap="nowrap">
                {e.oldStatus ? (
                  <StatusBadge status={e.oldStatus} />
                ) : (
                  <Badge variant="outline" size="sm">
                    new
                  </Badge>
                )}
                <Text size="xs" c="dimmed">
                  →
                </Text>
                <StatusBadge status={e.newStatus} />
              </Group>
            </Table.Td>
            <Table.Td>
              <Badge size="sm" variant="light" color={ACTION_COLORS[e.action] ?? 'gray'}>
                {e.action}
              </Badge>
            </Table.Td>
            <Table.Td>{e.user.fullName}</Table.Td>
            <Table.Td>{e.vehicle?.plate ?? '—'}</Table.Td>
            <Table.Td>{e.comment ?? '—'}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
