import { useEffect, useState } from 'react';
import { Alert, Button, Group, Modal, Radio, Stack, Text, Textarea } from '@mantine/core';
import { IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { trackersApi } from '../../api/trackers';
import { serverFieldErrors, serverMessage } from '../../lib/apiError';
import { allowedTransitionsFrom, STATUS_LABELS } from '../../lib/trackers';
import { StatusBadge } from '../StatusBadge';
import type { Tracker, TrackerStatus } from '../../types';

interface Props {
  opened: boolean;
  onClose: () => void;
  tracker: Tracker | null;
  onSaved: () => void;
}

export function ChangeStatusModal({ opened, onClose, tracker, onSaved }: Props) {
  const [target, setTarget] = useState<TrackerStatus | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = tracker ? allowedTransitionsFrom(tracker.status) : [];

  useEffect(() => {
    if (!opened) return;
    setTarget(null);
    setComment('');
    setError(null);
  }, [opened, tracker]);

  const handleSubmit = async () => {
    if (!tracker || !target) return;
    setSubmitting(true);
    setError(null);
    try {
      await trackersApi.updateStatus(tracker.id, {
        status: target,
        comment: comment.trim() || undefined,
      });
      notifications.show({
        title: 'Status updated',
        message: `${tracker.imei}: ${STATUS_LABELS[tracker.status]} → ${STATUS_LABELS[target]}`,
        color: 'teal',
      });
      onSaved();
      onClose();
    } catch (err) {
      const fieldErrors = serverFieldErrors(err);
      setError(
        Object.values(fieldErrors)[0] ?? serverMessage(err, 'Could not change the status'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Change tracker status" centered>
      {!tracker ? null : (
        <Stack gap="sm">
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              {tracker.imei}
            </Text>
            <StatusBadge status={tracker.status} />
          </Group>

          {options.length === 0 ? (
            <Alert icon={<IconInfoCircle size={16} />} color="gray" variant="light">
              No manual status change is possible from <b>{STATUS_LABELS[tracker.status]}</b>.
            </Alert>
          ) : (
            <Radio.Group
              value={target ?? ''}
              onChange={(v) => setTarget(v as TrackerStatus)}
              label="New status"
            >
              <Stack gap="xs" mt="xs">
                {options.map((s) => (
                  <Radio
                    key={s}
                    value={s}
                    label={STATUS_LABELS[s]}
                    description={
                      tracker.status === 'INSTALLED'
                        ? 'The tracker is detached from its vehicle'
                        : undefined
                    }
                  />
                ))}
              </Stack>
            </Radio.Group>
          )}

          <Textarea
            label="Comment"
            placeholder="Optional note stored in the history"
            autosize
            minRows={2}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.currentTarget.value)}
          />

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting || !target || options.length === 0}
            >
              Apply change
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
