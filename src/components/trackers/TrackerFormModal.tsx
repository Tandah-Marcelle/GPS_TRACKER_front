import { useEffect, useState } from 'react';
import {
  Button,
  Group,
  Modal,
  Stack,
  TextInput,
  Text,
  Alert,
} from '@mantine/core';
import { IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { trackersApi } from '../../api/trackers';
import { serverFieldErrors, serverMessage } from '../../lib/apiError';
import type { Tracker } from '../../types';

interface Props {
  opened: boolean;
  onClose: () => void;
  /** When set the modal edits an existing tracker instead of creating one. */
  tracker?: Tracker | null;
  onSaved: () => void;
}

interface FormValues {
  imei: string;
  model: string;
  simNumber: string;
}

export function TrackerFormModal({ opened, onClose, tracker, onSaved }: Props) {
  const isEdit = Boolean(tracker);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    initialValues: { imei: '', model: '', simNumber: '' },
    validate: {
      imei: (v) => (/^\d{15}$/.test(v.trim()) ? null : 'IMEI must be exactly 15 digits'),
      model: (v) => (v.trim().length >= 2 ? null : 'Model is required'),
      simNumber: (v) => (v.trim().length >= 5 ? null : 'SIM number is required'),
    },
  });

  useEffect(() => {
    if (!opened) return;
    setServerError(null);
    form.setValues({
      imei: tracker?.imei ?? '',
      model: tracker?.model ?? '',
      simNumber: tracker?.simNumber ?? '',
    });
    form.clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, tracker]);

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      if (isEdit && tracker) {
        // IMEI is immutable: only model and SIM can be edited.
        await trackersApi.update(tracker.id, {
          model: values.model.trim(),
          simNumber: values.simNumber.trim(),
        });
        notifications.show({ title: 'Tracker updated', message: `IMEI ${values.imei}`, color: 'teal' });
      } else {
        await trackersApi.create({
          imei: values.imei.trim(),
          model: values.model.trim(),
          simNumber: values.simNumber.trim(),
        });
        notifications.show({
          title: 'Tracker received',
          message: `${values.imei} added to stock as IN_STOCK`,
          color: 'teal',
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      const fieldErrors = serverFieldErrors(err, ['imei', 'model', 'simNumber', 'status']);
      if (Object.keys(fieldErrors).length) form.setErrors(fieldErrors);
      else setServerError(serverMessage(err, 'Could not save the tracker'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit tracker' : 'Receive a new tracker'}
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          {!isEdit && (
            <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
              New trackers always start as <b>IN_STOCK</b> and a RECEIVED history row is written
              automatically. Installation can only happen through an intervention.
            </Alert>
          )}

          {serverError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {serverError}
            </Alert>
          )}

          <TextInput
            label="IMEI"
            description="15 digits, unique"
            placeholder="352099001761481"
            maxLength={15}
            disabled={isEdit}
            {...form.getInputProps('imei')}
          />
          <TextInput
            label="Model"
            placeholder="Teltonika FMB640"
            {...form.getInputProps('model')}
          />
          <TextInput
            label="SIM number"
            description="Unique"
            placeholder="89310412106063919234"
            {...form.getInputProps('simNumber')}
          />

          {isEdit && (
            <Text size="xs" c="dimmed">
              The IMEI is the physical identity of the device and cannot be changed.
            </Text>
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              {isEdit ? 'Save changes' : 'Add to stock'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
