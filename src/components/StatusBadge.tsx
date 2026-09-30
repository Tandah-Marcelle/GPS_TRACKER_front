import { Badge, Group, Text } from '@mantine/core';
import { STATUS_COLORS, STATUS_LABELS } from '../lib/trackers';
import type { TrackerStatus } from '../types';

interface Props {
  status: TrackerStatus;
  size?: 'sm' | 'md' | 'lg';
}

/** Single source of truth for the status badge so colours stay consistent. */
export function StatusBadge({ status, size = 'sm' }: Props) {
  return (
    <Badge color={STATUS_COLORS[status]} variant="light" size={size} radius="sm">
      <Group gap={6} wrap="nowrap">
        <Text span size="xs" fw={600}>
          {STATUS_LABELS[status]}
        </Text>
      </Group>
    </Badge>
  );
}
